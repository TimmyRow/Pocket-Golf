export const themes = [
  {name:'Garden Club',short:'Garden',label:'THE GARDEN CLUB',range:'01 - 12',
    water:0xb8dfd6,ripple:0x65a99e,grass:0x68b85c,stripe:0x74c269,edge:0x2d754f,
    rail:0xf8fbec,railSide:0x99b59b,flag:0xec6b59,bumper:0xf5bd4f,leaf:0x387b5a,
    ui:{water:'#b8dfd6',ink:'#234b41',muted:'#547b6d',panel:'#f7fbf4',accent:'#d95142',line:'#92beb0',soft:'#e5eee0'}},
  {name:'Blue Lagoon',short:'Lagoon',label:'THE BLUE LAGOON',range:'13 - 24',
    water:0x95d5e6,ripple:0x429eba,grass:0x48b58a,stripe:0x58c198,edge:0x236e64,
    rail:0xf4fafb,railSide:0x8cb8c1,flag:0xf58c61,bumper:0xffcf61,leaf:0x2e8780,
    ui:{water:'#95d5e6',ink:'#214b58',muted:'#4c7983',panel:'#f4fbfc',accent:'#cf593d',line:'#7cb8c8',soft:'#dceef0'}},
  {name:'Afterglow Links',short:'Afterglow',label:'THE AFTERGLOW LINKS',range:'25 - 36',
    water:0xe7b8b7,ripple:0xae777f,grass:0x599e87,stripe:0x69ae96,edge:0x315d58,
    rail:0xffe8d4,railSide:0xc19d96,flag:0xc35470,bumper:0xffc56c,leaf:0x787b77,
    ui:{water:'#e7b8b7',ink:'#553d4c',muted:'#856272',panel:'#fff2ec',accent:'#ba4662',line:'#cba1a4',soft:'#f1d8d7'}}
];

export function applyTheme(theme){
  for(const [key,value] of Object.entries(theme.ui))document.documentElement.style.setProperty('--'+key,value);
  document.documentElement.dataset.theme=String(themes.indexOf(theme));
}
