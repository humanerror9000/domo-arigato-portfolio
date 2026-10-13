import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const section=document.querySelector('#soundstage');
const viewport=section.querySelector('.soundstage-viewport');
const curtain=section.querySelector('.soundstage-curtain');
const feature=document.querySelector('#feature');
const featureShell=document.querySelector('#feature-shell');
const featureBackdrop=feature.querySelector('.feature-transition-backdrop');
const featurePlaceholder=feature.querySelector('.feature-placeholder');
const mount=document.querySelector('#soundstage-canvas');
const fallback=document.querySelector('.soundstage-fallback');
const mobileVideo=document.querySelector('#soundstage-mobile-video');
const mobileLogo=document.querySelector('#soundstage-mobile-logo');
const titles=[...document.querySelectorAll('.soundstage-title')];
const status=document.querySelector('#soundstage-status');
const asset='./assets/soundstage/';
const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
const beats=[[0,.19],[.2,.39],[.4,.59],[.6,.78]];
const beatOpacity=(t,i)=>{const [a,b]=beats[i],edge=.035;return clamp(smooth((t-a)/edge)*(1-smooth((t-(b-edge))/edge)))};
const cameraKeys=[[0,-12],[.17,-7],[.2,2],[.37,3],[.4,11],[.57,12],[.6,20],[.77,21],[.79,29],[.84,30],[.91,33],[1,39.2]];
const mobile=matchMedia('(max-width: 700px)').matches;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
if(mobile)section.classList.add('soundstage-static');
let p=0,entry=0,exit=0,renderer,scene,camera,logo,video,videoIsVisible=false,mobile3dFailed=false;
let lastScrollY=scrollY,arrivalUsed=false,arrivalLocked=false;
let arrivalTop=0,arrivalStarted=0,lastBlockedInput=0,unlockTimer,touchStartY=0;
const scrimImages=[],scrimCloths=[],scrimHalos=[];

function releaseArrival(){
  arrivalLocked=false;
  clearTimeout(unlockTimer);
}
function scheduleRelease(){
  clearTimeout(unlockTimer);
  unlockTimer=setTimeout(()=>{
    const elapsed=performance.now()-arrivalStarted;
    const quiet=performance.now()-lastBlockedInput;
    if(elapsed>=1700&&quiet>=650)releaseArrival();
    else scheduleRelease();
  },100);
}
function pauseAtFeature(top){
  arrivalUsed=true;
  arrivalLocked=true;
  arrivalTop=Math.round(top);
  arrivalStarted=lastBlockedInput=performance.now();
  window.scrollTo({top:arrivalTop,behavior:'instant'});
  // The arrival hold is for exploring the film strip, so its controls must
  // remain clickable even while downward scrolling is temporarily blocked.
  feature.style.pointerEvents='auto';
  scheduleRelease();
}
addEventListener('wheel',event=>{
  if(!arrivalLocked)return;
  if(event.deltaY<0){releaseArrival();return}
  if(Math.abs(event.deltaY)>Math.abs(event.deltaX)){
    if(event.cancelable)event.preventDefault();
    lastBlockedInput=performance.now();
  }
},{passive:false});
addEventListener('touchstart',event=>{touchStartY=event.touches[0]?.clientY||0},{passive:true});
addEventListener('touchmove',event=>{
  if(!arrivalLocked)return;
  const travel=touchStartY-(event.touches[0]?.clientY||touchStartY);
  if(travel<0){releaseArrival();return}
  if(travel>3){if(event.cancelable)event.preventDefault();lastBlockedInput=performance.now()}
},{passive:false});
addEventListener('keydown',event=>{
  if(!arrivalLocked)return;
  if(['ArrowUp','PageUp','Home'].includes(event.key)){releaseArrival();return}
  if(['ArrowDown','PageDown','End',' '].includes(event.key)){
    event.preventDefault();lastBlockedInput=performance.now();
  }
});

function progress(){
  const top=section.getBoundingClientRect().top;
  return clamp(-top/(section.offsetHeight-innerHeight));
}
function cameraY(t){
  for(let i=1;i<cameraKeys.length;i++)if(t<=cameraKeys[i][0]){
    const a=cameraKeys[i-1],b=cameraKeys[i];
    return THREE.MathUtils.lerp(a[1],b[1],smooth((t-a[0])/(b[0]-a[0])));
  }
  return cameraKeys.at(-1)[1];
}
function titleState(t){
  titles.forEach((el,i)=>{
    const [a,b]=beats[i],edge=.035;
    const enter=smooth((t-a)/edge),leave=1-smooth((t-(b-edge))/edge);
    const visible=beatOpacity(t,i);
    const side=i%2===0?-1:1;
    const travel=side*((1-enter)*44+smooth((t-(b-edge))/edge)*120);
    el.style.opacity=visible.toFixed(3);
    el.style.transform=`translate3d(${travel}px,${(1-enter)*20}px,0)`;
    el.setAttribute('aria-hidden',visible<.05?'true':'false');
  });
  const idx=t<.2?0:t<.4?1:t<.6?2:t<.79?3:-1;
  status.textContent=idx<0?'':'0'+(idx+1)+' / 04';
  status.style.opacity=idx<0?'0':'.62';
  if(reduced||section.classList.contains('soundstage-static')){
    const reveal=smooth((t-.82)/.055),split=smooth((t-.905)/.075);
    mobileLogo.style.opacity=String(reveal);
    mobileLogo.children[0].style.transform=`translateY(${-split*110}px)`;
    mobileLogo.children[1].style.transform=`translateY(${split*110}px)`;
    mobileLogo.children[2].style.opacity=String(1-split);
  }
  if(reduced||section.classList.contains('soundstage-static')){
    const sources=['Video_Shot_1.5.mp4','Animation.png','Music_Zia 5.PNG','3D_cube_lamp_displacement_0139.png'];
    const newIdx=idx<0?4:idx;
    if(fallback.dataset.beat!==String(newIdx)){
      fallback.dataset.beat=String(newIdx);
      if(newIdx===0){
        fallback.style.backgroundImage="linear-gradient(90deg,#000b,#0002),url('./media/el-camino-feature.jpg')";
        if(mobile3dFailed)mobileVideo.classList.add('is-visible');
      }else{
        fallback.style.backgroundImage=newIdx===4?'none':`linear-gradient(90deg,#000b,#0002),url("${asset+sources[newIdx]}")`;
        mobileVideo.classList.remove('is-visible');mobileVideo.pause();
      }
    }
  }
}
function update(){
  if(arrivalLocked&&scrollY>arrivalTop+1){lastBlockedInput=performance.now();window.scrollTo({top:arrivalTop,behavior:'instant'});return}
  if(arrivalLocked&&scrollY<arrivalTop-innerHeight*.25)releaseArrival();
  const rect=section.getBoundingClientRect();
  p=progress();
  entry=smooth((innerHeight-rect.top)/innerHeight);
  exit=smooth((innerHeight-rect.bottom)/innerHeight);
  // Keep both scenes anchored to the same viewport. Scroll advances the
  // camera and dissolves between worlds instead of moving panels vertically.
  viewport.style.opacity=String(smooth((entry-.24)/.76)*(1-smooth((exit-.46)/.54)));
  curtain.style.opacity=String(.88*smooth((p-.95)/.05)+.08*exit);
  if(rect.bottom>0&&rect.bottom<=innerHeight){
    const reveal=smooth(exit/.58);
    feature.classList.add('is-handing-off');
    featurePlaceholder.style.height=`${featureShell.offsetHeight}px`;
    featureBackdrop.style.opacity=String(reveal);
    featureShell.style.position='fixed';
    featureShell.style.top=getComputedStyle(feature).paddingTop;
    featureShell.style.left='50%';
    featureShell.style.margin='0';
    featureShell.style.transform=`translateX(-50%) scale(${.76+.24*exit})`;
    featureShell.style.opacity=String(reveal);
    feature.style.pointerEvents=reveal>.65?'auto':'none';
  }else{
    feature.classList.remove('is-handing-off');
    featureBackdrop.style.opacity='0';
    featureShell.style.position='';
    featureShell.style.top='';
    featureShell.style.left='';
    featureShell.style.margin='';
    featureShell.style.transform='';
    featureShell.style.opacity='';
    featurePlaceholder.style.height='0';
    feature.style.pointerEvents=rect.bottom>0?'none':'auto';
  }
  if(rect.bottom>innerHeight*.5)arrivalUsed=false;
  // Let the full film strip enter the viewport before holding the page.
  const featureTop=scrollY+feature.getBoundingClientRect().top;
  const landing=Math.round(featureTop+featureShell.offsetTop+featureShell.offsetHeight-innerHeight+8);
  if(lastScrollY<landing&&scrollY>=landing&&scrollY>lastScrollY&&!arrivalUsed)pauseAtFeature(landing);
  lastScrollY=scrollY;
  titleState(p);
  if(mobile&&mobile3dFailed){
    const rect=section.getBoundingClientRect();
    const active=p<.2&&rect.top<innerHeight&&rect.bottom>0;
    mobileVideo.classList.toggle('is-visible',active);
    if(active){if(!mobileVideo.src)mobileVideo.src=asset+'Video_Shot_1.5.mp4';mobileVideo.play().catch(()=>{})}
    else mobileVideo.pause();
  }
  if(video){
    const visible=section.getBoundingClientRect().top<innerHeight&&section.getBoundingClientRect().bottom>0;
    if(visible!==videoIsVisible){videoIsVisible=visible;visible?video.play().catch(()=>{}):video.pause()}
  }
}
addEventListener('scroll',update,{passive:true});
addEventListener('resize',()=>{update();if(renderer){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}},{passive:true});
addEventListener('da-language-change',event=>{
  titles.forEach(el=>el.innerHTML=el.dataset[event.detail.english?'en':'es']);
  section.setAttribute('aria-label',event.detail.english?'What we do':'Qué hacemos');
});
update();

function loadStaticLogo(){
  Promise.all(['Domo','Arigato','Studio'].map(word=>croppedSvgTexture(asset+`DA_logo_${word}.svg`))).then(entries=>{
    entries.forEach((entry,i)=>mobileLogo.children[i].src=entry.texture.image.toDataURL('image/png'));
  }).catch(error=>console.error('Soundstage logo:',error));
}
if(reduced)loadStaticLogo();
if(!reduced){
  if(mobile){
    let started=false;
    const startNearStage=()=>{
      if(started||section.getBoundingClientRect().top>innerHeight*1.5)return;
      started=true;
      removeEventListener('scroll',startNearStage);
      init().then(()=>{
        mobileVideo.pause();
        mobileVideo.classList.remove('is-visible');
        section.classList.remove('soundstage-static');
        update();
      }).catch(error=>{
        console.error('Mobile soundstage:',error);
        mobile3dFailed=true;
        loadStaticLogo();
        update();
      });
    };
    addEventListener('scroll',startNearStage,{passive:true});
    startNearStage();
  }else{
    try{await init()}catch(error){console.error('Soundstage preview:',error);section.classList.add('soundstage-static')}
  }
}

function stageConcreteMaterial(){
  const material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.85,metalness:0,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vStagePosition;\nvarying vec3 vStageNormal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvStagePosition=position;\nvStageNormal=normal;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 vStagePosition;
      varying vec3 vStageNormal;
      float stageHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float stageNoise(vec2 p){
        vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
        return mix(mix(stageHash(i),stageHash(i+vec2(1.0,0.0)),f.x),
                   mix(stageHash(i+vec2(0.0,1.0)),stageHash(i+vec2(1.0,1.0)),f.x),f.y);
      }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
      float stageFloor=smoothstep(0.18,0.88,abs(normalize(vStageNormal).y));
      vec2 stageGround=vStagePosition.xz;
      vec2 stageWall=vec2(vStagePosition.x,vStagePosition.y);
      float stageBroad=mix(stageNoise(stageWall*.31+vec2(11.4,5.1)),stageNoise(stageGround*.16+vec2(3.7,19.3)),stageFloor);
      float stageMid=mix(stageNoise(stageWall*1.6+vec2(7.2,21.1)),stageNoise(stageGround*1.1+vec2(13.2,4.8)),stageFloor);
      float stageFine=mix(stageNoise(stageWall*11.0),stageNoise(stageGround*14.0),stageFloor);
      float stageStain=smoothstep(.46,.71,stageBroad);
      float stageWallWear=smoothstep(.52,.73,stageNoise(vec2(stageWall.x*.48,stageWall.y*.2)+vec2(5.8,14.1)));
      vec3 stageBase=mix(vec3(.17,.179,.176),vec3(.225,.222,.21),stageFloor);
      diffuseColor.rgb=stageBase*(.72+.45*stageBroad+.19*(stageMid-.5)-.22*stageStain-.19*stageWallWear*(1.0-stageFloor)+.08*(stageFine-.5));
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      roughnessFactor=mix(.91,clamp(.40+.51*stageBroad+.08*stageMid,.43,.96),stageFloor);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      float stageHeight=.7*stageFine+.3*stageMid;
      normal=normalize(normal+vec3(dFdx(stageHeight),dFdy(stageHeight),0.0)*(.05+.11*stageFloor));
    `);
  };
  material.customProgramCacheKey=()=>'stage-concrete-v2';
  return material;
}

function addStageHaze(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;
  const ctx=canvas.getContext('2d');
  ctx.translate(64,128);ctx.scale(1,2);
  const glow=ctx.createRadialGradient(0,0,2,0,0,63);
  glow.addColorStop(0,'rgba(223,244,244,.56)');
  glow.addColorStop(.35,'rgba(215,235,235,.27)');
  glow.addColorStop(1,'rgba(205,230,230,0)');
  ctx.fillStyle=glow;ctx.fillRect(-64,-64,128,128);
  const texture=new THREE.CanvasTexture(canvas);
  for(const [x,z,opacity] of [[-6.2,3.8,.20],[6.1,-2.64,.16],[-5.9,-12.21,.15],[5.8,-22.96,.14]]){
    const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,color:'#b8dadd',transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,fog:true}));
    sprite.position.set(x,3.35,z);sprite.scale.set(6.8,6.4,1);scene.add(sprite);
  }
  const beamMaterial=new THREE.ShaderMaterial({
    uniforms:{tint:{value:new THREE.Color('#bdd9db')},strength:{value:.075}},
    vertexShader:`varying float vHeight;varying vec3 vNormal;varying vec3 vView;
      void main(){vHeight=(position.y+3.1)/6.2;vec4 view=modelViewMatrix*vec4(position,1.0);
      vNormal=normalize(normalMatrix*normal);vView=normalize(-view.xyz);gl_Position=projectionMatrix*view;}`,
    fragmentShader:`uniform vec3 tint;uniform float strength;varying float vHeight;varying vec3 vNormal;varying vec3 vView;
      void main(){float fade=smoothstep(0.0,.19,vHeight)*(1.0-smoothstep(.8,1.0,vHeight));
      float softEdge=pow(abs(dot(normalize(vNormal),normalize(vView))),1.6);
      gl_FragColor=vec4(tint,strength*fade*softEdge);}`,
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending
  });
  for(const [x,z] of [[-6.2,3.8],[6.1,-2.64],[-5.9,-12.21]]){
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(.65,3.4,6.2,32,1,true),beamMaterial);
    beam.position.set(x,3.6,z);beam.renderOrder=1;scene.add(beam);
  }
}

async function init(){
  renderer=new THREE.WebGLRenderer({alpha:false,antialias:!mobile,powerPreference:mobile?'low-power':'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.2:1.5));
  renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  mount.appendChild(renderer.domElement);
  scene=new THREE.Scene();scene.background=new THREE.Color('#171c1b');
  scene.fog=new THREE.FogExp2('#465251',.024);
  camera=new THREE.PerspectiveCamera(mobile?70:59,innerWidth/innerHeight,.05,100);

  const gltf=await new GLTFLoader().loadAsync(asset+'soundstage.glb');
  scene.add(gltf.scene);
  const concrete=stageConcreteMaterial();
  gltf.scene.traverse(object=>{
    if(!object.isMesh)return;
    const name=object.name;
    if(name.includes('Cyclorama'))object.material=concrete;
    else if(name.includes('dark wing'))object.material=new THREE.MeshStandardMaterial({color:'#101110',roughness:1});
    else if(name.includes('translucent cloth')){
      object.material=new THREE.MeshStandardMaterial({color:'#c8c2b9',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,roughness:1});
      const match=name.match(/Scrim 0([1-4])/);
      if(match)scrimCloths[Number(match[1])-1]=object;
    }
    else if(name.includes('diffusion'))object.material=new THREE.MeshBasicMaterial({color:'#f3ebe0',transparent:true,opacity:.75,side:THREE.DoubleSide});
    else if(name.includes('black housing'))object.material=new THREE.MeshStandardMaterial({color:'#181918',roughness:.8});
    else if(name.includes('Track mark'))object.material=new THREE.MeshBasicMaterial({color:'#66645f'});
    else object.material=new THREE.MeshStandardMaterial({color:'#30312f',metalness:.28,roughness:.68});
  });

  scene.add(new THREE.HemisphereLight('#fffaf0','#37332e',1.6));
  const keyPositions=[[-6.2,6.65,3.8],[6.1,6.45,-2.64],[-5.9,6.65,-12.21],[5.8,6.55,-22.96],[0,8.4,-42]];
  keyPositions.forEach(([x,y,z],i)=>{
    const light=new THREE.PointLight(i===4?'#ddd9d3':'#f7efe4',i===4?85:55,18,2);
    light.position.set(x,y,z);scene.add(light);
  });
  for(const [x,y,z] of [[8.45,4.72,2.5],[-8.35,4.42,-5.91],[8.55,4.36,-8.36],[-8.75,4.15,-17.58]]){
    const l=new THREE.PointLight('#dddcd6',12,9,2);l.position.set(x,y,z);scene.add(l);
  }
  addStageHaze();

  const loader=new THREE.TextureLoader();
  const scrims=[
    {x:4.35,y:3.15,z:-1,w:5.18,h:3.35,video:true},
    {x:-3,y:3.15,z:-10,w:4.74,h:3.21,file:'Animation.png'},
    {x:3,y:3.15,z:-19,w:4.74,h:3.21,file:'Music_Zia 5.PNG'},
    {x:-3.05,y:3.15,z:-28,w:4.34,h:3.01,file:'3D_cube_lamp_displacement_0139.png'}
  ];
  for(const scrim of scrims){
    let texture;
    if(scrim.video){
      video=document.createElement('video');video.src=asset+'Video_Shot_1.5.mp4';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';
      texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;
    }else{
      texture=loader.load(asset+scrim.file);
      texture.colorSpace=THREE.SRGBColorSpace;
    }
    const image=new THREE.Mesh(new THREE.PlaneGeometry(scrim.w,scrim.h),new THREE.MeshBasicMaterial({map:texture,color:'#aeb0ad',transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    image.position.set(scrim.x,scrim.y,scrim.z+.055);
    scene.add(image);
    scrimImages.push(image);
    const halo=new THREE.PointLight('#f1eee7',0,5,2);halo.position.set(scrim.x,scrim.y,scrim.z+.55);scene.add(halo);scrimHalos.push(halo);
  }

  const [domo,arigato,studio]=await Promise.all([
    croppedSvgTexture(asset+'DA_logo_Domo.svg'),
    croppedSvgTexture(asset+'DA_logo_Arigato.svg'),
    croppedSvgTexture(asset+'DA_logo_Studio.svg')
  ]);
  logo=[domo,arigato,studio].map((entry,i)=>{
    const width=i===2?1.12:4.05;
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,width/entry.aspect),new THREE.MeshBasicMaterial({map:entry.texture,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));
    plane.position.set(0,[4.0,2.25,1.45][i],-37);
    plane.renderOrder=6;scene.add(plane);return plane;
  });
  section.classList.add('soundstage-loaded');
  requestAnimationFrame(frame);
}

function croppedSvgTexture(path){
  return new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>{
      const source=document.createElement('canvas');source.width=1440;source.height=810;
      const context=source.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,1440,810);
      const data=context.getImageData(0,0,1440,810).data;
      let left=1440,top=810,right=0,bottom=0;
      for(let y=0;y<810;y++)for(let x=0;x<1440;x++)if(data[(y*1440+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
      if(right<=left)return reject(new Error('Blank logo asset: '+path));
      const pad=3,w=right-left+1+pad*2,h=bottom-top+1+pad*2;
      const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(source,left-pad,top-pad,w,h,0,0,w,h);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      resolve({texture,aspect:w/h});
    };img.onerror=()=>reject(new Error('Logo asset missing: '+path));img.src=path;
  });
}

function frame(){
  requestAnimationFrame(frame);
  if(!renderer)return;
  const rect=section.getBoundingClientRect();
  if(rect.bottom<=0||rect.top>=innerHeight)return;
  const y=rect.top>0?THREE.MathUtils.lerp(-23,-12,entry):cameraY(p)+exit*9;
  if(mobile){
    camera.position.set(0,1.72,-y+3.5);
    camera.lookAt(0,2.75,-y-13);
  }else{
    camera.position.set(0,1.78,-y);
    camera.lookAt(0,2.85,-y-13);
  }
  scrimImages.forEach((mesh,i)=>{
    const visible=beatOpacity(p,i);
    mesh.material.opacity=.47*visible;
    if(scrimCloths[i])scrimCloths[i].material.opacity=.12*visible;
    scrimHalos[i].intensity=7*visible;
  });
  if(logo){
    const appear=smooth((p-.82)/.055);
    const part=smooth((p-.905)/.075);
    logo[0].position.y=4.0+part*6.5;
    logo[1].position.y=2.25-part*6.5;
    logo[2].position.y=1.45-part*1.5;
    logo.forEach((mesh,i)=>mesh.material.opacity=appear*(i===2?1-part:1));
  }
  renderer.render(scene,camera);
}
