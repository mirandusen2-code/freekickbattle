#!/usr/bin/env python3
"""Build a reproducible, non-secret SQLite reference index from canonical JSON."""
import datetime
import hashlib
import json
import sqlite3
import re
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'data/references.json').read_text())
items = json.loads((ROOT / 'data/battle-catalog.json').read_text())
analysis = json.loads((ROOT / 'data/video-analysis.json').read_text())
frame_index = json.loads((ROOT / 'data/frame-index.json').read_text())
reference_assets = json.loads((ROOT / 'data/reference-assets.json').read_text())
animation = json.loads((ROOT / 'data/animation-spec.json').read_text())
validation_path = ROOT / 'data/validation.json'
validation = json.loads(validation_path.read_text()) if validation_path.exists() else {'status': 'not_run', 'checks': []}
assert len({s['id'] for s in data['sources']}) == len(data['sources'])
source_ids = {s['id'] for s in data['sources']}
for fact in data['facts']:
    assert set(fact['sourceIds']) <= source_ids
    assert fact['status'] in {'source_documented', 'visually_verified', 'implementation_choice', 'unknown'}
for item in items:
    assert item['originalPrice'] is None and item['originalName'] is None
    assert set(item['costumeSourceIds']) <= source_ids

target = ROOT / 'data/references.sqlite'
temporary = target.with_suffix(f'.sqlite.{os.getpid()}.tmp')
temporary.unlink(missing_ok=True)
db = sqlite3.connect(temporary)
db.executescript('''
PRAGMA foreign_keys=ON;
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE sources (id TEXT PRIMARY KEY, title TEXT NOT NULL, url TEXT, access TEXT NOT NULL, http_status INTEGER, local_path TEXT, sha256 TEXT, note TEXT);
CREATE TABLE facts (id TEXT PRIMARY KEY, area TEXT, statement TEXT, status TEXT NOT NULL);
CREATE TABLE fact_sources (fact_id TEXT REFERENCES facts(id), source_id TEXT REFERENCES sources(id), PRIMARY KEY(fact_id,source_id));
CREATE TABLE items (id TEXT PRIMARY KEY, category TEXT, name TEXT, price INTEGER CHECK(price>=0), color TEXT, detail TEXT, original_name TEXT, original_price INTEGER, design_status TEXT, price_status TEXT);
CREATE TABLE item_sources (item_id TEXT REFERENCES items(id), source_id TEXT REFERENCES sources(id), PRIMARY KEY(item_id,source_id));
CREATE TABLE features (id TEXT PRIMARY KEY, area TEXT, name TEXT, implementation TEXT, verification_group TEXT);
CREATE TABLE assets (id TEXT PRIMARY KEY, kind TEXT, origin TEXT, path TEXT, source_id TEXT REFERENCES sources(id), visually_matched INTEGER CHECK(visually_matched IN (0,1)));
CREATE TABLE validations (id TEXT PRIMARY KEY, status TEXT, command TEXT, exit_code INTEGER, completed_at TEXT);
CREATE TABLE animations (id TEXT PRIMARY KEY, value REAL, unit TEXT, status TEXT, original_value REAL);
CREATE TABLE video_frames (source_id TEXT REFERENCES sources(id), frame_index INTEGER, timestamp_seconds REAL, path TEXT, PRIMARY KEY(source_id,frame_index));
CREATE TABLE imports (id TEXT PRIMARY KEY, source_id TEXT REFERENCES sources(id), filename TEXT, size_bytes INTEGER, sha256 TEXT, visually_reviewed INTEGER DEFAULT 0);
CREATE TABLE frame_index (source_id TEXT REFERENCES sources(id), frame_index INTEGER, pts REAL, is_keyframe INTEGER, picture_type TEXT, mean_difference REAL, image_hash TEXT, PRIMARY KEY(source_id,frame_index));
CREATE TABLE observations (id TEXT PRIMARY KEY, source_id TEXT REFERENCES sources(id), approx_seconds REAL, area TEXT, statement TEXT, status TEXT, image_path TEXT);
CREATE TABLE reference_crops (id TEXT PRIMARY KEY, source_id TEXT REFERENCES sources(id), timestamp_seconds REAL, x INTEGER, y INTEGER, width INTEGER, height INTEGER, sha256 TEXT, path TEXT);
CREATE TABLE stages (stage INTEGER PRIMARY KEY, distance_metres REAL, wall_players INTEGER, source_id TEXT REFERENCES sources(id), reference_seconds REAL);
''')
db.executemany('INSERT INTO metadata VALUES (?,?)', [('schema_version', '2'), ('scope', data['scope']), ('generated_at', datetime.datetime.now(datetime.timezone.utc).isoformat()), ('validation_status', validation['status'])])
for s in data['sources']:
    p = ROOT / s['localPath'] if s.get('localPath') else None
    digest = None
    if p and p.is_file():
        with p.open('rb') as stream: digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    if s.get('expectedSHA256') and digest: assert digest == s['expectedSHA256'], 'Primaire referentie heeft een afwijkende checksum'
    db.execute('INSERT INTO sources VALUES (?,?,?,?,?,?,?,?)', (s['id'], s['title'], s.get('url'), s['access'], s.get('httpStatus'), s.get('localPath'), digest, s.get('note')))
for f in data['facts']:
    db.execute('INSERT INTO facts VALUES (?,?,?,?)', (f['id'], f['area'], f['statement'], f['status']))
    db.executemany('INSERT INTO fact_sources VALUES (?,?)', [(f['id'], sid) for sid in f['sourceIds']])
for i in items:
    db.execute('INSERT INTO items VALUES (?,?,?,?,?,?,?,?,?,?)', (i['id'], i['category'], i['name'], i['price'], i['color'], i['detail'], i['originalName'], i['originalPrice'], i['designStatus'], i['priceStatus']))
    db.executemany('INSERT INTO item_sources VALUES (?,?)', [(i['id'], sid) for sid in i['costumeSourceIds']])
for f in data['features']:
    db.execute('INSERT INTO features VALUES (?,?,?,?,?)', (f['id'], f['area'], f['name'], f['implementation'], f['verification']))
for i in items:
    db.execute('INSERT INTO features VALUES (?,?,?,?,?)', ('item-' + i['id'], 'shop', 'Kopen en uitrusten: ' + i['name'], 'implemented', 'browser'))
for a in data['assets']:
    db.execute('INSERT INTO assets VALUES (?,?,?,?,?,?)', (a['id'], a['kind'], a['origin'], a['path'], a.get('sourceId'), int(a['visuallyMatched'])))
for c in validation['checks']:
    db.execute('INSERT INTO validations VALUES (?,?,?,?,?)', (c['id'], c['status'], c['command'], c['exitCode'], c['completedAt']))
for key, value in animation.items():
    if type(value) in (int, float):
        unit = 'Hz' if key in {'simulationHz','originalVideoFPS'} else 'm/s' if key == 'keeperSpeedMetresPerSecond' else 's'
        db.execute('INSERT INTO animations VALUES (?,?,?,?,?)', (key, value, unit, 'source_measured' if key=='originalVideoFPS' else animation['status'], value if key=='originalVideoFPS' else None))
import_root = ROOT / 'research/imports'
if import_root.is_dir():
    for info in sorted(import_root.glob('*/upload.json')):
        upload = json.loads(info.read_text())
        if not upload.get('completed') or upload.get('kind') != 'reference': continue
        assert re.fullmatch(r'[a-f0-9-]{36}', upload['id']) and info.parent.name == upload['id']
        video = (info.parent / upload['videoPath']).resolve()
        assert video.is_relative_to(import_root.resolve()) and video.is_file()
        with video.open('rb') as stream: digest = hashlib.file_digest(stream, 'sha256').hexdigest()
        assert digest == upload['sha256'], 'Geïmporteerde video heeft een afwijkende checksum'
        source_id = 'import-' + upload['id']
        db.execute('INSERT INTO sources VALUES (?,?,?,?,?,?,?,?)', (source_id, upload['fileName'], None, 'imported_not_viewed', None, str(video.relative_to(ROOT)), digest, 'Door gebruiker aangewezen referentie. Ontvangen bestand; niet automatisch visueel geverifieerd.'))
        db.execute('INSERT INTO imports VALUES (?,?,?,?,?,?)', (upload['id'], source_id, upload['fileName'], upload['size'], digest, 0))
        for job in upload['jobs']:
            if job['status'] != 'complete': continue
            assert re.fullmatch(r'[a-f0-9-]{36}', job['id'])
            manifest_path = info.parent / job['id'] / 'manifest.json'
            manifest = json.loads(manifest_path.read_text())
            assert manifest['sha256'] == digest and manifest['sourceId'] == source_id
            for frame in manifest['selectedFrames']:
                assert re.fullmatch(r'frame-\d{6}\.(jpg|png)', frame['path'])
                image = (manifest_path.parent / frame['path']).resolve()
                assert image.is_relative_to(import_root.resolve()) and image.is_file()
                assert hashlib.sha256(image.read_bytes()).hexdigest() == frame['sha256']
                db.execute('INSERT OR REPLACE INTO video_frames VALUES (?,?,?,?)', (source_id, frame['frameIndex'], frame['timestampSeconds'], str(image.relative_to(ROOT))))
for f in frame_index:
    db.execute('INSERT INTO frame_index VALUES (?,?,?,?,?,?,?)', (analysis['sourceId'],f['index'],f['pts'],int(f['key']),f['type'],f['difference'],f['imageHash']))
assert len(frame_index) == analysis['metadata']['videoFrames']
for o in analysis['observations']:
    db.execute('INSERT INTO observations VALUES (?,?,?,?,?,?,?)', (o['id'],analysis['sourceId'],o['approxSeconds'],o['area'],o['statement'],o['status'],o['image']))
for a in reference_assets:
    x,y,right,bottom=a['sourceRectangle']
    db.execute('INSERT INTO reference_crops VALUES (?,?,?,?,?,?,?,?,?)',(a['id'],a['sourceId'],a['timeSeconds'],x,y,right-x,bottom-y,a['sha256'],a['path']))
for stage in analysis['stages']:
    db.execute('INSERT INTO stages VALUES (?,?,?,?,?)',(stage['id'],stage['distance'],stage['wall'],analysis['sourceId'],stage['referenceSeconds']))
db.executemany('INSERT INTO metadata VALUES (?,?)', [('reference_frames_indexed',str(len(frame_index))),('visual_checkpoints',str(len(analysis['observations']))),('all_frames_manually_reviewed','false'),('video_fps',str(analysis['metadata']['videoFPS'])),('original_game_fps','unknown'),('reference_review_method',analysis['visualReview']['method'])])
db.execute('INSERT INTO metadata VALUES (?,?)', ('reference_frames_extracted', str(db.execute('SELECT COUNT(*) FROM video_frames').fetchone()[0])))
assert not db.execute('PRAGMA foreign_key_check').fetchall()
assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok'
db.commit()
counts = {t: db.execute(f'SELECT COUNT(*) FROM {t}').fetchone()[0] for t in ['sources', 'facts', 'items', 'features', 'assets', 'animations', 'validations', 'imports', 'video_frames', 'frame_index', 'observations', 'reference_crops', 'stages']}
db.row_factory = sqlite3.Row
index = {t: [dict(row) for row in db.execute(f'SELECT * FROM {t}')] for t in ['metadata', 'sources', 'facts', 'items', 'features', 'assets', 'animations', 'validations', 'imports', 'video_frames', 'observations', 'reference_crops', 'stages']}
index['frameIndexSummary'] = {'rows':len(frame_index),'firstPTS':frame_index[0]['pts'],'lastPTS':frame_index[-1]['pts'],'jsonPath':'data/frame-index.json'}
index_path = ROOT / 'data/reference-index.json'
index_temp = index_path.with_suffix(f'.json.{os.getpid()}.tmp')
index_temp.write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n')
db.close()
temporary.replace(target)
index_temp.replace(index_path)
print(json.dumps({'database': str(target.relative_to(ROOT)), 'integrity': 'ok', 'counts': counts}))
