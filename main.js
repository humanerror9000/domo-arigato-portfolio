import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const stage=document.querySelector('#stage');
const loading=document.querySelector('#loading');
const progress=document.querySelector('#progress');
const headline=document.querySelector('#headline');
const secondLine=document.querySelector('#second-line');
const hint=document.querySelector('#scroll-hint');
const language=document.querySelector('#language');
const watchHero=document.querySelector('#watch-hero');
const feature=document.querySelector('#feature');
const mobile=matchMedia('(max-width: 700px)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
let english=false;
language.onclick=()=>{
  english=!english;language.textContent=english?'ES':'EN';
  headline.innerHTML=english?'Less<br>noise.':'Menos<br>ruido.';
  secondLine.textContent=english?'More intention.':'Más intención.';
  hint.innerHTML=(english?'Scroll to explore':'Desliza para explorar')+' <span>↓</span>';
  watchHero.innerHTML=english?'Watch El Camino <span>↗</span>':'Ver El Camino <span>↗</span>';
  document.querySelector('#close-film').textContent=english?'← Back':'← Volver';
  document.querySelector('#footer-heading').textContent=english?"Let's talk.":'Hablemos.';
  document.querySelector('#footer-email-label').textContent=english?'Email':'Correo';
  document.querySelector('#footer-phone-label').textContent=english?'Mobile':'Cel.';
  document.documentElement.lang=english?'en':'es';
  window.updateLibraryLanguage?.(english);
  window.dispatchEvent(new CustomEvent('da-language-change',{detail:{english}}));
};
function playFilm(){
  const frame=document.querySelector('#film-frame');
  if(frame.querySelector('iframe'))return;
  const selected=window.selectedPortfolioWork||{title:'El Camino',id:'3KKLrafJkb4'};
  if(selected.link){window.open(selected.link,'_blank','noopener,noreferrer');return;}
  const iframe=document.createElement('iframe');
  iframe.title=selected.title;
  iframe.src=`https://www.youtube.com/embed/${selected.id}?autoplay=1&rel=0&playsinline=1`;
  iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen=true;
  document.querySelector('#player-layer').append(iframe);
  frame.classList.add('playing');
  document.querySelector('#feature-shell').classList.add('is-playing');
  document.querySelector('#close-film').focus();
}
watchHero.onclick=()=>{window.selectPortfolioWork?.(1);feature.scrollIntoView({behavior:'smooth'});playFilm()};
document.querySelector('#play-film').onclick=playFilm;
document.querySelector('#close-film').onclick=()=>{
  document.querySelector('#player-layer').replaceChildren();
  document.querySelector('#film-frame').classList.remove('playing');
  document.querySelector('#feature-shell').classList.remove('is-playing');
  document.querySelector('#play-film').focus();
};
function updateWatchButton(p){
  const visible=false;
  watchHero.classList.toggle('visible',visible);
  watchHero.style.opacity=visible?String(smooth((p-.88)/.06)):'0';
  watchHero.style.visibility=visible?'visible':'hidden';
}

if(!THREE.WebGLRenderer || mobile || reduced){
  document.body.classList.add('fallback','ready');
  loading.remove();
  fallbackScroll();
}else{
  try{await start()}catch(error){console.error(error);document.body.classList.add('fallback','ready');loading.remove()}
}

async function start(){
  const renderer=new THREE.WebGLRenderer({antialias:!mobile,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.25:1.7));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.82;
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#02090b');
  scene.fog=new THREE.FogExp2('#06191c',0.087);
  const gltf=await new GLTFLoader().loadAsync('./workshop.glb',event=>{if(event.total)progress.textContent=Math.round(event.loaded/event.total*100)+'%'});
  scene.add(gltf.scene);
  // Old paint-loss meshes were left over the new imported wall textures.
  gltf.scene.traverse(o=>{if(/^(Localized.paint.loss|Paint.edge.flake)/i.test(o.name))o.visible=false});
  const cams=gltf.cameras;
  if(cams.length<2)throw new Error('The Blender cameras were not exported');
  const opening=cams.find(c=>c.name.startsWith('CAM_01'))||cams[0];
  const hero=cams.find(c=>c.name.startsWith('CAM_02'))||cams[1];
  const screen=cams.find(c=>c.name.startsWith('CAM_03'))||hero;
  const camera=opening.clone();
  const camData=[opening,hero,screen].map(c=>({position:c.getWorldPosition(new THREE.Vector3()),quaternion:c.getWorldQuaternion(new THREE.Quaternion()),fov:c.fov}));
  const lights=[];
  const addLight=(x,y,z,color,power,distance)=>{const l=new THREE.PointLight(color,power,distance,2);l.position.set(x,y,z);scene.add(l);lights.push(l);return l};
  addLight(0,2.94,.28,'#70e4ef',7.0,3.9);
  addLight(.65,2.94,1.42,'#70e4ef',5.2,3.8);
  addLight(-.11,1.18,.72,'#c4faff',.45,1.9);
  addLight(-1.24,1.15,2.2,'#a8e1e7',.7,2.0);
  addLight(1.75,1.65,1.45,'#a8e1e7',.7,2.0);
  const lampBulb=new THREE.Vector3(.59,1.37,-.11);
  addLight(lampBulb.x,lampBulb.y,lampBulb.z,'#f5b779',.7,1.3);
  const lampPool=new THREE.SpotLight('#efb77b',13,1.8,Math.PI/6,.7,2);
  lampPool.position.copy(lampBulb);
  lampPool.target.position.set(.48,.9,.5);
  scene.add(lampPool,lampPool.target);
  const lampWallBounce=new THREE.SpotLight('#e6aa71',4.5,2.8,Math.PI/3,.95,2);
  lampWallBounce.position.copy(lampBulb);
  lampWallBounce.target.position.set(.62,1.35,-1.65);
  scene.add(lampWallBounce,lampWallBounce.target);
  const bulbGlow=new THREE.Mesh(new THREE.SphereGeometry(.015,8,8),new THREE.MeshBasicMaterial({color:'#ffe2b2',toneMapped:false}));
  bulbGlow.position.copy(lampBulb);scene.add(bulbGlow);
  const ambience=new THREE.HemisphereLight('#4a8c95','#080e0d',.16);scene.add(ambience);
  // Exported screen geometry retains its shape and UV mapping. Each receiver
  // has its own canvas and timing, even when several use the same source clip.
  const screens=[];
  gltf.scene.traverse(o=>{
    if(!o.isMesh)return;
    if(o.name.includes('lighting placeholder'))o.visible=false;
    const originalMaterials=Array.isArray(o.material)?o.material:[o.material];
    const correctedMaterials=originalMaterials.map(m=>{
      if(!m)return m;
      if(m.name.startsWith('DA Glass'))return new THREE.MeshPhysicalMaterial({name:m.name,color:'#a6e1e8',metalness:0,roughness:.18,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.13,depthWrite:false,side:THREE.DoubleSide});
      if(o.name.includes('TV_HERO')&&m.name==='material'){
        m=m.clone();m.color.multiplyScalar(.48);m.roughness=Math.max(.78,m.roughness);m.metalness=Math.min(.08,m.metalness);return m;
      }
      if(m.name==='Weathered White Plaster Wall'){m=m.clone();m.color.multiplyScalar(.38);return m}
      if(m.name==='Old brick wall'){m=m.clone();m.color.multiplyScalar(.18);return m}
      if(m.name==='DA_Workbench_Worn_v07'){m=m.clone();m.color.set('#323c38');m.roughness=.83;return m}
      if(m.name==='DA_Stained_Ceiling'){m=m.clone();m.color.set('#20282a');return m}
      if(m.name==='Office Ceiling Tile'){m=m.clone();m.color.multiplyScalar(.24);m.normalMap=null;m.needsUpdate=true;return m}
      if(m.name==='DA_Brand_Cyan_70E4EF'){m=m.clone();m.emissive.multiplyScalar(.6);return m}
      if(m.name==='DA_Scuffed_Baseboards'){m=m.clone();m.color.set('#303a3a');return m}
      return m;
    });
    o.material=Array.isArray(o.material)?correctedMaterials:correctedMaterials[0];
    if(!o.name.includes('PICTURE'))return;
    const isHero=o.name.includes('HERO');
    const canvas=document.createElement('canvas');canvas.width=isHero?1024:320;canvas.height=isHero?768:240;
    const ctx=canvas.getContext('2d',{alpha:false});
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.flipY=false;
    const original=Array.isArray(o.material)?o.material[0]:o.material;
    const mat=new THREE.MeshBasicMaterial({map:texture,color:'#ffffff',side:THREE.DoubleSide,toneMapped:false});
    o.material=mat;
    o.material.needsUpdate=true;
    const index=screens.length;
    screens.push({o,canvas,ctx,texture,index,seed:Math.random()*1000,phase:Math.random()*10,speed:.65+Math.random()*1.6,type:(index*7)%3,hero:isHero,original,last:-1});
  });
  // Only the two selected clips are used. The former abstract broadcast signal
  // to the left of the hero has been removed from every receiver.
  const clips=[
    ['TV_Back_Small','test-pattern.mp4'],
    ['TV_Right_Lower','test-pattern.mp4'],
    ['TV_Bench_Small','crt-tube.mp4'],
    ['TV_Left_Lower','crt-tube.mp4'],
    ['TV_Rear_Rack_03','crt-tube.mp4']
  ];
  for(const [name,source] of clips){
    const s=screens.find(s=>s.o.name.includes(name));if(!s)continue;
    const video=document.createElement('video');
    video.src=`./media/${source}?v=04b`;video.muted=true;video.playsInline=true;
    video.loop=true;video.autoplay=true;video.preload='auto';
    video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.random()*video.duration*.8});
    video.play().catch(()=>{});s.video=video;s.videoSource=source;
  }
  // A single muted excerpt drives every picture surface during the brief
  // lock-in. Sharing one video element keeps the receivers on the same frame.
  const filmTeaser=document.createElement('video');
  filmTeaser.src='./media/el-camino-teaser.mp4';
  filmTeaser.muted=true;filmTeaser.playsInline=true;
  filmTeaser.loop=true;filmTeaser.autoplay=true;filmTeaser.preload='auto';
  filmTeaser.play().catch(()=>{});
  // Soft halos sit just behind the picture surfaces. They give the screens a
  // sense of light scattering through dusty air without a costly bloom pass.
  const haloCanvas=document.createElement('canvas');haloCanvas.width=128;haloCanvas.height=128;
  const haloCtx=haloCanvas.getContext('2d');
  const haloGradient=haloCtx.createRadialGradient(64,64,3,64,64,64);
  haloGradient.addColorStop(0,'rgba(230,255,255,.72)');
  haloGradient.addColorStop(.22,'rgba(159,237,243,.42)');
  haloGradient.addColorStop(.58,'rgba(112,228,239,.09)');
  haloGradient.addColorStop(1,'rgba(112,228,239,0)');
  haloCtx.fillStyle=haloGradient;haloCtx.fillRect(0,0,128,128);
  const haloTexture=new THREE.CanvasTexture(haloCanvas);
  const bloomCanvas=document.createElement('canvas');bloomCanvas.width=128;bloomCanvas.height=128;
  const bloomCtx=bloomCanvas.getContext('2d');
  const bloomGradient=bloomCtx.createRadialGradient(64,64,2,64,64,64);
  bloomGradient.addColorStop(0,'rgba(235,255,255,.16)');
  bloomGradient.addColorStop(.24,'rgba(183,240,244,.28)');
  bloomGradient.addColorStop(.55,'rgba(112,228,239,.11)');
  bloomGradient.addColorStop(1,'rgba(112,228,239,0)');
  bloomCtx.fillStyle=bloomGradient;bloomCtx.fillRect(0,0,128,128);
  const bloomTexture=new THREE.CanvasTexture(bloomCanvas);
  gltf.scene.updateMatrixWorld(true);
  const openingPosition=opening.getWorldPosition(new THREE.Vector3());
  for(const s of screens){
    const box=new THREE.Box3().setFromObject(s.o);
    const center=box.getCenter(new THREE.Vector3());
    const size=box.getSize(new THREE.Vector3());
    const towardOpening=openingPosition.clone().sub(center).normalize();
    const screenWidth=Math.max(size.x,size.z),screenHeight=size.y;
    const baseGlow=s.hero ? .68 : .28;
    const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:haloTexture,color:s.hero?'#e8ffff':'#9de7ed',transparent:true,opacity:baseGlow,blending:THREE.AdditiveBlending,depthWrite:false}));
    halo.position.copy(center).addScaledVector(towardOpening,-.07);
    halo.scale.set(screenWidth*(s.hero?3.2:2.6),screenHeight*(s.hero?3.0:2.4),1);
    scene.add(halo);s.halo=halo;s.baseGlow=baseGlow;
    const frontGlow=s.hero ? .68 : .22;
    const bloom=new THREE.Sprite(new THREE.SpriteMaterial({map:bloomTexture,color:s.hero?'#efffff':'#a9ecf0',transparent:true,opacity:frontGlow,blending:THREE.AdditiveBlending,depthTest:false,depthWrite:false}));
    bloom.position.copy(center).addScaledVector(towardOpening,.09);
    bloom.scale.set(screenWidth*(s.hero?2.7:2.1),screenHeight*(s.hero?2.4:2.0),1);
    bloom.renderOrder=10;
    scene.add(bloom);s.bloom=bloom;s.baseBloom=frontGlow;
  }
  // Small illuminated flecks give a sense of air without trying to export
  // Blender's volume cube, which glTF cannot reproduce as the same effect.
  const dustCount=mobile?45:115;
  const dustGeometry=new THREE.BufferGeometry();
  const dustPositions=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){dustPositions[i*3]=(Math.random()-.5)*5.5;dustPositions[i*3+1]=.2+Math.random()*2.65;dustPositions[i*3+2]=Math.random()*5.6-.25}
  dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({color:'#93dbe3',size:mobile?.012:.009,transparent:true,opacity:.26,depthWrite:false}));scene.add(dust);
  // Broad, crossed translucent planes suggest cyan light scattering in dusty air.
  // The intensity is deliberately low so the room keeps its dark workshop mood.
  const shaftCanvas=document.createElement('canvas');shaftCanvas.width=128;shaftCanvas.height=256;
  const shaftCtx=shaftCanvas.getContext('2d');const shaftPixels=shaftCtx.createImageData(128,256);
  for(let y=0;y<256;y++)for(let x=0;x<128;x++){
    const u=(x-64)/64,v=y/255;
    const width=.16+v*.83;
    const scatter=Math.exp(-2.5*(u/width)**2)*Math.sin(Math.PI*v)**.55;
    const k=(y*128+x)*4;shaftPixels.data[k]=112;shaftPixels.data[k+1]=228;shaftPixels.data[k+2]=239;shaftPixels.data[k+3]=Math.round(scatter*70);
  }
  shaftCtx.putImageData(shaftPixels,0,0);
  const shaftTexture=new THREE.CanvasTexture(shaftCanvas);shaftTexture.colorSpace=THREE.SRGBColorSpace;
  for(const [x,z,width,opacity] of [[0,.28,2.2,.78],[.65,1.42,1.8,.55]]){
    for(const angle of [0]){
      const shaft=new THREE.Mesh(new THREE.PlaneGeometry(width,2.5),new THREE.MeshBasicMaterial({map:shaftTexture,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));
      shaft.position.set(x,1.65,z);shaft.rotation.y=angle;scene.add(shaft);
    }
  }
  document.body.classList.add('ready');loading.remove();
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
  addEventListener('resize',resize);resize();
  let lastFrame=0;
  function frame(ms){
    requestAnimationFrame(frame);
    const t=ms*.001;
    const track=document.querySelector('.scroll-track');
    const p=clamp(scrollY/(track.offsetHeight-innerHeight));
    const move=smooth(p/.82);
    const segment=move<.60?0:1;
    const local=segment===0?smooth(move/.60):smooth((move-.60)/.40);
    const a=camData[segment],b=camData[segment+1];
    camera.position.copy(a.position).lerp(b.position,local);
    camera.quaternion.copy(a.quaternion).slerp(b.quaternion,local);
    // Use the last viewport of the workshop track to keep travelling into
    // the hero screen while the soundstage fades into the same viewport.
    const handoff=smooth((scrollY-(track.offsetHeight-innerHeight))/innerHeight);
    camera.position.addScaledVector(new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion),handoff*1.35);
    camera.fov=THREE.MathUtils.lerp(a.fov,b.fov,local);
    // Preserve the Blender framing on wide screens; narrow screens crop into
    // the room while keeping the hero in view.
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    const headlineExit=smooth((p-.08)/.42);
    headline.style.opacity=String(1-headlineExit);
    headline.style.transform=`translate3d(${-headlineExit*innerWidth*.55}px,0,0)`;
    // The title is painted into the hero TV texture below, not floated over
    // the room as HTML. Keep the HTML copy for accessibility and fallback.
    secondLine.style.opacity='0';
    hint.style.opacity=String(1-smooth(p/.18));
    updateWatchButton(p);
    if(t-lastFrame>.085){
      const sync=smooth((p-.20)/.07)*(1-smooth((p-.39)/.08));
      const intent=smooth((p-.52)/.11);
      for(const s of screens){
        drawSignal(s,t,sync,intent,filmTeaser,english);
        s.halo.material.opacity=s.baseGlow*(s.hero?(1+smooth((p-.2)/.5)*.2)*(1-intent*.58):1);
        s.bloom.material.opacity=s.baseBloom*(s.hero?(1+smooth((p-.2)/.5)*.3)*(1-intent*.86):1);
      }
      lastFrame=t;
    }
    dust.rotation.y=Math.sin(t*.11)*.012;
    if(track.getBoundingClientRect().bottom>0 && track.getBoundingClientRect().top<innerHeight)renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
}

function drawSignal(s,t,sync,intent,filmTeaser,english){
  const {ctx,canvas}=s;const w=canvas.width,h=canvas.height;
  const phase=t*s.speed+s.phase;
  ctx.fillStyle='#081316';ctx.fillRect(0,0,w,h);
  if(s.video&&s.video.readyState>=2){ctx.drawImage(s.video,0,0,w,h)}
  else if(s.type===0||s.hero){bars(ctx,w,h,phase)}
  else if(s.type===1){staticNoise(ctx,w,h,s.seed,phase)}
  else {scope(ctx,w,h,phase)}
  // Each receiver is deliberately out of phase until the film locks them.
  if(sync<.35 && Math.sin(phase*2.9+s.seed)>.87){
    const tearY=Math.floor((phase*37+s.seed*9)%h),band=Math.max(3,Math.round(h*.055));
    ctx.drawImage(canvas,0,tearY,w,Math.min(band,h-tearY),Math.sin(phase*11)*w*.045,tearY,w,Math.min(band,h-tearY));
  }
  if(sync>.01){
    ctx.save();ctx.globalAlpha=sync;
    if(filmTeaser.readyState>=2)drawVideoCover(ctx,filmTeaser,w,h);
    else {ctx.fillStyle='#c8efed';ctx.fillRect(0,0,w,h)}
    ctx.restore();
    // A shared cyan tracking flash announces the exact moment of sync.
    const lockFlash=(1-smooth(sync/.27))*.5;
    if(lockFlash>0){ctx.fillStyle=`rgba(192,245,246,${lockFlash})`;ctx.fillRect(0,0,w,h)}
  }
  if(s.hero&&intent>0)drawIntentCard(ctx,w,h,intent,english,t);
  if(sync<.4&&intent<.5&&Math.sin(phase*3.7+s.seed)>.995){ctx.fillStyle='#051014b8';ctx.fillRect(0,0,w,h)}
  ctx.fillStyle='#00000016';
  for(let y=(sync>.5||intent>.5)?0:Math.floor(s.seed)%4;y<h;y+=4)ctx.fillRect(0,y,w,1);
  const flicker=.025+.035*(.5+.5*Math.sin(phase*17+s.seed));
  ctx.fillStyle=`rgba(195,240,241,${flicker})`;ctx.fillRect(0,0,w,h);
  // Vignette and scanlines sit within the exported curved screen and glass.
  const g=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.7);
  g.addColorStop(0,'#ffffff05');g.addColorStop(1,'#001419b0');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  const roll=(((sync>.5||intent>.5?t*23:phase*19+s.seed)%h))|0;
  ctx.fillStyle='#ffffff24';ctx.fillRect(0,roll,w,Math.max(1,h/180));
  s.texture.needsUpdate=true;
}
function drawVideoCover(ctx,video,w,h){
  const vw=video.videoWidth,vh=video.videoHeight;
  if(!vw||!vh)return;
  const sourceAspect=vw/vh,targetAspect=w/h;
  const sw=sourceAspect>targetAspect?vh*targetAspect:vw;
  const sh=sourceAspect>targetAspect?vh:vw/targetAspect;
  ctx.drawImage(video,(vw-sw)/2,(vh-sh)/2,sw,sh,0,0,w,h);
}
function drawIntentCard(ctx,w,h,alpha,english,t){
  ctx.save();ctx.globalAlpha=alpha;
  ctx.fillStyle='#07191d';ctx.fillRect(0,0,w,h);
  const bloom=ctx.createRadialGradient(w*.5,h*.46,0,w*.5,h*.46,w*.65);
  bloom.addColorStop(0,'#256068');bloom.addColorStop(.48,'#0b2a31');bloom.addColorStop(1,'#03090c');
  ctx.fillStyle=bloom;ctx.fillRect(0,0,w,h);
  const words=english?['More','intention.']:['Más','intención.'];
  const size=Math.round(h*.158);
  ctx.font=`800 ${size}px 'League Spartan', sans-serif`;
  ctx.letterSpacing='-0.065em';
  ctx.textAlign='left';ctx.textBaseline='middle';
  const ys=[h*.405,h*.585];
  for(let i=0;i<words.length;i++){
    const max=w*.76,measured=ctx.measureText(words[i]).width;
    const scale=Math.min(1,max/measured);
    ctx.save();ctx.translate(w*.12,ys[i]);ctx.scale(scale,1);
    ctx.globalAlpha=alpha*.18;ctx.fillStyle='#ef4f4d';ctx.fillText(words[i],-2,0);
    ctx.fillStyle='#70e4ef';ctx.fillText(words[i],2,0);
    ctx.globalAlpha=alpha*(.87+.05*Math.sin(t*17));
    ctx.shadowColor='#70e4ef';ctx.shadowBlur=22;
    ctx.fillStyle='#f1fcfa';ctx.fillText(words[i],0,0);
    ctx.restore();
  }
  ctx.restore();
}
function bars(ctx,w,h,t){
  const colors=['#d9e5db','#e1d951','#56c9ca','#4dce55','#bd59bb','#e9594d','#456dc8'];
  const unit=w/colors.length,drift=Math.sin(t*3)*w*.003;
  colors.forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*unit+drift,0,unit+2,h*.7)});
  ctx.fillStyle='#111b1e';ctx.fillRect(0,h*.7,w,h*.3);
  ctx.fillStyle='#25383e';ctx.fillRect(0,h*.72,w,h*.05);
  for(const [x,width,color] of [[0,.48,'#c7dce0'],[.5,.22,'#6d8790'],[.74,.2,'#1c2a31']]){ctx.fillStyle=color;ctx.fillRect(w*x,h*.79,w*width,h*.1)}
  ctx.fillStyle='#e6f5f626';ctx.fillRect(0,((t*23)%h),w,h*.022);
}
function staticNoise(ctx,w,h,seed,t,alpha=1){
  const cell=Math.max(2,Math.round(w/90));
  for(let y=0;y<h;y+=cell)for(let x=0;x<w;x+=cell){const v=Math.random()*155+35;ctx.fillStyle=`rgba(${v},${v+10},${v+13},${alpha})`;ctx.fillRect(x,y,cell,cell)}
  const band=((t*43+seed)%h)|0;ctx.fillStyle='#d9eef4a0';ctx.fillRect(0,band,w,h*.017);
}
function scope(ctx,w,h,t){
  ctx.fillStyle='#07191a';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#28515a';ctx.lineWidth=1;
  for(let x=0;x<w;x+=w/12){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}
  for(let y=0;y<h;y+=h/9){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
  ctx.strokeStyle='#70e4ef';ctx.lineWidth=Math.max(1.5,w/170);ctx.beginPath();
  for(let x=0;x<w;x++){const y=h/2+Math.sin(x/w*14+t*2)*h*.11+Math.sin(x/w*53+t)*h*.035;x?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.stroke();
}
function fallbackScroll(){function update(){const track=document.querySelector('.scroll-track');const p=clamp(scrollY/(track.offsetHeight-innerHeight));const handoff=smooth((scrollY-(track.offsetHeight-innerHeight))/innerHeight);const zoom=1+smooth(p)*.45+handoff*.2;document.querySelector('#fallback').style.transform=`scale(${zoom})`;const exit=smooth((p-.08)/.42);headline.style.opacity=String(1-exit);headline.style.transform=`translate3d(${-exit*innerWidth*.55}px,0,0)`;secondLine.style.opacity=String(smooth((p-.52)/.15)*(1-smooth((p-.89)/.1)));hint.style.opacity=String(1-smooth(p/.18));updateWatchButton(p)}addEventListener('scroll',update,{passive:true});update()}
