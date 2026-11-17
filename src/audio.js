'use strict';

// Áudio sintetizado pelo navegador. O primeiro gesto libera o contexto de áudio.

let audio=null;
let soundOn=true;

let audioUnlocked=false,soundVolume=.7;const voices=new Set();
function unlockAudio(){if(audioUnlocked)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume?.();audioUnlocked=true;}catch(_){}}
function stopSounds(){for(const osc of voices){try{osc.stop();}catch(_){}}voices.clear();}
function sound(freq=180,dur=.08,type='square',volume=.045){if(!soundOn||!audioUnlocked||voices.size>=8)return;try{const now=audio.currentTime;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.6),now+dur);gain.gain.setValueAtTime(volume*soundVolume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.connect(gain);gain.connect(audio.destination);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+dur+.01)}catch(_){}}

// Keep outgoing tracks alive until their fade has finished.
const soundtrack = new Map();
let previousMusicFrame;
function mixSoundtrack(now){
 const dt=Math.min(.05,(now-(previousMusicFrame??now))/1000);
 previousMusicFrame=now;
 requestAnimationFrame(mixSoundtrack);
 if(!audioUnlocked)return;

 const ultimateActive=game?.f?.some(fighter=>fighter.action==='ultimate');
 const scene=screen==='fight'?(ultimateActive?'ultimate':'fight'):
  screen==='results'?'victory':screen==='select'?'select':
  screen==='pause'?null:'menu';
 if(scene&&!soundtrack.has(scene)){
  const track=new Audio('assets/music/'+scene+'.ogg');
  track.loop=scene!=='victory';
  track.volume=0;
  soundtrack.set(scene,{track,level:0,starting:false});
 }
 for(const [name,entry] of soundtrack){
  const {track}=entry;
  const selected=name===scene;
  const wanted=selected&&soundOn&&!document.hidden;
  if(wanted&&track.paused&&!track.ended&&!entry.starting){
   entry.starting=true;
   track.play().catch(()=>{}).finally(()=>{entry.starting=false;});
  }
  const next=wanted&&!track.paused?1:0;
  // Cue the incoming track before lowering the outgoing one.
  const incoming=scene&&soundtrack.get(scene)?.track;
  if(!selected&&soundOn&&!document.hidden&&incoming?.paused&&!incoming.ended&&!incoming.error)continue;
  const speed=scene==='ultimate'||name==='ultimate'?3.5:1.25;
  entry.level+=Math.sign(next-entry.level)*Math.min(Math.abs(next-entry.level),dt*speed);
  track.volume=Math.sin(entry.level*Math.PI/2)*Math.min(1,Math.max(0,soundVolume))*.55;
  if(!wanted&&entry.level===0){
   track.pause();
   if(name==='ultimate'||name==='victory'){
    if(!selected&&screen!=='pause'){track.currentTime=0;soundtrack.delete(name);}
   }
  }
 }
}
requestAnimationFrame(mixSoundtrack);
