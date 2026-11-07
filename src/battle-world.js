import * as T from 'three';
import { keeperX } from './game.js';
import { battleWallZ } from './battle-engine.js';
export function battleWorld(canvas){
 const renderer=new T.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene();scene.background=new T.Color('#80ace5');scene.fog=new T.Fog('#9bb9d9',95,190);
 scene.add(new T.HemisphereLight('#ffffff','#a6b97b',2));const sun=new T.DirectionalLight('#fff4e2',1.6);sun.position.set(-10,25,15);scene.add(sun);
 const camera=new T.PerspectiveCamera(30,1,.05,220);const loader=new T.TextureLoader();
 const material=new Map();const mat=c=>{if(!material.has(c))material.set(c,new T.MeshLambertMaterial({color:c}));return material.get(c)};
 const mesh=(g,m,p,parent=scene)=>{const o=new T.Mesh(g,typeof m==='string'?mat(m):m);o.position.set(...p);parent.add(o);return o};
 const box=(w,h,d,c,x,y,z,parent=scene)=>mesh(new T.BoxGeometry(w,h,d),c,[x,y,z],parent);
 const sphere=(r,c,x,y,z,parent=scene)=>mesh(new T.SphereGeometry(r,24,16),c,[x,y,z],parent);
 const capsule=(r,h,c,x,y,z,parent)=>mesh(new T.CapsuleGeometry(r,h,6,12),c,[x,y,z],parent);
 function line(points,color='#ffffff',opacity=1,parent=scene){const g=new T.BufferGeometry().setFromPoints(points.map(v=>new T.Vector3(...v)));const o=new T.Line(g,new T.LineBasicMaterial({color,transparent:opacity<1,opacity}));parent.add(o);return o}
 const grass=['#80b448','#76aa40'];
 box(145,.15,160,'#b6915b',0,-.13,-20);
 for(let i=0;i<24;i++)box(80,.05,5, new T.MeshBasicMaterial({color:grass[i%2]}),0,-.04,37-i*5);
 const rect=(x,z,w,d)=>line([[x,.01,z],[x+w,.01,z],[x+w,.01,z+d],[x,.01,z+d],[x,.01,z]],'#edf2dc');
 rect(-34,-20,68,86);rect(-20.15,-20,40.3,16.5);rect(-9.15,-20,18.3,5.5);
 const arc=[];for(let i=0;i<=70;i++){const a=i/70*Math.PI;arc.push([Math.cos(a)*9.15,.015,-9+Math.sin(a)*9.15])}line(arc,'#f5f5df');
 const crowdTexture=loader.load('/reference/crowd.jpg');crowdTexture.colorSpace=T.SRGBColorSpace;crowdTexture.wrapS=T.RepeatWrapping;crowdTexture.repeat.x=5;
 const crowdMat=new T.MeshBasicMaterial({map:crowdTexture});
 const adTexture=loader.load('/reference/advert.jpg');adTexture.colorSpace=T.SRGBColorSpace;adTexture.wrapS=T.RepeatWrapping;adTexture.repeat.x=14;
 const adMat=new T.MeshBasicMaterial({map:adTexture});
 for(let side=0;side<4;side++){
  const stand=new T.Group();stand.rotation.y=-side*Math.PI/2;scene.add(stand);stand.position.set(Math.sin(side*Math.PI/2)*54,0,-3+Math.cos(side*Math.PI/2)*-55);
  // Each grandstand is independently modelled; reference texture supplies only the stationary crowd.
  for(let row=0;row<3;row++){
   const p=mesh(new T.PlaneGeometry(115,10),crowdMat,[0,5+row*12,-row*4],stand);p.rotation.x=-.25;
   box(120,1.6,3,'#354959',0,11+row*12,-row*4,stand);
   box(120,.8,1,'#ebedc8',0,12.1+row*12,1-row*4,stand);
   for(let x=-48;x<=48;x+=24){const stair=box(2.5,10,.1,'#aab3bd',x,5+row*12,.1-row*4,stand);stair.rotation.z=.05;}
  }
  box(120,.7,17,'#eceee4',0,39,-7,stand);
  for(let x=-56;x<=56;x+=14){box(.23,40,.23,'#505c68',x,20,-7,stand);box(.22,.3,19,'#a0a5a8',x,39,-7,stand);}
 }
 const ads=mesh(new T.PlaneGeometry(110,2.2),adMat,[0,1.1,-25]);
 const goal=new T.Group();scene.add(goal);
 for(const x of [-3.66,3.66])box(.09,2.44,.09,'#ffffff',x,1.22,-20,goal);box(7.42,.09,.09,'#ffffff',0,2.44,-20,goal);
 for(let x=-3.66;x<=3.67;x+=.18)line([[x,0,-21.8],[x,2.44,-21.8],[x,2.44,-20]],'#fffef5',.6,goal);
 for(let y=0;y<=2.45;y+=.18)line([[-3.66,y,-20],[-3.66,y,-21.8],[3.66,y,-21.8],[3.66,y,-20]],'#ffffff',.6,goal);
 const skin='#e6bda1';
 function person(keeper=false,defender=false){
  const skin=new T.MeshLambertMaterial({color:'#e6bda1'}),hairMaterial=new T.MeshLambertMaterial({color:keeper?'#211d19':'#634015'}),shortsMaterial=new T.MeshLambertMaterial({color:keeper?'#19252c':defender?'#283543':'#f6f4ea'}),shoesMaterial=new T.MeshLambertMaterial({color:keeper?'#131d2b':'#70271b'});const tails=[];let tuft;
  const root=new T.Group();scene.add(root);const shirtMaterial=new T.MeshLambertMaterial({color:keeper?'#202933':defender?'#e5e5dc':'#f4f2ea'});
  const torso=mesh(new T.CylinderGeometry(.19,.135,.44,24),shirtMaterial,[0,1.10,0],root);torso.scale.z=.67;
  capsule(.073,.12,skin,0,1.41,0,root);
  capsule(.105,.12,skin,0,.82,0,root).scale.z=.80;
  const waist=sphere(.20,shortsMaterial,0,.77,0,root);waist.scale.set(1,.52,.76);
  for(const side of [-1,1]){capsule(.115,.10,shortsMaterial,side*.105,.74,0,root).scale.z=.83;if(!keeper&&!defender)box(.025,.23,.14,'#b72b36',side*.215,.74,0,root);}
  const headGeometry=new T.SphereGeometry(.29,28,20);const vertices=headGeometry.getAttribute('position');for(let i=0;i<vertices.count;i++){const y=vertices.getY(i);if(y<-.04)vertices.setX(i,vertices.getX(i)*(1-Math.min(.25,(-y-.04)*.9)));}headGeometry.computeVertexNormals();const head=mesh(headGeometry,skin,[0,1.63,0],root);head.scale.set(.86,1.04,.90);
  const hair=sphere(.295,hairMaterial,0,1.73,-.035,root);hair.scale.set(.90,.76,.96);
  if(!keeper&&!defender){
   for(const side of [-1,1]){const path=new T.CatmullRomCurve3([new T.Vector3(side*.23,1.69,-.06),new T.Vector3(side*.31,1.53,-.06),new T.Vector3(side*.41,1.35,-.025),new T.Vector3(side*.46,1.26,.02)]);const g=new T.TubeGeometry(path,12,.10,10,false),v=g.getAttribute('position');for(let ring=0;ring<=12;ring++){const center=path.getPointAt(ring/12),taper=1-Math.pow(ring/12,3)*.96;for(let j=0;j<=10;j++){const n=ring*11+j;v.setXYZ(n,center.x+(v.getX(n)-center.x)*taper,center.y+(v.getY(n)-center.y)*taper,center.z+(v.getZ(n)-center.z)*taper*.65);}}g.computeVertexNormals();const tail=mesh(g,hairMaterial,[0,0,0],root),band=sphere(.035,'#ad2b32',side*.265,1.61,-.04,root);tails.push({tail,band});}
   for(const x of [-.16,-.07,.04,.14]){const fringe=mesh(new T.ConeGeometry(.075,.18,5),hairMaterial,[x,1.77,.19],root);fringe.rotation.z=Math.PI+x;fringe.scale.z=.4;}
   tuft=mesh(new T.ConeGeometry(.07,.28,5),hairMaterial,[.02,1.98,-.04],root);tuft.rotation.z=.17;
  }
  for(const s of [-1,1]){
   sphere(.083,'#fff9f0',s*.10,1.64,.237,root).scale.set(1,.65,.16);
   sphere(.045,'#704022',s*.10,1.64,.252,root).scale.set(.85,.95,.18);
   sphere(.023,'#161414',s*.10,1.64,.261,root).scale.z=.16;
   sphere(.012,'#ffffff',s*.10-.012,1.66,.269,root);
   const brow=box(.14,.025,.016,'#4b2a18',s*.105,1.74,.25,root);brow.rotation.z=-s*.15;
  }
  sphere(.025,skin,0,1.56,.283,root);sphere(.052,keeper?'#9c6d58':'#bf3854',0,1.48,.245,root).scale.set(1,.35,.3);
  const legs=[],arms=[],elbows=[],knees=[];
  for(const s of [-1,1]){
   const leg=new T.Group();leg.position.set(s*.105,.73,0);root.add(leg);legs.push(leg);
   capsule(.077,.20,skin,0,-.14,0,leg);const knee=new T.Group();knee.position.y=-.30;leg.add(knee);knees.push(knee);sphere(.069,skin,0,0,0,knee);capsule(.068,.20,keeper?'#202633':'#f0f1e8',0,-.19,0,knee);
   box(.13,.035,.15,'#bc2535',0,-.09,.01,knee);const boot=sphere(.115,shoesMaterial,0,-.35,.06,knee);boot.scale.set(.72,.58,1.4);
   const arm=new T.Group();arm.position.set(s*.255,1.24,0);root.add(arm);arms.push(arm);
   capsule(.075,.12,keeper?'#202933':'#f7f3e9',0,-.075,0,arm);capsule(.074,.01,keeper?'#dddddd':'#b72b36',0,-.16,0,arm);
   const elbow=new T.Group();elbow.position.y=-.24;arm.add(elbow);elbows.push(elbow);capsule(.055,.15,skin,0,-.10,0,elbow);sphere(keeper?.105:.065,keeper?'#e6ecea':skin,0,-.25,.02,elbow);
   arm.rotation.z=s*.12;
  }
  if(!keeper&&!defender){for(const side of [-1,1]){const trim=box(.14,.016,.014,'#b72b36',side*.06,1.29,.132,root);trim.rotation.z=side*.4;}box(.045,.024,.012,'#20242b',.11,1.24,.135,root);}
  const accessories=new T.Group(),eyewear=new T.Group();root.add(accessories,eyewear);
  if(!keeper&&!defender){
   const c=document.createElement('canvas');c.width=128;c.height=160;const ctx=c.getContext('2d');ctx.fillStyle='#a8232c';ctx.textAlign='center';ctx.font='bold 24px Arial';ctx.fillText('ROOKIE',64,34);ctx.font='bold 100px Arial';ctx.fillText('7',64,140);
   const texture=new T.CanvasTexture(c);const number=mesh(new T.PlaneGeometry(.28,.35),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}),[0,1.12,-.137],root);number.rotation.y=Math.PI;
  }
  const shadow=mesh(new T.CircleGeometry(.45,24),new T.MeshBasicMaterial({color:'#183923',transparent:true,opacity:.25,depthWrite:false}),[0,.02,0],root);shadow.rotation.x=-Math.PI/2;shadow.scale.y=.6;
  return {root,torso,shirtMaterial,skinMaterial:skin,hairMaterial,shortsMaterial,shoesMaterial,tails,tuft,eyewear,legs,arms,elbows,knees,accessories};
 }
 const player=person();const helper=person();helper.root.visible=false;const keeper=person(true);keeper.root.position.set(0,0,-19.6);
 const defenders=Array.from({length:4},(_,i)=>{const p=person(false,true);p.root.position.set((i-1.5)*.6,0,-9);return p});
 const ballMaterial=new T.MeshStandardMaterial({color:'#ffffff',roughness:.55});const ball=new T.Group();scene.add(ball);mesh(new T.SphereGeometry(.135,28,20),ballMaterial,[0,0,0],ball);
 const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;const gc=glowCanvas.getContext('2d'),gradient=gc.createRadialGradient(64,64,10,64,64,64);gradient.addColorStop(0,'#ffffcc');gradient.addColorStop(.3,'#ffdd2288');gradient.addColorStop(.6,'#ff6e0033');gradient.addColorStop(1,'#ff220000');gc.fillStyle=gradient;gc.fillRect(0,0,128,128);const glow=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(glowCanvas),transparent:true,depthWrite:false,blending:T.AdditiveBlending}));glow.scale.set(.9,.9,.9);ball.add(glow);
 const v=new T.IcosahedronGeometry(1,0).getAttribute('position'),seen=new Set();
 for(let i=0;i<v.count;i++){const p=new T.Vector3().fromBufferAttribute(v,i).normalize();const key=p.toArray().join();if(seen.has(key))continue;seen.add(key);const patch=mesh(new T.CircleGeometry(.047,5),'#202523',p.clone().multiplyScalar(.134).toArray(),ball);patch.lookAt(p.multiplyScalar(2));}
 const arrow=new T.Group();arrow.scale.setScalar(.45);scene.add(arrow);const shape=new T.Shape();[[-.24,0],[.24,0],[.24,.70],[.40,.70],[0,1.02],[-.4,.70],[-.24,.7]].forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
 const ag=new T.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:false});const am=new T.MeshBasicMaterial({color:'#ffc900'});mesh(ag,am,[0,0,0],arrow);box(.48,.28,.13,'#ff6a00',0,.14,.055,arrow);
 const direction=line([[0,.2,1],[0,.2,-20]],'#e8eb74',.5);const dp=direction.geometry.getAttribute('position');
 const trailData=new Float32Array(90*3),trailGeo=new T.BufferGeometry();trailGeo.setAttribute('position',new T.BufferAttribute(trailData,3));const trail=new T.Line(trailGeo,new T.LineBasicMaterial({color:'#fff8d5',transparent:true,opacity:.7}));scene.add(trail);let trailPoints=[];
 let kitId='rookie',glassesId='',lastShotTime=-1;
 function appearance(kit,ballColor,equipment={}){player.shirtMaterial.color.set(kit.color);ballMaterial.color.set(ballColor);
  player.skinMaterial.color.set(equipment.skin?.color||'#e6bda1');player.hairMaterial.color.set(equipment.hair?.color||'#634015');player.shortsMaterial.color.set(equipment.shorts?.color||'#f6f4ea');player.shoesMaterial.color.set(equipment.shoes?.color||'#70271b');
  const male=equipment.gender?.id==='male',style=equipment.hair?.style||'twins';player.torso.scale.x=male?1.1:1;player.torso.scale.y=male?1.13:1;player.torso.position.y=male?1.08:1.10;
  player.tails.forEach(({tail,band},i)=>{tail.visible=!male&&style!=='short'&&(style!=='pony'||i===0);tail.rotation.y=style==='pony'?-Math.PI/2:0;band.visible=tail.visible&&style==='twins';});player.tuft.visible=!male&&style!=='short';
  const glasses=equipment.glasses;if(glasses?.id!==glassesId){glassesId=glasses?.id;for(const child of [...player.eyewear.children]){player.eyewear.remove(child);child.geometry?.dispose();}if(glasses&&glasses.style!=='none'){for(const side of [-1,1]){const rim=mesh(new T.TorusGeometry(.089,.012,7,24),glasses.color,[side*.10,1.64,.285],player.eyewear);rim.scale.y=.68;if(glasses.style==='sun'){const lens=sphere(.077,'#15232d',side*.10,1.64,.286,player.eyewear);lens.scale.set(1,.66,.11);}}box(.045,.016,.014,glasses.color,0,1.65,.285,player.eyewear);}}
  if(kit.id===kitId)return;kitId=kit.id;
  for(const child of [...player.accessories.children]){player.accessories.remove(child);child.geometry?.dispose();}
  if(kit.id==='pirate'){box(.72,.12,.44,'#242326',0,1.95,0,player.accessories);box(.4,.22,.34,'#242326',0,2.08,0,player.accessories);}
  if(kit.id==='samurai'){for(const s of [-1,1])box(.3,.15,.4,'#a99554',s*.27,1.26,0,player.accessories);box(.6,.17,.45,'#343e50',0,1.93,0,player.accessories);}
  if(kit.id==='bunny')for(const s of [-1,1]){const ear=sphere(.07,'#e4c9ec',s*.13,2.08,0,player.accessories);ear.scale.y=3.2;}
 }
 function reset(){trailPoints=[];trail.visible=false;lastShotTime=-1;goal.scale.z=1;}
 function update(s,screen='game',orbit=0){
  const oz=-20+s.distance;const phase=s.phase;const shot=s.shot;
  const preview=screen==='shop'||screen==='profile';const result=phase==='result'||phase==='ranking';
  for(let i=0;i<defenders.length;i++){const d=defenders[i];d.root.visible=i<s.wall&&!preview;d.root.position.set((i-(s.wall-1)/2)*.63,0,battleWallZ(s.distance));d.arms.forEach((p,j)=>{p.rotation.z=(j?-1:1)*.7;p.rotation.x=-.2});d.elbows.forEach((p,j)=>p.rotation.z=(j?-1:1)*1.4);}
  helper.root.visible=s.passAvailable&&!preview&&screen==='game';helper.root.position.set(5,0,-8);helper.root.rotation.set(0,Math.PI,0);helper.legs.forEach(p=>p.rotation.x=0);helper.arms.forEach((p,i)=>p.rotation.z=(i?1:-1)*.12);
  if(phase==='assist-kick'){const t=Math.min(1,s.phaseTime/.8);helper.root.position.y=(1-Math.cos(t*Math.PI))+Math.sin(t*Math.PI)*.9;helper.root.rotation.x=-Math.PI*t;helper.legs[1].rotation.x=-1.5;helper.arms.forEach((p,i)=>p.rotation.z=(i?1:-1)*1.1);}
  if(shot?.assisted&&!shot.assistMiss){const poseTime=shot.time+(result?s.phaseTime:0);helper.root.rotation.x=-Math.PI*Math.exp(-poseTime*4);const recovery=Math.exp(-poseTime*4)*Math.PI;helper.root.position.y=1-Math.cos(recovery)+Math.sin(recovery)*.9;}
  glow.visible=Boolean(s.bonusChance||s.passMode);glow.material.opacity=.7+Math.sin(s.time*12)*.15;
  keeper.root.visible=(shot?shot.keeperEnabled:!(s.stage===1&&s.attempts===0))&&!preview;
  player.root.position.set(-1.1,0,oz+1.15);player.root.rotation.set(0,Math.PI,0);
  player.legs.forEach(p=>p.rotation.x=0);player.knees.forEach(p=>p.rotation.x=0);player.elbows.forEach((p,i)=>p.rotation.z=(i?1:-1)*.12);player.arms.forEach((p,i)=>{p.rotation.x=0;p.rotation.z=(i?1:-1)*.12;});
  ball.position.set(0,.15,oz);ball.rotation.set(0,0,0);
  player.root.visible=!['ready','charging'].includes(phase)||preview;
  const active=['ready','charging'].includes(phase)&&!preview;
  arrow.visible=active;direction.visible=active;arrow.position.set(0,.32,oz);arrow.rotation.y=-s.aim/7;
  dp.setXYZ(0,0,.25,oz);dp.setXYZ(1,s.aim,1.0,-20);dp.needsUpdate=true;
  if(phase==='runup'){
   const t=Math.min(1,s.phaseTime/.7);player.root.position.set(-1.1+t*.82,0,oz+1.15-t*1.05);
   player.legs[0].rotation.x=Math.sin(t*Math.PI*3)*.7;player.legs[1].rotation.x=-Math.sin(t*Math.PI*3)*.8;player.knees.forEach((p,i)=>p.rotation.x=Math.max(0,Math.sin(t*Math.PI*3+i*Math.PI))*.9);
   player.arms[0].rotation.x=-Math.sin(t*Math.PI*3)*.4;player.arms[1].rotation.x=Math.sin(t*Math.PI*3)*.4;
  }
  if(shot){
   ball.position.set(shot.x,shot.y,shot.z);ball.rotation.x=-shot.time*16;ball.rotation.y=shot.time*s.curve*8;
   player.root.position.set(-.28,0,oz+.1);player.legs[1].rotation.x=-Math.exp(-shot.time*6)*1.5;player.knees[1].rotation.x=Math.exp(-shot.time*9)*.4;
   const k=keeperX(shot.time,shot.perfectAssist?-3.2:shot.x);keeper.root.position.set(k,Math.sin(Math.min(1,Math.abs(k)/3)*Math.PI)*.4,-19.6);keeper.root.rotation.z=-Math.sign(k)*Math.min(1,Math.abs(k)*.4);
   keeper.arms.forEach((p,i)=>{p.rotation.z=(i?1:-1)*(.3+Math.abs(k)*.25)});
   if(phase==='flight'&&shot.time!==lastShotTime){lastShotTime=shot.time;trailPoints.push(ball.position.clone());if(trailPoints.length>90)trailPoints.shift();trailPoints.forEach((p,i)=>p.toArray(trailData,i*3));trailGeo.setDrawRange(0,trailPoints.length);trailGeo.attributes.position.needsUpdate=true;trail.visible=true;}
  }else{keeper.root.position.set(Math.sin(s.time)*.12,0,-19.6);keeper.root.rotation.z=0;}
  if(s.passBall&&!shot)ball.position.set(s.passBall.x,s.passBall.y,s.passBall.z);
  const target=new T.Vector3(0,1.2,-20),pos=new T.Vector3(0,1.16,oz+5.2);
  if((phase==='flight'||phase==='replay')&&shot){pos.set(shot.x*.3,Math.max(1.4,shot.y+.5),Math.max(-16,shot.z+8));target.set(shot.x,shot.y,-21);}
  if(phase==='pass-flight'){pos.set(ball.position.x*.4,Math.max(1.6,ball.position.y+.5),ball.position.z+9);target.set(5,1,-8);}
  if(phase==='assist-timing'||phase==='assist-kick'){pos.set(7,2,-3);target.set(5,1.5,-8);}
  if(result&&shot){
   if(shot.result==='blocked'||shot.assistMiss){pos.set(shot.x+4,3,shot.z+7);target.set(shot.x,1,shot.z);}
   else if(shot.result==='goal'&&s.bonuses.reduce((n,b)=>n+b.points,0)>=300){pos.set(-.2,1.2,oz+3.1);target.set(0,1.15,oz);player.root.position.set(0,0,oz);player.root.rotation.y=0;player.arms.forEach((p,i)=>p.rotation.z=(i?1:-1)*(1.1+Math.sin(s.phaseTime*5)*.15));player.elbows.forEach((p,i)=>p.rotation.z=(i?1:-1)*1.4);}
   else {pos.set(6,3.7,-13);target.set(0,1,-20);}
   if(shot.result==='goal')goal.scale.z=1+Math.sin(s.phaseTime*18)*Math.exp(-s.phaseTime*3)*.002;
  }
  if(phase==='ranking'||preview){player.root.position.set(0,0,oz);player.root.rotation.y=preview?orbit:0;player.arms.forEach((p,i)=>p.rotation.z=preview?(i?1:-1)*.12:(i?1:-1)*(1.6+Math.sin(s.time*3)*.1));pos.set(preview?.4:-.8,preview?1.1:1.4,oz+(preview?4.4:3));target.set(preview?1.0:.8,preview?.95:1.2,oz);if(!preview)player.elbows.forEach((p,i)=>p.rotation.z=(i?1:-1)*1.25);keeper.root.visible=false;defenders.forEach(d=>d.root.visible=false);ball.visible=false;}
  else ball.visible=true;
  if(screen==='game'&&orbit&&['ready','charging'].includes(phase))pos.add(new T.Vector3(1,.8,2));
  camera.position.copy(pos);camera.lookAt(target);camera.updateMatrixWorld();
 }
 function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();}
 new ResizeObserver(resize).observe(canvas);resize();
 function pick(x,y){const r=canvas.getBoundingClientRect();const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),camera);const p=ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,0,1),20),new T.Vector3());return p?{x:T.MathUtils.clamp(p.x,-5.5,5.5),y:T.MathUtils.clamp(p.y,.25,3.1)}:null;}
 function screenPoint(point){const v=point.clone().project(camera);return{x:T.MathUtils.clamp((v.x+1)/2,.1,.9),y:T.MathUtils.clamp((1-v.y)/2,.18,.88)}}
 return {update,appearance,reset,pick,ballScreen(){return screenPoint(ball.position)},helperScreen(){return screenPoint(new T.Vector3(5,2.15,-8))},render(){renderer.render(scene,camera)},renderer};
}
