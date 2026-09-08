const D = window.RPG_DATA;
const $ = id => document.getElementById(id);
const STORAGE_KEY = "thaalemor_characters_v4";
const LEGACY_KEYS = ["thaalemor_characters_v3", "thaalemor_characters_v2"];
const state = {sourceVersion:"4.0",id:null, attributes:{}, skills:{}, gifts:[], portrait:"", rollLog:[], dirty:false};
const slug = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\W+/g,"_").toLowerCase();
const sign = n => `${n >= 0 ? "+" : ""}${n}`;
const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function makeId(){return globalThis.crypto?.randomUUID?.() || `te_${Date.now()}_${Math.random().toString(16).slice(2)}`;}
function level(){return Math.trunc(clamp($("level").value||1,1,10))}
function attributeCap(){return level()===1?4:level()<=4?5:6}
function skillRankCap(){return level()===1?2:level()<=4?3:level()<=7?4:5}
function classData(){return D.classes[$("className").value]||D.classes.Livre}
function classRanks(name){return Number(classData().freeRanks?.[name]||0)}
function flatSkillMod(name){return Number(classData().flatMods?.[name]||0)}
function rawSkillRank(name){return Math.max(0,Number(state.skills[name]||0))+classRanks(name)}
function effectiveSkillRank(name){return Math.min(D.balance.skillEffectiveAbsoluteCap||7,rawSkillRank(name))}
function skillBonusFromRank(rank){const full=Math.min(rank,D.balance.skillFullBonusRanks||4);return full*D.balance.skillBonusPerRank+Math.max(0,rank-full)}
function skillBonus(name){return skillBonusFromRank(effectiveSkillRank(name))+flatSkillMod(name)}
function investedAttributes(){return Object.values(state.attributes).reduce((n,v)=>n+Math.max(0,Number(v)-1),0)}
function investedSkills(){return Object.values(state.skills).reduce((n,v)=>n+Math.max(0,Number(v)),0)}
function giftInfo(raw){if(!raw)return {count:null,attributes:0,skills:0,label:""};const r=clamp(raw,1,20);return D.giftTable.find(row=>r>=row.min&&r<=row.max)||D.giftTable[0]}
function budgets(){const g=giftInfo($("giftRoll").value);return {a:g.attributes||0,s:g.skills||0,count:g.count}}
function skillAttrKey(skill){return Object.entries(D.attributes).find(([,a])=>a.skills.includes(skill))?.[0]||"fortitude"}
function markDirty(){state.dirty=true;$("saveState").textContent="Não salvo";$("saveState").style.color="#c5a56b"}
function markSaved(){state.dirty=false;$("saveState").textContent="Salvo localmente";$("saveState").style.color=""}

function init(){
  migrateStorage();
  Object.keys(D.origins).forEach(k=>$("origin").add(new Option(k,k)));
  D.kingdoms.forEach(k=>$("kingdom").add(new Option(k,k)));
  Object.keys(D.classes).forEach(k=>$("className").add(new Option(k,k)));
  Object.entries(D.attributes).forEach(([key,a])=>{
    state.attributes[key]=1;
    $("attributes").insertAdjacentHTML("beforeend",`<article class="attribute-node"><button type="button" class="attribute-roll" data-roll-attr="${key}" title="Rolar ${a.label}"><span class="attribute-rune">${a.short}</span><strong id="attrDisplay_${key}">1</strong><small>${a.label}<br>rolar atributo</small></button><input class="attr-input" data-key="${key}" type="number" min="1" max="6" value="1" aria-label="${a.label}"></article>`);
    $("testAttribute").add(new Option(`${a.short} — ${a.label}`,key));
  });
  Object.entries(D.attributes).forEach(([key,a])=>{
    const group=document.createElement("section");group.className="skill-group";group.innerHTML=`<div class="skill-group-title"><span>${a.short}</span><h3>${a.label}</h3></div><div id="sg_${key}"></div>`;$("skillsContainer").appendChild(group);
    a.skills.forEach(name=>{state.skills[name]=0;$(`sg_${key}`).insertAdjacentHTML("beforeend",`<div class="skill-row"><div class="skill-name"><button type="button" data-roll-skill="${escapeHtml(name)}">${escapeHtml(name)}</button><small id="class_${slug(name)}">Classe +0</small></div><div class="stepper"><button type="button" data-skill-step="${escapeHtml(name)}" data-delta="-1" aria-label="Reduzir investimento em ${escapeHtml(name)}">−</button><input class="skill-input" data-skill="${escapeHtml(name)}" aria-label="Pontos investidos em ${escapeHtml(name)}" type="number" min="0" value="0"><button type="button" data-skill-step="${escapeHtml(name)}" data-delta="1" aria-label="Aumentar investimento em ${escapeHtml(name)}">+</button></div><div class="rank-display"><span>Grau</span><strong id="rank_${slug(name)}">0</strong></div><div class="bonus" id="bonus_${slug(name)}">+0</div></div>`)});
  });
  D.rules.forEach(([title,text],i)=>$("rulesContent").insertAdjacentHTML("beforeend",`<article class="rule-card"><span>${String(i+1).padStart(2,"0")}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`));
  bindEvents();populateTestSkills();recalc();renderLibrary();renderRollHistory();
}
function bindEvents(){
  document.querySelectorAll(".side-nav-btn").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
  document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.jump)));
  document.querySelectorAll("[data-collapse]").forEach(b=>b.addEventListener("click",()=>{const el=$(b.dataset.collapse);el.hidden=!el.hidden;b.textContent=el.hidden?"+":"−";b.setAttribute("aria-expanded",String(!el.hidden))}));
  document.querySelectorAll(".content-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".content-tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".content-pane").forEach(x=>x.classList.toggle("active",x.id===b.dataset.contentTab))}));
  document.addEventListener("input",handleInput);
  document.addEventListener("change",handleInput);
  document.addEventListener("click",handleClick);
  $("rollGifts").addEventListener("click",()=>{$("giftRoll").value=Math.floor(Math.random()*20)+1;markDirty();recalc();showView("gifts")});
  $("rollTest").addEventListener("click",rollTest);
  $("testAttribute").addEventListener("change",()=>{populateTestSkills();updateTestPreview()});
  ["testSkill","testEdge"].forEach(id=>$(id).addEventListener("change",updateTestPreview));
  ["testCombo","testTarget"].forEach(id=>$(id).addEventListener("input",updateTestPreview));
  $("saveCharacter").addEventListener("click",saveCharacter);
  $("newCharacter").addEventListener("click",resetForm);
  $("printSheet").addEventListener("click",()=>window.print());
  $("clearLog").addEventListener("click",()=>{state.rollLog=[];renderRollHistory();$("lastRoll").className="last-roll empty";$("lastRoll").innerHTML="<span>Clique em um atributo, perícia ou dado.</span>"});
  $("portraitButton").addEventListener("click",()=>$("portraitInput").click());
  $("portraitInput").addEventListener("change",handlePortrait);
  window.addEventListener("beforeunload",e=>{if(state.dirty){e.preventDefault();e.returnValue="";}});

}
function handleClick(e){
  const attr=e.target.closest("[data-roll-attr]");if(attr){rollPool(attr.dataset.rollAttr,"",0,0,null,D.attributes[attr.dataset.rollAttr].label);return}
  const skill=e.target.closest("[data-roll-skill]");if(skill){const name=skill.dataset.rollSkill;rollPool(skillAttrKey(name),name,0,0,null,name);return}
  const step=e.target.closest("[data-skill-step]");if(step){const name=step.dataset.skillStep;state.skills[name]=clamp((state.skills[name]||0)+Number(step.dataset.delta),0,skillRankCap());const input=document.querySelector(`.skill-input[data-skill="${CSS.escape(name)}"]`);if(input)input.value=state.skills[name];markDirty();recalc();return}
  const r=e.target.closest("[data-resource]");if(r){changeResource(r.dataset.resource,Number(r.dataset.delta));return}
  const die=e.target.closest("[data-die]");if(die){rollSingleDie(Number(die.dataset.die));return}
  const load=e.target.closest("[data-load]");if(load){loadCharacter(load.dataset.load);return}
  const del=e.target.closest("[data-delete]");if(del){deleteCharacter(del.dataset.delete);return}
}
function handleInput(e){
  if(e.target.matches("[data-gift]")){const i=Number(e.target.dataset.gift),field=e.target.dataset.field;if(state.gifts[i]&&["name","type","description"].includes(field))state.gifts[i][field]=e.target.value;markDirty();if(window.refreshPowerOutputs)window.refreshPowerOutputs();return}
  if(e.target.classList.contains("attr-input")){const key=e.target.dataset.key,val=Math.trunc(clamp(e.target.value,1,D.balance.attributeAbsoluteCap));state.attributes[key]=val;e.target.value=val;markDirty();recalc();return}
  if(e.target.classList.contains("skill-input")){const name=e.target.dataset.skill,val=Math.trunc(clamp(e.target.value,0,skillRankCap()));state.skills[name]=val;e.target.value=val;markDirty();recalc();return}
  const calcIds=new Set(["giftRoll","level","className","armor","lpMax","lpCurrent","veilCurrent","will","origin","kingdom"]);
  if(calcIds.has(e.target.id)){markDirty();recalc();return}
  if(["name","path","player","age","gender","alignment","location","abilities","inventory","traits","notes","exp"].includes(e.target.id)){markDirty();updateMiniProfile()}
}
function recalc(){
  const g=giftInfo($("giftRoll").value),b=budgets(),c=classData();
  $("giftCount").textContent=g.count??"—";$("attributeBudget").textContent=$("giftRoll").value?b.a:"—";$("skillBudget").textContent=$("giftRoll").value?b.s:"—";
  $("giftRollMini").textContent=$("giftRoll").value||"—";$("giftCountMini").textContent=g.count??"—";$("budgetMini").textContent=$("giftRoll").value?`${b.a}A / ${b.s}P`:"—";
  renderGifts(g.count||0);
  $("attributeCounter").textContent=$("giftRoll").value?`${investedAttributes()} / ${b.a} pontos • teto ${attributeCap()}`:`Teto atual ${attributeCap()}`;
  $("skillCounter").textContent=$("giftRoll").value?`${investedSkills()} / ${b.s} investidos • máx. ${skillRankCap()}`:`Máx. ${skillRankCap()} investidos por Perícia`;
  Object.entries(state.attributes).forEach(([k,v])=>{const d=$(`attrDisplay_${k}`);if(d)d.textContent=v});
  Object.keys(state.skills).forEach(name=>{const free=classRanks(name),rank=effectiveSkillRank(name),bonus=skillBonus(name);const input=document.querySelector(`.skill-input[data-skill="${CSS.escape(name)}"]`);if(input)input.max=skillRankCap();$(`class_${slug(name)}`).textContent=free?`Classe +${free}`:"Classe +0";$(`rank_${slug(name)}`).textContent=rank;const be=$(`bonus_${slug(name)}`);be.textContent=sign(bonus);be.classList.toggle("negative",bonus<0)});
  const lpMax=Math.max(1,Number($("lpMax").value)||1);$("lpMax").value=lpMax;$("lpCurrent").value=clamp($("lpCurrent").value,0,lpMax);
  const veilMax=Math.floor(lpMax/(c.veilDivisor||3));$("veilMax").value=veilMax;$("veilCurrent").value=clamp($("veilCurrent").value===""?veilMax:$("veilCurrent").value,0,veilMax);
  const defense=10+Number(state.attributes.fortitude||1)+skillBonus("Defesa")+Number($("armor").value||0);const movement=D.balance.baseMovement+effectiveSkillRank("Vigor")*D.balance.vigorMetersPerRank;
  $("defenseDisplay").textContent=defense;$("movementDisplay").textContent=`${movement}m`;$("aimRange").textContent=`+${effectiveSkillRank("Mira")*D.balance.miraMetersPerRank}m`;$("powerRange").textContent=`+${effectiveSkillRank("Potência")*D.balance.potencyMetersPerRank}m`;$("powerDamage").textContent=sign(effectiveSkillRank("Potência")*D.balance.potencyDamagePerRank);
  $("railDefense").textContent=defense;$("railLP").textContent=`${$("lpCurrent").value}/${lpMax}`;$("railVeil").textContent=`${$("veilCurrent").value}/${veilMax}`;$("railMove").textContent=`${movement}m`;
  updateBars();renderClassSummary();renderBuildHighlights();renderWarnings();updateMiniProfile();updateTestPreview();if(window.refreshPowerOutputs)window.refreshPowerOutputs();
}
function updateBars(){const lp=Math.max(1,Number($("lpMax").value)||1),veil=Math.max(1,Number($("veilMax").value)||1);$("lpBar").style.width=`${clamp((Number($("lpCurrent").value)||0)/lp*100,0,100)}%`;$("veilBar").style.width=`${clamp((Number($("veilCurrent").value)||0)/veil*100,0,100)}%`}
function changeResource(id,delta){const el=$(id),max=id==="lpCurrent"?Number($("lpMax").value):Number($("veilMax").value);el.value=clamp(Number(el.value)+delta,0,max);markDirty();recalc()}
function renderClassSummary(){const c=classData();const specs=Object.entries(c.freeRanks||{}).map(([n,r])=>`${n} +${r}`).join(" • ")||"Sem graus gratuitos";const mods=Object.entries(c.flatMods||{}).map(([n,v])=>`${n} ${sign(v)}`).join(" • ")||"Sem ajustes fixos";$("classSummary").innerHTML=`<div><span>Especializações</span><strong>${escapeHtml(specs)}</strong></div><div><span>Ajustes</span><strong>${escapeHtml(mods)}</strong></div><div><span>Traços</span><p>${(c.traits||[]).map(escapeHtml).join(" • ")}</p></div>`}
function renderBuildHighlights(){const best=Object.keys(state.skills).map(n=>({n,b:skillBonus(n),r:effectiveSkillRank(n)})).sort((a,b)=>b.b-a.b).slice(0,3);$("buildHighlights").innerHTML=best.map(x=>`<div class="build-pill"><span>${escapeHtml(x.n)} • grau ${x.r}</span><strong>${sign(x.b)}</strong></div>`).join("")}
function renderGifts(count,force=false){if(window.renderPowerGifts)window.renderPowerGifts(count,force)}
function renderWarnings(){const out=[];const b=budgets();if($("giftRoll").value&&investedAttributes()>b.a)out.push(`Atributos: ${investedAttributes()} pontos usados para orçamento ${b.a}.`);if($("giftRoll").value&&investedSkills()>b.s)out.push(`Perícias: ${investedSkills()} pontos usados para orçamento ${b.s}.`);if(Object.values(state.attributes).some(v=>Number(v)>attributeCap()))out.push(`Há Atributo acima do teto recomendado para o nível ${level()} (${attributeCap()}). Combos podem ultrapassar a curva via efeitos, não via compra inicial.`);if(classData().minGifts&&Number(b.count||0)<classData().minGifts)out.push(`${$("className").value} exige pelo menos ${classData().minGifts} Dons.`);if($("origin").value==="Humano")out.push("Humano: Versatilidade/penalidades do texto-base continuam sem automação porque o material original é ambíguo.");$("warnings").innerHTML=out.map(x=>`<div class="warning">${escapeHtml(x)}</div>`).join("")}
function updateMiniProfile(){$("miniName").textContent=$("name").value||"Personagem sem nome";$("miniClass").textContent=`${$("className").value||"Livre"} • Nível ${level()}`}
function populateTestSkills(){const key=$("testAttribute").value,current=$("testSkill").value;$("testSkill").innerHTML='<option value="">Sem Perícia</option>'+D.attributes[key].skills.map(n=>`<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");if([...$("testSkill").options].some(o=>o.value===current))$("testSkill").value=current}
function testMath(){const attrKey=$("testAttribute").value,skill=$("testSkill").value,edge=Number($("testEdge").value||0),target=Math.max(1,Number($("testTarget").value)||15),dice=Math.max(1,Number(state.attributes[attrKey]||1)+edge),combo=clamp($("testCombo").value,-(D.balance.comboModifierCap||6),D.balance.comboModifierCap||6),baseBonus=skill?skillBonus(skill):0,bonus=baseBonus+combo,needed=target-bonus;let single;if(needed<=1)single=1;else if(needed>20)single=.05;else single=(21-needed)/20;return{attrKey,skill,target,dice,combo,baseBonus,bonus,chance:1-Math.pow(1-single,dice)}}
function updateTestPreview(){if(!$("testPreview"))return;const t=testMath();$("testPreview").innerHTML=`<div><span>Pool</span><strong>${t.dice}d20</strong></div><div><span>Bônus</span><strong>${sign(t.bonus)}</strong></div><div><span>Alvo</span><strong>${t.target}</strong></div><div><span>Chance</span><strong>${Math.round(t.chance*100)}%</strong></div>`}
function rollPool(attrKey,skill="",extra=0,edge=0,target=null,label="Teste"){const dice=Math.max(1,Number(state.attributes[attrKey]||1)+Number(edge||0)),rolls=Array.from({length:dice},()=>Math.floor(Math.random()*20)+1),best=Math.max(...rolls),bonus=(skill?skillBonus(skill):0)+Number(extra||0),total=best+bonus,critical=best===20,success=target==null?null:(critical||total>=target);pushRoll({label,dice:`${dice}d20`,rolls,best,bonus,total,target,success,critical});return total}
function rollTest(){const t=testMath();rollPool(t.attrKey,t.skill,t.combo,Number($("testEdge").value||0),t.target,t.skill||D.attributes[t.attrKey].label)}
function rollSingleDie(sides){const value=Math.floor(Math.random()*sides)+1;pushRoll({label:`d${sides}`,dice:`1d${sides}`,rolls:[value],best:value,bonus:0,total:value,target:null,success:null,critical:value===sides})}
function pushRoll(r){state.rollLog.unshift({...r,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});state.rollLog=state.rollLog.slice(0,30);const cls=r.success===true?" success":r.success===false?" fail":"";$("lastRoll").className=`last-roll${cls}`;$("lastRoll").innerHTML=`<span class="roll-label">${escapeHtml(r.label)}${r.target?` • alvo ${r.target}`:""}</span><strong class="roll-total">${r.total}</strong><span>${r.best}${r.bonus?` ${sign(r.bonus)}`:""}${r.critical?" • CRÍTICO":""}</span><div class="roll-dice">${r.rolls.join(" • ")}</div>`;renderRollHistory()}
function renderRollHistory(){const box=$("rollHistory");if(!box)return;box.innerHTML=state.rollLog.length?state.rollLog.map(r=>`<div class="history-entry ${r.success===true?"success":r.success===false?"fail":""}"><div><strong>${escapeHtml(r.label)}</strong><small> ${r.dice} • ${r.rolls.join(", ")}</small></div><strong>${r.total}</strong><small>${r.time}</small></div>`).join(""):'<div class="empty-state">Nenhuma rolagem ainda nesta sessão.</div>'}
function showView(id){
  const target=$(id);if(!target)return;
  document.querySelectorAll(".side-nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  if(id==="library")renderLibrary();
  target.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
function notice(message){
  const box=$("sessionFeedback");if(!box)return;box.textContent=message;
  clearTimeout(notice.timer);notice.timer=setTimeout(()=>box.textContent="",6500);
}
function readCharacters(){
  const raw=localStorage.getItem(STORAGE_KEY);if(raw==null)return [];
  const data=JSON.parse(raw);if(!Array.isArray(data)||data.some(x=>!x||typeof x!=="object"||Array.isArray(x)))throw new Error("Formato de fichas inválido");
  return data;
}
function migrateStorage(){
  try{
    if(localStorage.getItem(STORAGE_KEY)!==null){readCharacters();return;}
    for(const key of LEGACY_KEYS){const raw=localStorage.getItem(key);if(raw!==null){const data=JSON.parse(raw);if(!Array.isArray(data))throw new Error("Arquivo antigo inválido");localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return;}}
  }catch(error){notice("Não foi possível ler as fichas deste navegador. Os dados anteriores foram preservados. Você ainda pode editar e exportar JSON.");}
}
function collect(){return{version:"4.0",sourceVersion:state.sourceVersion,id:state.id||makeId(),savedAt:new Date().toISOString(),portrait:state.portrait,identity:{name:$("name").value,player:$("player").value,age:$("age").value,gender:$("gender").value,origin:$("origin").value,kingdom:$("kingdom").value,location:$("location").value,className:$("className").value,path:$("path").value,level:$("level").value,exp:$("exp").value,armor:$("armor").value,alignment:$("alignment").value},giftRoll:$("giftRoll").value,gifts:state.gifts,attributes:{...state.attributes},skills:{...state.skills},resources:{lpMax:$("lpMax").value,lpCurrent:$("lpCurrent").value,veilCurrent:$("veilCurrent").value,will:$("will").value},text:{inventory:$("inventory").value,abilities:$("abilities").value,traits:$("traits").value,notes:$("notes").value},powerSession:window.getPowerSession?window.getPowerSession():null}}
function saveCharacter(){
  const ch=collect();
  try{const all=readCharacters(),idx=all.findIndex(x=>x.id===ch.id);if(idx>=0)all[idx]=ch;else all.push(ch);localStorage.setItem(STORAGE_KEY,JSON.stringify(all));state.id=ch.id;markSaved();renderLibrary();notice("Ficha salva neste navegador.");}
  catch(error){notice("Não foi possível salvar. Os dados existentes foram preservados; exporte a ficha em JSON para guardá-la.");}
}
function applyCharacter(ch){
  state.id=String(ch.id||makeId());state.sourceVersion=String(ch.sourceVersion||ch.version||"3.0");
  const I={...(ch.identity||{})};if(I.kingdom==="Submundo"){I.kingdom="Reino da Chuva";I.location=I.location||"Submundo";}
  const defaults={level:1,exp:0,armor:0,origin:"Humano",kingdom:"Reino de Ferro",className:"Livre"};
  ["name","player","age","gender","origin","kingdom","location","className","path","level","exp","armor","alignment"].forEach(k=>{if($(k))$(k).value=I[k]??defaults[k]??"";});
  if(!$("className").value)$("className").value="Livre";
  $("level").value=level();$("giftRoll").value=ch.giftRoll?Math.trunc(clamp(ch.giftRoll,1,20)):"";
  state.attributes=Object.fromEntries(Object.keys(D.attributes).map(k=>[k,Math.trunc(clamp(ch.attributes?.[k]??1,1,6))]));
  state.skills=Object.fromEntries(Object.values(D.attributes).flatMap(a=>a.skills).map(k=>[k,Math.trunc(clamp(ch.skills?.[k]??0,0,5))]));
  state.gifts=Array.isArray(ch.gifts)?ch.gifts.filter(g=>g&&typeof g==="object").map(g=>({...g,name:String(g.name??""),type:D.giftTypes.includes(g.type)?g.type:"Primordial",description:String(g.description??""),techniques:Array.isArray(g.techniques)?g.techniques.filter(t=>t&&typeof t==="object"):[]})):[];
  state.portrait=/^data:image\/(png|jpeg|webp);base64,/.test(ch.portrait||"")?ch.portrait:"";
  document.querySelectorAll(".attr-input").forEach(el=>el.value=state.attributes[el.dataset.key]);
  document.querySelectorAll(".skill-input").forEach(el=>el.value=state.skills[el.dataset.skill]);
  $("lpMax").value=ch.resources?.lpMax??25;$("lpCurrent").value=ch.resources?.lpCurrent??25;$("veilCurrent").value=ch.resources?.veilCurrent??"";$("will").value=ch.resources?.will??0;
  ["inventory","abilities","traits","notes"].forEach(k=>$(k).value=ch.text?.[k]||"");
  if(window.setPowerSession)window.setPowerSession(ch.powerSession);
  renderGifts(giftInfo($("giftRoll").value).count||0,true);renderPortrait();recalc();markSaved();showView("overview");
}
function loadCharacter(id){
  if(state.dirty&&!confirm("Abrir outra ficha e descartar as alterações ainda não salvas?"))return;
  try{const ch=readCharacters().find(x=>String(x.id)===String(id));if(ch)applyCharacter(ch);}catch(error){notice("Não foi possível abrir esta ficha. Os dados salvos foram preservados.");}
}
function deleteCharacter(id){
  if(!confirm("Excluir esta ficha salva?"))return;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(readCharacters().filter(x=>String(x.id)!==String(id))));if(String(state.id)===String(id)){state.id=null;markDirty();}renderLibrary();notice("Ficha removida da lista salva.");}catch(error){notice("Não foi possível excluir a ficha.");}
}
function renderLibrary(){
  try{const all=readCharacters();$("savedCharacters").innerHTML=all.length?all.map(ch=>`<article class="card"><span class="kicker">NÍVEL ${escapeHtml(ch.identity?.level||1)} · V${escapeHtml(ch.version||"3")}</span><h3>${escapeHtml(ch.identity?.name||"Sem nome")}</h3><p>${escapeHtml(ch.identity?.origin||"")} • ${escapeHtml(ch.identity?.className||"Livre")}</p><p>${escapeHtml(ch.identity?.kingdom||"")}${ch.identity?.location?` • ${escapeHtml(ch.identity.location)}`:""}</p><div class="card-actions"><button type="button" data-load="${escapeHtml(ch.id)}">Abrir</button><button type="button" class="danger" data-delete="${escapeHtml(ch.id)}">Excluir</button></div></article>`).join(""):'<div class="empty-state">Sua primeira história começa aqui. Preencha e salve a ficha para encontrá-la nesta lista.</div>';}catch(error){$("savedCharacters").innerHTML='<div class="empty-state">Não foi possível ler os dados locais. Eles não foram substituídos. Você pode importar ou exportar uma ficha JSON.</div>';}
}
function resetForm(){
  if(state.dirty&&!confirm("Criar uma ficha nova e descartar as alterações ainda não salvas?"))return;
  state.id=null;state.sourceVersion="4.0";state.gifts=[];state.portrait="";state.rollLog=[];
  Object.keys(state.attributes).forEach(k=>state.attributes[k]=1);Object.keys(state.skills).forEach(k=>state.skills[k]=0);
  ["name","player","age","gender","path","alignment","location","giftRoll","inventory","abilities","traits","notes"].forEach(k=>$(k).value="");
  $("level").value=1;$("exp").value=0;$("armor").value=0;$("lpMax").value=25;$("lpCurrent").value=25;$("veilCurrent").value=8;$("will").value=0;$("className").value="Livre";$("origin").value="Humano";$("kingdom").value="Reino de Ferro";
  document.querySelectorAll(".attr-input").forEach(el=>el.value=1);document.querySelectorAll(".skill-input").forEach(el=>el.value=0);
  if(window.setPowerSession)window.setPowerSession(null);
  renderGifts(0,true);renderPortrait();renderRollHistory();$("lastRoll").className="last-roll empty";$("lastRoll").innerHTML="<span>Clique em um atributo, perícia ou dado.</span>";markDirty();recalc();showView("overview");
}
function handlePortrait(e){const file=e.target.files?.[0];if(!file)return;if(file.size>6*1024*1024){alert("Escolha uma imagem de até 6 MB.");return}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),size=320;c.width=size;c.height=size;const ctx=c.getContext("2d"),scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);state.portrait=c.toDataURL("image/jpeg",.78);renderPortrait();markDirty()};img.src=reader.result};reader.readAsDataURL(file)}
function renderPortrait(){const img=$("portraitImage"),fallback=$("portraitFallback");if(state.portrait){img.src=state.portrait;img.hidden=false;fallback.hidden=true}else{img.removeAttribute("src");img.hidden=true;fallback.hidden=false}}
init();
