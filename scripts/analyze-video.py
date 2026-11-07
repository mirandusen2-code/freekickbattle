#!/usr/bin/env python3
"""Extract timestamped native frames without changing the original video."""
import argparse
import hashlib
import json
import subprocess
import shutil
from fractions import Fraction
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('video', type=Path)
parser.add_argument('--output', required=True, type=Path)
parser.add_argument('--source-id', required=True)
parser.add_argument('--kind', choices=['reference', 'fixture', 'implementation'], default='reference')
parser.add_argument('--start', type=float, default=0)
parser.add_argument('--duration', type=float)
parser.add_argument('--interval', type=float, default=2)
parser.add_argument('--every-frame', action='store_true')
parser.add_argument('--max-frames', type=int, default=10000)
args = parser.parse_args()
if not args.video.is_file(): parser.error('Videobestand bestaat niet')
if args.start < 0 or args.interval <= 0 or args.max_frames < 1 or (args.duration is not None and args.duration <= 0): parser.error('Ongeldig bereik of interval')
if args.output.exists() and any(args.output.iterdir()): parser.error('Kies een lege uitvoermap om bestaand onderzoek te beschermen')

def probe(*options):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', *options, '-of', 'json', str(args.video)], text=True))

meta = probe('-select_streams', 'v:0', '-show_entries', 'stream=codec_name,width,height,avg_frame_rate,r_frame_rate,duration:format=duration')
if not meta.get('streams'): parser.error('Geen videostream gevonden')
frames = probe('-select_streams', 'v:0', '-show_entries', 'frame=best_effort_timestamp_time,width,height')['frames']
selected = []
next_time = args.start
end = args.start + args.duration if args.duration is not None else float('inf')
for index, frame in enumerate(frames):
    if 'best_effort_timestamp_time' not in frame: continue
    t = float(frame['best_effort_timestamp_time'])
    if t < args.start - 1e-8 or t >= end - 1e-8: continue
    if args.every_frame or t >= next_time - 1e-8:
        extension = 'png' if args.every_frame else 'jpg'
        selected.append({'frameIndex': index, 'timestampSeconds': t, 'sourceWidth': frame.get('width'), 'sourceHeight': frame.get('height'), 'path': f'frame-{len(selected)+1:06}.{extension}'})
        next_time = t + args.interval
if not selected: parser.error('Geen frames in het opgegeven bereik')
if len(selected) > args.max_frames: parser.error(f'{len(selected)} frames geselecteerd; kies een kleiner bereik of verhoog expliciet --max-frames')
if args.every_frame:
    parent = args.output.parent
    while not parent.exists(): parent = parent.parent
    estimated = sum(f['sourceWidth'] * f['sourceHeight'] * 4 for f in selected)
    if shutil.disk_usage(parent).free < estimated + 128 * 1024 * 1024: parser.error('Te weinig schijfruimte voor native PNG-frames; kies een korter fragment')
args.output.mkdir(parents=True, exist_ok=True)
expression = '+'.join(f'eq(n,{f["frameIndex"]})' for f in selected)
# Keep long selection expressions out of command-line limits.
filter_path = args.output / 'selection.fffilter'
filter_path.write_text(f"select='{expression}'" + ('' if args.every_frame else ",scale='min(960,iw)':-2"))
output_args = ['-c:v', 'png', str(args.output / 'frame-%06d.png')] if args.every_frame else ['-q:v', '2', str(args.output / 'frame-%06d.jpg')]
subprocess.run(['ffmpeg', '-v', 'error', '-i', str(args.video), '-filter_script:v', str(filter_path), '-fps_mode', 'vfr', *output_args], check=True)
for frame in selected:
    p = args.output / frame['path']
    if not p.is_file(): raise RuntimeError(f'Frame ontbreekt: {p.name}')
    frame['sha256'] = hashlib.sha256(p.read_bytes()).hexdigest()
stream = meta['streams'][0]
result = {'schemaVersion': 1, 'sourceId': args.source_id, 'kind': args.kind, 'videoName': args.video.name,
          'pixelProcessing': 'native-png' if args.every_frame else 'jpeg-overview-max-960px',
          'sha256': hashlib.file_digest(args.video.open('rb'), 'sha256').hexdigest(),
          'metadata': meta, 'averageVideoFPS': float(Fraction(stream.get('avg_frame_rate', '0/1'))),
          'originalGameFPS': None, 'selectedFrames': selected, 'note': 'Videotimestamps zijn geen bewijs van originele gameframerate.'}
(args.output / 'manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'sourceId': args.source_id, 'kind': args.kind, 'framesExtracted': len(selected), 'manifest': str(args.output / 'manifest.json')}))
