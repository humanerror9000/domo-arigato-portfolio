// A portrait camera path rendered from the approved Blender workshop.
// This module is loaded only on narrow, non-reduced-motion screens.
export function startMobile({headline,secondLine,hint,updateWatchButton,clamp,smooth}){
  const fallback=document.querySelector('#fallback');
  const track=document.querySelector('.scroll-track');
  const scene=document.createElement('div');
  scene.className='mobile-workshop-scene';
  const plates={};
  for(const name of ['opening','approach','screen']){
    const plate=document.createElement('div');
    plate.className=`mobile-workshop-plate mobile-workshop-${name}`;
    const image=document.createElement('img');
    image.src=`./assets/mobile/workshop-${name}.jpg`;
    image.alt='';
    image.decoding='async';
    plate.append(image);
    scene.append(plate);
    plates[name]=plate;
  }
  const crt=document.createElement('div');
  crt.className='mobile-crt-copy';
  crt.setAttribute('aria-hidden','true');
  const words=document.createElement('span');
  words.innerHTML='Más<br>intención.';
  crt.append(words);
  plates.screen.append(crt);
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
    const approach=smooth((p-.22)/.23);
    const screen=smooth((p-.52)/.2);
    plates.opening.style.opacity=String(1-approach);
    plates.approach.style.opacity=String(approach*(1-screen));
    plates.screen.style.opacity=String(screen);
    plates.opening.style.transform=`scale(${1+.14*smooth(p/.4)})`;
    plates.approach.style.transform=`scale(${1+.13*smooth((p-.34)/.31)})`;
    plates.screen.style.transform=`scale(${1+.6*smooth((p-.69)/.31)+handoff*.4})`;
    const intent=smooth((p-.68)/.1);
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
  addEventListener('scroll',update,{passive:true});
  addEventListener('resize',resize,{passive:true});
  addEventListener('da-language-change',event=>{
    words.innerHTML=event.detail.english?'More<br>intention.':'Más<br>intención.';
  });
  resize();
}
