"""Package the standalone game, source, reference database and review evidence."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1];out=root/'artifacts';out.mkdir(exist_ok=True)
target=out/'Freekick-Battle-spelpakket.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 z.write(out/'Freekick-Battle.html','Freekick-Battle/Freekick-Battle.html')
 z.writestr('Freekick-Battle/LEESMIJ.txt','Pak het ZIP-bestand uit en open Freekick-Battle.html in Chrome, Edge of Safari. Geen installatie nodig.\n\nSTART > TRAINING > Stage 1. Richt met de groene pijlen. Tik tweemaal op de grote bal, of druk tweemaal spatie: eerst kracht opbouwen, daarna schieten. Sleep op de grote bal voor effect. P pauzeert. In stages 6 en 7 kun je PASS kiezen en daarna op de timingcirkel tikken voor een omhaal. Drie missers beeindigen Training.\n\nProject bevat de volledige ontwikkelcode, prompt, analyse en SQLite-database. De oorspronkelijke bronvideo staat apart in de cloudwerkmap en is niet in dit pakket opgenomen.\n\nDit is een speelbare reconstructie, geen pixelidentieke kopie. De video opent de shop niet: extra ontwerpen en prijzen zijn eigen keuzes. Online PvP ontbreekt. Zie project/docs/VIDEOANALYSE.md.\n')
 for folder in ['src','public','scripts','tests','docs','data']:
  for p in sorted((root/folder).rglob('*')):
   if p.is_file() and '__pycache__' not in p.parts and not p.name.endswith('.tmp'):z.write(p,'Freekick-Battle/project/'+str(p.relative_to(root)))
 for name in ['README.md','package.json','package-lock.json','.gitignore','index.html','lab.html','reference.html','review.html','analyze.html','vite.config.js']:
  z.write(root/name,'Freekick-Battle/project/'+name)
 for rel in ['research/overview/complete-01.jpg','research/overview/complete-02.jpg','research/overview/complete-03.jpg','research/overview/complete-04.jpg','research/stages/contact.jpg','research/overview/rules-check.jpg','research/motion/native-contact-0.jpg','research/motion/native-contact-1.jpg','research/pass/contact.jpg','research/stage-label-ocr.json','research/article.txt','research/pocketgamer-article.html','research/pocketgamer.html','research/148apps-review.html','research/148apps-review.txt']:
  p=root/rel
  if p.is_file():z.write(p,'Freekick-Battle/project/'+rel)
 for name in ['ready.png','ranking.png','shop.png','mobile.png','landscape.png','standalone-goal.png','blocked.png','spin-goal.png','pass-timing.png','bicycle.png','pass-goal.png','wardrobe-kit.png','wardrobe-ball.png','wardrobe-hair.png','wardrobe-shoes.png','wardrobe-shorts.png','wardrobe-glasses.png','wardrobe-skin.png','wardrobe-gender.png']:
  p=root/'test-results/reference-game'/name
  if p.is_file():z.write(p,'Freekick-Battle/voorbeelden/'+name)
 for name in ['Spelvoorbeeld.mp4','Referentie-en-reconstructie.jpg']:
  p=out/name
  if p.is_file():z.write(p,'Freekick-Battle/voorbeelden/'+name)
 for p in sorted((root/'test-results/validation').glob('*.log')):z.write(p,'Freekick-Battle/validatie/'+p.name)
print(target, target.stat().st_size,'bytes')
