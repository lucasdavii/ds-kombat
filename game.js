'use strict';

// Ponto de entrada. O index.html carrega os scripts de src/ antes daqui.
setupMobile();
showHome();
requestAnimationFrame(gameLoop);

// Interface usada pela página de revisão e pelo treino.
window.RuaFighters={FIGHTERS,get state(){return screen},get game(){return game},selectMode,showHome,startMatch,choose:(a,b)=>{selected=[a,b];startMatch();},debugHit:(amount=10)=>{if(game)game.f[1].hp=Math.max(0,game.f[1].hp-amount);}};
