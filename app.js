
const $=id=>document.getElementById(id);
let currentCourse=null,current=null,state={};
const storeKey=id=>'training-engine:'+id;
function base(){return{mode:'Treinamento',scenarioIdx:0,answers:{},diag:{idx:0,cases:{}},readiness:{idx:0,cases:{}},master:{step:0,scores:[70,70,70,70],history:[]}}}
function load(id){try{let x=JSON.parse(localStorage.getItem(storeKey(id)))||{};return Object.assign(base(),x)}catch(e){return base()}}
function normalize(){state.diag=Object.assign({idx:0,cases:{}},state.diag||{});state.readiness=Object.assign({idx:0,cases:{}},state.readiness||{});state.master=Object.assign({step:0,scores:[70,70,70,70],history:[]},state.master||{})}
function save(){if(currentCourse)localStorage.setItem(storeKey(currentCourse),JSON.stringify(state))}
function fb(ok,w,src){return `<div class="feedback ${ok?'good':'bad'}"><b>${ok?'✓ Decisão consistente':'✕ Reveja o raciocínio'}</b><p>${w}</p><div class="source">${src||''}</div></div>`}

function showGuide(force=false){const g=$('guide');if(g&&(force||!localStorage.getItem('liberacao-guide-v4')))g.classList.add('open')}
const helpBtn=$('helpBtn'),closeGuide=$('closeGuide');
if(helpBtn)helpBtn.onclick=()=>showGuide(true);
if(closeGuide)closeGuide.onclick=()=>{const g=$('guide');if(g)g.classList.remove('open');localStorage.setItem('liberacao-guide-v4','1')};

function library(){
 $('courseCount').textContent=TRAINING_CATALOG.length;
 $('courses').innerHTML=TRAINING_CATALOG.map(c=>`<div class="card course" onclick="openCourse('${c.id}')"><div class="k">${c.domain}</div><h3>${c.title}</h3><p class="muted">${c.description}</p></div>`).join('');
}
window.openCourse=id=>{
 currentCourse=id;current=TRAINING_CONTENT[id];state=load(id);normalize();
 $('library').style.display='none';$('courseUI').style.display='block';
 $('courseDomain').textContent=current.config.domain;$('courseTitle').textContent=current.config.title;$('courseDesc').textContent=current.config.description;
 $('courseBadges').innerHTML=`<span class="tag">${current.modules.length} módulos</span><span class="tag">${current.scenarios.length} cenários</span><span class="tag">${current.diagnostics.length} diagnósticos</span><span class="tag">${current.readiness?.length||0} prontidão</span>`;
 $('mode').textContent='Modo: '+state.mode;
 renderModules();buildScenarioFilter();renderReleaseMap();renderReadiness();renderCoverage();renderScenario();renderDiagnostic();renderMaster();renderReport();
};
$('backLibrary').onclick=()=>{current=null;currentCourse=null;$('courseUI').style.display='none';$('library').style.display='block'};
$('mode').onclick=()=>{if(!current)return;state.mode=state.mode==='Treinamento'?'Avaliação':'Treinamento';$('mode').textContent='Modo: '+state.mode;save();renderScenario();renderDiagnostic()};

document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('#courseUI .sec').forEach(s=>s.classList.remove('active'));
 $(b.dataset.s).classList.add('active');
 document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x===b));
 if(b.dataset.s==='releaseMap')renderReleaseMap();
 if(b.dataset.s==='readiness')renderReadiness();
 if(b.dataset.s==='coverage')renderCoverage();
 if(b.dataset.s==='report')renderReport();
});

function renderModules(){
 $('moduleGrid').innerHTML=current.modules.map(m=>`<div class="card module"><div class="k">${m.n} · ${m.area}</div><h3>${m.title}</h3><p class="muted">${m.desc}</p><span class="tag">${m.doc}</span><span class="tag">${current.scenarios.filter(s=>s.mid===m.id).length} cenários</span></div>`).join('');
}
function buildScenarioFilter(){$('scenarioModule').innerHTML='<option value="">Todos os módulos</option>'+current.modules.map(m=>`<option value="${m.id}">${m.n} · ${m.title}</option>`).join('')}
function scenarioList(){let v=$('scenarioModule').value;return current.scenarios.map((s,i)=>({s,i})).filter(x=>!v||x.s.mid===v)}
function renderScenario(){
 if(!current)return;let l=scenarioList();if(!l.length){$('scenarioCard').innerHTML='<div class="empty">Nenhum cenário.</div>';return}
 let p=l.findIndex(x=>x.i===state.scenarioIdx);if(p<0){state.scenarioIdx=l[0].i;p=0}
 let s=current.scenarios[state.scenarioIdx],a=state.answers[state.scenarioIdx],m=current.modules.find(x=>x.id===s.mid);
 $('scenarioCard').innerHTML=`<div class="head"><div><div class="k">${m?.title||s.mid}</div><h2>${s.title}</h2></div><div class="grow"></div><span class="badge">${s.diff}</span><span class="badge">${p+1}/${l.length}</span></div><p><span class="sim">SIMULADO</span> ${s.context}</p><div class="trends">${s.trends.map(t=>`<div class="trend"><small><span class="sim">SIM</span> ${t[0]}</small><b>${t[1]}</b><span class="muted">${t[2]}</span></div>`).join('')}</div><div class="call"><b><span class="role field">CAMPO</span> Informação disponível:</b> ${s.field}</div><h3>${s.q}</h3><div class="options">${s.opts.map((o,j)=>`<button class="option ${a?.choice===j?'sel':''}" onclick="answerScenario(${j})" ${a?'disabled':''}>${String.fromCharCode(65+j)}. ${o}</button>`).join('')}</div>${a&&state.mode==='Treinamento'?fb(a.choice===s.correct,s.why,`<span class="proc">PROCEDIMENTO</span> ${s.source}`):''}<div class="stickyProgress">Cenário ${p+1} de ${l.length} · ${m?.title||''}</div><div class="controls"><button class="btn" onclick="moveScenario(-1)" ${p===0?'disabled':''}>← Anterior</button><button class="btn primary" onclick="moveScenario(1)" ${p===l.length-1?'disabled':''}>Próximo →</button></div>`;
}
window.answerScenario=j=>{let s=current.scenarios[state.scenarioIdx];if(!state.answers[state.scenarioIdx]){state.answers[state.scenarioIdx]={choice:j,ok:j===s.correct};save();renderScenario();renderReport()}};
window.moveScenario=d=>{let l=scenarioList(),p=l.findIndex(x=>x.i===state.scenarioIdx),n=p+d;if(n>=0&&n<l.length){state.scenarioIdx=l[n].i;save();renderScenario()}};
$('scenarioModule').onchange=renderScenario;$('randomScenario').onclick=()=>{let l=scenarioList();if(l.length){state.scenarioIdx=l[Math.floor(Math.random()*l.length)].i;save();renderScenario()}};

function renderReleaseMap(){
 if(!current?.releaseMap)return;
 $('releaseMapGrid').innerHTML=current.releaseMap.map(x=>`<div class="card"><div class="k">${x.source}</div><h3>${x.equipment}</h3><div class="call"><b>👁️ CIC acompanha</b><br>${x.cic}</div><div class="call"><b>📻 Campo confirma</b><br>${x.field}</div><div class="call risk"><b>⛔ O que impede a entrega</b><br>${x.barrier}</div><div class="call"><b>✓ Evidência de liberação</b><br>${x.proof}</div></div>`).join('');
}

function readyState(i){state.readiness.cases[i]??={answer:null};return state.readiness.cases[i]}
function renderReadiness(){
 if(!current?.readiness?.length)return;let i=state.readiness.idx,x=current.readiness[i],rs=readyState(i);
 $('readyCase').innerHTML=`<div class="head"><div><div class="k">${x.source}</div><h3>${x.equipment}</h3></div><div class="grow"></div><span class="badge">${i+1}/${current.readiness.length}</span></div><div class="call"><span class="sim">SIMULADO</span> Caso didático montado a partir das barreiras do procedimento indicado.</div><div class="trends">${x.facts.map(f=>`<div class="trend"><small>${f[0]}</small><b>${f[1]}</b></div>`).join('')}</div><h3>Como você classifica a condição?</h3><div class="options">${x.opts.map((o,j)=>`<button class="option ${rs.answer===j?'sel':''}" onclick="answerReadiness(${j})" ${rs.answer!==null?'disabled':''}>${o}</button>`).join('')}</div>${rs.answer!==null&&state.mode==='Treinamento'?fb(rs.answer===x.correct,x.why+`<br><br><b>Classificação:</b> ${x.status}`,`<span class="proc">PROCEDIMENTO</span> ${x.source}`):''}`;
 $('rPrev').disabled=i===0;$('rNext').disabled=i===current.readiness.length-1;
}
window.answerReadiness=j=>{let rs=readyState(state.readiness.idx);if(rs.answer===null){rs.answer=j;save();renderReadiness();renderReport()}};
$('rPrev').onclick=()=>{if(state.readiness.idx>0){state.readiness.idx--;save();renderReadiness()}};
$('rNext').onclick=()=>{if(state.readiness.idx<current.readiness.length-1){state.readiness.idx++;save();renderReadiness()}};
$('rReset').onclick=()=>{if(confirm('Reiniciar o Painel de Prontidão?')){state.readiness={idx:0,cases:{}};save();renderReadiness();renderReport()}};

function renderCoverage(){
 let v=$('covStatus').value,a=current.coverage.filter(x=>!v||x.status===v);
 $('coverageTable').innerHTML='<table><thead><tr><th>Fonte</th><th>Etapa</th><th>Tópico</th><th>Cenário</th><th>Diagnóstico</th><th>Mestre</th><th>Nível</th></tr></thead><tbody>'+a.map(x=>`<tr><td>${x.code}</td><td>${x.step}</td><td>${x.title}${x.limit?`<br><span class="source">${x.limit}</span>`:''}</td><td>${x.scenario?'✓':'—'}</td><td>${x.diagnostic?'✓':'—'}</td><td>${x.master?'✓':'—'}</td><td><span class="tag">${x.status}</span></td></tr>`).join('')+'</tbody></table>';
}
$('covStatus').onchange=renderCoverage;

function diagState(i){state.diag.cases[i]??={seen:[],answer:null,confidence:null};return state.diag.cases[i]}
function renderDiagnostic(){
 if(!current?.diagnostics?.length)return;let i=state.diag.idx,d=current.diagnostics[i],x=diagState(i);
 $('dTitle').textContent=d.title;$('dCount').textContent=(i+1)+'/'+current.diagnostics.length;$('dContext').textContent=d.context;
 $('dInitial').innerHTML=d.initial.map(t=>`<div class="trend"><small><span class="sim">SIM</span> ${t[0]}</small><b>${t[1]}</b><span class="muted">${t[2]}</span></div>`).join('');
 $('dInvestigations').innerHTML=d.investigations.map((q,j)=>`<button class="option ${x.seen.includes(j)?'sel':''}" onclick="investigate(${j})" ${x.seen.includes(j)||x.answer!==null?'disabled':''}>${q[0]==='field'?'📻 Campo':q[0]==='trend'?'📈 Tendência':'📘 Fonte'} · ${q[1]}</button>`).join('');
 $('dRevealed').innerHTML=x.seen.map(j=>`<div class="call"><b>${d.investigations[j][1]}</b><br>${d.investigations[j][2]}</div>`).join('');
 $('dQuestion').textContent=d.q+` (${x.seen.length}/${d.min} investigações mínimas)`;
 document.querySelectorAll('.confBtn').forEach(b=>{b.classList.toggle('primary',x.confidence===b.dataset.c);b.disabled=x.answer!==null;b.onclick=()=>{x.confidence=b.dataset.c;save();renderDiagnostic()}});
 let unlocked=x.seen.length>=d.min&&!!x.confidence;
 $('dOptions').innerHTML=d.opts.map((o,j)=>`<button class="option ${x.answer===j?'sel':''}" onclick="answerDiagnostic(${j})" ${!unlocked||x.answer!==null?'disabled':''}>${String.fromCharCode(65+j)}. ${o}</button>`).join('');
 $('dFeedback').innerHTML=x.answer!==null&&state.mode==='Treinamento'?fb(x.answer===d.correct,d.why+`<br><br><b>Certeza declarada:</b> ${x.confidence}.`,`<span class="proc">PROCEDIMENTO</span> ${d.source}`):'';
 $('dPrev').disabled=i===0;$('dNext').disabled=i===current.diagnostics.length-1;
}
window.investigate=j=>{let x=diagState(state.diag.idx);if(x.answer===null&&!x.seen.includes(j)){x.seen.push(j);save();renderDiagnostic()}};
window.answerDiagnostic=j=>{let d=current.diagnostics[state.diag.idx],x=diagState(state.diag.idx);if(x.seen.length>=d.min&&x.confidence&&x.answer===null){x.answer=j;save();renderDiagnostic();renderReport()}};
$('dPrev').onclick=()=>{if(state.diag.idx>0){state.diag.idx--;save();renderDiagnostic()}};
$('dNext').onclick=()=>{if(state.diag.idx<current.diagnostics.length-1){state.diag.idx++;save();renderDiagnostic()}};

function renderMaster(){
 let X=state.master,n=current.config.masterMeters;
 $('mMeters').innerHTML=n.map((x,i)=>`<div class="meter"><small>${x}</small><b>${X.scores[i]}%</b><div class="bar"><span style="width:${X.scores[i]}%"></span></div></div>`).join('');
 if(X.step>=current.master.length){let a=Math.round(X.scores.reduce((u,v)=>u+v,0)/X.scores.length);$('mTitle').textContent='Concluído';$('mText').textContent='Efeito acumulado das decisões.';$('mOptions').innerHTML='';$('mAfter').innerHTML=fb(a>=65,`Índice consolidado: ${a}%`,'')}
 else{let x=current.master[X.step];$('mTitle').textContent=x.title;$('mText').innerHTML=`<span class="sim">SIMULADO</span> ${x.text}`;$('mOptions').innerHTML=x.opts.map((o,j)=>`<button class="option" onclick="answerMaster(${j})">${o}</button>`).join('');$('mAfter').innerHTML=''}
 $('mHistory').innerHTML=X.history.slice(-5).reverse().map(h=>`<div class="hist"><b>${h.title}</b><br><span class="muted">${h.msg}</span></div>`).join('');
}
window.answerMaster=j=>{let X=state.master,x=current.master[X.step],imp=x.impact[j]||[0,0,0,0];X.scores=X.scores.map((v,i)=>Math.max(0,Math.min(100,v+(imp[i]||0))));X.history.push({title:x.title,msg:x.after[j]||''});X.step++;save();renderMaster()};
$('mReset').onclick=()=>{if(confirm('Reiniciar o Cenário Mestre?')){state.master={step:0,scores:[70,70,70,70],history:[]};save();renderMaster()}};

function renderReport(){
 if(!current)return;let C={};
 current.scenarios.forEach((s,i)=>(s.comp||[]).forEach(c=>{C[c]??={n:0,ok:0};if(state.answers[i]){C[c].n++;if(state.answers[i].ok)C[c].ok++}}));
 let rows=Object.entries(C).map(([c,v])=>{let p=v.n?Math.round(v.ok/v.n*100):0;return`<div class="report-row"><b>${c}</b><div class="bar"><span style="width:${p}%"></span></div><span>${v.n?p+'%':'—'}</span></div>`}).join('');
 let dc=Object.entries(state.diag.cases).filter(([k,x])=>x.answer!==null);
 let highWrong=dc.filter(([k,x])=>x.confidence==='Alta'&&x.answer!==current.diagnostics[+k]?.correct).length;
 let lowCorrect=dc.filter(([k,x])=>x.confidence==='Baixa'&&x.answer===current.diagnostics[+k]?.correct).length;
 let rc=Object.entries(state.readiness.cases||{}).filter(([k,x])=>x.answer!==null);
 let rok=rc.filter(([k,x])=>x.answer===current.readiness[+k]?.correct).length;
 $('reportBody').innerHTML=rows+`<div class="call"><b>Sala CIC:</b> ${dc.length}/${current.diagnostics.length} concluídos · erros com alta certeza: <b>${highWrong}</b> · acertos com baixa certeza: <b>${lowCorrect}</b>.</div><div class="call"><b>Prontidão:</b> ${rc.length}/${current.readiness.length} concluídos · ${rc.length?Math.round(rok/rc.length*100):0}% de classificação correta.</div>`;
}
$('resetCourse').onclick=()=>{if(confirm('Apagar todo o progresso deste treinamento?')){localStorage.removeItem(storeKey(currentCourse));state=base();renderScenario();renderDiagnostic();renderReadiness();renderMaster();renderReport()}};

let deferred;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('install').style.display='block'});
$('install').onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;$('install').style.display='none'}};
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
library();showGuide();
