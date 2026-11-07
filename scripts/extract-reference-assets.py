"""Extract documented UI crops from the user-supplied video for the reconstruction."""
from PIL import Image
from pathlib import Path
import hashlib,json,subprocess
root=Path(__file__).resolve().parents[1];out=root/'public/reference';out.mkdir(parents=True,exist_ok=True)
def frame(t):
 p=root/f'research/native/frame-{t}.png'
 if not p.exists():subprocess.run(['ffmpeg','-v','error','-threads','1','-ss',str(t),'-i',str(root/'research/original/training.mp4'),'-frames:v','1','-threads','1','-y',str(p)],check=True)
 return Image.open(p)
specs=[('title.jpg',20,(236,114,1684,970)),('menu.jpg',25,(236,114,1684,970)),('best.png',30,(395,114,791,215)),('score.png',30,(805,114,1225,215)),('life.png',30,(1246,127,1329,210)),('miss.png',54,(1246,127,1329,210)),('pause.png',30,(1378,230,1472,322)),('camera.png',30,(1482,230,1576,322)),('spin.png',30,(1220,590,1589,955)),('arrow.png',30,(333,807,475,951)),('crowd.jpg',30,(244,280,800,478)),('advert.jpg',30,(238,487,722,588))]
records=[]
for name,t,rect in specs:
 image=frame(t).crop(rect);p=out/name;image.save(p,quality=94) if name.endswith('.jpg') else image.save(p)
 records.append({'id':name.split('.')[0],'path':'/reference/'+name,'sourceId':'received-training-video','timeSeconds':t,'sourceRectangle':rect,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'use':'UI crop or stationary texture; gameplay is independently simulated'})
(root/'data/reference-assets.json').write_text(json.dumps(records,indent=2)+'\n')
print('Extracted',len(records),'documented assets')
