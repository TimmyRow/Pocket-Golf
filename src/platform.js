let sdk=null,active=false;
export async function initPlatform(){if(import.meta.env.VITE_POKI!=='true'&&!new URLSearchParams(location.search).has('poki'))return;await new Promise(resolve=>{const script=document.createElement('script');script.src='https://game-cdn.poki.com/scripts/v2/poki-sdk.js';script.onload=resolve;script.onerror=resolve;document.head.append(script);setTimeout(resolve,3500);});if(window.PokiSDK){try{await Promise.race([window.PokiSDK.init(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('SDK unavailable')),5000))]);sdk=window.PokiSDK;}catch{}}}
export function gameplay(on){if(on===active)return;active=on;try{sdk?.[on?'gameplayStart':'gameplayStop']();}catch{}}
export async function commercial(){try{await sdk?.commercialBreak();}catch{}}

export function loadingFinished(){try{sdk?.gameLoadingFinished();}catch{}}
