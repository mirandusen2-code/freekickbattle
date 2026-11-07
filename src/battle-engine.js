import { DT, createShot, stepShot, simulate } from './game.js';
export const STAGES = [
  {id:1,distance:21,wall:0},{id:2,distance:21,wall:0},{id:3,distance:27,wall:2},{id:4,distance:27,wall:2},
  {id:5,distance:42,wall:2},{id:6,distance:42,wall:2},{id:7,distance:37,wall:3},{id:8,distance:32,wall:4},
];
import referenceCatalog from '../data/battle-catalog.json' with {type:'json'};
export const BATTLE_CATALOG=referenceCatalog;
export const BATTLE_CATEGORIES={kit:'COSTUMES',ball:'BALLS',hair:'HAIR',shoes:'SHOES',shorts:'SHORTS',glasses:'GLASSES',skin:'SKIN',gender:'GENDER'};
const defaults=Object.fromEntries(Object.keys(BATTLE_CATEGORIES).map(type=>[type,BATTLE_CATALOG.find(i=>i.type===type&&i.price===0).id]));
export function battleProfile(p){
 const fresh={version:2,gold:0,...defaults,owned:Object.values(defaults),best:0,bests:{},unlocked:1,stars:{},xp:0};
 if(!p||p.version!==2||!Number.isSafeInteger(p.gold)||p.gold<0||!Array.isArray(p.owned))return fresh;
 const owned=[...new Set([...fresh.owned,...p.owned.filter(id=>BATTLE_CATALOG.some(i=>i.id===id))])];
 const equipment=Object.fromEntries(Object.keys(defaults).map(type=>[type,owned.includes(p[type])&&BATTLE_CATALOG.some(i=>i.id===p[type]&&i.type===type)?p[type]:defaults[type]]));
 return {...fresh,...equipment,gold:p.gold,owned,bests:Object.fromEntries(Object.entries(p.bests||{}).filter(([k,v])=>/^[1-8]$/.test(k)&&Number.isSafeInteger(v)&&v>=0)),best:Number.isSafeInteger(p.best)&&p.best>=0?p.best:0,unlocked:Math.max(1,Math.min(8,Number.isInteger(p.unlocked)?p.unlocked:1)),stars:Object.fromEntries(Object.entries(p.stars||{}).filter(([k,v])=>/^[1-8]$/.test(k)&&Number.isInteger(v)&&v>=0&&v<=3)),xp:Number.isSafeInteger(p.xp)&&p.xp>=0?p.xp:0};
}
export function buyBattleItem(p,id){const item=BATTLE_CATALOG.find(i=>i.id===id);if(!item)return false;if(!p.owned.includes(id)){if(p.gold<item.price)return false;p.gold-=item.price;p.owned.push(id);}p[item.type]=id;return true;}
export function battleWallZ(distance){return -20+distance-Math.min(11,Math.max(1,distance-3));}
export function battleRound(mode='training',stage=1){
  if(!['training','arcade','match'].includes(mode))throw new Error('Unknown mode');
  const spec=STAGES[Math.max(0,Math.min(7,stage-1))];
  return {mode,stage:spec.id,distance:spec.distance,wall:spec.wall,lives:3,score:0,goals:0,attempts:0,combo:0,time:0,phase:'ready',phaseTime:0,power:0,aim:0,height:1.35,curve:0,spinY:0,shot:null,frames:[],lastReplay:null,bonuses:[],paused:false,finished:false,paid:false,remaining:60,opponent:0,bonusChance:spec.id===6||spec.id===7,passAvailable:spec.id===6||spec.id===7,passMode:false,passBall:null,timingGrade:''};
}
export function shotAction(s){
  if(s.paused||s.finished)return false;
  if(s.phase==='assist-timing'){const error=Math.abs(s.phaseTime-1.4);s.timingGrade=error<=.18?'perfect':error<=.48?'good':'miss';if(s.timingGrade==='miss'){failAssist(s);s.pendingAssistResult=true;}else{s.phase='assist-kick';s.phaseTime=0;}return true;}
  if(s.phase==='ready'){s.phase='charging';s.phaseTime=0;return true;}
  if(s.phase!=='charging')return false;
  s.locked={power:Math.min(1,Math.max(.15,s.power)+(s.powerBoost||0)),x:s.aim,y:s.height,curve:s.curve,distance:s.distance};
  s.phase='runup';s.phaseTime=0;return true;
}
export function ranking(score){const stars=score>=1500?3:score>=800?2:score>0?1:0;return {stars,gold:stars*50};}
export function resolveBattleShot(s,result,shot){
  s.attempts++;
  if(result==='goal'){
    s.goals++;s.combo++;
    const technique=Math.abs(shot.curve)>.25||Math.abs(shot.x)>2.3?200:100;
    s.bonuses=[{id:'T',name:'Technique',points:technique}];
    if(s.combo>1)s.bonuses.push({id:'C',name:`Combo X${s.combo}`,points:Math.min(s.combo-1,4)*100});
    if(!shot.bounced&&s.attempts>1&&!shot.assisted)s.bonuses.push({id:'B',name:'No Bounce',points:100});
    if(shot.assisted)s.bonuses.push({id:'X',name:'Cross',points:100});
    s.score+=s.bonuses.reduce((a,b)=>a+b.points,0);
  }else{if(s.mode!=='match')s.lives--;s.combo=0;s.bonuses=[];}
  s.phase='result';s.phaseTime=0;
}
function failAssist(s){s.shot={...s.passBall,time:0,result:'wide',assisted:true,assistMiss:true,keeperEnabled:true,curve:0};s.lastReplay=null;resolveBattleShot(s,'wide',s.shot);}
function strike(s,assisted=false){s.shot=createShot({...s.locked,...(assisted?{distance:12,originX:5,originY:1.8}: {})});s.shot.keeperEnabled=!(s.stage===1&&s.attempts===0);s.shot.assisted=assisted;s.shot.perfectAssist=assisted&&s.timingGrade==='perfect';s.frames=[{...s.shot}];s.phase='flight';s.phaseTime=0;}
export function advanceBattle(s,dt=DT){
  if(s.paused||s.finished)return [];
  const events=[];if(s.pendingAssistResult){events.push({type:'result',result:'wide'});s.pendingAssistResult=false;}s.time+=dt;s.phaseTime+=dt;
  if(s.mode==='match'){
    const previous=Math.floor((60-s.remaining)/10);s.remaining=Math.max(0,s.remaining-dt);
    if(Math.floor((60-s.remaining)/10)>previous){const n=previous+1;const rival=simulate({x:n%3===0?0:n%2?-3.1:3.1,y:1.8,power:.85});if(rival.result==='goal')s.opponent++;events.push({type:'opponent',result:rival.result});}
    if(!s.remaining&&['ready','charging'].includes(s.phase)){s.finished=true;s.phase='ranking';return [...events,{type:'ranking'}];}
  }
  if(s.phase==='charging')s.power=(Math.sin(s.phaseTime*Math.PI/1.7-Math.PI/2)+1)/2;
  if(s.phase==='runup'&&s.phaseTime>=.7){if(s.passMode&&s.passAvailable){s.phase='pass-flight';s.phaseTime=0;s.passBall={x:0,y:.15,z:-20+s.distance};}else strike(s);events.push({type:'kick'});}
  if(s.phase==='pass-flight'){const u=Math.min(1,s.phaseTime/2.4);s.passBall={x:5*u,y:.15+1.1*u+Math.sin(u*Math.PI)*2.5,z:(-20+s.distance)*(1-u)-8*u};if(u===1){s.phase='assist-timing';s.phaseTime=0;}}
  if(s.phase==='assist-timing'&&s.phaseTime>=2.8){s.timingGrade='miss';failAssist(s);events.push({type:'result',result:'wide'});}
  if(s.phase==='assist-kick'&&s.phaseTime>=.8){strike(s,true);events.push({type:'kick'});}

  if(s.phase==='flight'){
    const sh=s.shot;
    stepShot(sh,dt,sh.keeperEnabled&&!sh.perfectAssist,s.wall,battleWallZ(s.distance));
    s.frames.push({...sh});
    if(sh.result){resolveBattleShot(s,sh.result,sh);s.lastReplay={sampleRate:120,frames:s.frames.map(f=>({...f})),distance:sh.assisted?12:s.distance,wall:s.wall};events.push({type:'result',result:sh.result});}
  }
  if(s.phase==='result'&&s.phaseTime>=4.2)events.push(...nextBattleShot(s));
  return events;
}
export function nextBattleShot(s){
  if(s.phase!=='result')return [];
  if(s.lives<=0||(s.mode==='match'&&s.remaining<=0)){s.finished=true;s.phase='ranking';return [{type:'ranking'}];}
  s.bonusChance=s.attempts%4===2;
  if(s.mode==='arcade'){s.stage=Math.min(8,1+Math.floor(s.goals/3));s.wall=STAGES[s.stage-1].wall;}
  s.distance=s.bonusChance?12:STAGES[s.stage-1].distance+(s.attempts%2);
  s.phase='ready';s.phaseTime=0;s.shot=null;s.passBall=null;s.passMode=false;s.timingGrade='';s.power=0;return [{type:'reset'}];
}
