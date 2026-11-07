import json,hashlib
from pathlib import Path
from PIL import Image
r=Path(__file__).resolve().parents[1]
def write(p,v): (r/p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
obs=[
('title',20,'menu','Geel Free Kick Battle-titelscherm met START.','opening'),
('main-menu',25,'menu','Tabs PLAY, SHOP, PROFILE, OPTION; MATCH PLAY, ARCADE, TRAINING, CREDIT; onderaan gold, premium, level en energie.','native'),
('training-hud',30,'controls','BEST/SCORE, drie voetballen, pauze en camera, groene pijlen, afstand 21m, grote SPIN-bal en schuine krachtmeter.','native'),
('first-goal',38,'scoring','Eerste doelpunt: Technique +100; score 100 en drie ongebruikte levens.','native'),
('first-miss',50,'rules','Na de eerste misser heeft Training een rood kruis en twee ongebruikte voetballen.','timeline'),
('second-goal',56,'scoring','Score 400 na bonussen; slechts één leven gebruikt.','native'),
('second-miss',74,'rules','Twee rode kruisen; de ronde blijft speelbaar.','timeline'),
('third-goal',80,'scoring','Technique +100 en No Bounce +100 worden afgebeeld; twee kruisen blijven staan.','native'),
('ranking-600',89,'ranking','TRAINING RANKING met score 600, één ster en uiteindelijk 50 gold; NEXT LEVEL, RETRY, MENU.','timeline'),
('stage2',134,'stages','Stage 2: 21m, keeper en geen verdedigingsmuur; schuine veldoriëntatie. BEST begint op 0: de trainingsbestscore hoort bij de stage.','stages'),
('stage3',197,'stages','Stage 3: 27m, muur van twee verdedigers.','stages'),
('stage4',265,'stages','Stage 4: 27m, muur van twee verdedigers en gewijzigde veldoriëntatie.','stages'),
('stage5',421,'stages','Stage 5: 42m, twee verdedigers.','stages'),
('stage6',611,'stages','Stage 6: 42m, twee verdedigers, CHANCE / POWER SHOT en PASS in beeld.','stages'),
('stage7',780,'stages','Stage 7: 37m, drie verdedigers en CHANCE / POWER SHOT.','native'),
('stage8',871,'stages','Stage 8: 32m en vier verdedigers.','stages'),
('pass-option',611,'passing','Stage 6 toont een medespeler met PASS-ballon en CHANCE / POWER SHOT.','pass'),
('pass-timing',619,'passing','Na de pas verschijnt een timingcirkel rond de bal bij de ontvanger.','pass'),
('bicycle-cross',622,'passing','Een PERFECT-timingreactie gaat over in een omhaal; de volgende goal levert Technique +100 en Cross +100 op.','pass'),
]
for ident,t,area,statement,group in obs:
 src=r/f'research/native/frame-{t}.png'
 if not src.exists():src=r/f'research/stages/{t}.jpg'
 if not src.exists():src=r/f'research/pass/{t}.jpg'
 if not src.exists():src=r/f'research/overview/t-{t:04d}.jpg'
 if src.exists():
  im=Image.open(src)
  # Overview samples already include the complete capture at a reduced resolution.
  if im.width==1920:im=im.crop((236,114,1684,970))
  im.thumbnail((724,428));im.save(r/f'public/analysis/{ident}.jpg',quality=90)
analysis={
 'sourceId':'received-training-video','sourcePath':'research/original/training.mp4',
 'integrity':{'parts':13,'sizeBytes':307773232,'sha256':'68a71a62c5c6f89599ba688b8dfc0737f90a7a065d228daf9490876f04cd173d','matchesUserManifest':True},
 'metadata':{'width':1920,'height':1080,'durationSeconds':900.167982,'videoFrames':26975,'videoFPSNumerator':30000,'videoFPSDenominator':1001,'videoFPS':30000/1001,'originalInternalGameFPS':None,'lastFramePTS':900.032467,'videoCodec':'h264','audioCodec':'aac','gameViewport':[236,114,1448,856]},
 'technicalAnalysis':{'allFramesDecoded':True,'frameIndex':'data/frame-index.json','imageProcessing':'1448x856 game crop scaled to 160x94 greyscale; average absolute difference and 80-bit SHA-256 prefix per decoded image','fullVideoSHA256IsAuthoritative':True,'cutCandidatesAbove18':727,'cutCandidatesAreNotConfirmedSceneCuts':True},
 'visualReview':{'everyFrameManuallyReviewed':False,'method':'Whole-timeline contact sheets at 15-second intervals; opening at 2 fps; stage-1 dense samples; first shot at 10 fps; 36 consecutive native contact frames; native detail and stage screenshots; additional one-second Stage 6 pass/timing/bicycle sequence from 611 to 630 seconds.','wholeTimelineSampleCount':61,'denseNativeContactFrames':36,'nativeContactRange':[1043,1078],'stageLabelsOCR':'research/stage-label-ocr.json','checkpoints':len(obs)},
 'observations':[{'id':ident,'approxSeconds':t,'area':area,'statement':statement,'status':'visually_verified','image':f'/analysis/{ident}.jpg' if (r/f'public/analysis/{ident}.jpg').exists() else None} for ident,t,area,statement,g in obs],
 'timingMeasurements':[{'id':'first-contact','sourceFrameRange':[1058,1061],'approxSecondsRange':[35.301933,35.402033],'meaning':'Visueel interval rond het eerste balcontact; onzekerheid circa 0,10s.'},{'id':'first-goal-feedback','approxSeconds':36.3,'meaning':'Begin van doelpuntfeedback, circa 0,9–1,0s na eerste contact. Niet bewezen voor elk schot.'}],
 'stages':[{'id':i+1,'distance':d,'wall':w,'referenceSeconds':t,'status':'visually_verified'} for i,(d,w,t) in enumerate([(21,0,30),(21,0,134),(27,2,197),(27,2,265),(42,2,421),(42,2,611),(37,3,780),(32,4,871)])],
 'unresolved':['De video opent de SHOP niet; volledige catalogus, prijzen, itemstatistieken en alle ontwerpen zijn niet geverifieerd.','De bron bevat videoframes, geen originele 3D-bestanden, rig, textures, broncode of interne physicsparameters.','De interne gameframerate kan niet uit de 29,97 fps-opname worden vastgesteld.','Driesterrendrempel 1500, tweesterrendrempel 800, periodieke chance-shots en variatie van één meter zijn lokale keuzes.','Aanloop 0,7s en resultaat 4,2s zijn reconstructietimings; inputmomenten en SKIP maken exacte oorspronkelijke duur onzeker.','Arcade en lokale AI Match zijn aanvullende implementaties; de opname toont Training. Online PvP ontbreekt.'],
}
write('data/video-analysis.json',analysis)
refs=json.loads((r/'data/references.json').read_text());refs['schemaVersion']=2;refs['scope']='Ontvangen Training-video: geverifieerde integriteit, volledige technische frame-index, expliciete visuele observaties en speelbare reconstructie; oorspronkelijke shop onvolledig bekend.'
refs['sources']=[s for s in refs['sources'] if s['id']!='received-training-video']+[{'id':'received-training-video','title':'Door gebruiker aangeleverde TouchGameplay Training-opname — 13 ZIP-delen','url':'https://www.youtube.com/watch?v=MSTnwRicRSw','access':'visually_sampled','localPath':'research/original/training.mp4','expectedSHA256':analysis['integrity']['sha256'],'note':'Volledig gereconstrueerd en SHA-256 gecontroleerd; alle 26.975 frames technisch gedecodeerd. Visueel onderzocht met overzichtsplaten, dichte schot- en native detailbeelden; niet elk frame handmatig beoordeeld.'}]
for f in refs['facts']:
 if f['id']=='training-rules':f.update(statement='Training gebruikt drie missers als levens. Een doelpunt behoudt de overgebleven voetballen; de derde misser leidt naar de ranglijst.',status='visually_verified',sourceIds=['received-training-video'])
 if f['id']=='original-fps':f.update(statement='De ontvangen video is 30000/1001 (29,97003) fps en bevat 26.975 frames. De interne gameframerate is onbekend.',status='source_documented',sourceIds=['received-training-video'])
 if f['id']=='original-animation':f.update(statement='Eerste balcontact is visueel gelokaliseerd rond 35,30–35,40s en doelpuntfeedback rond 36,3s. Andere timingparameters blijven gedeeltelijk geschat.',status='source_documented',sourceIds=['received-training-video'])
 if f['id']=='camera':f.update(statement='HUD, menu en statische stadiondetails zijn op de video afgestemd met gedocumenteerde uitsneden. 3D-modellen, animaties en camera zijn eigen benaderingen.',status='implementation_choice',sourceIds=['received-training-video','local-implementation'])
refs['facts']=[f for f in refs['facts'] if not f['id'].startswith('video-observation-')]+[{'id':'video-observation-'+o['id'],'area':o['area'],'statement':o['statement']+' Referentie: circa '+str(o['approxSeconds'])+'s.','status':'visually_verified','sourceIds':['received-training-video']} for o in analysis['observations']]
for f in refs['features']:
 if f['id']=='training-ten':f.update(id='training-three-misses',name='Videogame: Training met drie missers; tien-schotsproef blijft alleen in het aparte lab',verification='reference-game-browser')
 if f['id']=='arcade-lives':f.update(name='Videogame: Arcade met drie levens en stageprogressie; vijf-levensproef alleen in lab',verification='reference-game-browser')
 if f['id']=='original-frame-match':f.update(name='Bronbeelden bekeken en naast spelbeelden vergeleken; geen pixelidentieke 3D-reconstructie',implementation='partial',verification='visual-checkpoints')
for id,area,name in [('source-integrity','reference','Alle 13 ZIP-delen samengevoegd en SHA-256 geverifieerd'),('all-frame-index','reference','26.975 oorspronkelijke frames technisch geïndexeerd'),('eight-stages','modes','Acht visueel waargenomen stages met afstanden en muren'),('training-ranking','modes','Sterren, goldbeloning en volgende stage'),('reference-hud','visual','HUD met brongebonden uitsneden en touchbediening')]:
 if not any(f['id']==id for f in refs['features']):refs['features'].append({'id':id,'area':area,'name':name,'implementation':'implemented','verification':'reference-game-browser' if area!='reference' else 'source-data'})
refs['assets']=[a for a in refs['assets'] if not a['id'].startswith('video-crop-')]
for a in json.loads((r/'data/reference-assets.json').read_text()):refs['assets'].append({'id':'video-crop-'+a['id'],'kind':'reference_crop','origin':'user_supplied_video','path':'public'+a['path'],'sourceId':'received-training-video','visuallyMatched':True})
write('data/references.json',refs)
a=json.loads((r/'data/animation-spec.json').read_text());a.update(originalVideoFPS=30000/1001,note='Lokale labtimings; de standaardvideogame gebruikt een aanloop van 0,7s en resultaat van 4,2s. Opname 29,97003 fps gemeten; interne gameframerate en exacte inputgestuurde timings onbekend. Zie data/video-analysis.json.');write('data/animation-spec.json',a)
print('Saved analysis with',len(obs),'source checkpoints')
