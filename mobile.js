// A portrait camera path rendered from the approved Blender workshop.
// This module is loaded only on narrow, non-reduced-motion screens.
export function startMobile({headline,secondLine,hint,updateWatchButton,clamp,smooth}){
  const fallback=document.querySelector('#fallback');
  const track=document.querySelector('.scroll-track');
  const scene=document.createElement('div');
  scene.className='mobile-workshop-scene';
  const canvas=document.createElement('canvas');
  canvas.className='mobile-workshop-canvas';
  canvas.width=720;
  canvas.height=1280;
  const context=canvas.getContext('2d',{alpha:false});
  scene.append(canvas);
  let pendingFrame=0;
  function scheduleUpdate(){
    if(pendingFrame)return;
    pendingFrame=requestAnimationFrame(()=>{pendingFrame=0;update()});
  }
  const frames=Array.from({length:40},(_,index)=>{
    const image=new Image();
    image.onload=scheduleUpdate;
    image.src=`./assets/mobile/sequence/frame-${String(index).padStart(2,'0')}.jpg`;
    return image;
  });
  const crt=document.createElement('div');
  crt.className='mobile-crt-copy';
  crt.setAttribute('aria-hidden','true');
  const words=document.createElement('span');
  words.innerHTML='Más<br>intención.';
  crt.append(words);
  scene.append(crt);
  const flash=document.createElement('div');
  flash.className='mobile-workshop-flash';
  fallback.append(scene,flash);

  function resize(){
    const scale=Math.max(innerWidth/720,innerHeight/1280);
    scene.style.width=`${Math.ceil(720*scale)}px`;
    scene.style.height=`${Math.ceil(1280*scale)}px`;
    update();
  }
  function update(){
    const p=clamp(scrollY/(track.offsetHeight-innerHeight));
    const handoff=smooth((scrollY-(track.offsetHeight-innerHeight))/innerHeight);
    const frame=clamp(p/.76)* (frames.length-1);
    const first=Math.floor(frame);
    const second=Math.min(first+1,frames.length-1);
    const loaded=index=>frames[index].complete&&frames[index].naturalWidth>0;
    if(loaded(first)||loaded(second)){
      context.globalAlpha=1;
      context.drawImage(frames[loaded(first)?first:second],0,0,720,1280);
      if(loaded(first)&&loaded(second)&&first!==second){
        context.globalAlpha=frame-first;
        context.drawImage(frames[second],0,0,720,1280);
        context.globalAlpha=1;
      }
    }
    scene.style.transform=`translate(-50%,-50%) scale(${1+.6*smooth((p-.76)/.24)+handoff*.4})`;
    const intent=smooth((p-.76)/.08);
    crt.style.opacity=String(intent);
    words.style.opacity=String(1-smooth((p-.9)/.1));
    flash.style.opacity=String(.62*smooth((p-.9)/.1)+.2*handoff);
    const exit=smooth((p-.07)/.31);
    headline.style.opacity=String(1-exit);
    headline.style.transform=`translate3d(${-exit*innerWidth*.62}px,0,0)`;
    secondLine.style.opacity='0';
    hint.style.opacity=String(1-smooth(p/.18));
    updateWatchButton(p);
  }
  addEventListener('scroll',scheduleUpdate,{passive:true});
  addEventListener('resize',resize,{passive:true});
  addEventListener('da-language-change',event=>{
    words.innerHTML=event.detail.english?'More<br>intention.':'Más<br>intención.';
  });
  resize();
}
