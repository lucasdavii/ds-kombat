'use strict';

// Áudio sintetizado pelo navegador. O primeiro gesto libera o contexto de áudio.

let audio=null;
let soundOn=true;

let audioUnlocked=false,soundVolume=.7;const voices=new Set();
function unlockAudio(){if(audioUnlocked)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();audio.resume?.();audioUnlocked=true;}catch(_){}}
function stopSounds(){for(const osc of voices){try{osc.stop();}catch(_){}}voices.clear();}
function sound(freq=180,dur=.08,type='square',volume=.045){if(!soundOn||!audioUnlocked||voices.size>=8)return;try{const now=audio.currentTime;const osc=audio.createOscillator(),gain=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.6),now+dur);gain.gain.setValueAtTime(volume*soundVolume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+dur);osc.connect(gain);gain.connect(audio.destination);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+dur+.01)}catch(_){}}
