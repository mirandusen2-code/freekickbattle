#!/usr/bin/env python3
"""Reassemble bounded ZIP attachments using a manifest; never execute archive contents."""
import argparse, hashlib, json, zipfile
from pathlib import Path

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('manifest', type=Path)
p.add_argument('parts_map', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()
m = json.loads(a.manifest.read_text(encoding='utf-8-sig'))
paths = json.loads(a.parts_map.read_text())
assert m['schemaVersion'] == 1 and m['partCount'] == len(m['parts'])
assert m['originalBytes'] > 0 and len(m['originalSHA256']) == 64
assert not a.output.exists(), 'Uitvoer bestaat al; overschrijven is niet toegestaan'
a.output.parent.mkdir(parents=True, exist_ok=True)
digest = hashlib.sha256(); total = 0
try:
    with a.output.open('xb') as target:
        for part in m['parts']:
            assert part['offset'] == total and part['bytes'] > 0
            assert Path(part['file']).name == part['file'] and Path(part['entry']).name == part['entry']
            with zipfile.ZipFile(paths[part['file']]) as archive:
                assert len(archive.infolist()) == 1
                item = archive.getinfo(part['entry'])
                assert item.file_size == part['bytes'] and item.file_size <= m['partBytes']
                count = 0
                with archive.open(item) as source:
                    while chunk := source.read(1024 * 1024):
                        target.write(chunk); digest.update(chunk); count += len(chunk)
                assert count == part['bytes']
                total += count
                print(f"Verified ZIP/CRC: {part['file']} ({count} bytes)", flush=True)
    actual = digest.hexdigest()
    assert total == m['originalBytes'], 'Totale grootte klopt niet'
    assert actual.lower() == m['originalSHA256'].lower(), 'SHA-256 wijkt af'
    receipt = {'originalName': m['originalName'], 'bytes': total, 'sha256': actual, 'parts': m['partCount'], 'integrity': 'verified'}
    a.output.with_suffix('.receipt.json').write_text(json.dumps(receipt, indent=2)+'\n')
    print(json.dumps(receipt))
except BaseException:
    a.output.unlink(missing_ok=True)
    raise
