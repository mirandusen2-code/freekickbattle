(function () {
  var started = false;
  var failed = false;
  var timer;
  function element(id) { return document.getElementById(id); }
  function units() {
    var frame = element('battle-frame');
    if (frame) document.documentElement.style.setProperty('--battle-unit', (frame.getBoundingClientRect().width / 100) + 'px');
  }
  function fail(message, detail) {
    var panel = element('startup-overlay');
    failed = true;
    if (!panel) return;
    panel.style.display = 'block';
    panel.setAttribute('data-state', 'error');
    element('startup-message').textContent = message;
    element('startup-retry').style.display = 'inline-block';
    element('startup-detail').textContent = (detail || '') + '\n' + navigator.userAgent;
    element('startup-details').style.display = 'block';
    clearTimeout(timer);
  }
  window.__freekickBoot = {
    ready: function () {
      units();
      var title = element('title-screen');
      var background = title ? window.getComputedStyle(title).backgroundImage : 'none';
      var source = background.indexOf('url(') === 0 ? background.slice(4, -1).replace(/^['"]|['"]$/g, '') : '';
      if (source.indexOf('data:image/') !== 0) {
        fail('Het titelscherm kon niet worden geladen.', 'Ongeldig afbeeldingsadres: ' + source.slice(0, 80));
        return;
      }
      var image = new Image();
      image.onload = function () {
        units();
        var frame = element('battle-frame').getBoundingClientRect();
        if (frame.width < 100 || frame.height < 100) {
          fail('Het speelveld kon niet worden weergegeven.', 'Schermmaat: ' + frame.width + ' x ' + frame.height);
          return;
        }
        started = true;
        clearTimeout(timer);
        var panel = element('startup-overlay');
        if (panel) { panel.setAttribute('data-state', 'ready'); panel.style.display = 'none'; }
        document.documentElement.setAttribute('data-game-ready', 'true');
      };
      image.onerror = function () { fail('Het titelscherm kon niet worden geladen.', 'Het beeldbestand kon niet worden gelezen.'); };
      image.src = source;
    }
  };
  window.addEventListener('error', function (event) {
    if (!event.message) return;
    fail(started ? 'Er ging iets mis tijdens het spelen.' : 'Het spel kon niet starten.', event.message);
  });
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason;
    fail('Het spel kon niet verder laden.', reason && reason.message ? reason.message : String(reason));
  });
  window.addEventListener('resize', units);
  document.addEventListener('DOMContentLoaded', function () {
    units();
    element('startup-retry').onclick = function () {
      var url = new URL(window.location.href);
      url.searchParams.set('reload', String(Date.now()));
      window.location.replace(url.toString());
    };
    if (!started && !failed) timer = setTimeout(function () {
      fail('Het starten duurt te lang. Open de link rechtstreeks in Safari of Chrome en probeer opnieuw.', 'De spelcode heeft het startscherm niet geopend.');
    }, 15000);
  });
}());
