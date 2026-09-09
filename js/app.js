const D = window.RPG_DATA;
const C = window.PENTA_CHARACTER;
const $ = id => document.getElementById(id);
const STORAGE_KEY = "thaalemor_characters_v4";
const LEGACY_KEYS = ["thaalemor_characters_v3", "thaalemor_characters_v2"];
// Preserve storage keys so the new page can open existing characters on the same origin.
const VIEW_TITLES = {overview:"Identidade",skills:"Perícias",gifts:"Dons",combat:"Combate & Dados",content:"Anotações",library:"Personagens"};
const state = {sourceVersion:"4.0",id:null,awakeningKey:null,awakening:{attempts:0,result:null,locked:false},build:{className:"Livre",level:1},attributes:{},skills:{},gifts:[],portrait:"",rollLog:[],dirty:false,legacyIdentity:{},allocationArchive:null};
const creationContext = () => ({...state.build,awakening:state.awakening});
const slug = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\W+/g,"_").toLowerCase();
const sign = n => `${n >= 0 ? "+" : ""}${n}`;
const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function makeId(){return globalThis.crypto?.randomUUID?.() || `te_${Date.now()}_${Math.random().toString(16).slice(2)}`;}
function level(){return state.build.level;}
function attributeCap(){return C.attributeCap(level());}
function skillRankCap(){return C.skillCap(level());}
function classData(){return D.classes[state.build.className]||D.classes.Livre;}
function classRanks(name){return Number(classData().freeRanks?.[name]||0)}
function flatSkillMod(name){return Number(classData().flatMods?.[name]||0)}
function rawSkillRank(name){return Math.max(0,Number(state.skills[name]||0))+classRanks(name)}
function effectiveSkillRank(name){return Math.min(D.balance.skillEffectiveAbsoluteCap||7,rawSkillRank(name))}
function skillBonusFromRank(rank){const full=Math.min(rank,D.balance.skillFullBonusRanks||4);return full*D.balance.skillBonusPerRank+Math.max(0,rank-full)}
function skillBonus(name){return skillBonusFromRank(effectiveSkillRank(name))+flatSkillMod(name)}
function investedAttributes(){return Object.values(state.attributes).reduce((n,v)=>n+Math.max(0,Number(v)-1),0)}
function investedSkills(){return Object.values(state.skills).reduce((n,v)=>n+Math.max(0,Number(v)),0)}
function giftInfo(raw){if(!raw)return {count:null,attributes:0,skills:0,label:""};const r=clamp(raw,1,20);return D.giftTable.find(row=>r>=row.min&&r<=row.max)||D.giftTable[0]}
function budgets(){return C.budget(D,creationContext());}
function skillAttrKey(skill){return Object.entries(D.attributes).find(([,a])=>a.skills.includes(skill))?.[0]||"fortitude"}
function markDirty(){state.dirty=true;$("saveState").textContent="Não salvo";$("saveState").style.color="";if(window.queueCharacterDraft)window.queueCharacterDraft();}
function markSaved(){state.dirty=false;$("saveState").textContent="Salvo localmente";$("saveState").style.color=""}

function init(){
  state.id=makeId();state.awakeningKey=state.id;
  migrateStorage();
  Object.keys(D.origins).forEach(k=>$("origin").add(new Option(k,k)));
  D.kingdoms.forEach(k=>$("kingdom").add(new Option(k,k)));
  populateBirthplaces();
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
  bindEvents();populateTestSkills();recalc();renderLibrary();renderRollHistory();
  showView(viewFromHash(),{recordHistory:false});
}
function bindEvents(){
  document.querySelectorAll(".side-nav-btn").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
  document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.jump,{focusPanel:true})));
  const tabs=document.querySelector('.side-nav');
  const mobileTabs=window.matchMedia('(max-width: 860px)');
  const orientTabs=()=>tabs.setAttribute('aria-orientation',mobileTabs.matches?'horizontal':'vertical');
  orientTabs();mobileTabs.addEventListener('change',orientTabs);
  tabs.addEventListener('keydown',event=>{
    const buttons=[...tabs.querySelectorAll('[role="tab"]')];
    const current=buttons.indexOf(event.target);if(current<0)return;
    const nextKey=mobileTabs.matches?'ArrowRight':'ArrowDown';
    const prevKey=mobileTabs.matches?'ArrowLeft':'ArrowUp';
    let next;
    if(event.key===nextKey)next=(current+1)%buttons.length;
    else if(event.key===prevKey)next=(current+buttons.length-1)%buttons.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=buttons.length-1;
    else return;
    event.preventDefault();showView(buttons[next].dataset.view);buttons[next].focus({preventScroll:true});
  });
  window.addEventListener('hashchange',()=>showView(viewFromHash(),{recordHistory:false}));
  document.querySelectorAll("[data-collapse]").forEach(b=>b.addEventListener("click",()=>{const el=$(b.dataset.collapse);el.hidden=!el.hidden;b.textContent=el.hidden?"+":"−";b.setAttribute("aria-expanded",String(!el.hidden))}));
  document.querySelectorAll(".content-tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".content-tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".content-pane").forEach(x=>x.classList.toggle("active",x.id===b.dataset.contentTab))}));
  document.addEventListener("input",handleInput);
  document.addEventListener("change",handleInput);
  document.addEventListener("click",handleClick);
  $("rollGifts").addEventListener("click",()=>window.rollAwakening?.());
  $("keepGiftRoll").addEventListener("click",()=>window.keepAwakening?.());
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
  window.addEventListener("beforeunload",e=>{if(window.persistCharacterDraft)window.persistCharacterDraft();if(state.dirty){e.preventDefault();e.returnValue="";}});

}
function handleClick(e){
  const attr=e.target.closest("[data-roll-attr]");if(attr){rollPool(attr.dataset.rollAttr,"",0,0,null,D.attributes[attr.dataset.rollAttr].label);return}
  const skill=e.target.closest("[data-roll-skill]");if(skill){const name=skill.dataset.rollSkill;rollPool(skillAttrKey(name),name,0,0,null,name);return}
  const step=e.target.closest("[data-skill-step]");if(step){const name=step.dataset.skillStep;allocatePoint("skills",name,Number(state.skills[name]||0)+Number(step.dataset.delta));return;}
  const r=e.target.closest("[data-resource]");if(r){changeResource(r.dataset.resource,Number(r.dataset.delta));return}
  const die=e.target.closest("[data-die]");if(die){rollSingleDie(Number(die.dataset.die));return}
  const load=e.target.closest("[data-load]");if(load){loadCharacter(load.dataset.load);return}
  const del=e.target.closest("[data-delete]");if(del){deleteCharacter(del.dataset.delete);return}
}
function handleInput(e){
  if(e.target.matches("[data-gift]")){const i=Number(e.target.dataset.gift),field=e.target.dataset.field;if(state.gifts[i]&&["name","type","description"].includes(field))state.gifts[i][field]=e.target.value;markDirty();if(window.refreshPowerOutputs)window.refreshPowerOutputs();return}
  if(e.target.classList.contains("attr-input")){allocatePoint("attributes",e.target.dataset.key,e.target.value);return;}
  if(e.target.classList.contains("skill-input")){allocatePoint("skills",e.target.dataset.skill,e.target.value);return;}
  if(["level","className"].includes(e.target.id)){changeBuild();return;}
  if(e.target.id==="giftRoll"){recalc();return;}
  if(e.target.id==="kingdom"){populateBirthplaces();markDirty();recalc();return;}
  const calcIds=new Set(["armor","lpMax","lpCurrent","veilCurrent","will","origin"]);
  if(calcIds.has(e.target.id)){markDirty();recalc();return}
  if(["name","path","player","age","gender","location","abilities","inventory","traits","notes","exp"].includes(e.target.id)){markDirty();updateMiniProfile()}
}
function recalc(){
  const fitted=C.fit(D,creationContext(),state);state.attributes=fitted.attributes;state.skills=fitted.skills;
  $("giftRoll").value=state.awakening.result??"";$("className").value=state.build.className;$("level").value=state.build.level;
  const g=giftInfo(state.awakening.result),b=budgets(),c=classData();
  $("giftCount").textContent=g.count??"—";$("attributeBudget").textContent=$("giftRoll").value?b.a:"—";$("skillBudget").textContent=$("giftRoll").value?b.s:"—";
  $("giftRollMini").textContent=$("giftRoll").value||"—";$("giftCountMini").textContent=g.count??"—";$("budgetMini").textContent=$("giftRoll").value?`${b.a}A / ${b.s}P`:"—";
  renderGifts(g.count||0);
  $("attributeCounter").textContent=`${investedAttributes()} / ${b.a} usados · ${Math.max(0,b.a-investedAttributes())} restantes`;
  $("skillCounter").textContent=`${investedSkills()} / ${b.s} usados · ${Math.max(0,b.s-investedSkills())} restantes`;
  Object.entries(state.attributes).forEach(([k,v])=>{const d=$(`attrDisplay_${k}`);if(d)d.textContent=v});
  Object.keys(state.skills).forEach(name=>{const free=classRanks(name),rank=effectiveSkillRank(name),bonus=skillBonus(name);const input=document.querySelector(`.skill-input[data-skill="${CSS.escape(name)}"]`);if(input)input.max=skillRankCap();$(`class_${slug(name)}`).textContent=free?`Classe +${free}`:"Classe +0";$(`rank_${slug(name)}`).textContent=rank;const be=$(`bonus_${slug(name)}`);be.textContent=sign(bonus);be.classList.toggle("negative",bonus<0)});
  const lpMax=Math.max(1,Number($("lpMax").value)||1);$("lpMax").value=lpMax;$("lpCurrent").value=clamp($("lpCurrent").value,0,lpMax);
  const veilMax=Math.floor(lpMax/(c.veilDivisor||3));$("veilMax").value=veilMax;$("veilCurrent").value=clamp($("veilCurrent").value===""?veilMax:$("veilCurrent").value,0,veilMax);
  const defense=10+Number(state.attributes.fortitude||1)+skillBonus("Defesa")+Number($("armor").value||0);const movement=D.balance.baseMovement+effectiveSkillRank("Vigor")*D.balance.vigorMetersPerRank;
  $("defenseDisplay").textContent=defense;$("movementDisplay").textContent=`${movement}m`;$("aimRange").textContent=`+${effectiveSkillRank("Mira")*D.balance.miraMetersPerRank}m`;$("powerRange").textContent=`+${effectiveSkillRank("Potência")*D.balance.potencyMetersPerRank}m`;$("powerDamage").textContent=sign(effectiveSkillRank("Potência")*D.balance.potencyDamagePerRank);
  $("railDefense").textContent=defense;$("railLP").textContent=`${$("lpCurrent").value}/${lpMax}`;$("railVeil").textContent=`${$("veilCurrent").value}/${veilMax}`;$("railMove").textContent=`${movement}m`;
  updateBars();renderClassSummary();renderBuildHighlights();renderWarnings();updateMiniProfile();updateTestPreview();renderAllocation();if(window.refreshPowerOutputs)window.refreshPowerOutputs();if(window.refreshCreationUI)window.refreshCreationUI();
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
function rollPool(attrKey,skill="",extra=0,edge=0,target=null,label="Teste"){if(!budgets().ready){notice("Defina o despertar antes de fazer testes com a ficha.");return null;}const dice=Math.max(1,Number(state.attributes[attrKey]||1)+Number(edge||0)),rolls=Array.from({length:dice},()=>Math.floor(Math.random()*20)+1),best=Math.max(...rolls),bonus=(skill?skillBonus(skill):0)+Number(extra||0),total=best+bonus,critical=best===20,success=target==null?null:(critical||total>=target);pushRoll({label,dice:`${dice}d20`,rolls,best,bonus,total,target,success,critical});return total}
function rollTest(){const t=testMath();rollPool(t.attrKey,t.skill,t.combo,Number($("testEdge").value||0),t.target,t.skill||D.attributes[t.attrKey].label)}
function rollSingleDie(sides){const value=Math.floor(Math.random()*sides)+1;pushRoll({label:`d${sides}`,dice:`1d${sides}`,rolls:[value],best:value,bonus:0,total:value,target:null,success:null,critical:value===sides})}
function pushRoll(r){state.rollLog.unshift({...r,time:new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})});state.rollLog=state.rollLog.slice(0,30);const cls=r.success===true?" success":r.success===false?" fail":"";$("lastRoll").className=`last-roll${cls}`;$("lastRoll").innerHTML=`<span class="roll-label">${escapeHtml(r.label)}${r.target?` • alvo ${r.target}`:""}</span><strong class="roll-total">${r.total}</strong><span>${r.best}${r.bonus?` ${sign(r.bonus)}`:""}${r.critical?" • CRÍTICO":""}</span><div class="roll-dice">${r.rolls.join(" • ")}</div>`;renderRollHistory();if(window.matchMedia("(max-width: 1180px)").matches)notice(`${r.label}: ${r.total}${r.critical?" · CRÍTICO":""}${r.success===true?" · sucesso":r.success===false?" · falha":""}`)}
function renderRollHistory(){const box=$("rollHistory");if(!box)return;box.innerHTML=state.rollLog.length?state.rollLog.map(r=>`<div class="history-entry ${r.success===true?"success":r.success===false?"fail":""}"><div><strong>${escapeHtml(r.label)}</strong><small> ${r.dice} • ${r.rolls.join(", ")}</small></div><strong>${r.total}</strong><small>${r.time}</small></div>`).join(""):'<div class="empty-state">Nenhuma rolagem ainda nesta sessão.</div>'}
function viewFromHash(){
  const id=window.location.hash.slice(1);
  return Object.hasOwn(VIEW_TITLES,id)?id:'overview';
}
function showView(id,{recordHistory=true,focusPanel=false}={}){
  if(!Object.hasOwn(VIEW_TITLES,id))return;
  const target=$(id);if(!target)return;
  document.querySelectorAll('.view').forEach(panel=>{const active=panel===target;panel.hidden=!active;panel.classList.toggle('active',active);});
  document.querySelectorAll(".side-nav-btn").forEach(button=>{
    const active=button.dataset.view===id;
    button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  });
  $('viewTitle').textContent=VIEW_TITLES[id];
  document.title=VIEW_TITLES[id]+' | Fichas · Penta-Reign';
  if(id==="library")renderLibrary();
  if(recordHistory&&window.location.hash!=='#'+id){
    try{window.history.pushState(null,'','#'+id);}catch(error){/* Local file URLs may restrict history changes. */}
  }
  if(focusPanel)target.focus({preventScroll:true});
  window.scrollTo(0,0);
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
function collect(){return{version:"4.0",sourceVersion:state.sourceVersion,id:state.id,awakeningKey:state.awakeningKey,awakening:{...state.awakening},legacyIdentity:state.legacyIdentity,allocationArchive:state.allocationArchive,savedAt:new Date().toISOString(),portrait:state.portrait,identity:{name:$("name").value,player:$("player").value,age:$("age").value,gender:$("gender").value,origin:$("origin").value,kingdom:$("kingdom").value,location:$("location").value,className:state.build.className,path:$("path").value,level:level(),exp:$("exp").value,armor:$("armor").value,alignment:$("alignment").value},giftRoll:state.awakening.result??"",gifts:state.gifts,attributes:{...state.attributes},skills:{...state.skills},resources:{lpMax:$("lpMax").value,lpCurrent:$("lpCurrent").value,veilCurrent:$("veilCurrent").value,will:$("will").value},text:{inventory:$("inventory").value,abilities:$("abilities").value,traits:$("traits").value,notes:$("notes").value},powerSession:window.getPowerSession?window.getPowerSession():null}}
function saveCharacter(){
  const ch=collect();
  try{const all=readCharacters(),idx=all.findIndex(x=>x.id===ch.id);if(idx>=0)all[idx]=ch;else all.push(ch);localStorage.setItem(STORAGE_KEY,JSON.stringify(all));state.id=ch.id;markSaved();if(window.persistCharacterDraft)window.persistCharacterDraft();renderLibrary();notice("Ficha salva neste navegador.");}
  catch(error){notice("Não foi possível salvar. Os dados existentes foram preservados; exporte a ficha em JSON para guardá-la.");}
}
function applyCharacter(ch,{fromDraft=false}={}){
  const resolved=window.resolveCharacterCreation?window.resolveCharacterCreation(ch):C.awakening(ch.awakening,ch.giftRoll);
  state.id=String(ch.id||makeId());state.awakeningKey=String(ch.awakeningKey||ch.id||state.id);state.awakening=resolved;
  state.sourceVersion=String(ch.sourceVersion||ch.version||"3.0");
  const I={...(ch.identity||{})};if(I.kingdom==="Submundo"){I.kingdom="Reino da Chuva";I.location=I.location||"Submundo";}
  state.build={className:Object.hasOwn(D.classes,I.className)?I.className:"Livre",level:Math.trunc(clamp(I.level||1,1,10))};
  state.legacyIdentity={...(ch.legacyIdentity||{})};
  const defaults={exp:0,armor:0,origin:"Humano",kingdom:"Reino de Ferro"};
  ["name","player","age","gender","origin","kingdom","path","exp","armor"].forEach(k=>{$(k).value=I[k]??defaults[k]??"";});
  if(!$("kingdom").value)$("kingdom").value="Reino de Ferro";
  if(!$("origin").value)$("origin").value="Humano";
  if(I.location&&!C.locationsFor($("kingdom").value).includes(I.location))state.legacyIdentity.location=String(I.location);
  if(!ch.awakening&&I.alignment)state.legacyIdentity.alignment=String(I.alignment);
  populateBirthplaces(I.location||"");
  const fitted=C.fit(D,creationContext(),{attributes:ch.attributes,skills:ch.skills});
  state.attributes=fitted.attributes;state.skills=fitted.skills;
  state.allocationArchive=fitted.changed?{attributes:ch.attributes||{},skills:ch.skills||{}}:ch.allocationArchive||null;
  state.gifts=Array.isArray(ch.gifts)?ch.gifts.filter(g=>g&&typeof g==="object").map(g=>({...g,name:String(g.name??""),type:D.giftTypes.includes(g.type)?g.type:"Primordial",description:String(g.description??""),techniques:Array.isArray(g.techniques)?g.techniques.filter(t=>t&&typeof t==="object"):[]})):[];
  state.portrait=/^data:image\/(png|jpeg|webp);base64,/.test(ch.portrait||"")?ch.portrait:"";
  $("lpMax").value=ch.resources?.lpMax??25;$("lpCurrent").value=ch.resources?.lpCurrent??25;$("veilCurrent").value=ch.resources?.veilCurrent??"";$("will").value=ch.resources?.will??0;
  ["inventory","abilities","traits","notes"].forEach(k=>$(k).value=ch.text?.[k]||"");
  if(window.setPowerSession)window.setPowerSession(ch.powerSession);
  renderGifts(giftInfo(state.awakening.result).count||0,true);renderPortrait();recalc();
  if(fromDraft||fitted.changed)markDirty();else markSaved();
  if(!fromDraft)showView(budgets().ready?"overview":"gifts",{focusPanel:true});
  if(fitted.changed)notice("A distribuição foi ajustada ao orçamento disponível. O registro recebido está guardado para consulta.");
  if(window.persistCharacterDraft)window.persistCharacterDraft();
  return {adjusted:fitted.changed};
}
function loadCharacter(id){
  if(state.dirty&&!confirm("Abrir outra ficha e descartar as alterações ainda não salvas?"))return;
  try{const ch=readCharacters().find(x=>String(x.id)===String(id));if(ch)applyCharacter(ch);}catch(error){notice("Não foi possível abrir esta ficha. Os dados salvos foram preservados.");}
}
function deleteCharacter(id){
  if(!confirm("Excluir esta ficha salva?"))return;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(readCharacters().filter(x=>String(x.id)!==String(id))));if(String(state.id)===String(id)){markDirty();}renderLibrary();notice("Ficha removida da lista salva.");}catch(error){notice("Não foi possível excluir a ficha.");}
}
function renderLibrary(){
  try{const all=readCharacters();$("savedCharacters").innerHTML=all.length?all.map(ch=>`<article class="card"><span class="kicker">NÍVEL ${escapeHtml(ch.identity?.level||1)}</span><h3>${escapeHtml(ch.identity?.name||"Sem nome")}</h3><p>${escapeHtml(ch.identity?.origin||"")} • ${escapeHtml(ch.identity?.className||"Livre")}</p><p>${escapeHtml(ch.identity?.kingdom||"")}${ch.identity?.location?` • ${escapeHtml(ch.identity.location)}`:""}</p><div class="card-actions"><button type="button" data-load="${escapeHtml(ch.id)}">Abrir</button><button type="button" class="danger" data-delete="${escapeHtml(ch.id)}">Excluir</button></div></article>`).join(""):'<div class="empty-state">Sua primeira história começa aqui. Preencha e salve a ficha para encontrá-la nesta lista.</div>';}catch(error){$("savedCharacters").innerHTML='<div class="empty-state">Não foi possível ler os dados locais. Eles não foram substituídos. Você pode importar ou exportar uma ficha JSON.</div>';}
}
function resetForm(){
  if(state.dirty&&!confirm("Criar uma ficha nova e descartar as alterações ainda não salvas?"))return;
  state.id=makeId();state.awakeningKey=state.id;state.awakening={attempts:0,result:null,locked:false};state.build={className:"Livre",level:1};state.legacyIdentity={};state.allocationArchive=null;state.sourceVersion="4.0";state.gifts=[];state.portrait="";state.rollLog=[];
  Object.keys(state.attributes).forEach(k=>state.attributes[k]=1);Object.keys(state.skills).forEach(k=>state.skills[k]=0);
  ["name","player","age","gender","path","alignment","location","giftRoll","inventory","abilities","traits","notes"].forEach(k=>$(k).value="");
  $("level").value=1;$("exp").value=0;$("armor").value=0;$("lpMax").value=25;$("lpCurrent").value=25;$("veilCurrent").value=8;$("will").value=0;$("className").value="Livre";$("origin").value="Humano";$("kingdom").value="Reino de Ferro";
  document.querySelectorAll(".attr-input").forEach(el=>el.value=1);document.querySelectorAll(".skill-input").forEach(el=>el.value=0);
  populateBirthplaces("");
  if(window.setPowerSession)window.setPowerSession(null);
  renderGifts(0,true);renderPortrait();renderRollHistory();$("lastRoll").className="last-roll empty";$("lastRoll").innerHTML="<span>Clique em um atributo, perícia ou dado.</span>";markDirty();recalc();if(window.persistCharacterDraft)window.persistCharacterDraft();showView("gifts",{focusPanel:true});
}
function handlePortrait(e){const file=e.target.files?.[0];if(!file)return;if(file.size>6*1024*1024){alert("Escolha uma imagem de até 6 MB.");return}const reader=new FileReader();reader.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),size=320;c.width=size;c.height=size;const ctx=c.getContext("2d"),scale=Math.max(size/img.width,size/img.height),w=img.width*scale,h=img.height*scale;ctx.drawImage(img,(size-w)/2,(size-h)/2,w,h);state.portrait=c.toDataURL("image/jpeg",.78);renderPortrait();markDirty()};img.src=reader.result};reader.readAsDataURL(file)}
function renderPortrait(){const img=$("portraitImage"),fallback=$("portraitFallback");if(state.portrait){img.src=state.portrait;img.hidden=false;fallback.hidden=true}else{img.removeAttribute("src");img.hidden=true;fallback.hidden=false}}

function allocatePoint(type,key,value){
  const result=C.setPoint(D,creationContext(),state,type,key,value);
  state.attributes=result.allocation.attributes;state.skills=result.allocation.skills;
  markDirty();recalc();
  if(result.limited)notice(budgets().ready?"Você atingiu o orçamento disponível ou o teto deste campo.":"Defina o despertar antes de distribuir pontos.");
}
function changeBuild(){
  const next={className:Object.hasOwn(D.classes,$("className").value)?$("className").value:"Livre",level:Math.trunc(clamp($("level").value||1,1,10))};
  if(next.className===state.build.className&&next.level===state.build.level){$("className").value=state.build.className;$("level").value=state.build.level;return;}
  const candidate=C.fit(D,{...next,awakening:state.awakening},state);
  if(candidate.changed){$("className").value=state.build.className;$("level").value=state.build.level;notice("Essa mudança reduziria seu orçamento ou teto. Remova os pontos excedentes antes de alterar classe ou nível.");return;}
  state.build=next;markDirty();recalc();
}
function populateBirthplaces(preferred=$("location").value){
  const values=C.locationsFor($("kingdom").value);
  $("location").innerHTML='<option value="">Escolha o local</option>'+values.map(value=>'<option value="'+escapeHtml(value)+'">'+escapeHtml(value)+'</option>').join("");
  $("location").value=values.includes(preferred)?preferred:"";
}
function renderAllocation(){
  const b=budgets(),remainingA=Math.max(0,b.a-investedAttributes()),remainingS=Math.max(0,b.s-investedSkills());
  $("attributeAllocation").disabled=!b.ready;$("skillAllocation").disabled=!b.ready;
  document.querySelectorAll(".attr-input").forEach(el=>{const value=state.attributes[el.dataset.key];el.value=value;el.max=b.ready?Math.min(b.attributeCap,value+remainingA):1;});
  document.querySelectorAll(".skill-input").forEach(el=>{const value=state.skills[el.dataset.skill];el.value=value;el.max=b.ready?Math.min(b.skillCap,value+remainingS):0;});
  document.querySelectorAll("[data-skill-step]").forEach(button=>{const value=state.skills[button.dataset.skillStep];button.disabled=!b.ready||(Number(button.dataset.delta)>0?(remainingS===0||value>=b.skillCap):value===0);});
  const result=C.alignment(D,state.attributes,state.build.className);
  $("alignment").value=b.ready?result.name:"Aguardando despertar";
  $("alignmentDescription").textContent=b.ready?result.labels.join(" + ")+" · "+result.description+(result.tied?" Empate resolvido pela afinidade da classe.":""):"Defina seus dons e distribua atributos para revelar sua afinidade.";
  $("budgetBreakdown").textContent=state.awakening.result===null?"Role e defina seu despertar para conhecer os pontos disponíveis.":`Despertar: ${b.baseA} atributos e ${b.baseS} perícias. Classe: ${sign(b.classA)} atributos e ${sign(b.classS)} perícias. Nível: +${b.growthA} atributos e +${b.growthS} perícias. Total: ${b.a} atributos e ${b.s} perícias. Tetos por campo: ${b.attributeCap} em atributos e ${b.skillCap} pontos investidos em cada perícia.`;
  $("allocationGate").hidden=b.ready;
  const records=[];
  if(state.legacyIdentity.location)records.push("Nascimento registrado anteriormente: "+state.legacyIdentity.location);
  if(state.legacyIdentity.alignment)records.push("Alinhamento registrado anteriormente: "+state.legacyIdentity.alignment);
  if(state.allocationArchive){records.push("Distribuição recebida antes do ajuste: "+Object.entries(state.allocationArchive.attributes||{}).map(([key,value])=>(D.attributes[key]?.label||key)+" "+value).join(", "));records.push("Perícias recebidas antes do ajuste: "+Object.entries(state.allocationArchive.skills||{}).filter(([,value])=>Number(value)>0).map(([key,value])=>key+" "+value).join(", "));}
  $("legacyCreation").hidden=!records.length;$("legacyCreationText").textContent=records.join("\n");
}

init();
