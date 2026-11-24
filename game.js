'use strict';
(()=>{
const $=id=>document.getElementById(id),app=$('app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeHex=c=>/^#[0-9a-fA-F]{3,8}$/.test(String(c||''))?c:'#8a96a8';
const safeImgUrl=u=>{
if(typeof u!=='string')return '';
const t=u.trim();
if(/^data:image\/(png|jpeg|jpg|webp|gif);base64,[a-zA-Z0-9+/=]+$/i.test(t))return t;
if(/^(assets\/)?[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|gif)$/i.test(t)&&!t.includes('..'))return t;
try{const p=new URL(t,location.origin);if(p.protocol==='https:')return p.href}catch(e){}
return ''};
const isUUID=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const clampInt=(v,min,max,def)=>{const n=Number(v);return Number.isFinite(n)?Math.max(min,Math.min(max,Math.trunc(n))):def};
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),W=ms=>new Promise(r=>setTimeout(r,ms));
/* Personnages : r = rôle, nom = nom du combattant, img = ton dessin (data:URI sécurisé ou chemin) */
const H=Object.freeze([
{r:'Archer',nom:'Alaric',e:'🏹',c:'#6a8f3c',sp:14,a:['Flèche vive',16],u:['Pluie de flèches',38],b:['Œil de faucon','crit'],d:['Roulade','dodge']},
{r:'Chevalier',nom:'Eamon',e:'⚔️',c:'#8a96a8',sp:8,a:['Coup d’épée',18],u:['Charge royale',40],b:['Serment','atk'],d:['Rempart','block']},
{r:'Lancier',nom:'Hector',e:'🔱',c:'#a8553a',sp:11,a:['Estoc',17],u:['Charge à la lance',42],b:['Garde haute','atk'],d:['Parade croisée','reflect']},
{r:'Paysan',nom:'Colin',e:'🌾',c:'#9a8a3a',sp:10,a:['Coup de fourche',14],u:['Moisson furieuse',36],b:['Soupe du soir','heal'],d:['Bouclier de charrette','block']},
{r:'Magicien',nom:'Ignis',e:'🔮',c:'#6a4ab0',sp:12,a:['Éclair arcanique',17],u:['Météore',44],b:['Concentration','crit'],d:['Voile magique','absorb']},
{r:'Sage',nom:'Aurélius',e:'📜',c:'#c9b27c',sp:9,a:['Bâton de sagesse',13],u:['Jugement',37],b:['Méditation','heal'],d:['Miroir d’âme','reflect']},
{r:'Marchand',nom:'Gaspard',e:'💰',c:'#b8862a',sp:10,a:['Lancer de bourse',15],u:['Ruine totale',38],b:['Bonne affaire','atk'],d:['Pot-de-vin','absorb']},
{r:'Ninja',nom:'Haku',e:'🥷',c:'#3a3a4a',sp:16,a:['Shuriken',15],u:['Lame des ombres',41],b:['Souffle de l’ombre','crit'],d:['Disparition','dodge']},
{r:'Fléau d’armes',nom:'Gorak',e:'⛓️',c:'#6a6a6a',sp:7,a:['Boulet à chaîne',20],u:['Tempête de fer',46],b:['Fureur','atk'],d:['Chaîne tendue','reflect']},
{r:'Barde',nom:'Fael',e:'🎻',c:'#b0507a',sp:11,a:['Note aiguë',13],u:['Ballade héroïque',36],b:['Hymne de vie','heal'],d:['Chanson apaisante','absorb']}].map(o=>Object.freeze(o)));
const VALID_MOVES=new Set(['a','u','b','d']);
const VALID_GUARDS=Object.freeze({block:'PARADE',reflect:'RIPOSTE',absorb:'ABSORBÉ'});
const BD=Object.freeze({atk:'+40 % de dégâts sur 2 attaques',crit:'la prochaine attaque est critique',heal:'soigne 22 PV'});
const DD=Object.freeze({block:'réduit les dégâts de 60 %',dodge:'1 chance sur 2 d’esquiver',reflect:'réduit de 45 % et renvoie 25 %',absorb:'réduit de 50 % et soigne un peu'});
const AR=Object.freeze([
{n:'La Fosse des Forgerons',id:'forge'},
{n:'Le Cloître des Reliques Brisées',id:'cloitre'},
{n:'La Lice des Brumes d’Orage',id:'lice'}
]);
const PO=[[9.75,3.25],[7.67,2.17],[10.5,4.5],[8,2],[11,5],[7,1.5]];
const clk=h=>{const t=h/12*2*Math.PI;return[50+36*Math.sin(t),52-26*Math.cos(t)]};
const ITM=['🎖️','👑','⚜️'];
let SV={streak:0,best:0,n:0,aura:0,vol:.4,muted:false};
try{
const raw=JSON.parse(localStorage.getItem('joute')||'{}');
if(raw&&typeof raw==='object'&&!Array.isArray(raw)){
SV.streak=clampInt(raw.streak,0,100000,0);
SV.best=clampInt(raw.best,0,100000,0);
SV.n=clampInt(raw.n,0,1000000,0);
SV.aura=raw.aura?1:0;
if(typeof raw.vol==='number'&&Number.isFinite(raw.vol))SV.vol=Math.max(0,Math.min(1,raw.vol));
SV.muted=Boolean(raw.muted);
}}catch(e){}
const sv=()=>{try{localStorage.setItem('joute',JSON.stringify({
streak:clampInt(SV.streak,0,100000,0),
best:clampInt(SV.best,0,100000,0),
n:clampInt(SV.n,0,1000000,0),
aura:SV.aura?1:0,
vol:Math.max(0,Math.min(1,Number(SV.vol)||0)),
muted:Boolean(SV.muted)
}))}catch(e){}};
function art(d){
const img=safeImgUrl(d.img);
if(img)return `<img src="${esc(img)}" alt="${esc(d.nom||d.r)}" referrerpolicy="no-referrer">`;
return `<svg viewBox="0 0 100 120"><ellipse cx="50" cy="112" rx="26" ry="6" fill="#0005"/><rect x="30" y="52" width="40" height="52" rx="14" fill="${safeHex(d.c)}" stroke="#2b1d10" stroke-width="3"/><circle cx="50" cy="34" r="20" fill="#f1d3a8" stroke="#2b1d10" stroke-width="3"/><circle cx="55" cy="33" r="3" fill="#2b1d10"/><circle cx="64" cy="33" r="3" fill="#2b1d10"/><text x="70" y="90" font-size="30">${esc(d.e)}</text></svg>`}
/* Musiques */
let AC,MG,vol=typeof SV.vol=='number'?SV.vol:.4,muted=!!SV.muted,prevVol=vol>.05?vol:.4,MB,cur='',TM,want='',NZ;
const menuTrack=$('menu-bgm');
const defeatTrack=$('defeat-bgm');
const victoryTrack=$('victory-bgm');
const combatTrack=$('combat-bgm');
let defeatTrackFailed=false,victoryTrackFailed=false,combatTrackFailed=false;
if(menuTrack){
menuTrack.addEventListener('error',()=>{
if(!menuTrack.dataset.fallback){menuTrack.dataset.fallback='1';menuTrack.src='Where_the_Mountains_Sleep.mp3';menuTrack.load();if(want=='menu')syncMenuTrack()}});
menuTrack.addEventListener('canplay',()=>{if(want=='menu')syncMenuTrack()});
}
if(defeatTrack){
defeatTrack.addEventListener('error',()=>{
if(!defeatTrack.dataset.fallback){defeatTrack.dataset.fallback='1';defeatTrack.src='defeat-beneath-25s-to-45s.mp3';defeatTrack.load();if(want=='lose')syncDefeatTrack()}
else{defeatTrackFailed=true;if(want=='lose'){cur='';play('lose')}}});
defeatTrack.addEventListener('canplay',()=>{if(want=='lose')syncDefeatTrack()});
}
if(victoryTrack){
victoryTrack.addEventListener('error',()=>{
if(!victoryTrack.dataset.fallback){victoryTrack.dataset.fallback='1';victoryTrack.src='victory-banners-20s.mp3';victoryTrack.load();if(want=='win')syncVictoryTrack()}
else{victoryTrackFailed=true;if(want=='win'){cur='';play('win')}}});
victoryTrack.addEventListener('canplay',()=>{if(want=='win')syncVictoryTrack()});
}
if(combatTrack){
combatTrack.addEventListener('error',()=>{
if(!combatTrack.dataset.fallback){combatTrack.dataset.fallback='1';combatTrack.src='Gloria_In_Armis.mp3';combatTrack.load();if(want=='combat')syncCombatTrack()}
else{combatTrackFailed=true;if(want=='combat'){cur='';play('combat')}}});
combatTrack.addEventListener('canplay',()=>{if(want=='combat')syncCombatTrack()});
}
const effVol=()=>muted?0:vol;
function syncMenuTrack(){
if(!menuTrack)return;
menuTrack.volume=Math.max(0,Math.min(1,effVol()*.9));
menuTrack.muted=muted||vol<=0;
if(want=='menu'){
if(!menuTrack.muted&&menuTrack.paused)menuTrack.play().catch(()=>{});
else if(menuTrack.muted&&!menuTrack.paused)menuTrack.pause()}
else if(!menuTrack.paused){menuTrack.pause()}}
function syncDefeatTrack(){
if(!defeatTrack||defeatTrackFailed)return;
defeatTrack.volume=Math.max(0,Math.min(1,effVol()*.9));
defeatTrack.muted=muted||vol<=0;
if(want=='lose'){
if(!defeatTrack.muted&&defeatTrack.paused){defeatTrack.currentTime=0;defeatTrack.play().catch(()=>{})}
else if(defeatTrack.muted&&!defeatTrack.paused)defeatTrack.pause()}
else if(!defeatTrack.paused){defeatTrack.pause();defeatTrack.currentTime=0}}
function syncVictoryTrack(){
if(!victoryTrack||victoryTrackFailed)return;
victoryTrack.volume=Math.max(0,Math.min(1,effVol()*.9));
victoryTrack.muted=muted||vol<=0;
if(want=='win'){
if(!victoryTrack.muted&&victoryTrack.paused){victoryTrack.currentTime=0;victoryTrack.play().catch(()=>{})}
else if(victoryTrack.muted&&!victoryTrack.paused)victoryTrack.pause()}
else if(!victoryTrack.paused){victoryTrack.pause();victoryTrack.currentTime=0}}
function syncCombatTrack(){
if(!combatTrack||combatTrackFailed)return;
combatTrack.volume=Math.max(0,Math.min(1,effVol()*.9));
combatTrack.muted=muted||vol<=0;
if(want=='combat'){
if(!combatTrack.muted&&combatTrack.paused){combatTrack.play().catch(()=>{})}
else if(combatTrack.muted&&!combatTrack.paused)combatTrack.pause()}
else if(!combatTrack.paused){combatTrack.pause();combatTrack.currentTime=0}}
const SC=[146.83,164.81,174.61,196,220,246.94,261.63,293.66,329.63,349.23,392,440];
const nt=(f,t,d,ty,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.4,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(MB);o.start(t);o.stop(t+d+.05)};
const drum=(t,k)=>{const g=AC.createGain();g.connect(MB);if(k){const o=AC.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);o.start(t);o.stop(t+.25)}else{const x=AC.createBufferSource();x.buffer=NZ;g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);x.connect(g);x.start(t)}};
const TR={
combat:(t,n)=>{const B=[0,0,0,0,2,2,3,3,0,0,0,0,4,4,3,3],M=[7,-1,9,-1,11,9,-1,7,9,-1,7,-1,4,7,-1,2];
for(let k=0;k<16;k++){const u=t+k*.2;if(k%4==0)drum(u,1);if(k%8==4)drum(u,0);if(k%2==0)nt(SC[B[k]]/2,u,.22,'sawtooth',.22);if(M[k]>=0)nt(SC[M[k]],u,.35,'square',.14)}return 3.2},
win:t=>{[[523,0,.15],[523,.2,.15],[523,.4,.15],[659,.6,.3],[784,.9,.4],[1047,1.3,1.8]].forEach(a=>nt(a[0],t+a[1],a[2]+.2,'sawtooth',.25));[261.63,329.63,392].forEach(f=>nt(f,t+1.3,2,'triangle',.3));return 3.5},
lose:t=>{[[440,0],[392,.8],[349.23,1.6],[293.66,2.4]].forEach(a=>nt(a[0],t+a[1],1.6,'triangle',.4));nt(110,t,4,'sine',.35);return 4.5}};
function play(n){want=n;
if(n=='menu'){
cur='menu';clearTimeout(TM);if(MB&&AC)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
syncDefeatTrack();syncVictoryTrack();syncCombatTrack();syncMenuTrack();return}
if(n=='combat'&&combatTrack&&!combatTrackFailed){
cur='combat';clearTimeout(TM);if(MB&&AC)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
syncMenuTrack();syncDefeatTrack();syncVictoryTrack();syncCombatTrack();return}
if(n=='lose'&&defeatTrack&&!defeatTrackFailed){
cur='lose';clearTimeout(TM);if(MB&&AC)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
syncMenuTrack();syncVictoryTrack();syncCombatTrack();syncDefeatTrack();return}
if(n=='win'&&victoryTrack&&!victoryTrackFailed){
cur='win';clearTimeout(TM);if(MB&&AC)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
syncMenuTrack();syncDefeatTrack();syncCombatTrack();syncVictoryTrack();return}
syncMenuTrack();syncDefeatTrack();syncVictoryTrack();syncCombatTrack();
if(!AC||cur==n||!TR[n])return;cur=n;clearTimeout(TM);if(MB)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
MB=AC.createGain();MB.connect(MG);const my=MB;let t=AC.currentTime+.15,k=0;
const run=()=>{if(MB!==my)return;t+=TR[n](t,k++);if(n=='combat')TM=setTimeout(run,Math.max(100,(t-AC.currentTime-1.5)*1000))};run()}
function music(){
syncMenuTrack();syncDefeatTrack();syncVictoryTrack();syncCombatTrack();
if(AC){if(AC.state=='suspended')AC.resume();return}
try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
MG=AC.createGain();MG.gain.value=effVol()*.5;MG.connect(AC.destination);
NZ=AC.createBuffer(1,AC.sampleRate*.2,AC.sampleRate);const D=NZ.getChannelData(0);for(let i=0;i<D.length;i++)D[i]=Math.random()*2-1;
cur='';play(want||'menu')}
addEventListener('pointerdown',music,{once:true});addEventListener('keydown',music,{once:true});
const vMute=$('vol-mute'),vDown=$('vol-down'),vUp=$('vol-up'),vSld=$('vol-slider'),vPct=$('vol-pct');
function setV(v,keepMute){
vol=Math.max(0,Math.min(1,Math.round(v*100)/100));
if(!keepMute)muted=vol===0;
if(vol>0)prevVol=vol;
const ev=effVol();
if(MG)MG.gain.value=ev*.5;
syncMenuTrack();syncDefeatTrack();syncVictoryTrack();syncCombatTrack();
const pct=Math.round(ev*100);
if(vSld)vSld.value=pct;
if(vPct)vPct.textContent=pct+'%';
if(vMute){vMute.textContent=muted||ev===0?'🔇':ev<.5?'🔉':'🔊';vMute.classList.toggle('muted',muted||ev===0);vMute.setAttribute('aria-label',muted||ev===0?'Réactiver le son':'Couper le son')}
SV.vol=vol;SV.muted=muted;sv()}
function toggleMute(){
if(muted||vol===0){muted=false;setV(prevVol>.05?prevVol:.4,true)}
else{prevVol=vol;muted=true;setV(vol,true)}
music()}
setV(vol,true);
if(vMute)vMute.onclick=e=>{e.stopPropagation();toggleMute()};
if(vDown)vDown.onclick=e=>{e.stopPropagation();muted=false;setV(vol-.1);music()};
if(vUp)vUp.onclick=e=>{e.stopPropagation();muted=false;setV(vol+.1);music()};
if(vSld)vSld.oninput=e=>{e.stopPropagation();muted=false;setV(+e.target.value/100);music()};
/* Écrans */
function menu(){closeMod();leave();play('menu');
const st=clampInt(SV.streak,0,100000,0),bs=clampInt(SV.best,0,100000,0);
app.innerHTML=`<h1>Joute Duel</h1><div class="sub">Série : ${st} victoire(s) · Record : ${bs}</div>
<button class="mode" id="b1"><span>⚔️</span><div><b>Combat contre l’IA</b><br><small>Un duel, un seul survivant</small></div></button>
<button class="mode" id="b2"><span>🌐</span><div><b>Combat 1 contre 1 (en ligne)</b><br><small>Affronte un vrai joueur</small></div></button>
<div id="msg"></div>
<button class="mode" id="b3"><span>🛡️</span><div><b>Personnages</b><br><small>Voir les 10 combattants</small></div></button>
<div class="rules"><b>Règles</b><ul><li>Combat au tour par tour (20 secondes pour agir)</li><li>Pas de potion</li><li>Pas de fuite possible</li><li>Il faudra faire les bons choix</li></ul></div>`;
$('b1').onclick=()=>chars(1);$('b3').onclick=()=>chars(0);
$('b2').onclick=()=>chars(2)}
function chars(pickMode){closeMod();
app.innerHTML=`<h1 style="font-size:1.8rem;margin-top:44px">${pickMode?'Choisis ton combattant':'Les combattants'}</h1><div class="grid">${H.map((d,i)=>`<button class="card" data-i="${i}">${art(d)}<b>${esc(d.nom||d.r)}</b><small>${esc(d.r)}</small></button>`).join('')}</div><button id="bk">Retour</button>`;
$('bk').onclick=menu;
app.querySelectorAll('.card').forEach(c=>c.onclick=()=>{const i=clampInt(c.dataset.i,0,H.length-1,-1);if(i<0)return;
if(pickMode==2)return online(i);if(pickMode)return fight(i);
openMod(i)})}
function openMod(i){const d=H[clampInt(i,0,H.length-1,0)];closeMod();const m=document.createElement('div');m.className='mo';m.id='mo';m.onclick=e=>{if(e.target==m)closeMod()};
m.innerHTML=`<div class="mw" role="dialog" aria-modal="true" aria-label="${esc(d.nom||d.r)}"><button class="x" aria-label="Fermer">✕</button>${art(d)}<h2>${esc(d.nom||d.r)}</h2><div style="text-align:center"><small>${esc(d.r)}</small></div><div class="mv"><b>Attaque</b> : ${esc(d.a[0])} (${d.a[1]})</div><div class="mv"><b>Ultime ×3</b> : ${esc(d.u[0])} (${d.u[1]})</div><div class="mv"><b>Renforcement</b> : ${esc(d.b[0])}, ${esc(BD[d.b[1]])}</div><div class="mv"><b>Défense</b> : ${esc(d.d[0])}, ${esc(DD[d.d[1]])}</div></div>`;
document.body.appendChild(m);const x=m.querySelector('.x');x.onclick=closeMod;x.focus()}
const closeMod=()=>{const m=$('mo');if(m)m.remove()};
addEventListener('keydown',e=>{if(e.key=='Escape')closeMod()});
let F;
const mk=i=>({i:clampInt(i,0,H.length-1,0),hp:100,ult:3,ab:0,cr:0,g:0});
const S=s=>s?F.B:F.A;
function fight(pi){const cpi=clampInt(pi,0,H.length-1,0),n=clampInt(SV.n,0,1000000,0),ar=AR[Math.floor(n/3)%3];begin(cpi,R(0,9),ar,PO[n%6],`Arène : ${ar.n} · Combat n°${n+1}`,0)}
function begin(pi,e,ar,po,hdr,on){
const cpi=clampInt(pi,0,H.length-1,0),ce=clampInt(e,0,H.length-1,0);
F={pi:cpi,ar,P:[clk(po[0]),clk(po[1])],A:mk(cpi),B:mk(ce),busy:0,over:0,on};
const st=clampInt(SV.streak,0,100000,0),im=Math.min(3,Math.floor(st/10)),au=SV.aura||st>=40;
if(st>=40)SV.aura=1;
const av=s=>{const X=S(s),d=H[X.i],fl=F.P[s][0]>F.P[1-s][0];
return `<div class="av ${fl?'f':''} ${s==0&&au?'aura':''}" id="v${s}" style="left:${F.P[s][0]}%;top:${F.P[s][1]}%">${s==0&&im?`<div class="itm">${ITM.slice(0,im).join('')}</div>`:''}<div class="in">${art(d)}</div></div>`};
app.innerHTML=`<small>${esc(hdr)}${st?' · Série '+st:''}</small>
<div class="hud">${[0,1].map(s=>`<div><b>${esc(H[S(s).i].nom||H[S(s).i].r)}</b> <small>(${esc(H[S(s).i].r)})</small><div class="hb"><i id="h${s}"></i></div></div>`).join('')}</div>
<div class="arena" id="ar"><canvas class="arena-canvas" id="arena-canvas" aria-hidden="true"></canvas><div class="arena-postfx" id="arena-postfx"></div><div class="floor"></div>${av(0)}${av(1)}</div>
<div id="tm"><i></i></div><div id="log"></div><div id="act" class="grid"></div>`;
sv();
if(window.jouteArena)window.jouteArena.destroy();
window.jouteArena=new RealisticMedievalArenas($('arena-canvas'),$('arena-postfx'));
window.jouteArena.showGroundAnchors=false;
window.jouteArena.setArena(ar.id);
window.jouteArena.start();
play('combat');say('Le duel commence !');if(!on)turn()}
const say=t=>{const l=$('log');if(!l)return;const lines=Array.from(l.children).slice(0,3);const div=document.createElement('div');div.textContent=String(t??'');l.replaceChildren(div,...lines)};
const hud=()=>[0,1].forEach(s=>{const h=$('h'+s);if(h)h.style.width=Math.max(0,Math.min(100,Number(S(s).hp)||0))+'%'});
function turn(){
F.busy=0;const d=H[F.A.i];
$('act').innerHTML=[['a',d.a[0],'Attaque, '+d.a[1]+' dégâts'],['u',d.u[0],'Ultime, '+d.u[1]+' dégâts (reste '+F.A.ult+')'],['b',d.b[0],BD[d.b[1]]],['d',d.d[0],DD[d.d[1]]]].map(m=>`<button data-m="${m[0]}" ${m[0]=='u'&&!F.A.ult?'disabled':''}><b>${esc(m[1])}</b><br><small>${esc(m[2])}</small></button>`).join('');
$('act').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(VALID_MOVES.has(b.dataset.m))go(b.dataset.m)});
let t=20;const bar=$('tm').firstChild;bar.style.width='100%';
clearInterval(F.iv);F.iv=setInterval(()=>{t-=.1;bar.style.width=Math.max(0,t/20*100)+'%';if(t<=0){clearInterval(F.iv);go(Math.random()<.5?'a':'d',1)}},100)}
function aiPick(){const X=F.B,o=['a','a','b','d'];if(X.ult>0)o.push('u','u');if(X.hp<45)o.push('d','d');return o[R(0,o.length-1)]}
function pop(s,txt,cls){const e=$('v'+s);if(!e)return;const sp=document.createElement('span');sp.className='fl '+(cls||'');sp.textContent=String(txt??'');e.appendChild(sp);setTimeout(()=>sp.remove(),3000)}
function vfx(s,k){const a=$('ar');if(!a||!['n','u','p','m'].includes(k))return;a.insertAdjacentHTML('beforeend',`<div class="vfx v${k}" style="left:${F.P[s][0]}%;top:${F.P[s][1]}%"></div>`);const n=a.lastChild;setTimeout(()=>n.remove(),2000)}
async function go(ma,auto){
if(F.busy||!VALID_MOVES.has(ma))return;if(ma=='u'&&F.A.ult<=0)return;
F.busy=1;clearInterval(F.iv);$('act').innerHTML='';
if(auto)say('Temps écoulé : action automatique.');
const mv=[ma,aiPick()];
for(const s of[0,1]){const X=S(s),d=H[X.i],m=mv[s];
if(m=='b'){const k=d.b[1];if(k=='atk')X.ab=2;if(k=='crit')X.cr=1;if(k=='heal')X.hp=Math.min(100,X.hp+22);say(`${d.nom||d.r} : ${d.b[0]} !`);pop(s,'RENFORCÉ','buf');hud();await W(1500)}
if(m=='d'){X.g=d.d[1];say(`${d.nom||d.r} : ${d.d[0]}.`);pop(s,'GARDE','par');await W(1400)}}
const ord=[0,1].filter(s=>mv[s]=='a'||mv[s]=='u').sort((x,y)=>H[S(y).i].sp-H[S(x).i].sp+Math.random()-.5);
for(const s of ord){if(F.A.hp<=0||F.B.hp<=0)break;await atk(s,mv[s])}
F.A.g=F.B.g=0;
if(F.A.hp<=0||F.B.hp<=0)return finish();
await W(500);turn()}
async function atk(s,m){
const X=S(s),Y=S(1-s),d=H[X.i],ult=m=='u',mv=ult?d.u:d.a,t=1-s;
if(ult){if(X.ult<=0)return;X.ult--;const a=$('ar');a.insertAdjacentHTML('beforeend',`<div class="flash"></div><div class="ban" style="--c:${safeHex(d.c)}">${esc(mv[0])}</div>`);const els=[...a.querySelectorAll('.flash,.ban')];setTimeout(()=>els.forEach(e=>e.remove()),2000);await W(1500)}
else say(`${d.nom||d.r} : ${mv[0]}`);
const av=$('v'+s);av.classList.add('l'+s);setTimeout(()=>av.classList.remove('l'+s),700);await W(450);
if(Math.random()<(ult?.12:.1)){vfx(t,'m');pop(t,'RATÉ','gry');say(`${mv[0]} : raté !`);await W(1700);return}
const crit=X.cr||Math.random()<.08;X.cr=0;
let dmg=mv[1]*(.9+Math.random()*.2)*(X.ab>0?1.4:1)*(crit?1.6:1);if(X.ab>0)X.ab--;
let par='',g=Y.g;
if(g=='dodge'&&Math.random()<.5){vfx(t,'p');pop(t,'ESQUIVE','par');say(`${H[Y.i].nom||H[Y.i].r} esquive !`);await W(1900);return}
if(g=='block'){dmg*=.4;par='PARADE'}
else if(g=='reflect'){dmg*=.55;X.hp=Math.max(0,X.hp-Math.round(dmg*.25));par='RIPOSTE'}
else if(g=='absorb'){dmg*=.5;Y.hp=Math.min(100,Y.hp+4);par='ABSORBÉ'}
dmg=Math.max(1,Math.round(dmg));Y.hp=Math.max(0,Y.hp-dmg);
vfx(t,par?'p':ult?'u':'n');
pop(t,par?par+' −'+dmg:crit?'CRITIQUE −'+dmg:'−'+dmg,par?'par':crit?'crit':'');
say(`${mv[0]} : −${dmg}${crit?' (critique)':''}${par?' ('+par.toLowerCase()+')':''}`);
if(crit||ult){const a=$('ar');a.classList.add('shake');setTimeout(()=>a.classList.remove('shake'),600)}
await W(crit||ult||par?2200:1500);hud();await W(700)}
function finish(){
hud();if(OM)OM.done=1;clearInterval(F.iv);const win=F.B.hp<=0&&F.A.hp>0,draw=F.A.hp<=0&&F.B.hp<=0;let msg;
if(draw)msg='Égalité : personne ne tombe, la série est conservée.';
else if(win){SV.streak=(SV.streak||0)+1;SV.best=Math.max(SV.best||0,SV.streak);SV.n=(SV.n||0)+1;
msg=`Victoire ! Série : ${SV.streak}.`;
if(SV.streak%10==0)msg+=SV.streak>=40?' Bulle d’aura bleue permanente !':' Nouvel objet obtenu !';
if(SV.streak>=40)SV.aura=1}
else{msg=`Défaite… ta série de ${SV.streak||0} victoire(s) s’arrête.`;SV.streak=0;SV.n=(SV.n||0)+1}
sv();say(msg);
if(!draw){const w=$('v'+(win?0:1)),l=$('v'+(win?1:0));w.classList.add('win');l.classList.add('dead');
for(let i=0;i<6;i++)w.insertAdjacentHTML('beforeend',`<span class="spk" style="left:${R(0,90)}px;top:${R(0,90)}px;animation-delay:${i*.23}s">✨</span>`);
$('ar').insertAdjacentHTML('beforeend',`<div class="ban" style="--c:${win?'#d9a441':'#555'}">${win?'VICTOIRE !':'DÉFAITE'}</div>`)}
play(draw?'menu':win?'win':'lose');
$('act').innerHTML=`<button class="full" id="nx">Combat suivant</button><button class="full" id="mn">Retour au menu</button>`;
$('nx').onclick=()=>F.on?online(F.pi):fight(F.pi);$('mn').onclick=menu}
/* Mode en ligne (Supabase : parties arbitrées par le serveur) */
const SBURL='https://bmwqyymidcnqpiwqvfex.supabase.co',SBKEY='sb_publishable_N4h4L5krFIcGYKoHyptvAA_xrFny1ut';
let SB=null,ME=null,OM=null,poll=null,chn=null,onlineReqId=0,lastTickTs=0;
const sbc=()=>{if(!SB&&window.supabase)SB=window.supabase.createClient(SBURL,SBKEY);return SB};
function leave(){onlineReqId++;if(window.jouteArena){window.jouteArena.destroy();window.jouteArena=null}clearInterval(poll);poll=null;if(chn&&SB)SB.removeChannel(chn);chn=null;OM=null;if(F)clearInterval(F.iv)}
function waitScr(t){app.innerHTML=`<h1 style="font-size:1.8rem;margin-top:44px">En ligne</h1><div class="det" id="ol">${esc(t)}</div><button id="bk">Annuler</button>`;$('bk').onclick=menu}
const btns=()=>{const d=H[F.A.i];return [['a',d.a[0],'Attaque, '+d.a[1]+' dégâts'],['u',d.u[0],'Ultime, '+d.u[1]+' dégâts (reste '+F.A.ult+')'],['b',d.b[0],BD[d.b[1]]],['d',d.d[0],DD[d.d[1]]]].map(m=>`<button data-m="${m[0]}" ${m[0]=='u'&&!F.A.ult?'disabled':''}><b>${esc(m[1])}</b><br><small>${esc(m[2])}</small></button>`).join('')};
async function online(ci){
const charIdx=clampInt(ci,0,H.length-1,-1);if(charIdx<0)return;
leave();closeMod();const reqId=++onlineReqId;
const sb=sbc();if(!sb)return waitScr('Serveur injoignable.');
waitScr('Connexion…');
let {data:{session}}=await sb.auth.getSession();
if(reqId!==onlineReqId)return;
if(!session){const r=await sb.auth.signInAnonymously();if(reqId!==onlineReqId)return;if(r.error)return waitScr('Connexion refusée : '+(r.error.message||'erreur inconnue'));session=r.data.session}
if(!session||!session.user||!isUUID(session.user.id))return waitScr('Session invalide.');
ME=session.user.id;
const {data:mid,error}=await sb.rpc('find_match',{p_char:charIdx});
if(reqId!==onlineReqId)return;
if(error)return waitScr('Erreur : '+(error.message||'impossible de trouver une partie'));
if(!isUUID(mid))return waitScr('Identifiant de partie invalide.');
OM={id:mid,ci:charIdx,turn:0,busy:0,q:[],done:0,dl:0};waitScr('Recherche d’un adversaire…');
chn=sb.channel('m'+mid).on('postgres_changes',{event:'*',schema:'public',table:'matches',filter:'id=eq.'+mid},p=>{if(p&&p.new)feed(p.new)}).subscribe();
const get=async()=>{if(!OM||reqId!==onlineReqId)return;const {data}=await sb.from('matches').select('*').eq('id',mid).maybeSingle();if(data){feed(data);const now=Date.now();if(data.status=='active'&&now>new Date(data.deadline).getTime()&&now-lastTickTs>2500){lastTickTs=now;sb.rpc('tick',{p_match:mid})}}};
poll=setInterval(get,2000);get()}
async function feed(r){if(!OM||!r||r.id!==OM.id)return;OM.q.push(r);if(OM.busy)return;OM.busy=1;
try{while(OM&&OM.q.length)await apply(OM.q.shift())}catch(e){}finally{if(OM)OM.busy=0}}
const syncF=(r,me)=>{F.A.hp=clampInt(r['hp'+me],0,100,F.A.hp);F.B.hp=clampInt(r['hp'+(3-me)],0,100,F.B.hp);F.A.ult=clampInt(r['ult'+me],0,3,F.A.ult);F.B.ult=clampInt(r['ult'+(3-me)],0,3,F.B.ult)};
async function apply(r){
if(!r||r.status=='waiting'||!OM)return;
if(r.p1!==ME&&r.p2!==ME)return;
const me=r.p1===ME?1:2,op=3-me;OM.dl=new Date(r.deadline).getTime()||Date.now();
const turnNum=clampInt(r.turn,0,10000,0);
if(!F||!F.on||F.mid!==r.id){
const h=[...String(r.id)].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)>>>0,ar=AR[h%3];
begin(clampInt(r['c'+me],0,H.length-1,0),clampInt(r['c'+op],0,H.length-1,0),ar,PO[(h>>3)%6],`Arène : ${ar.n} · En ligne`,1);F.mid=r.id;OM.turn=turnNum;syncF(r,me);hud();
if(r.status=='done'){OM.done=1;return finish()}return onlineTurn()}
if(OM.done)return;
if(turnNum>OM.turn||r.status=='done'){await playLog(r,me);OM.turn=turnNum;syncF(r,me);hud();
if(r.status=='done'){OM.done=1;return finish()}onlineTurn()}}
function onlineTurn(){
F.busy=0;$('act').innerHTML=btns();
$('act').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(VALID_MOVES.has(b.dataset.m))osend(b.dataset.m)});
const bar=$('tm').firstChild;clearInterval(F.iv);
F.iv=setInterval(()=>{const t=Math.max(0,(OM.dl-Date.now())/1000-3);bar.style.width=Math.min(100,t/20*100)+'%'},100)}
async function osend(m){if(F.busy||!OM||!VALID_MOVES.has(m))return;if(m=='u'&&F.A.ult<=0)return;
F.busy=1;$('act').innerHTML='<small class="full">En attente de l’adversaire…</small>';
const {error}=await SB.rpc('submit_move',{p_match:OM.id,p_move:m});
if(error){say('Coup refusé : '+(error.message||'action rejetée'));onlineTurn()}}
async function playLog(r,me){
clearInterval(F.iv);$('act').innerHTML='';
const logs=Array.isArray(r.last_log)?r.last_log.slice(0,12):[];
for(const e of logs){if(!e||typeof e!=='object')continue;
const s=(e.s===1||e.s===2)?(e.s===me?0:1):0,t=1-s,d=H[S(s).i];
if(e.e=='buff'){say(`${d.nom||d.r} : ${d.b[0]} !`);pop(s,'RENFORCÉ','buf');await W(1300);continue}
if(e.e=='guard'){say(`${d.nom||d.r} : ${d.d[0]}.`);pop(s,'GARDE','par');await W(1200);continue}
const a=$('ar'),av=$('v'+s);
if(e.e=='ult'){a.insertAdjacentHTML('beforeend',`<div class="flash"></div><div class="ban" style="--c:${safeHex(d.c)}">${esc(d.u[0])}</div>`);const els=[...a.querySelectorAll('.flash,.ban')];setTimeout(()=>els.forEach(x=>x.remove()),2000);await W(1500)}
av.classList.add('l'+s);setTimeout(()=>av.classList.remove('l'+s),700);await W(450);
if(e.e=='miss'){vfx(t,'m');pop(t,'RATÉ','gry');say(`${d.nom||d.r} rate son attaque.`);await W(1700);continue}
if(e.e=='dodge'){vfx(t,'p');pop(t,'ESQUIVE','par');say(`${H[S(t).i].nom||H[S(t).i].r} esquive !`);await W(1900);continue}
const dmgVal=clampInt(e.d,0,999,0);
const par=Object.prototype.hasOwnProperty.call(VALID_GUARDS,e.g)?VALID_GUARDS[e.g]:'';
vfx(t,par?'p':e.e=='ult'?'u':'n');pop(t,par?par+' −'+dmgVal:e.crit?'CRITIQUE −'+dmgVal:'−'+dmgVal,par?'par':e.crit?'crit':'');
say(`${d.nom||d.r} : −${dmgVal}${e.crit?' (critique)':''}${par?' ('+par.toLowerCase()+')':''}`);
if(e.crit||e.e=='ult'){a.classList.add('shake');setTimeout(()=>a.classList.remove('shake'),600)}
await W(e.crit||e.e=='ult'||par?2200:1500)}
await W(600)}
menu();
})();
