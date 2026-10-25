import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const canvas=document.querySelector('#world'), loader=document.querySelector('#loader'), lure=document.querySelector('#lure');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
const probe=document.createElement('canvas'),canWebGL=!!(probe.getContext('webgl2')||probe.getContext('webgl'));
if(!canWebGL){document.body.classList.add('no-webgl');document.querySelector('.fallback').style.display='block';loader.classList.add('done');}
else {
renderer=new THREE.WebGLRenderer({canvas,antialias:innerWidth>700,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.35:1.8));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=innerWidth>700;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.72;
const scene=new THREE.Scene();scene.background=new THREE.Color('#788b82');scene.fog=new THREE.FogExp2('#65736b',.022);
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.1,150);camera.position.set(0,3.2,13);
scene.add(new THREE.HemisphereLight('#b8c7bd','#263026',2.4));
const sun=new THREE.DirectionalLight('#ffd09b',4.2);sun.position.set(-7,11,2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);scene.add(sun);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180,80,80),new THREE.MeshStandardMaterial({color:'#273329',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.7;ground.receiveShadow=true;
const p=ground.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin(x*.16)*.35+Math.cos(y*.12)*.25+Math.sin((x+y)*.07)*.5)}p.needsUpdate=true;ground.geometry.computeVertexNormals();scene.add(ground);
// Varied branching conifers replace single geometric cones.
const trees=new THREE.Group();
const bark=new THREE.MeshStandardMaterial({color:'#322d25',roughness:1});
const foliagePalette=['#26382b','#304532','#1b3027','#425443'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide}));
const branchGeo=new THREE.CylinderGeometry(.012,.055,1,5);
const leafGeo=new THREE.IcosahedronGeometry(1,1);
function seeded(n){let x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)}
function createTree(seed,height){
 const t=new THREE.Group(), trunk=new THREE.Mesh(new THREE.CylinderGeometry(.04,.12,height,7),bark);
 trunk.position.y=height*.5;trunk.castShadow=true;t.add(trunk);
 const levels=5+Math.floor(seeded(seed+2)*3), branches=7+Math.floor(seeded(seed+3)*3);
 for(let j=0;j<levels;j++){
  const y=.5+j*(height-.95)/levels, spread=(1-j/levels)*1.28+.12;
  for(let k=0;k<branches;k++){
   const angle=k*Math.PI*2/branches+j*.55+seeded(seed+j*11+k)*.35;
   const length=spread*(.72+seeded(seed*5+j*10+k)*.55);
   const branch=new THREE.Mesh(branchGeo,bark);
   branch.position.set(Math.cos(angle)*length*.45,y+length*.1,Math.sin(angle)*length*.45);
   branch.rotation.z=-Math.cos(angle)*1.12;branch.rotation.x=Math.sin(angle)*1.12;
   branch.scale.set(.85,length, .85);t.add(branch);
   const foliage=new THREE.Mesh(leafGeo,foliagePalette[(seed+j+k)%foliagePalette.length]);
   foliage.position.set(Math.cos(angle)*length*.78,y+length*.15,Math.sin(angle)*length*.78);
   foliage.scale.set(.48+length*.29,.31+length*.30,.38+length*.25);
   foliage.rotation.set(seeded(seed+j)*.4,angle,seeded(k+seed)*.5);t.add(foliage);
  }
 }
 return t;
}
for(let i=0;i<62;i++){
 const a=i*2.39996,r=9+seeded(i+12)*18;
 const tree=createTree(i,3+seeded(i*7+4)*3.5);
 tree.position.set(Math.cos(a)*r,-.7,Math.sin(a)*r-4);
 tree.scale.setScalar(.85+seeded(i*3+1)*.5);trees.add(tree);
}
scene.add(trees);
// Ground-cover tufts, fern-like leaves and stones give the clearing a natural scale.
const grassGeo=new THREE.ConeGeometry(.026,.42,4),grassMat=new THREE.MeshStandardMaterial({color:'#52694b',roughness:1}),grass=new THREE.InstancedMesh(grassGeo,grassMat,2400),dummy=new THREE.Object3D();
for(let i=0;i<2400;i++){const a=seeded(i*4+6)*Math.PI*2,r=2+Math.sqrt(seeded(i*3+8))*27;dummy.position.set(Math.cos(a)*r,-.40,Math.sin(a)*r-2);dummy.rotation.set((seeded(i+19)-.5)*.3,seeded(i*5)*6.28,(seeded(i+12)-.5)*.35);dummy.scale.setScalar(.35+seeded(i+8)*1.6);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix)}scene.add(grass);
const stones=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:'#535a4c',roughness:1}),120);
for(let i=0;i<120;i++){const a=seeded(i*7+8)*6.28,r=2+seeded(i*11+9)*22;dummy.position.set(Math.cos(a)*r,-.51,Math.sin(a)*r-2);dummy.rotation.set(seeded(i)*.2,seeded(i+1)*6.28,0);dummy.scale.set(.08+seeded(i+3)*.2,.04+seeded(i+6)*.08,.08+seeded(i+4)*.2);dummy.updateMatrix();stones.setMatrixAt(i,dummy.matrix)}scene.add(stones);
let fox,mixer,actions=[],active=0,modelReady=false,foxProcedural=false,foxParts=null;
// A local procedural fox is always available. The optional detailed rig upgrades it when loaded.
function makeFox(){
 const root=new THREE.Group(), bodyRig=new THREE.Group();root.add(bodyRig);
 const orange=new THREE.MeshStandardMaterial({color:'#b86434',roughness:.96}),cream=new THREE.MeshStandardMaterial({color:'#e4c7a2',roughness:.96}),dark=new THREE.MeshStandardMaterial({color:'#281f1c',roughness:1}),eye=new THREE.MeshStandardMaterial({color:'#13120f',roughness:.5});
 const ball=(parent,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m};
 ball(bodyRig,orange,0,.65,0,.94,.47,.37);ball(bodyRig,cream,.18,.41,.02,.67,.25,.31);
 const head=new THREE.Group();head.position.set(.83,.95,0);bodyRig.add(head);
 ball(head,orange,0,0,0,.4,.38,.33);ball(head,cream,.25,-.21,0,.34,.16,.25);
 const nose=ball(head,dark,.55,-.19,0,.08,.065,.085);
 for(const side of [-1,1]){
  const ear=new THREE.Mesh(new THREE.ConeGeometry(.16,.49,4),orange);ear.position.set(-.15,.43,side*.25);ear.rotation.y=Math.PI/4;ear.castShadow=true;head.add(ear);
  ball(head,eye,.21,.05,side*.292,.055,.063,.045);
 }
 const legs=[];
 for(const x of [-.58,.55])for(const z of [-.23,.23]){const pivot=new THREE.Group();pivot.position.set(x,.44,z);bodyRig.add(pivot);const leg=ball(pivot,orange,0,-.26,0,.13,.35,.12);ball(pivot,dark,.045,-.52,.01,.17,.09,.15);legs.push(pivot)}
 const tail=new THREE.Group();tail.position.set(-.83,.84,0);bodyRig.add(tail);const bush=ball(tail,orange,-.48,.18,0,.63,.27,.27);bush.rotation.z=-.26;ball(tail,cream,-1,.3,0,.18,.19,.19);
 root.position.set(.7,-.66,-2.4);root.rotation.y=-.18;root.scale.setScalar(.85);
 root.userData.animate=(t,run)=>{bodyRig.position.y=Math.sin(t*(run?9:2))*(run?.045:.012);tail.rotation.z=Math.sin(t*2.3)*.16;head.rotation.y=Math.sin(t*.8)*.075;legs.forEach((l,i)=>{l.rotation.z=run?Math.sin(t*9+(i%3)*Math.PI)*.5:Math.sin(t*2+i)*.045})};
 return root;
}
function showFallbackFox(){if(modelReady)return;fox=makeFox();foxProcedural=true;scene.add(fox);modelReady=true;loader.classList.add('done');}
// Do not allow the landscape to become an empty experience if an external model fails.
const foxTimeout=setTimeout(showFallbackFox,12000);
new GLTFLoader().load('./assets/fox.glb',g=>{
 /* WILD_FOX_CUSTOM_MODEL */
 const detailed=g.scene;
 const rawBox=new THREE.Box3().setFromObject(detailed);
 const rawSize=rawBox.getSize(new THREE.Vector3());
 const biggest=Math.max(rawSize.x,rawSize.y,rawSize.z,.0001);
 detailed.scale.setScalar(2.4/biggest);
 const fittedBox=new THREE.Box3().setFromObject(detailed);
 const center=fittedBox.getCenter(new THREE.Vector3());
 detailed.position.set(.7-center.x,-.66-fittedBox.min.y,-2.4-center.z);
 detailed.rotation.y=-1.7;
 
 detailed.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 if(foxProcedural){scene.remove(fox);fox=null;foxProcedural=false}
 clearTimeout(foxTimeout);fox=detailed;scene.add(fox);mixer=new THREE.AnimationMixer(fox);actions=g.animations.map(c=>mixer.clipAction(c));actions[0]?.play();modelReady=true;loader.classList.add('done');
},undefined,()=>{new GLTFLoader().load('https://threejs.org/examples/models/gltf/Fox.glb',g=>{
 const detailed=g.scene;detailed.scale.setScalar(.035);detailed.position.set(.7,-.66,-2.4);detailed.rotation.y=-1.7;detailed.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});if(foxProcedural){scene.remove(fox);foxProcedural=false}clearTimeout(foxTimeout);fox=detailed;scene.add(fox);mixer=new THREE.AnimationMixer(fox);actions=g.animations.map(c=>mixer.clipAction(c));actions[0]?.play();modelReady=true;loader.classList.add('done');
 },undefined,()=>{clearTimeout(foxTimeout);showFallbackFox()});});
function playClip(index,speed=1){if(foxProcedural){active=index;return}if(!actions.length||active===index)return;actions[active]?.fadeOut(.35);actions[index]?.reset().setEffectiveTimeScale(speed).fadeIn(.35).play();active=index}
let targetX=.58,targetY=.62,lureActive=false;addEventListener('pointermove',e=>{targetX=e.clientX/innerWidth;targetY=e.clientY/innerHeight;if(scrollProgress()>.45&&scrollProgress()<.78){lureActive=true;lure.style.opacity='1';lure.style.left=e.clientX+'px';lure.style.top=e.clientY+'px'}});document.querySelector('#touch-light').onclick=()=>{lureActive=true;targetX=.35+Math.random()*.3;targetY=.45+Math.random()*.25;lure.style.opacity='1';lure.style.left=(targetX*innerWidth)+'px';lure.style.top=(targetY*innerHeight)+'px'};
const scrollProgress=()=>scrollY/(document.documentElement.scrollHeight-innerHeight||1);
const dawn=new THREE.Color('#788b82'),ember=new THREE.Color('#9a563c'),night=new THREE.Color('#0b1116');let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;const s=reduced?.35:scrollProgress();let x,y,z,lookY;
if(s<.28){const q=s/.28;x=THREE.MathUtils.lerp(0,-2.2,q);y=THREE.MathUtils.lerp(3.2,2.3,q);z=THREE.MathUtils.lerp(13,8,q);lookY=.9;scene.background.copy(dawn).lerp(ember,q*.25);}
else if(s<.58){const q=(s-.28)/.3;x=THREE.MathUtils.lerp(-2.2,2.8,q);y=THREE.MathUtils.lerp(2.3,1.65,q);z=THREE.MathUtils.lerp(8,6.2,q);lookY=.6;scene.background.copy(dawn).lerp(ember,.25+q*.55);if(fox){fox.position.x=THREE.MathUtils.lerp(.7,-1.2,q);fox.position.z=THREE.MathUtils.lerp(-2.4,-2.2,q);fox.rotation.y=-1.55;playClip(q>.1&&q<.92?1:0,q>.65?1.25:.8)}}
else{const q=Math.min(1,(s-.58)/.42);x=THREE.MathUtils.lerp(2.8,-1,q);y=THREE.MathUtils.lerp(1.65,3.2,q);z=THREE.MathUtils.lerp(6.2,10.5,q);lookY=.5;scene.background.copy(ember).lerp(night,q);if(fox){const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(targetX*2-1,1-targetY*2),camera);const hit=new THREE.Vector3();const point=ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),.5),hit);const tx=point?THREE.MathUtils.clamp(point.x,-5,5):0,tz=point?THREE.MathUtils.clamp(point.z,-7,2):-2;const desired=lureActive&&q<.55?tx:-3.3;fox.position.x=THREE.MathUtils.lerp(fox.position.x,desired,.025);fox.position.z=THREE.MathUtils.lerp(fox.position.z,lureActive?tz:-2,.02);fox.rotation.y=THREE.MathUtils.lerp(fox.rotation.y,desired>fox.position.x?1.55:-1.55,.04);playClip(Math.abs(desired-fox.position.x)>.45?1:0,.85)}}
camera.position.lerp(new THREE.Vector3(x,y,z),.055);camera.lookAt(0,lookY,-2);sun.intensity=THREE.MathUtils.lerp(4.2,.7,Math.max(0,(s-.45)/.55));scene.fog.color.copy(scene.background);audioFrame(now,s);mixer?.update(dt);if(foxProcedural&&fox?.userData.animate)fox.userData.animate(now/1000,active===1);renderer.render(scene,camera)}requestAnimationFrame(frame);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerWidth<700?52:38;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.2:1.8));renderer.setSize(innerWidth,innerHeight)});
// Real wind-like filtered noise and intermittent bird calls, generated locally without remote audio files.
let audioCtx, master, wind, birdTimer=0, soundEnabled=false;
function chirp(t){if(!audioCtx||!soundEnabled)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='sine';o.frequency.setValueAtTime(1550,t);o.frequency.exponentialRampToValueAtTime(2550,t+.09);o.frequency.exponentialRampToValueAtTime(1850,t+.22);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+.26);o.connect(g).connect(master);o.start(t);o.stop(t+.28)}
function setupAudio(){audioCtx=new AudioContext();master=audioCtx.createGain();master.gain.value=0;master.connect(audioCtx.destination);
 const length=audioCtx.sampleRate*3,buffer=audioCtx.createBuffer(1,length,audioCtx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*.35;
 const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;const low=audioCtx.createBiquadFilter(),high=audioCtx.createBiquadFilter();low.type='lowpass';low.frequency.value=420;high.type='highpass';high.frequency.value=90;source.connect(low).connect(high).connect(master);source.start();wind=low;
}
document.querySelector('#sound').onclick=async e=>{const b=e.currentTarget; soundEnabled=!soundEnabled;b.setAttribute('aria-pressed',String(soundEnabled));b.querySelector('.sound-label').textContent=soundEnabled?'Sound on':'Sound off';if(!audioCtx)setupAudio();await audioCtx.resume();master.gain.setTargetAtTime(soundEnabled?.21:0,audioCtx.currentTime,.3);if(soundEnabled)chirp(audioCtx.currentTime+.15)};
function audioFrame(now,s){if(!audioCtx||!soundEnabled)return;wind.frequency.setTargetAtTime(320+Math.sin(now*.00022)*110+(s>.7?45:0),audioCtx.currentTime,.6);if(now>birdTimer){chirp(audioCtx.currentTime+.02);birdTimer=now+3800+Math.random()*5300}}
}
