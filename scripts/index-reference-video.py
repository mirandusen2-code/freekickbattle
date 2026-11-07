"""Index every decoded source frame and calculate image transitions without retaining all raw pixels."""
import subprocess,json,hashlib
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[1];video=root/'research/original/training.mp4'
pts_path=root/'research/original/frame-timestamps.json'
if not pts_path.exists():
    with pts_path.open('w') as out:subprocess.run(['ffprobe','-v','error','-threads','2','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time,pict_type,key_frame','-of','json',str(video)],stdout=out,check=True)
frames=json.loads(pts_path.read_text())['frames']
process=subprocess.Popen(['ffmpeg','-v','error','-threads','2','-i',str(video),'-vf','crop=1448:856:236:114,scale=160:94,format=gray','-threads','1','-f','rawvideo','-'],stdout=subprocess.PIPE)
records=[];previous=None
for index,frame in enumerate(frames):
    raw=process.stdout.read(160*94)
    if len(raw)!=160*94:raise RuntimeError('Onvolledige framedecode')
    a=np.frombuffer(raw,dtype=np.uint8).astype(np.int16)
    delta=float(np.abs(a-previous).mean()) if previous is not None else 0
    records.append({'index':index,'pts':float(frame['best_effort_timestamp_time']),'key':bool(frame['key_frame']),'type':frame['pict_type'],'difference':round(delta,4),'imageHash':hashlib.sha256(raw).hexdigest()[:20]})
    previous=a
    if index%3000==0: print('Indexed',index,flush=True)
assert process.wait()==0
path=root/'data/frame-index.json';path.write_text(json.dumps(records,separators=(',',':'))+'\n')
print(json.dumps({'frames':len(records),'firstPTS':records[0]['pts'],'lastPTS':records[-1]['pts'],'cutCandidates':sum(r['difference']>18 for r in records)}))
