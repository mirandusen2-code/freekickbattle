import concurrent.futures, subprocess, json
from pathlib import Path
from PIL import Image, ImageDraw

root=Path(__file__).resolve().parents[1]
source=root/'research/original/training.mp4';out=root/'research/overview';out.mkdir(exist_ok=True)
times=list(range(0,901,15))
def grab(t):
    path=out/f't-{t:04}.jpg'
    if not path.exists(): subprocess.run(['ffmpeg','-v','error','-threads','1','-ss',str(min(t,899.9)),'-i',str(source),'-frames:v','1','-vf','scale=480:-2','-threads','1','-y',str(path)],check=True)
    return t,path
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: frames=list(pool.map(grab,times))
for page in range((len(frames)+15)//16):
    sheet=Image.new('RGB',(480*4,294*4),'#101010');d=ImageDraw.Draw(sheet)
    for i,(t,path) in enumerate(frames[page*16:(page+1)*16]):
        x=(i%4)*480;y=(i//4)*294;im=Image.open(path);sheet.paste(im,(x,y+24));d.text((x+8,y+5),f'{t//60:02}:{t%60:02} / {t}s',fill='white')
    sheet.save(out/f'complete-{page+1:02}.jpg',quality=90)
print(json.dumps({'sampleTimes':times,'pages':(len(frames)+15)//16}))
