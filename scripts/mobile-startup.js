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
      started = true;
      clearTimeout(timer);
      units();
      var panel = element('startup-overlay');
      if (panel) { panel.setAttribute('data-state', 'ready'); panel.style.display = 'none'; }
      document.documentElement.setAttribute('data-game-ready', 'true');
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
