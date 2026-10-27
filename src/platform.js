export const pokiEnabled = import.meta.env.VITE_POKI === 'true' || new URLSearchParams(location.search).has('poki');
const SDK_URL = 'https://game-cdn.poki.com/scripts/v2/poki-sdk.js';
let sdk=null,active=false,loaded=false,breakPending=false,initialization;

function loadSDK() {
  if(window.PokiSDK)return Promise.resolve();
  return new Promise(resolve=>{
    let script=document.querySelector('script[src="'+SDK_URL+'"]');
    let timer;
    const done=()=>{clearTimeout(timer);resolve();};
    if(!script){script=document.createElement('script');script.src=SDK_URL;script.async=true;document.head.append(script);}
    script.addEventListener('load',done,{once:true});
    script.addEventListener('error',done,{once:true});
    timer=setTimeout(done,3500);
  });
}
export function initPlatform(){
  if(initialization)return initialization;
  initialization=(async()=>{
    if(!pokiEnabled)return;
    document.documentElement.classList.add('poki');
    await loadSDK();
    if(!window.PokiSDK)return;
    const candidate=window.PokiSDK;
    let timer;
    try{
      await Promise.race([Promise.resolve(candidate.init()),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('SDK unavailable')),5000);})]);
      sdk=candidate;
    }catch{
      // SDK/ad blocking must never stop the game from loading.
    }finally{clearTimeout(timer);}
  })();
  return initialization;
}
export function loadingFinished(){
  if(loaded)return;loaded=true;
  try{sdk?.gameLoadingFinished();}catch{}
}
export function gameplay(on){
  if(breakPending||on===active)return;
  active=on;
  try{sdk?.[on?'gameplayStart':'gameplayStop']();}catch{}
}
export async function commercial(){
  if(breakPending)return;
  breakPending=true;
  try{await sdk?.commercialBreak();}catch{}
  finally{breakPending=false;}
}
