import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import * as Tone from "tone";

/* ═══════════════════════════════════════════════
CONSTANTS
═══════════════════════════════════════════════ */
const SCALES: Record<string, {notes: number[], label: string, mood: number, chords: number[][]}> = {
  pentatonic:{notes:[0,3,5,7,10],label:"PENTA",mood:.5,chords:[[0,3,7],[3,7,10],[5,7,10],[7,10,12],[10,12,15]]},
  minor:{notes:[0,2,3,5,7,8,10],label:"MINOR",mood:.2,chords:[[0,3,7],[2,5,8],[3,7,10],[5,8,12],[7,10,14],[8,12,15],[10,14,17]]},
  major:{notes:[0,2,4,5,7,9,11],label:"MAJOR",mood:.85,chords:[[0,4,7],[2,5,9],[4,7,11],[5,9,12],[7,11,14],[9,12,16],[11,14,17]]},
  arabic:{notes:[0,1,4,5,7,8,11],label:"ARABIC",mood:.25,chords:[[0,4,7],[1,5,8],[4,7,11],[5,8,12],[7,11,13],[8,12,16]]}
};
const SO = ["pentatonic","minor","major","arabic"];
const PROGS: Record<string, number[][]> = {
  pentatonic:[[0,3,0,4],[0,1,2,0]],
  minor:[[0,3,4,0],[0,5,3,4],[0,2,5,4]],
  major:[[0,4,5,3],[0,3,4,0]],
  arabic:[[0,3,4,0],[0,2,4,0]]
};
const BM=48, MR=36, GN=9000, SM=.12, PP=300, RIPPLE_POOL=16, FFT_BARS=32;
const PAL: number[][] = [[0,.94,1],[1,0,.9],[1,.9,0],[0,1,.53],[1,.38,.19],[.5,.25,1]];
const NN = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

/* DJ sections */
const DJ = [
  {name:"INTRO",bars:4,e:.1,d:.15,l:{dr:1,pd:0,bs:0,ml:0,ar:0,ct:0},ft:.15,rv:.6,dw:.2,algo:"silent",adsr:[2,1,.7,3],mod:[1,1,0,5]},
  {name:"VERSE",bars:8,e:.3,d:.4,l:{dr:1,pd:.5,bs:0,ml:1,ar:0,ct:0},ft:.35,rv:.45,dw:.18,algo:"motif",adsr:[.08,.3,.5,1.5],mod:[3,2,8,12]},
  {name:"BUILD",bars:4,e:.55,d:.6,l:{dr:1,pd:.7,bs:.3,ml:1,ar:.5,ct:0},ft:.6,rv:.35,dw:.15,algo:"sequence",sweep:1,adsr:[.05,.25,.55,1.2],mod:[4,2.5,12,15]},
  {name:"DROP",bars:8,e:.85,d:.8,l:{dr:1,pd:1,bs:1,ml:1,ar:.8,ct:.3},ft:.9,rv:.3,dw:.12,algo:"develop",adsr:[.03,.2,.6,.8],mod:[5,3,15,18]},
  {name:"BREAK",bars:6,e:.2,d:.25,l:{dr:1,pd:.8,bs:0,ml:.5,ar:0,ct:0},ft:.25,rv:.55,dw:.25,algo:"fragment",adsr:[.15,.4,.4,2.5],mod:[2,1.5,5,8]},
  {name:"BUILD2",bars:4,e:.65,d:.7,l:{dr:1,pd:.8,bs:.5,ml:1,ar:.7,ct:.3},ft:.75,rv:.3,dw:.13,algo:"sequence",sweep:1,riser:1,adsr:[.04,.2,.6,1],mod:[5,2.8,14,16]},
  {name:"PEAK",bars:8,e:1,d:.9,l:{dr:1,pd:1,bs:1,ml:1,ar:1,ct:.6},ft:1,rv:.25,dw:.1,algo:"climax",adsr:[.02,.15,.65,.6],mod:[6,3.5,18,22]},
  {name:"OUTRO",bars:6,e:.15,d:.2,l:{dr:1,pd:.4,bs:0,ml:.3,ar:0,ct:0},ft:.15,rv:.6,dw:.22,algo:"fragment",adsr:[.2,.5,.4,3],mod:[1.5,1.2,3,6]},
] as any[];
const RHY: Record<string, number[][]> = {
  sparse:[[8,1],[8,.7]],
  quarter:[[4,1],[4,.7],[4,.9],[4,.6]],
  driving:[[2,1],[2,.6],[2,.9],[2,.5],[2,1],[2,.7],[2,.8],[2,.5]],
  syncopated:[[3,1],[1,.5],[4,.8],[3,.9],[1,.4],[4,.7]],
  dense:[[2,1],[1,.5],[1,.7],[2,.9],[2,.8],[1,.6],[1,.5],[2,.7]]
};
const BASS: Record<string, number[][]> = {
  whole:[[16,1]],
  octave:[[4,1],[4,.8],[4,1],[4,.7]],
  bounce:[[2,1],[2,0],[2,.8],[2,0],[2,1],[2,0],[2,.7],[2,0]]
};
const ARPM = ["up","down","updown","random","skip"];

/* ═══════════════════════════════════════════════
HELPERS
═══════════════════════════════════════════════ */
const m2f = (m: number) => 440*Math.pow(2,(m-69)/12);
const clamp = (v: number, a: number, b: number) => v<a?a:v>b?b:v;
const lerp = (a: number, b: number, t: number) => a+(b-a)*t;
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random()*a.length)];

function quantize(midi: number, sn: number[]) {
  const oct=Math.floor(midi/12), pc=((midi%12)+12)%12;
  let b=sn[0], bd=99;
  for(const s of sn) {
    const d=Math.min(Math.abs(pc-s),12-Math.abs(pc-s));
    if(d<bd){bd=d;b=s;}
  }
  return oct*12+b;
}

function nColor(midi: number) {
  const t=((midi%12)/12)*PAL.length, i=Math.floor(t)%PAL.length, j=(i+1)%PAL.length, f=t-Math.floor(t);
  return PAL[i].map((v,k)=>v+(PAL[j][k]-v)*f);
}

function nHex(midi: number) {
  return "#"+nColor(midi).map(v=>Math.round(v*255).toString(16).padStart(2,"0")).join("");
}

function haptic(ms: number | number[]) {
  try{navigator.vibrate?.(Array.isArray(ms)?ms:[ms]);}catch{}
}

function genMotif(sn: number[], len=4) {
  const m: number[]=[];
  let d=Math.floor(Math.random()*sn.length);
  m.push(d);
  for(let i=1;i<len;i++){
    d=clamp(d+(Math.random()<.7?(Math.random()<.5?1:-1):(Math.random()<.5?2:-2)),0,sn.length-1);
    m.push(d);
  }
  return m;
}

function devMotif(m: number[], tech: string, n: number): number[] {
  switch(tech) {
    case"transpose":{const s=pick([1,2,-1,-2]);return m.map(d=>clamp(d+s,0,n-1));}
    case"invert":{const a=m[0];return m.map(d=>clamp(a-(d-a),0,n-1));}
    case"retrograde":return[...m].reverse();
    case"fragment":return m.slice(0,Math.ceil(m.length/2));
    case"ornament":{const r: number[]=[];m.forEach((d,i)=>{r.push(d);if(i<m.length-1&&Math.random()<.4)r.push(clamp(Math.round((d+m[i+1])/2),0,n-1));});return r;}
    case"sequence":{const s=pick([2,3,-2]);return m.map(d=>clamp(d+s,0,n-1));}
    default:return m;
  }
}

function buildMatrix(sn: number[]) {
  const n=sn.length, m: Record<number, Record<number, number>>={};
  for(let i=0;i<n;i++){
    const w: Record<number, number>={};
    for(let j=0;j<n;j++){
      const iv=Math.abs(i-j);
      w[j]=iv===0?.05:iv===1?4:iv===2?2.2:iv===3?1:.35;
    }
    if(i===n-1)w[0]=6;
    if(i===n-2){w[n-1]=3.5;w[0]=2.5;}
    m[i]=w;
  }
  return m;
}

function wPick(w: Record<number, number>) {
  const e=Object.entries(w), tot=e.reduce((s,[,v])=>s+(v as number),0);
  let r=Math.random()*tot;
  for(const[k,v]of e){r-=(v as number);if(r<=0)return parseInt(k);}
  return parseInt(e[0][0]);
}

function getArpNote(ch: number[], step: number, mode: string) {
  const n=ch.length;
  if(!n)return 0;
  switch(mode){
    case"up":return ch[step%n];
    case"down":return ch[(n-1)-(step%n)];
    case"updown":{const c=n*2-2||1;const p=step%c;return p<n?ch[p]:ch[c-p];}
    case"skip":return ch[(step*2)%n];
    default:return ch[Math.floor(Math.random()*n)];
  }
}

/* ═══════════════════════════════════════════════
SHADERS
═══════════════════════════════════════════════ */
const G_V=`attribute float aSize;attribute float aRand;varying vec3 vC;varying float vA;uniform float uT,uPR,uB,uTr,uV,uFl; void main(){vC=color*(1.+uFl*.8);vec3 p=position;float d=length(p.xz);p.xz*=1.+uTr*.06*smoothstep(100.,900.,d); p.y+=sin(p.x*.004+uT*.8+aRand*6.28)*uB*20.;vec4 mv=modelViewMatrix*vec4(p,1.); gl_PointSize=max(aSize*(1.+uTr*.6+uFl*.5)*uPR*(280./-mv.z),.8);gl_Position=projectionMatrix*mv;vA=.75+uV*.25;}`;
const G_F=`varying vec3 vC;varying float vA;uniform float uV;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard; gl_FragColor=vec4(vC+exp(-d*4.5)*(.25+uV*.35),smoothstep(.5,.05,d)*vA);}`;
const P_V=`attribute float aL;attribute float aML;attribute float aS;varying float vL;varying vec3 vC;uniform float uPR,uB; void main(){vL=aL/aML;vC=color;vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=step(.001,aL)*step(aL,aML)*aS*(1.-vL)*(1.+uB*.5)*uPR*(200./-mv.z);gl_Position=projectionMatrix*mv;}`;
const P_F=`varying float vL;varying vec3 vC;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard; gl_FragColor=vec4(vC+exp(-d*3.)*.4*(1.-vL),smoothstep(.5,0.,d)*(1.-vL)*.85);}`;
const SV=`varying vec3 vN;void main(){vN=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const SF=`uniform float uT,uB,uP;varying vec3 vN;void main(){float rim=1.-dot(vN,vec3(0,0,1)); vec3 c=mix(vec3(0,.94,1),mix(vec3(1,0,.9),vec3(1,.9,0),uP),sin(uT*.4+uP*4.)*.5+.5); gl_FragColor=vec4(c*(pow(rim,1.8)*(2.+uB*4.)+.5+uB),1.);}`;
const HF=`uniform float uT,uB;varying vec3 vN;void main(){float rim=pow(max(dot(vN,vec3(0,0,1)),0.),2.5); gl_FragColor=vec4(mix(vec3(0,.94,1),vec3(1,0,.9),sin(uT*.25)*.5+.5),rim*(.3+uB*.55));}`;
const PV=`varying vec2 vU;void main(){vU=uv;gl_Position=vec4(position,1.);}`;
const BRF=`uniform sampler2D tD;uniform float uTh;varying vec2 vU;void main(){vec4 c=texture2D(tD,vU);gl_FragColor=dot(c.rgb,vec3(.2126,.7152,.0722))>uTh?c*1.2:vec4(0.);}`;
const BLF=`uniform sampler2D tD;uniform vec2 uR;varying vec2 vU;void main(){ vec2 ph=vec2(2.5,0.)/uR;vec2 pv=vec2(0.,1.)/uR;vec4 s=vec4(0.); for(float i=-3.;i<=3.;i+=1.){float w=.15-.02*abs(i);s+=texture2D(tD,vU+i*ph)*w;s+=texture2D(tD,vU+i*pv)*w*.5;} gl_FragColor=s*.55;}`;
const COF=`uniform sampler2D tO,tB;uniform float uBl,uCh,uVi,uT2,uMd;varying vec2 vU;void main(){ vec2 d=vU-.5;float dist=length(d);float off=uCh*dist*.018; float r=texture2D(tO,vU+d*off).r,g=texture2D(tO,vU).g,b=texture2D(tO,vU-d*off).b; vec3 col=vec3(r,g,b)+texture2D(tB,vU).rgb*uBl;col*=1.-smoothstep(.35,1.5,dist*2.)*uVi; col=mix(col*vec3(.8,.88,1.2),col*vec3(1.15,.95,.8),uMd); col+=fract(sin(dot(vU*uT2*80.,vec2(12.9898,78.233)))*43758.5453)*.03-.015; gl_FragColor=vec4(col,1.);}`;

/* ═══════════════════════════════════════════════
COMPONENT
═══════════════════════════════════════════════ */
export default function CosmicSynth() {
  const [phase, setPhase] = useState<"splash"|"warp"|"play">("splash");
  const [audioOk, setAudioOk] = useState(true);
  const [scale, setScale] = useState("pentatonic");
  const [auto, setAuto] = useState(false);
  const [flash, setFlash] = useState("");
  const [showTitle, setShowTitle] = useState(true);
  const [hintGone, setHintGone] = useState(false);
  const [gyroPrompt, setGyroPrompt] = useState(false);
  const [djSec, setDjSec] = useState("");

  const cvRef = useRef<HTMLCanvasElement>(null);
  const engRef = useRef<any>(null);
  const audRef = useRef<any>(null);
  const tRef = useRef(new Map());
  const aRef = useRef({bass:0,mid:0,treble:0,high:0,vol:0,pitch:0});
  const scRef = useRef("pentatonic");
  const fftB = useRef(new Float32Array(256));
  const rafRef = useRef<number|null>(null);
  const glowsRef = useRef(new Map());
  const glowCRef = useRef<HTMLDivElement>(null);
  const gyRef = useRef({on:false,b:0,g:0});
  const hideRef = useRef<any>(null);
  const flU = useRef(0);
  const warpR = useRef({on:false,t:0});
  const djR = useRef<any>({on:false,iv:null,si:0,tis:0,tt:0,motif:[],dev:[],phrase:[],pp:0,
    prog:[],ci:0,ct:0,bp:"whole",bi:0,am:"up",as:0,ac:[],rn:"quarter",ri:0,
    oct:4,deg:0,tf:.3,cf:.3,te:.1,ce:.1,rf:200});
  const frameCount = useRef(0);

  useEffect(()=>{scRef.current=scale;},[scale]);

  useEffect(()=>{
    const l=document.createElement("link");
    l.rel="stylesheet";
    l.href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Raleway:wght@200;300;400&display=swap";
    document.head.appendChild(l);
    return()=>{try{document.head.removeChild(l);}catch{}}
  },[]);

  useEffect(()=>{
    const p = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu",p,{passive:false} as any);
    document.addEventListener("selectstart",p,{passive:false} as any);
    const s=document.createElement("style");
    s.textContent=`*{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;-webkit-tap-highlight-color:transparent!important;}`;
    document.head.appendChild(s);
    return()=>{
      document.removeEventListener("contextmenu",p);
      document.removeEventListener("selectstart",p);
      try{document.head.removeChild(s);}catch{}
    };
  },[]);

  const resetHide = useCallback(()=>{
    clearTimeout(hideRef.current);
    setShowTitle(true);
    hideRef.current=setTimeout(()=>setShowTitle(false),3500);
    if(!hintGone)setHintGone(true);
  },[hintGone]);

  // Gyro
  useEffect(()=>{
    if(phase!=="play")return;
    const g=gyRef.current;
    const h = (e: DeviceOrientationEvent) => {g.on=true;g.b=e.beta||0;g.g=e.gamma||0;};
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof (DeviceOrientationEvent as any).requestPermission==="function")
      setGyroPrompt(true);
    else{window.addEventListener("deviceorientation",h);g.on=true;}
    return()=>window.removeEventListener("deviceorientation",h);
  },[phase]);

  const grantGyro = useCallback(async()=>{
    setGyroPrompt(false);
    try{
      const s=await (DeviceOrientationEvent as any).requestPermission();
      if(s==="granted"){
        const g=gyRef.current;
        window.addEventListener("deviceorientation",(e: DeviceOrientationEvent)=>{
          g.on=true;g.b=e.beta||0;g.g=e.gamma||0;
        });
      }
    }catch{}
  },[]);

  const handleStart = useCallback(async()=>{
    try{await Tone.start();initAudio();}catch{setAudioOk(false);}
    setPhase("warp");
    warpR.current={on:true,t:0};
    setTimeout(()=>{setPhase("play");warpR.current.on=false;},1300);
  },[]);

  function initAudio() {
    try {
      const fi=new Tone.Filter({type:"lowpass",frequency:4500,rolloff:-24});
      const rv=new Tone.Reverb({decay:6,wet:.4});
      const dl=new Tone.FeedbackDelay({delayTime:"8n.",feedback:.22,wet:.13});
      const ch=new Tone.Chorus({frequency:.8,delayTime:4,depth:.6,wet:.18}).start();
      const ld=new Tone.PolySynth(Tone.FMSynth,{maxPolyphony:6,harmonicity:2.5,modulationIndex:4,oscillator:{type:"fatsawtooth",spread:15,count:3},modulation:{type:"triangle"},envelope:{attack:.05,decay:.3,sustain:.5,release:1.5},modulationEnvelope:{attack:.08,decay:.2,sustain:.4,release:1}} as any);
      ld.volume.value=-10;
      const sb=new Tone.PolySynth(Tone.Synth,{maxPolyphony:6,oscillator:{type:"sine"},envelope:{attack:.08,decay:.2,sustain:.6,release:1.2}} as any);
      sb.volume.value=-16;
      ld.connect(fi);sb.connect(fi);fi.connect(ch);ch.connect(dl);dl.connect(rv);rv.toDestination();
      const pf=new Tone.Filter({type:"lowpass",frequency:1200,rolloff:-12});
      const pr=new Tone.Reverb({decay:7,wet:.55});
      const pd=new Tone.PolySynth(Tone.Synth,{maxPolyphony:6,oscillator:{type:"fatsine4",spread:30,count:4},envelope:{attack:2.5,decay:1,sustain:.7,release:3}} as any);
      pd.volume.value=-20;pd.connect(pf);pf.connect(pr);pr.toDestination();
      const bf=new Tone.Filter({type:"lowpass",frequency:800,rolloff:-24});
      const br2=new Tone.Reverb({decay:3,wet:.2});
      const bs=new Tone.PolySynth(Tone.Synth,{maxPolyphony:3,oscillator:{type:"fatsquare",spread:8,count:2},envelope:{attack:.02,decay:.15,sustain:.7,release:.5}} as any);
      bs.volume.value=-14;bs.connect(bf);bf.connect(br2);br2.toDestination();
      const af=new Tone.Filter({type:"lowpass",frequency:3000,rolloff:-12});
      const ad=new Tone.FeedbackDelay({delayTime:"16n",feedback:.3,wet:.2});
      const ar=new Tone.PolySynth(Tone.Synth,{maxPolyphony:4,oscillator:{type:"triangle"},envelope:{attack:.01,decay:.1,sustain:.2,release:.4}} as any);
      ar.volume.value=-18;ar.connect(af);af.connect(ad);ad.connect(rv);
      const df=new Tone.Filter({type:"lowpass",frequency:600,rolloff:-12});
      const dr2=new Tone.Reverb({decay:8,wet:.5});
      const dn=new Tone.PolySynth(Tone.Synth,{maxPolyphony:4,oscillator:{type:"sine"},envelope:{attack:3,decay:2,sustain:.8,release:5}} as any);
      dn.volume.value=-22;dn.connect(df);df.connect(dr2);dr2.toDestination();
      dn.triggerAttack([m2f(36),m2f(43)],Tone.now());
      const lfo=new Tone.LFO(.05,100,500);lfo.connect(df.frequency);lfo.start();
      const fft=new Tone.FFT(256);Tone.getDestination().connect(fft);
      audRef.current={ld,sb,pd,bs,ar,dn,fi,pf,bf,af,df,rv,dl,ch,pr,br2,dr2,fft,lfo};
    } catch(e) {
      console.error("Audio:",e);setAudioOk(false);
    }
  }

  function analyze() {
    const a=aRef.current;
    if(!audRef.current?.fft){a.bass=a.mid=a.treble=a.high=a.vol=a.pitch=0;return;}
    const raw=audRef.current.fft.getValue();
    let rB=0,rM=0,rT=0,rH=0,rV=0,mI=0,mV=-200;
    const len=raw.length;
    for(let i=0;i<len;i++){
      const db=raw[i] as number;
      const v=db>-100?(db+100)*.01:0;
      fftB.current[i]+=(v-fftB.current[i])*.18;
      const s=fftB.current[i];rV+=s;
      if(s>mV){mV=s;mI=i;}
      const f=(i/len)*22050;
      if(f<150)rB+=s;else if(f<600)rM+=s;else if(f<4000)rT+=s;else rH+=s;
    }
    a.bass+=(Math.min(rB/6,1)-a.bass)*SM;
    a.mid+=(Math.min(rM/8,1)-a.mid)*SM;
    a.treble+=(Math.min(rT/12,1)-a.treble)*SM;
    a.high+=(Math.min(rH/8,1)-a.high)*SM;
    a.vol+=(Math.min(rV/len,1)-a.vol)*SM;
    a.pitch+=(mI/len-a.pitch)*.08;
  }

  /* ═══════════════════════════════════════════════
  THREE.JS Scene
  ═══════════════════════════════════════════════ */
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const W=()=>window.innerWidth, H=()=>window.innerHeight, PR=Math.min(window.devicePixelRatio,2);
    const sc=new THREE.Scene();
    sc.fog=new THREE.FogExp2(0x000008,.00015);
    const cam=new THREE.PerspectiveCamera(72,W()/H(),1,8000);
    cam.position.z=650;
    const ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:"high-performance"});
    ren.setSize(W(),H());ren.setPixelRatio(PR);
    ren.toneMapping=THREE.ACESFilmicToneMapping;
    ren.toneMappingExposure=1.1;
    ren.setClearColor(0x000008);

    // Galaxy
    const gGeo=new THREE.BufferGeometry();
    const gP=new Float32Array(GN*3),gC=new Float32Array(GN*3),gS=new Float32Array(GN),gR=new Float32Array(GN);
    for(let i=0;i<GN;i++){
      const arm=Math.floor(Math.random()*3),ang=arm*2.094+Math.random()*5,rad=20+Math.pow(Math.random(),1.5)*900;
      const x=Math.cos(ang)*rad,z=Math.sin(ang)*rad,y=(Math.random()-.5)*60*(1+rad*.003);
      gP[i*3]=x;gP[i*3+1]=y;gP[i*3+2]=z;
      const ci=Math.floor(Math.random()*PAL.length);
      gC[i*3]=PAL[ci][0];gC[i*3+1]=PAL[ci][1];gC[i*3+2]=PAL[ci][2];
      gS[i]=1.5+Math.random()*3.5;gR[i]=Math.random();
    }
    gGeo.setAttribute("position",new THREE.BufferAttribute(gP,3));
    gGeo.setAttribute("color",new THREE.BufferAttribute(gC,3));
    gGeo.setAttribute("aSize",new THREE.BufferAttribute(gS,1));
    gGeo.setAttribute("aRand",new THREE.BufferAttribute(gR,1));
    const gMat=new THREE.ShaderMaterial({
      uniforms:{uT:{value:0},uPR:{value:PR},uB:{value:0},uTr:{value:0},uV:{value:0},uFl:{value:0}},
      vertexShader:G_V,fragmentShader:G_F,transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending
    });
    const galaxy=new THREE.Points(gGeo,gMat);
    sc.add(galaxy);

    // Star
    const sGeo=new THREE.IcosahedronGeometry(18,4);
    const sM=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uB:{value:0},uP:{value:0}},vertexShader:SV,fragmentShader:SF});
    const star=new THREE.Mesh(sGeo,sM);sc.add(star);

    // Halo
    const hGeo=new THREE.SphereGeometry(45,32,32);
    const hM=new THREE.ShaderMaterial({uniforms:{uT:{value:0},uB:{value:0}},vertexShader:SV,fragmentShader:HF,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide});
    const halo=new THREE.Mesh(hGeo,hM);sc.add(halo);

    // Rings
    const rings: THREE.Mesh[] = [];
    for(let i=0;i<3;i++){
      const rG=new THREE.RingGeometry(80+i*55,82+i*55,128);
      const rM=new THREE.MeshBasicMaterial({color:new THREE.Color(PAL[i][0],PAL[i][1],PAL[i][2]),transparent:true,opacity:.12,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});
      const ring=new THREE.Mesh(rG,rM);
      ring.rotation.x=.3+i*.25;ring.rotation.y=i*.4;
      sc.add(ring);rings.push(ring);
    }

    // Nebulae
    const nebs: (THREE.Sprite & {_bo: number})[] = [];
    for(let i=0;i<5;i++){
      const c=document.createElement("canvas");c.width=128;c.height=128;
      const ctx=c.getContext("2d")!;
      const g=ctx.createRadialGradient(64,64,0,64,64,64);
      const ci=PAL[i%PAL.length];
      g.addColorStop(0,`rgba(${Math.round(ci[0]*255)},${Math.round(ci[1]*255)},${Math.round(ci[2]*255)},.18)`);
      g.addColorStop(1,"transparent");
      ctx.fillStyle=g;ctx.fillRect(0,0,128,128);
      const tex=new THREE.CanvasTexture(c);
      const mat=new THREE.SpriteMaterial({map:tex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,opacity:.08+Math.random()*.05});
      const spr=new THREE.Sprite(mat) as THREE.Sprite & {_bo: number};
      spr.scale.setScalar(300+Math.random()*500);
      spr.position.set((Math.random()-.5)*1200,(Math.random()-.5)*400,(Math.random()-.5)*1200);
      spr._bo=mat.opacity;
      sc.add(spr);nebs.push(spr);
    }

    // Shooting stars
    const SHN=6,SHL=20;
    const shP=new Float32Array(SHN*3),shV=new Float32Array(SHN*3),shLife=new Float32Array(SHN),shMax=new Float32Array(SHN);
    const shPos=new Float32Array(SHN*SHL*3),shHead=new Int32Array(SHN),shLen=new Int32Array(SHN);
    for(let i=0;i<SHN;i++){
      shP[i*3]=(Math.random()-.5)*1800;shP[i*3+1]=(Math.random()-.5)*700;shP[i*3+2]=(Math.random()-.5)*1800;
      shV[i*3]=(Math.random()-.5)*5;shV[i*3+1]=(Math.random()-.5)*2;shV[i*3+2]=(Math.random()-.5)*5;
      shLife[i]=0;shMax[i]=60+Math.random()*120;
    }
    const shGeo=new THREE.BufferGeometry();
    shGeo.setAttribute("position",new THREE.BufferAttribute(shPos,3));
    const shMat=new THREE.PointsMaterial({color:0xffffff,size:2,transparent:true,opacity:.6,blending:THREE.AdditiveBlending,depthWrite:false});
    const shooters=new THREE.Points(shGeo,shMat);sc.add(shooters);

    // Particles
    const pP=new Float32Array(PP*3),pC=new Float32Array(PP*3),pV=new Float32Array(PP*3),pL=new Float32Array(PP),pM=new Float32Array(PP),pSz=new Float32Array(PP);
    for(let i=0;i<PP;i++){pP[i*3+1]=-9999;pL[i]=0;pM[i]=1;pSz[i]=2;}
    const pGeo=new THREE.BufferGeometry();
    pGeo.setAttribute("position",new THREE.BufferAttribute(pP,3));
    pGeo.setAttribute("color",new THREE.BufferAttribute(pC,3));
    pGeo.setAttribute("aL",new THREE.BufferAttribute(pL,1));
    pGeo.setAttribute("aML",new THREE.BufferAttribute(pM,1));
    pGeo.setAttribute("aS",new THREE.BufferAttribute(pSz,1));
    const pMat=new THREE.ShaderMaterial({
      uniforms:{uPR:{value:PR},uB:{value:0}},
      vertexShader:P_V,fragmentShader:P_F,transparent:true,depthWrite:false,vertexColors:true,blending:THREE.AdditiveBlending
    });
    const particles=new THREE.Points(pGeo,pMat);sc.add(particles);
    let pIdx=0,pDirty=false;

    function emitP(x: number,y: number,z: number,col: number[],count: number,vel: number){
      for(let i=0;i<count;i++){
        const idx=pIdx;pIdx=(pIdx+1)%PP;
        pP[idx*3]=x;pP[idx*3+1]=y;pP[idx*3+2]=z;
        pV[idx*3]=(Math.random()-.5)*vel*8;pV[idx*3+1]=(Math.random()-.5)*vel*8;pV[idx*3+2]=(Math.random()-.5)*vel*8;
        pC[idx*3]=col[0];pC[idx*3+1]=col[1];pC[idx*3+2]=col[2];
        pL[idx]=1;pM[idx]=30+Math.random()*40;pSz[idx]=3+Math.random()*5;
        pDirty=true;
      }
    }

    // Ripple pool
    const ripplePool: {mesh: THREE.Mesh, active: boolean, life: number}[] = [];
    for(let i=0;i<RIPPLE_POOL;i++){
      const rGeo=new THREE.RingGeometry(.5,1,64);
      const rMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false});
      const rMesh=new THREE.Mesh(rGeo,rMat);
      rMesh.visible=false;sc.add(rMesh);
      ripplePool.push({mesh:rMesh,active:false,life:0});
    }
    function addRipple(x: number,y: number,z: number,col: number[]){
      const r=ripplePool.find(r=>!r.active);if(!r)return;
      r.active=true;r.life=0;r.mesh.visible=true;
      r.mesh.position.set(x,y,z);r.mesh.scale.setScalar(1);
      (r.mesh.material as THREE.MeshBasicMaterial).color.setRGB(col[0],col[1],col[2]);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity=.7;
    }

    // FFT bars
    const fftGroup=new THREE.Group();sc.add(fftGroup);
    const fftMeshes: THREE.Mesh[] = [];
    for(let i=0;i<FFT_BARS;i++){
      const bGeo=new THREE.BoxGeometry(3,1,3);
      const ci=Math.floor((i/FFT_BARS)*PAL.length)%PAL.length;
      const bMat=new THREE.MeshBasicMaterial({color:new THREE.Color(PAL[ci][0],PAL[ci][1],PAL[ci][2]),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false});
      const bMesh=new THREE.Mesh(bGeo,bMat);
      const ang=(i/FFT_BARS)*Math.PI*2;
      bMesh.position.set(Math.cos(ang)*220,0,Math.sin(ang)*220);
      bMesh.lookAt(0,0,0);
      fftGroup.add(bMesh);fftMeshes.push(bMesh);
    }

    // Post-processing
    const rt=new THREE.WebGLRenderTarget(W(),H());
    const bw=()=>Math.ceil(W()*.3),bh=()=>Math.ceil(H()*.3);
    const bt1=new THREE.WebGLRenderTarget(bw(),bh()),bt2=new THREE.WebGLRenderTarget(bw(),bh());
    const ppC=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    const fsG=new THREE.PlaneGeometry(2,2);
    const brM=new THREE.ShaderMaterial({uniforms:{tD:{value:null},uTh:{value:.45}},vertexShader:PV,fragmentShader:BRF});
    const brS=new THREE.Scene();brS.add(new THREE.Mesh(fsG,brM));
    const blM=new THREE.ShaderMaterial({uniforms:{tD:{value:null},uR:{value:new THREE.Vector2(bw(),bh())}},vertexShader:PV,fragmentShader:BLF});
    const blS=new THREE.Scene();blS.add(new THREE.Mesh(fsG.clone(),blM));
    const coM=new THREE.ShaderMaterial({uniforms:{tO:{value:null},tB:{value:null},uBl:{value:.5},uCh:{value:0},uVi:{value:.35},uT2:{value:0},uMd:{value:.5}},vertexShader:PV,fragmentShader:COF});
    const coS=new THREE.Scene();coS.add(new THREE.Mesh(fsG.clone(),coM));

    const ms={x:0,y:0,tx:0,ty:0};let scrollZ=0;
    window.addEventListener("wheel",(e)=>{scrollZ+=e.deltaY*.25;},{passive:true});
    window.addEventListener("mousemove",(e)=>{ms.tx=(e.clientX/W()-.5)*2;ms.ty=-(e.clientY/H()-.5)*2;});
    const onR=()=>{cam.aspect=W()/H();cam.updateProjectionMatrix();ren.setSize(W(),H());rt.setSize(W(),H());bt1.setSize(bw(),bh());bt2.setSize(bw(),bh());blM.uniforms.uR.value.set(bw(),bh());};
    window.addEventListener("resize",onR);

    function s2w(x: number, y: number) {
      const nd=new THREE.Vector3((x/W())*2-1,-(y/H())*2+1,.5);
      nd.unproject(cam);
      const d=nd.sub(cam.position).normalize();
      return cam.position.clone().add(d.multiplyScalar(280));
    }
    engRef.current={cam,addRipple,emitP,s2w:(x: number,y: number)=>{const p=s2w(x,y);return[p.x,p.y,p.z];}};

    const clk=new THREE.Clock();
    function frame() {
      rafRef.current=requestAnimationFrame(frame);
      const t=clk.getElapsedTime(), a=aRef.current;
      const fc=frameCount.current++;
      if(fc%2===0)analyze();

      const g=gyRef.current;
      if(g.on){ms.tx=clamp(g.g/30,-1,1);ms.ty=clamp(-g.b/45+.5,-1,1);}
      ms.x+=(ms.tx-ms.x)*.04;ms.y+=(ms.ty-ms.y)*.04;
      const warp=warpR.current;
      let camZ=650+scrollZ;
      if(warp.on){warp.t=Math.min(warp.t+.025,1);camZ=650-450*warp.t*warp.t+scrollZ;}
      cam.position.x+=(ms.x*140-cam.position.x)*.018;
      cam.position.y+=(ms.y*100-cam.position.y)*.018;
      cam.position.z+=(camZ-cam.position.z)*.04;
      cam.position.z=clamp(cam.position.z,80,1600);
      cam.lookAt(0,0,0);

      flU.current*=.93;
      galaxy.rotation.y=t*(.018+a.mid*.035);
      const gu=gMat.uniforms;gu.uT.value=t;gu.uB.value=a.bass;gu.uTr.value=a.treble;gu.uV.value=a.vol;gu.uFl.value=flU.current;
      sM.uniforms.uT.value=t;sM.uniforms.uB.value=a.bass;sM.uniforms.uP.value=a.pitch;
      star.scale.setScalar(1+Math.sin(t*1.8)*.08+a.bass*3);
      hM.uniforms.uT.value=t;hM.uniforms.uB.value=a.bass;
      halo.scale.setScalar(1+a.bass*1.8);
      rings.forEach((r,i)=>{r.rotation.z=t*(.08+i*.04+a.mid*.35);(r.material as THREE.MeshBasicMaterial).opacity=.1+a.mid*.35;});
      nebs.forEach(n=>{(n.material as THREE.SpriteMaterial).opacity=n._bo+a.mid*.07+a.vol*.03;});

      // Shooters
      for(let i=0;i<SHN;i++){
        shLife[i]++;
        if(shLife[i]>shMax[i]){
          shLife[i]=0;
          shP[i*3]=(Math.random()-.5)*1800;shP[i*3+1]=(Math.random()-.5)*700;shP[i*3+2]=(Math.random()-.5)*1800;
          const v=4+a.high*9;
          shV[i*3]=(Math.random()-.5)*v;shV[i*3+1]=(Math.random()-.5)*v*.4;shV[i*3+2]=(Math.random()-.5)*v;
          shHead[i]=0;shLen[i]=0;
        }
        shP[i*3]+=shV[i*3];shP[i*3+1]+=shV[i*3+1];shP[i*3+2]+=shV[i*3+2];
        const h=shHead[i],base=i*SHL*3,idx=h*3;
        shPos[base+idx]=shP[i*3];shPos[base+idx+1]=shP[i*3+1];shPos[base+idx+2]=shP[i*3+2];
        shHead[i]=(h+1)%SHL;
        if(shLen[i]<SHL)shLen[i]++;
      }
      shGeo.attributes.position.needsUpdate=true;

      // Particles
      let anyAlive=false;
      for(let i=0;i<PP;i++){
        if(pL[i]>0&&pL[i]<pM[i]){
          pL[i]++;pP[i*3]+=pV[i*3];pP[i*3+1]+=pV[i*3+1];pP[i*3+2]+=pV[i*3+2];
          pV[i*3]*=.96;pV[i*3+1]*=.96;pV[i*3+2]*=.96;anyAlive=true;
        } else if(pL[i]>=pM[i]){pL[i]=0;pP[i*3+1]=-9999;anyAlive=true;}
      }
      if(anyAlive||pDirty){
        pGeo.attributes.position.needsUpdate=true;pGeo.attributes.aL.needsUpdate=true;
        if(pDirty){pGeo.attributes.color.needsUpdate=true;pGeo.attributes.aS.needsUpdate=true;pGeo.attributes.aML.needsUpdate=true;pDirty=false;}
        pMat.uniforms.uB.value=a.bass;
      }

      // Ripples
      for(let i=0;i<ripplePool.length;i++){
        const r=ripplePool[i];if(!r.active)continue;
        r.life++;r.mesh.scale.setScalar(1+r.life*2.5);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity=.7*(1-r.life/55);
        if(r.life>=55){r.mesh.visible=false;r.active=false;}
      }

      // FFT bars
      if(fc%3===0){
        for(let i=0;i<FFT_BARS;i++){
          const v=fftB.current[Math.floor(i/FFT_BARS*128)]||0;
          fftMeshes[i].scale.y=1+v*120;
          (fftMeshes[i].material as THREE.MeshBasicMaterial).opacity=.2+v*.8;
        }
      }

      // Post-processing
      ren.setRenderTarget(rt);ren.render(sc,cam);
      brM.uniforms.tD.value=rt.texture;ren.setRenderTarget(bt1);ren.render(brS,ppC);
      blM.uniforms.tD.value=bt1.texture;ren.setRenderTarget(bt2);ren.render(blS,ppC);
      coM.uniforms.tO.value=rt.texture;coM.uniforms.tB.value=bt2.texture;
      coM.uniforms.uCh.value=a.treble*2;coM.uniforms.uT2.value=t;
      coM.uniforms.uMd.value=SCALES[scRef.current]?.mood||.5;
      ren.setRenderTarget(null);ren.render(coS,ppC);
    }
    frame();

    return()=>{
      if(rafRef.current)cancelAnimationFrame(rafRef.current);
      ren.dispose();rt.dispose();bt1.dispose();bt2.dispose();
      sc.traverse((o: any)=>{o.geometry?.dispose();if(o.material){if(Array.isArray(o.material))o.material.forEach((m: any)=>m.dispose());else o.material.dispose();}});
    };
  },[]);

  /* ═══════════════════════════════════════════════
  TOUCH/MOUSE
  ═══════════════════════════════════════════════ */
  useEffect(()=>{
    const cv=cvRef.current;if(!cv||phase!=="play")return;
    function noteOn(id: any, x: number, y: number) {
      if(!audRef.current)return;resetHide();
      const sn=SCALES[scRef.current].notes;
      const midi=quantize(Math.round(BM+(x/window.innerWidth)*MR),sn);
      const freq=m2f(midi);
      const cut=300+(1-y/window.innerHeight)*5500;
      const vel=.35+(1-y/window.innerHeight)*.55;
      try{
        audRef.current.ld.triggerAttack(freq,Tone.now(),vel);
        audRef.current.sb.triggerAttack(m2f(midi-12),Tone.now(),vel*.6);
        audRef.current.fi.frequency.rampTo(cut,.08);
        audRef.current.pd.volume.rampTo(-28,.05);
        setTimeout(()=>{try{audRef.current.pd.volume.rampTo(-20,.4);}catch{}},100);
      }catch{}
      haptic(15);
      const col=nColor(midi);
      if(engRef.current){
        const [wx,wy,wz]=engRef.current.s2w(x,y);
        engRef.current.addRipple(wx,wy,wz,col);
        engRef.current.emitP(wx,wy,wz,col,30,vel);
      }
      tRef.current.set(id,{midi,freq,sf:m2f(midi-12),x,y,note:NN[midi%12]});
    }
    function noteMove(id: any, x: number, y: number) {
      if(!audRef.current||!tRef.current.has(id))return;
      const p=tRef.current.get(id);
      const sn=SCALES[scRef.current].notes;
      const midi=quantize(Math.round(BM+(x/window.innerWidth)*MR),sn);
      const freq=m2f(midi);
      if(midi!==p.midi){
        try{
          audRef.current.ld.triggerRelease(p.freq,Tone.now());
          audRef.current.sb.triggerRelease(p.sf,Tone.now());
          audRef.current.ld.triggerAttack(freq,Tone.now()+.015,.35+(1-y/window.innerHeight)*.5);
          audRef.current.sb.triggerAttack(m2f(midi-12),Tone.now()+.015,.3);
        }catch{}
        haptic(8);p.midi=midi;p.freq=freq;p.sf=m2f(midi-12);p.note=NN[midi%12];
      }
      try{audRef.current.fi.frequency.rampTo(300+(1-y/window.innerHeight)*5500,.06);}catch{}
      p.x=x;p.y=y;
    }
    function noteOff(id: any) {
      const i=tRef.current.get(id);
      if(i&&audRef.current){
        try{audRef.current.ld.triggerRelease(i.freq,Tone.now());audRef.current.sb.triggerRelease(i.sf,Tone.now());}catch{}
      }
      tRef.current.delete(id);
    }
    const onTS=(e: TouchEvent)=>{e.preventDefault();e.stopPropagation();for(const t of Array.from(e.changedTouches))noteOn(t.identifier,t.clientX,t.clientY);};
    const onTM=(e: TouchEvent)=>{e.preventDefault();e.stopPropagation();for(const t of Array.from(e.changedTouches))noteMove(t.identifier,t.clientX,t.clientY);};
    const onTE=(e: TouchEvent)=>{for(const t of Array.from(e.changedTouches))noteOff(t.identifier);};
    const onMD=(e: MouseEvent)=>noteOn("m",e.clientX,e.clientY);
    const onMM=(e: MouseEvent)=>{if(tRef.current.has("m"))noteMove("m",e.clientX,e.clientY);};
    const onMU=()=>noteOff("m");
    cv.addEventListener("touchstart",onTS,{passive:false});cv.addEventListener("touchmove",onTM,{passive:false});
    cv.addEventListener("touchend",onTE,{passive:false});cv.addEventListener("touchcancel",onTE,{passive:false});
    cv.addEventListener("mousedown",onMD);cv.addEventListener("mousemove",onMM);
    cv.addEventListener("mouseup",onMU);cv.addEventListener("mouseleave",onMU);
    return()=>{
      cv.removeEventListener("touchstart",onTS);cv.removeEventListener("touchmove",onTM);
      cv.removeEventListener("touchend",onTE);cv.removeEventListener("touchcancel",onTE);
      cv.removeEventListener("mousedown",onMD);cv.removeEventListener("mousemove",onMM);
      cv.removeEventListener("mouseup",onMU);cv.removeEventListener("mouseleave",onMU);
    };
  },[phase,resetHide]);

  /* Glow elements */
  useEffect(()=>{
    let raf: number;
    function loop(){
      raf=requestAnimationFrame(loop);
      const c=glowCRef.current;if(!c)return;
      const active=tRef.current;
      glowsRef.current.forEach((el: any,id: any)=>{
        if(!active.has(id)){
          el.g.style.opacity="0";
          setTimeout(()=>{try{el.g.remove();}catch{}},300);
          glowsRef.current.delete(id);
        }
      });
      active.forEach((info: any,id: any)=>{
        let entry=glowsRef.current.get(id);
        if(!entry){
          const g=document.createElement("div");
          g.style.cssText="position:fixed;pointer-events:none;z-index:12;transform:translate(-50%,-50%);transition:opacity .25s;text-align:center;";
          const orb=document.createElement("div");
          orb.style.cssText="width:70px;height:70px;border-radius:50%;";
          const lbl=document.createElement("div");
          lbl.style.cssText="font-family:'Orbitron',monospace;font-size:10px;margin-top:4px;letter-spacing:.1em;opacity:.8;";
          g.appendChild(orb);g.appendChild(lbl);c.appendChild(g);
          entry={g,orb,lbl,lastMidi:-1,lastX:-1,lastY:-1};
          glowsRef.current.set(id,entry);
        }
        if(info.x!==entry.lastX||info.y!==entry.lastY){
          entry.g.style.left=info.x+"px";entry.g.style.top=info.y+"px";
          entry.lastX=info.x;entry.lastY=info.y;
        }
        if(info.midi!==entry.lastMidi){
          const hex=nHex(info.midi);
          entry.orb.style.background=`radial-gradient(circle,${hex}55 0%,transparent 70%)`;
          entry.orb.style.boxShadow=`0 0 35px ${hex}88`;
          entry.lbl.style.color=hex;
          entry.lbl.style.textShadow=`0 0 8px ${hex}`;
          entry.lbl.textContent=info.note;
          entry.lastMidi=info.midi;
        }
        entry.g.style.opacity=".85";
      });
    }
    loop();
    return()=>cancelAnimationFrame(raf);
  },[]);

  /* ═══════════════════════════════════════════════
  DJ AUTO-PLAY
  ═══════════════════════════════════════════════ */
  useEffect(()=>{
    const dj=djR.current;
    if(!auto||!audRef.current){
      dj.on=false;
      if(dj.iv){clearInterval(dj.iv);dj.iv=null;}
      try{audRef.current?.pd?.releaseAll();audRef.current?.bs?.releaseAll();audRef.current?.ar?.releaseAll();}catch{}
      setDjSec("");return;
    }
    dj.on=true;dj.si=0;dj.tis=0;dj.tt=0;dj.oct=4;dj.deg=0;dj.cf=.15;dj.ce=.1;
    const sn=()=>SCALES[scRef.current];
    const sec=()=>DJ[dj.si%DJ.length];
    let prog=(PROGS[scRef.current]||PROGS.minor)[0];
    dj.ci=0;dj.motif=genMotif(sn().notes);dj.am=pick(ARPM);dj.as=0;

    function secRhy(s: any){return s.d<.3?RHY.sparse:s.d<.5?RHY.quarter:s.d<.7?pick([RHY.syncopated,RHY.quarter]):s.d<.85?RHY.driving:pick([RHY.dense,RHY.driving]);}
    function secBass(s: any){return s.e<.4?BASS.whole:s.e<.7?BASS.octave:BASS.bounce;}
    let rhy=secRhy(sec());dj.ri=0;let bRhy=secBass(sec());dj.bi=0;

    function transition(){
      const s=sec();setDjSec(s.name);rhy=secRhy(s);dj.ri=0;bRhy=secBass(s);dj.bi=0;dj.tf=s.ft;dj.te=s.e;dj.am=pick(ARPM);dj.as=0;
      try{
        const [at,dc,su,rl]=s.adsr;const [mi,hm,_dt,sp]=s.mod;
        audRef.current.ld.set({envelope:{attack:at,decay:dc,sustain:su,release:rl},modulationIndex:mi,harmonicity:hm,oscillator:{spread:sp}});
        audRef.current.rv.set({wet:s.rv});audRef.current.dl.set({wet:s.dw});
      }catch{}
      const sc2=sn(),m=buildMatrix(sc2.notes);
      switch(s.algo){
        case"motif":dj.phrase=[...dj.motif];break;
        case"sequence":dj.phrase=devMotif(dj.motif,"sequence",sc2.notes.length);break;
        case"develop":dj.phrase=devMotif(dj.motif,pick(["transpose","invert","ornament"]),sc2.notes.length);break;
        case"fragment":dj.phrase=devMotif(dj.motif,"fragment",sc2.notes.length);break;
        case"climax":dj.phrase=[...devMotif(dj.motif,"ornament",sc2.notes.length),...devMotif(dj.motif,"transpose",sc2.notes.length)];break;
        default:dj.phrase=[];
      }
      dj.pp=0;
      if(dj.si%3===0){const ps=PROGS[scRef.current]||PROGS.minor;prog=pick(ps);dj.ci=0;}
    }
    transition();setDjSec(sec().name);

    dj.iv=setInterval(()=>{
      if(!audRef.current||!dj.on)return;
      const s=sec(),sc2=sn(),notes=sc2.notes,chords=sc2.chords,matrix=buildMatrix(notes);
      dj.tt++;dj.tis++;dj.ce+=(dj.te-dj.ce)*.06;dj.cf+=(dj.tf-dj.cf)*.04;const E=dj.ce;
      if(s.sweep){dj.cf=lerp(s.ft*.3,s.ft,Math.min(dj.tis/(s.bars*4),1));}
      try{audRef.current.fi.frequency.rampTo(200+dj.cf*5800,.15);}catch{}
      if(dj.tis>=s.bars*4){dj.tis=0;dj.si++;transition();return;}
      dj.ct++;if(dj.ct>=4){
        dj.ct=0;dj.ci=(dj.ci+1)%prog.length;dj.ac=chords[prog[dj.ci]%chords.length]||[];
        if(s.l.pd>0){
          try{
            audRef.current.pd.releaseAll(Tone.now());
            audRef.current.pd.triggerAttack(dj.ac.map((n: number)=>m2f(48+n)),Tone.now(),.1+E*.15*s.l.pd);
            audRef.current.pf.frequency.rampTo(400+E*2500,.5);
          }catch{}
        }
        if(dj.tt%8===0){
          try{
            const rn=notes[prog[dj.ci]%notes.length];
            audRef.current.dn.releaseAll(Tone.now()+.1);
            audRef.current.dn.triggerAttack([m2f(36+rn),m2f(36+rn+7)],Tone.now()+.12);
            audRef.current.df.frequency.rampTo(300+E*600,1);
          }catch{}
        }
      }

      const rC=rhy[dj.ri%rhy.length];dj.ri++;const durS=rC[0]*.14;

      // Melody
      if(s.l.ml>0&&dj.phrase.length>0){
        const rP=E<.2?.5:E<.4?.2:.05;
        if(Math.random()>rP){
          let di: number;
          if(dj.pp<dj.phrase.length){di=dj.phrase[dj.pp];dj.pp++;}
          else{di=wPick(matrix[dj.deg]);dj.deg=di;}
          dj.oct=E>.6?5:4;
          const midi=dj.oct*12+notes[di%notes.length],freq=m2f(midi),vel=Math.min((.1+E*.7)*rC[1]*s.l.ml,1);
          try{
            audRef.current.ld.triggerAttackRelease(freq,durS*.85,Tone.now(),vel);
            audRef.current.sb.triggerAttackRelease(m2f(midi-12),durS*.85,Tone.now(),vel*.5);
          }catch{}
          if(E>.7)haptic([15,30,15]);
          if(engRef.current){
            const fx=((midi-BM)/MR)*window.innerWidth,fy=(1-E)*window.innerHeight;
            const [wx,wy,wz]=engRef.current.s2w(fx,fy);
            engRef.current.addRipple(wx,wy,wz,nColor(midi));
            engRef.current.emitP(wx,wy,wz,nColor(midi),Math.floor(8+E*22),E);
          }
        }
      }

      // Bass
      if(s.l.bs>0){
        const bC=bRhy[dj.bi%bRhy.length];dj.bi++;
        if(bC[1]>0){
          const bn=notes[prog[dj.ci]%notes.length],bm=36+bn;
          try{audRef.current.bs.triggerAttackRelease(m2f(bm),bC[0]*.14*.9,Tone.now(),Math.min((.2+E*.6)*bC[1]*s.l.bs,1));}catch{}
        }
      }

      // Arp
      if(s.l.ar>0&&dj.ac.length>0&&dj.tt%2===0){
        const an=getArpNote(dj.ac,dj.as,dj.am);dj.as++;
        try{audRef.current.ar.triggerAttackRelease(m2f(60+an),.14*.7,Tone.now(),Math.min((.15+E*.4)*s.l.ar,1));}catch{}
        if(engRef.current){
          const [wx,wy,wz]=engRef.current.s2w(Math.random()*window.innerWidth,.3*window.innerHeight);
          engRef.current.emitP(wx,wy,wz,nColor(60+an),6,.3);
        }
      }

      // Counter
      if(s.l.ct>0&&dj.tt%6===3){
        const cD=wPick(matrix[dj.deg]),cM=60+notes[cD%notes.length];
        try{audRef.current.ld.triggerAttackRelease(m2f(cM),.14*.6,Tone.now()+.05,Math.min((.1+E*.35)*s.l.ct,1));}catch{}
      }

      if(s.riser){dj.rf=lerp(200,2000,dj.tis/(s.bars*4));try{audRef.current.af.frequency.rampTo(dj.rf,.1);}catch{}}
    },140);

    return()=>{if(djR.current.iv){clearInterval(djR.current.iv);djR.current.iv=null;}};
  },[auto]);

  /* ═══════════════════════════════════════════════
  UI
  ═══════════════════════════════════════════════ */
  const chScale = useCallback((ns: string)=>{
    setScale(ns);flU.current=1;setFlash(SCALES[ns].label);setTimeout(()=>setFlash(""),1400);
  },[]);
  const nxS = useCallback(()=>{const i=SO.indexOf(scale);chScale(SO[(i+1)%SO.length]);},[scale,chScale]);
  const pvS = useCallback(()=>{const i=SO.indexOf(scale);chScale(SO[(i-1+SO.length)%SO.length]);},[scale,chScale]);

  const gl: React.CSSProperties = {
    background:"rgba(255,255,255,.04)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)" as any,
    border:"1px solid rgba(255,255,255,.08)",boxShadow:"0 4px 30px rgba(0,0,0,.3)",
    touchAction:"none",WebkitTouchCallout:"none" as any,userSelect:"none",WebkitUserSelect:"none" as any,
    cursor:"pointer",transition:"all .3s ease-out"
  };

  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",background:"#000008",touchAction:"none"}}>
      <canvas ref={cvRef} style={{position:"fixed",inset:0,zIndex:1,touchAction:"none"}} />
      <div ref={glowCRef} style={{position:"fixed",inset:0,zIndex:12,pointerEvents:"none"}} />

      {phase==="splash" && (
        <div onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();handleStart();}}
             onClick={(e)=>{e.preventDefault();e.stopPropagation();handleStart();}}
             style={{position:"fixed",inset:0,zIndex:100,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.6)",backdropFilter:"blur(4px)",cursor:"pointer",touchAction:"none"}}>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:"clamp(28px,6vw,56px)",fontWeight:900,letterSpacing:".2em",background:"linear-gradient(90deg,#00f0ff,#ff00e6,#ffee00,#00ff88)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"300% 100%",animation:"gs 4s ease infinite",marginBottom:32,textAlign:"center"}}>
            COSMIC SYNTH
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{fontFamily:"'Raleway',sans-serif",fontSize:"clamp(11px,2vw,15px)",fontWeight:200,letterSpacing:".25em",color:"rgba(255,255,255,.45)",animation:"pl 2.5s ease-in-out infinite"}}>
              tap to enter
            </div>
            <div style={{fontFamily:"'Raleway',sans-serif",fontSize:"clamp(9px,1.5vw,12px)",fontWeight:200,letterSpacing:".35em",color:"rgba(255,255,255,.25)"}}>
              the cosmos
            </div>
          </div>
        </div>
      )}

      {phase==="play" && (
        <>
          <div style={{position:"fixed",top:20,left:0,right:0,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",pointerEvents:"none",opacity:showTitle?1:0,transition:"opacity .8s ease-out"}}>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"clamp(11px,2vw,16px)",fontWeight:400,letterSpacing:".3em",background:"linear-gradient(90deg,#00f0ff,#ff00e6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>
              COSMIC SYNTH
            </div>
            <div style={{fontFamily:"'Raleway',sans-serif",fontSize:9,fontWeight:200,letterSpacing:".2em",color:"rgba(255,255,255,.25)"}}>
              Touch to create
            </div>
          </div>

          {!hintGone && (
            <div style={{position:"fixed",bottom:"18%",left:0,right:0,zIndex:10,textAlign:"center",fontFamily:"'Raleway',sans-serif",fontSize:"clamp(10px,1.8vw,13px)",fontWeight:200,letterSpacing:".2em",color:"rgba(255,255,255,.2)",pointerEvents:"none",animation:"pl 3s ease-in-out infinite"}}>
              Touch · Slide · Hold
            </div>
          )}

          <div style={{position:"fixed",bottom:20,left:20,zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
            <div onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();setAuto(p=>!p);}}
                 onClick={(e)=>{e.preventDefault();e.stopPropagation();setAuto(p=>!p);}}
                 style={{...gl,width:46,height:46,borderRadius:"50%",fontFamily:"'Orbitron',monospace",fontSize:9,fontWeight:400,letterSpacing:".12em",display:"flex",alignItems:"center",justifyContent:"center",
                   color:auto?"#00f0ff":"rgba(255,255,255,.45)",
                   background:auto?"rgba(0,240,255,.1)":"rgba(255,255,255,.04)",
                   borderColor:auto?"rgba(0,240,255,.4)":"rgba(255,255,255,.08)",
                   boxShadow:auto?"0 0 25px rgba(0,240,255,.15)":"0 4px 30px rgba(0,0,0,.3)"}}>
              AUTO
            </div>
            {auto && djSec && (
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:8,letterSpacing:".15em",color:"rgba(0,240,255,.5)",textAlign:"center"}}>
                {djSec}
              </div>
            )}
          </div>

          <div style={{position:"fixed",bottom:20,right:20,zIndex:10,display:"flex",alignItems:"center",gap:10}}>
            <div onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();pvS();}}
                 onClick={(e)=>{e.preventDefault();e.stopPropagation();pvS();}}
                 style={{...gl,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Raleway',sans-serif",fontSize:14,color:"rgba(255,255,255,.35)"}}>
              ‹
            </div>
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:"clamp(10px,1.8vw,13px)",fontWeight:400,letterSpacing:".2em",color:"rgba(255,255,255,.5)",minWidth:60,textAlign:"center"}}>
              {SCALES[scale].label}
            </div>
            <div onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();nxS();}}
                 onClick={(e)=>{e.preventDefault();e.stopPropagation();nxS();}}
                 style={{...gl,width:32,height:32,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Raleway',sans-serif",fontSize:14,color:"rgba(255,255,255,.35)"}}>
              ›
            </div>
          </div>

          {flash && (
            <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:15,fontFamily:"'Orbitron',monospace",fontSize:"clamp(28px,6vw,52px)",fontWeight:900,letterSpacing:".3em",background:"linear-gradient(90deg,#00f0ff,#ff00e6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",opacity:.7,pointerEvents:"none",animation:"pl 1.4s ease-out forwards"}}>
              {flash}
            </div>
          )}

          {gyroPrompt && (
            <div onTouchStart={(e)=>{e.preventDefault();e.stopPropagation();grantGyro();}}
                 onClick={(e)=>{e.preventDefault();e.stopPropagation();grantGyro();}}
                 style={{...gl,position:"fixed",bottom:70,left:"50%",transform:"translateX(-50%)",zIndex:20,padding:"12px 24px",borderRadius:20,fontFamily:"'Raleway',sans-serif",fontSize:11,color:"rgba(0,240,255,.7)",letterSpacing:".1em",textAlign:"center"}}>
              Allow motion for full experience
            </div>
          )}

          {!audioOk && (
            <div style={{position:"fixed",top:60,left:"50%",transform:"translateX(-50%)",zIndex:15,fontFamily:"'Raleway',sans-serif",fontSize:10,color:"rgba(255,100,100,.5)",letterSpacing:".1em"}}>
              Audio unavailable — visual only
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes gs{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes pl{0%,100%{opacity:.2}50%{opacity:.5}}
        @keyframes rp{0%,100%{transform:scale(.95);opacity:.5}50%{transform:scale(1.05);opacity:.9}}
        @keyframes tw{from{width:0}to{width:clamp(240px,50vw,520px)}}
        @keyframes bk{50%{border-color:transparent}}
      `}</style>
    </div>
  );
}
