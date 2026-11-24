const $=id=>document.getElementById(id),app=$('app');
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),W=ms=>new Promise(r=>setTimeout(r,ms));
/* Personnages : r = rôle (nom affiché), nom = emplacement du vrai nom, img = ton dessin (data:URI ou chemin) */
const H=[
{r:'Archer',e:'🏹',c:'#6a8f3c',sp:14,a:['Flèche vive',16],u:['Pluie de flèches',38],b:['Œil de faucon','crit'],d:['Roulade','dodge']},
{r:'Chevalier',e:'⚔️',c:'#8a96a8',sp:8,a:['Coup d’épée',18],u:['Charge royale',40],b:['Serment','atk'],d:['Rempart','block']},
{r:'Lancier',e:'🔱',c:'#a8553a',sp:11,a:['Estoc',17],u:['Charge à la lance',42],b:['Garde haute','atk'],d:['Parade croisée','reflect']},
{r:'Paysan',e:'🌾',c:'#9a8a3a',sp:10,a:['Coup de fourche',14],u:['Moisson furieuse',36],b:['Soupe du soir','heal'],d:['Bouclier de charrette','block']},
{r:'Magicien',e:'🔮',c:'#6a4ab0',sp:12,a:['Éclair arcanique',17],u:['Météore',44],b:['Concentration','crit'],d:['Voile magique','absorb']},
{r:'Sage',e:'📜',c:'#c9b27c',sp:9,a:['Bâton de sagesse',13],u:['Jugement',37],b:['Méditation','heal'],d:['Miroir d’âme','reflect']},
{r:'Marchand',e:'💰',c:'#b8862a',sp:10,a:['Lancer de bourse',15],u:['Ruine totale',38],b:['Bonne affaire','atk'],d:['Pot-de-vin','absorb']},
{r:'Ninja',e:'🥷',c:'#3a3a4a',sp:16,a:['Shuriken',15],u:['Lame des ombres',41],b:['Souffle de l’ombre','crit'],d:['Disparition','dodge']},
{r:'Fléau d’armes',e:'⛓️',c:'#6a6a6a',sp:7,a:['Boulet à chaîne',20],u:['Tempête de fer',46],b:['Fureur','atk'],d:['Chaîne tendue','reflect']},
{r:'Barde',e:'🎻',c:'#b0507a',sp:11,a:['Note aiguë',13],u:['Ballade héroïque',36],b:['Hymne de vie','heal'],d:['Chanson apaisante','absorb']}];
const BD={atk:'+40 % de dégâts sur 2 attaques',crit:'la prochaine attaque est critique',heal:'soigne 22 PV'};
const DD={block:'réduit les dégâts de 60 %',dodge:'1 chance sur 2 d’esquiver',reflect:'réduit de 45 % et renvoie 25 %',absorb:'réduit de 50 % et soigne un peu'};
const AR=[{n:'Champ de tournoi',s:['#7fb6e8','#e9e2b8'],g:'#5d8a3a'},{n:'Forêt sombre',s:['#1e3a2a','#4a6b3d'],g:'#2f4a28'},{n:'Cour du château',s:['#8c9bb0','#cdd3da'],g:'#8a8a8a'},{n:'Pont de pierre',s:['#e08a5a','#ffd8a0'],g:'#6b5a4a'},{n:'Ruines antiques',s:['#3b2a52','#b0728a'],g:'#7a6a58'}];
const PO=[[9.75,3.25],[7.67,2.17],[10.5,4.5],[8,2],[11,5],[7,1.5]];/* positions en heures de cadran */
const clk=h=>{const t=h/12*2*Math.PI;return[50+36*Math.sin(t),52-26*Math.cos(t)]};
const ITM=['🎖️','👑','⚜️'];
let SV={};try{SV=JSON.parse(localStorage.getItem('joute')||'{}')}catch(e){}
const sv=()=>{try{localStorage.setItem('joute',JSON.stringify(SV))}catch(e){}};
function art(d){if(d.img)return `<img src="${d.img}" alt="${d.r}">`;
return `<svg viewBox="0 0 100 120"><ellipse cx="50" cy="112" rx="26" ry="6" fill="#0005"/><rect x="30" y="52" width="40" height="52" rx="14" fill="${d.c}" stroke="#2b1d10" stroke-width="3"/><circle cx="50" cy="34" r="20" fill="#f1d3a8" stroke="#2b1d10" stroke-width="3"/><circle cx="55" cy="33" r="3" fill="#2b1d10"/><circle cx="64" cy="33" r="3" fill="#2b1d10"/><text x="70" y="90" font-size="30">${d.e}</text></svg>`}
/* Musiques générées : menu, combat, victoire, défaite */
let AC,MG,vol=.4,MB,cur='',TM,want='',NZ;
const SC=[146.83,164.81,174.61,196,220,246.94,261.63,293.66,329.63,349.23,392,440];
const MEL=[7,9,10,9,7,5,4,5,7,9,11,10,9,7,5,7,4,5,7,9,10,9,7,5,4,2,4,5,4,2,0,2];
const nt=(f,t,d,ty,v)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v||.4,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(MB);o.start(t);o.stop(t+d+.05)};
const drum=(t,k)=>{const g=AC.createGain();g.connect(MB);if(k){const o=AC.createOscillator();o.frequency.setValueAtTime(130,t);o.frequency.exponentialRampToValueAtTime(40,t+.15);g.gain.setValueAtTime(.9,t);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.connect(g);o.start(t);o.stop(t+.25)}else{const x=AC.createBufferSource();x.buffer=NZ;g.gain.setValueAtTime(.3,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);x.connect(g);x.start(t)}};
const TR={
menu:(t,n)=>{for(let k=0;k<8;k++){nt(SC[MEL[(n*8+k)%32]],t+k*.33,.7,'triangle');if(k%4==0)nt(SC[n%4<2?0:4],t+k*.33,1.3,'sine')}return 2.64},
combat:(t,n)=>{const B=[0,0,0,0,2,2,3,3,0,0,0,0,4,4,3,3],M=[7,-1,9,-1,11,9,-1,7,9,-1,7,-1,4,7,-1,2];
for(let k=0;k<16;k++){const u=t+k*.2;if(k%4==0)drum(u,1);if(k%8==4)drum(u,0);if(k%2==0)nt(SC[B[k]]/2,u,.22,'sawtooth',.22);if(M[k]>=0)nt(SC[M[k]],u,.35,'square',.14)}return 3.2},
win:t=>{[[523,0,.15],[523,.2,.15],[523,.4,.15],[659,.6,.3],[784,.9,.4],[1047,1.3,1.8]].forEach(a=>nt(a[0],t+a[1],a[2]+.2,'sawtooth',.25));[261.63,329.63,392].forEach(f=>nt(f,t+1.3,2,'triangle',.3));return 3.5},
lose:t=>{[[440,0],[392,.8],[349.23,1.6],[293.66,2.4]].forEach(a=>nt(a[0],t+a[1],1.6,'triangle',.4));nt(110,t,4,'sine',.35);return 4.5}};
function play(n){want=n;if(!AC||cur==n)return;cur=n;clearTimeout(TM);if(MB)MB.gain.setTargetAtTime(0,AC.currentTime,.2);
MB=AC.createGain();MB.connect(MG);const my=MB;let t=AC.currentTime+.15,k=0;
const run=()=>{if(MB!==my)return;t+=TR[n](t,k++);if(n=='menu'||n=='combat')TM=setTimeout(run,Math.max(100,(t-AC.currentTime-1.5)*1000))};run()}
function music(){if(AC){AC.resume();return}try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return}
MG=AC.createGain();MG.gain.value=vol*.5;MG.connect(AC.destination);
NZ=AC.createBuffer(1,AC.sampleRate*.2,AC.sampleRate);const D=NZ.getChannelData(0);for(let i=0;i<D.length;i++)D[i]=Math.random()*2-1;
cur='';play(want||'menu')}
addEventListener('pointerdown',music,{once:true});addEventListener('keydown',music,{once:true});
const kn=$('knob');
function setV(v){vol=Math.max(0,Math.min(1,v));if(MG)MG.gain.value=vol*.5;kn.querySelector('i').style.transform=`rotate(${-135+vol*270}deg)`;kn.setAttribute('aria-valuenow',Math.round(vol*100))}
setV(vol);
kn.addEventListener('wheel',e=>{e.preventDefault();setV(vol-e.deltaY/800)},{passive:false});
kn.addEventListener('pointerdown',e=>{let y=e.clientY;kn.setPointerCapture(e.pointerId);const mv=ev=>{setV(vol+(y-ev.clientY)/120);y=ev.clientY};kn.addEventListener('pointermove',mv);kn.addEventListener('pointerup',()=>kn.removeEventListener('pointermove',mv),{once:true})});
kn.addEventListener('keydown',e=>{if(e.key=='ArrowUp'||e.key=='ArrowRight')setV(vol+.1);if(e.key=='ArrowDown'||e.key=='ArrowLeft')setV(vol-.1)});
/* Écrans */
function menu(){closeMod();leave();play('menu');
app.innerHTML=`<h1>Joute Duel</h1><div class="sub">Série : ${SV.streak||0} victoire(s) · Record : ${SV.best||0}</div>
<button class="mode" id="b1"><span>⚔️</span><div><b>Combat contre l’IA</b><br><small>Un duel, un seul survivant</small></div></button>
<button class="mode" id="b2"><span>🌐</span><div><b>Combat 1 contre 1 (en ligne)</b><br><small>Affronte un vrai joueur</small></div></button>
<div id="msg"></div>
<button class="mode" id="b3"><span>🛡️</span><div><b>Personnages</b><br><small>Voir les 10 combattants</small></div></button>
<div class="rules"><b>Règles</b><ul><li>Combat au tour par tour (20 secondes pour agir)</li><li>Pas de potion</li><li>Pas de fuite possible</li><li>Il faudra faire les bons choix</li></ul></div>`;
$('b1').onclick=()=>chars(1);$('b3').onclick=()=>chars(0);
$('b2').onclick=()=>chars(2)}
function chars(pickMode){closeMod();
app.innerHTML=`<h1 style="font-size:1.8rem;margin-top:44px">${pickMode?'Choisis ton combattant':'Les combattants'}</h1><div class="grid">${H.map((d,i)=>`<button class="card" data-i="${i}">${art(d)}<b>${d.r}</b><small>${d.nom||'— nom à venir —'}</small></button>`).join('')}</div><button id="bk">Retour</button>`;
$('bk').onclick=menu;
app.querySelectorAll('.card').forEach(c=>c.onclick=()=>{const i=+c.dataset.i,d=H[i];
if(pickMode==2)return online(i);if(pickMode)return fight(i);
openMod(i)})}
function openMod(i){const d=H[i];closeMod();const m=document.createElement('div');m.className='mo';m.id='mo';m.onclick=e=>{if(e.target==m)closeMod()};
m.innerHTML=`<div class="mw" role="dialog" aria-modal="true" aria-label="${d.r}"><button class="x" aria-label="Fermer">✕</button>${art(d)}<h2>${d.r}</h2><div style="text-align:center"><small>${d.nom||'— nom à venir —'}</small></div><div class="mv"><b>Attaque</b> : ${d.a[0]} (${d.a[1]})</div><div class="mv"><b>Ultime ×3</b> : ${d.u[0]} (${d.u[1]})</div><div class="mv"><b>Renforcement</b> : ${d.b[0]}, ${BD[d.b[1]]}</div><div class="mv"><b>Défense</b> : ${d.d[0]}, ${DD[d.d[1]]}</div></div>`;
document.body.appendChild(m);const x=m.querySelector('.x');x.onclick=closeMod;x.focus()}
const closeMod=()=>{const m=$('mo');if(m)m.remove()};
addEventListener('keydown',e=>{if(e.key=='Escape')closeMod()});
let F;
const mk=i=>({i,hp:100,ult:3,ab:0,cr:0,g:0});
const S=s=>s?F.B:F.A;
function fight(pi){const n=SV.n||0,ar=AR[Math.floor(n/3)%5];begin(pi,R(0,9),ar,PO[n%6],`Arène : ${ar.n} · Combat n°${n+1}`,0)}
function begin(pi,e,ar,po,hdr,on){
F={pi,ar,P:[clk(po[0]),clk(po[1])],A:mk(pi),B:mk(e),busy:0,over:0,on};
const st=SV.streak||0,im=Math.min(3,Math.floor(st/10)),au=SV.aura||st>=40;
if(st>=40)SV.aura=1;
const av=(s,x)=>{const X=S(s),d=H[X.i],fl=F.P[s][0]>F.P[1-s][0];
return `<div class="av ${fl?'f':''} ${s==0&&au?'aura':''}" id="v${s}" style="left:${F.P[s][0]}%;top:${F.P[s][1]}%">${s==0&&im?`<div class="itm">${ITM.slice(0,im).join('')}</div>`:''}<div class="in">${art(d)}</div></div>`};
app.innerHTML=`<small>${hdr}${st?' · Série '+st:''}</small>
<div class="hud">${[0,1].map(s=>`<div><b>${H[S(s).i].r}</b> <small>${H[S(s).i].nom||''}</small><div class="hb"><i id="h${s}"></i></div></div>`).join('')}</div>
<div class="arena" id="ar" style="background:linear-gradient(${ar.s[0]},${ar.s[1]} 45%,${ar.g} 45%)"><div class="floor"></div>${av(0)}${av(1)}</div>
<div id="tm"><i></i></div><div id="log"></div><div id="act" class="grid"></div>`;
sv();play('combat');say('Le duel commence !');if(!on)turn()}
const say=t=>{const l=$('log');if(l)l.innerHTML=t+'<br>'+l.innerHTML.split('<br>').slice(0,3).join('<br>')};
const hud=()=>[0,1].forEach(s=>{const h=$('h'+s);if(h)h.style.width=S(s).hp+'%'});
function turn(){
F.busy=0;const d=H[F.A.i];
$('act').innerHTML=[['a',d.a[0],'Attaque, '+d.a[1]+' dégâts'],['u',d.u[0],'Ultime, '+d.u[1]+' dégâts (reste '+F.A.ult+')'],['b',d.b[0],BD[d.b[1]]],['d',d.d[0],DD[d.d[1]]]].map(m=>`<button data-m="${m[0]}" ${m[0]=='u'&&!F.A.ult?'disabled':''}><b>${m[1]}</b><br><small>${m[2]}</small></button>`).join('');
$('act').querySelectorAll('button').forEach(b=>b.onclick=()=>go(b.dataset.m));
let t=20;const bar=$('tm').firstChild;bar.style.width='100%';
clearInterval(F.iv);F.iv=setInterval(()=>{t-=.1;bar.style.width=(t/20*100)+'%';if(t<=0){clearInterval(F.iv);go(Math.random()<.5?'a':'d',1)}},100)}
function aiPick(){const X=F.B,o=['a','a','b','d'];if(X.ult>0)o.push('u','u');if(X.hp<45)o.push('d','d');return o[R(0,o.length-1)]}
function pop(s,txt,cls){const e=$('v'+s);if(!e)return;e.insertAdjacentHTML('beforeend',`<span class="fl ${cls||''}">${txt}</span>`);const n=e.lastChild;setTimeout(()=>n.remove(),3000)}
function vfx(s,k){const a=$('ar');a.insertAdjacentHTML('beforeend',`<div class="vfx v${k}" style="left:${F.P[s][0]}%;top:${F.P[s][1]}%"></div>`);const n=a.lastChild;setTimeout(()=>n.remove(),2000)}
async function go(ma,auto){
if(F.busy)return;F.busy=1;clearInterval(F.iv);$('act').innerHTML='';
if(auto)say('Temps écoulé : action automatique.');
const mv=[ma,aiPick()];
for(const s of[0,1]){const X=S(s),d=H[X.i],m=mv[s];
if(m=='b'){const k=d.b[1];if(k=='atk')X.ab=2;if(k=='crit')X.cr=1;if(k=='heal')X.hp=Math.min(100,X.hp+22);say(`${d.r} : ${d.b[0]} !`);pop(s,'RENFORCÉ','buf');hud();await W(1500)}
if(m=='d'){X.g=d.d[1];say(`${d.r} : ${d.d[0]}.`);pop(s,'GARDE','par');await W(1400)}}
const ord=[0,1].filter(s=>mv[s]=='a'||mv[s]=='u').sort((x,y)=>H[S(y).i].sp-H[S(x).i].sp+Math.random()-.5);
for(const s of ord){if(F.A.hp<=0||F.B.hp<=0)break;await atk(s,mv[s])}
F.A.g=F.B.g=0;
if(F.A.hp<=0||F.B.hp<=0)return finish();
await W(500);turn()}
async function atk(s,m){
const X=S(s),Y=S(1-s),d=H[X.i],ult=m=='u',mv=ult?d.u:d.a,t=1-s;
if(ult){X.ult--;const a=$('ar');a.insertAdjacentHTML('beforeend',`<div class="flash"></div><div class="ban" style="--c:${d.c}">${mv[0]}</div>`);const els=[...a.querySelectorAll('.flash,.ban')];setTimeout(()=>els.forEach(e=>e.remove()),2000);await W(1500)}
else say(`${d.r} : ${mv[0]}`);
const av=$('v'+s);av.classList.add('l'+s);setTimeout(()=>av.classList.remove('l'+s),700);await W(450);
if(Math.random()<(ult?.12:.1)){vfx(t,'m');pop(t,'RATÉ','gry');say(`${mv[0]} : raté !`);await W(1700);return}
const crit=X.cr||Math.random()<.08;X.cr=0;
let dmg=mv[1]*(.9+Math.random()*.2)*(X.ab>0?1.4:1)*(crit?1.6:1);if(X.ab>0)X.ab--;
let par='',g=Y.g;
if(g=='dodge'&&Math.random()<.5){vfx(t,'p');pop(t,'ESQUIVE','par');say(`${H[Y.i].r} esquive !`);await W(1900);return}
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
let SB=null,ME=null,OM=null,poll=null,chn=null;
const sbc=()=>{if(!SB&&window.supabase)SB=window.supabase.createClient(SBURL,SBKEY);return SB};
function leave(){clearInterval(poll);if(chn&&SB)SB.removeChannel(chn);chn=null;OM=null;if(F)clearInterval(F.iv)}
function waitScr(t){app.innerHTML=`<h1 style="font-size:1.8rem;margin-top:44px">En ligne</h1><div class="det" id="ol">${t}</div><button id="bk">Annuler</button>`;$('bk').onclick=menu}
const btns=()=>{const d=H[F.A.i];return [['a',d.a[0],'Attaque, '+d.a[1]+' dégâts'],['u',d.u[0],'Ultime, '+d.u[1]+' dégâts (reste '+F.A.ult+')'],['b',d.b[0],BD[d.b[1]]],['d',d.d[0],DD[d.d[1]]]].map(m=>`<button data-m="${m[0]}" ${m[0]=='u'&&!F.A.ult?'disabled':''}><b>${m[1]}</b><br><small>${m[2]}</small></button>`).join('')};
async function online(ci){
leave();closeMod();const sb=sbc();if(!sb)return waitScr('Serveur injoignable.');
waitScr('Connexion…');
let {data:{session}}=await sb.auth.getSession();
if(!session){const r=await sb.auth.signInAnonymously();if(r.error)return waitScr('Connexion refusée : '+String(r.error.message).replace(/</g,'&lt;'));session=r.data.session}
ME=session.user.id;
const {data:mid,error}=await sb.rpc('find_match',{p_char:ci});
if(error)return waitScr('Erreur : '+String(error.message).replace(/</g,'&lt;'));
OM={id:mid,ci,turn:0,busy:0,q:[],done:0,dl:0};waitScr('Recherche d’un adversaire…');
chn=sb.channel('m'+mid).on('postgres_changes',{event:'*',schema:'public',table:'matches',filter:'id=eq.'+mid},p=>feed(p.new)).subscribe();
const get=async()=>{if(!OM)return;const {data}=await sb.from('matches').select('*').eq('id',mid).maybeSingle();if(data){feed(data);if(data.status=='active'&&Date.now()>new Date(data.deadline).getTime())sb.rpc('tick',{p_match:mid})}};
poll=setInterval(get,2000);get()}
async function feed(r){if(!OM||r.id!=OM.id)return;OM.q.push(r);if(OM.busy)return;OM.busy=1;
try{while(OM&&OM.q.length)await apply(OM.q.shift())}catch(e){}if(OM)OM.busy=0}
const syncF=(r,me)=>{F.A.hp=r['hp'+me];F.B.hp=r['hp'+(3-me)];F.A.ult=r['ult'+me];F.B.ult=r['ult'+(3-me)]};
async function apply(r){
if(r.status=='waiting'||!OM)return;
const me=r.p1==ME?1:2,op=3-me;OM.dl=new Date(r.deadline).getTime();
if(!F||!F.on||F.mid!=r.id){
const h=[...r.id].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)>>>0,ar=AR[h%5];
begin(r['c'+me],r['c'+op],ar,PO[(h>>3)%6],`Arène : ${ar.n} · En ligne`,1);F.mid=r.id;OM.turn=r.turn;syncF(r,me);hud();
if(r.status=='done'){OM.done=1;return finish()}return onlineTurn()}
if(OM.done)return;
if(r.turn>OM.turn||r.status=='done'){await playLog(r,me);OM.turn=r.turn;syncF(r,me);hud();
if(r.status=='done'){OM.done=1;return finish()}onlineTurn()}}
function onlineTurn(){
F.busy=0;$('act').innerHTML=btns();
$('act').querySelectorAll('button').forEach(b=>b.onclick=()=>osend(b.dataset.m));
const bar=$('tm').firstChild;clearInterval(F.iv);
F.iv=setInterval(()=>{const t=Math.max(0,(OM.dl-Date.now())/1000-3);bar.style.width=Math.min(100,t/20*100)+'%'},100)}
async function osend(m){if(F.busy||!OM)return;F.busy=1;$('act').innerHTML='<small class="full">En attente de l’adversaire…</small>';
const {error}=await SB.rpc('submit_move',{p_match:OM.id,p_move:m});
if(error){say('Coup refusé : '+String(error.message).replace(/</g,'&lt;'));onlineTurn()}}
async function playLog(r,me){
clearInterval(F.iv);$('act').innerHTML='';
for(const e of r.last_log){const s=e.s==me?0:1,t=1-s,d=H[S(s).i];
if(e.e=='buff'){say(`${d.r} : ${d.b[0]} !`);pop(s,'RENFORCÉ','buf');await W(1300);continue}
if(e.e=='guard'){say(`${d.r} : ${d.d[0]}.`);pop(s,'GARDE','par');await W(1200);continue}
const a=$('ar'),av=$('v'+s);
if(e.e=='ult'){a.insertAdjacentHTML('beforeend',`<div class="flash"></div><div class="ban" style="--c:${d.c}">${d.u[0]}</div>`);const els=[...a.querySelectorAll('.flash,.ban')];setTimeout(()=>els.forEach(x=>x.remove()),2000);await W(1500)}
av.classList.add('l'+s);setTimeout(()=>av.classList.remove('l'+s),700);await W(450);
if(e.e=='miss'){vfx(t,'m');pop(t,'RATÉ','gry');say(`${d.r} rate son attaque.`);await W(1700);continue}
if(e.e=='dodge'){vfx(t,'p');pop(t,'ESQUIVE','par');say(`${H[S(t).i].r} esquive !`);await W(1900);continue}
const par={block:'PARADE',reflect:'RIPOSTE',absorb:'ABSORBÉ'}[e.g]||'';
vfx(t,par?'p':e.e=='ult'?'u':'n');pop(t,par?par+' −'+e.d:e.crit?'CRITIQUE −'+e.d:'−'+e.d,par?'par':e.crit?'crit':'');
say(`${d.r} : −${e.d}${e.crit?' (critique)':''}${par?' ('+par.toLowerCase()+')':''}`);
if(e.crit||e.e=='ult'){a.classList.add('shake');setTimeout(()=>a.classList.remove('shake'),600)}
await W(e.crit||e.e=='ult'||par?2200:1500)}
await W(600)}
menu();
