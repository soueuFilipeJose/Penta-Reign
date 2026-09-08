/* Interface do construtor. Os campos editáveis não são recriados durante a digitação. */
(() => {
  'use strict';
  const P=window.THAAL_POWER;
  let session={turn:1,used:{main:false,bonus:false,reaction:false},ongoing:null};
  let lastResult='';
  const categories={Primordial:'Criação e controle de matéria e elementos.',Vitálio:'Transformações do corpo e da energia vital.',Synithar:'Pensamento, percepção e consciência.',Occultus:'Forças ocultas, espíritos e manifestações arcanas.',Phantaso:'Ilusões, sentidos e aparências.',Sanátio:'Restauração, proteção e fluxo vital.',Summanu:'Invocação e vínculo com seres e presenças.',Indilus:'Manifestações singulares. Escolha efeitos mecânicos delimitados.',Proibido:'Exige acordo explícito da mesa. A natureza proibida não remove os limites de uma técnica.'};
  const context=()=>({level:level(),potency:effectiveSkillRank('Potência'),mira:effectiveSkillRank('Mira'),arcana:effectiveSkillRank('Manipulação Arcana')});
  const count=()=>giftInfo($('giftRoll').value).count||0;
  const technique=(g,i)=>state.gifts[g]?.techniques?.[i];
  const options=(values,selected,label=v=>String(v))=>values.map(v=>`<option value="${escapeHtml(v)}" ${String(v)===String(selected)?'selected':''}>${escapeHtml(label(v))}</option>`).join('');
  const select=(g,i,t,key,label,values,getLabel)=>`<label>${label}<select data-tech="${g}:${i}" data-prop="${key}">${options(values,t[key],getLabel)}</select></label>`;
  const num=(g,i,t,key,label,min,max)=>`<label>${label}<input type="number" min="${min}" max="${max}" step="1" value="${escapeHtml(t[key])}" data-tech="${g}:${i}" data-prop="${key}"></label>`;
  function spellCombo(){return P.combo([1,2].map(i=>({name:$(`comboSource${i}`).value,value:Number($(`comboValue${i}`).value)})));}
  function activeErrors(g,i){
    const errors=[];
    if(g>=count())errors.push('Este dom está arquivado pela rolagem atual.');
    if(i>=P.slots(count(),g))errors.push('Esta técnica excede os espaços deste dom.');
    if(!state.gifts[g]?.name.trim())errors.push('Dê um nome ao dom que origina esta técnica.');
    if(state.gifts[g]?.type==='Proibido'&&!state.gifts[g].masterAgreement)errors.push('Registre o acordo da mesa para este Dom Proibido.');
    if(level()===1&&count()>1&&state.gifts.slice(0,count()).some(x=>x.type==='Proibido'))errors.push('No nível 1, o livro exige que um Dom Proibido seja o único dom. A mesa precisa ajustar o despertar antes de usá-lo.');
    return errors;
  }
  function resultFor(g,i){const r=P.evaluate(technique(g,i)||{},context());r.errors.push(...activeErrors(g,i));r.valid=r.errors.length===0;return r;}
  function effectNote(r){
    const t=r.technique,notes=[];
    if(t.effect==='damage')notes.push(r.canCrit?'Teste DOM + Canalização contra Defesa. Errou: nenhum dano, Véu e ação já gastos. Crítico natural 20 dobra somente os dados.':'Cada alvo faz resistência contra DT '+r.dc+'. Sucesso reduz o dano pela metade (para baixo) e evita a condição. Sem crítico.');
    if(t.effect==='heal')notes.push('Recupera LP uma única vez, sem ultrapassar o máximo. Não ressuscita, não restaura Véu, não remove estados e não gera regeneração passiva.');
    if(t.effect==='barrier')notes.push('Pontos de barreira absorvem dano antes dos LP e são consumidos. Não se renovam por ciclo. Barreiras não acumulam: mantenha apenas a maior. '+(t.action==='reaction'?'Use após confirmar o acerto, antes de rolar dano; a barreira vale só para esse golpe.':'O saldo expira ao fim da duração.'));
    if(t.effect==='control')notes.push('Resistência do alvo contra DT '+r.dc+' anula a condição. Não exige acerto. Empurrar/desarmar acontece uma vez; outras condições terminam, no máximo, no início do seu próximo turno ou na duração sustentada.');
    if(t.control!=='none'){
      notes.push((P.controls[t.control]?.label||'Condição inválida')+'. '+(t.effect==='damage'&&r.canCrit?'Mesmo com acerto, o alvo pode resistir contra DT '+r.dc+' para evitar a condição. ':''));
      notes.push('Resistência física: FOR + Resistência (Reflexos para desarmar/empurrar). Mental: SOR + Equilíbrio Espiritual. Defina a natureza ao criar. Sucesso vence empate.');
      if(t.control==='stun')notes.push('O alvo perde somente a próxima ação principal, até o fim do próximo turno dele. Depois fica imune a Interromper por 2 ciclos, de qualquer fonte. Não há acúmulo de perda de ações.');
      else notes.push('Condições iguais não acumulam. Condições sustentadas permitem nova resistência no fim de cada turno do alvo; sucesso encerra. O alvo mantém ações salvo a condição Interromper.');
    }
    if(t.effect==='utility')notes.push(P.utilities[t.utility]?.label||'Escolha uma utilidade.','A aparência pode mudar, mas os números e o efeito são os definidos aqui. Ilusões podem ser percebidas com VIS + Observação contra DT '+r.dc+' ao investigar ou interagir; não forçam crença, cegueira ou obediência.');
    if(t.effect==='utility'&&t.utility==='step')notes.push('Exige linha de efeito além de visão; não atravessa barreiras que bloqueiam a manifestação.');
    if(t.effect==='utility'&&t.utility==='flight')notes.push('Substitui até 6 m do movimento normal por movimento aéreo, sem adicionar deslocamento. Ao perder concentração, resolva a queda na mesa.');
    if(t.effect==='utility'&&t.utility==='aid')notes.push('Especifique a perícia na descrição. O próximo teste dessa perícia recebe +2 antes do início do seu próximo turno; depois o efeito termina. O bônus ocupa uma fonte do combo, limitado a +6, e não acumula com outro Auxílio. Não aumenta graus de perícia, LP, Véu, Defesa, DT ou dano.');
    if(t.effect==='utility'&&t.utility==='thought')notes.push('Um alvo consciente e visível testa SOR + Equilíbrio Espiritual contra DT '+r.dc+'. Sucesso impede a leitura. Falha revela apenas uma intenção ou emoção superficial atual: sem memórias, segredos garantidos ou comandos. O alvo percebe a tentativa e fica imune a novas leituras por essa técnica pelo resto da cena.');
    if(t.effect==='utility'&&t.utility==='spirit')notes.push('É preciso um espírito presente ao alcance. Faça uma pergunta breve; ele escolhe se responde e pode não saber ou não dizer a verdade. Não invoca, aprisiona, obriga, dá proficiência nem cria fatos.');
    if(t.effect==='summon')notes.push(`Uma criatura: ${5*r.band.tier} LP, Defesa ${10+r.band.tier}, movimento 6 m por ciclo, alcance de ataque 2 m. Usa DOM + Canalização do invocador, sem crítico de dano. Criar não ataca. Comandar substitui sua ação principal; não concede turno, reação, dom ou técnica próprios. A criatura fica a até 12 m de você. Ao chegar a 0 LP, desaparecer ou perder concentração, ela se desfaz.`);
    if(t.targets>1)notes.push('O conjunto total de dados e bônus é dividido antes da rolagem: '+r.packets.map((p,i)=>`alvo ${i+1}: ${p.dice}d${t.sides}${p.fixed?' + '+p.fixed:''}`).join('; ')+'. Se um alvo não puder ser atingido, sua parcela é perdida.');
    if(t.area)notes.push(`Raio ${t.area} m. Afeta até ${t.targets} criaturas mais próximas do centro, incluindo aliados. Resolva empates na declaração; a área não multiplica o dano. Exige linha de efeito até o centro.`);
    if(t.delivery==='overTime')notes.push('Role o dano total uma vez e divida pelos ciclos (restos nos primeiros). Não repita os dados nem a Potência. O alvo testa resistência antes de cada parcela: sucesso reduz a parcela à metade e encerra as futuras. Sem concentração, parcelas restantes se perdem.');
    if(r.longEffect)notes.push('Uma concentração por conjurador. Ativar ocupa também sua ação bônus neste turno. Cada ciclo adicional custa 1 Véu + ação bônus. Após sofrer dano, teste DOM + Manipulação Arcana, DT 15; falha encerra. Inconsciência também encerra.');
    notes.push('A descrição não concede dano, alvos, estados, vantagens, ações ou efeitos adicionais. Dano verdadeiro, morte automática, domínio total, Véu gratuito e ciclos infinitos exigem regras específicas fora deste construtor. Toda técnica exige linha de efeito; ela não atravessa cobertura total pela descrição.');
    return notes.map(n=>`<p>${escapeHtml(n)}</p>`).join('');
  }
  function techniqueHTML(g,i,raw,open=false){
    const t=P.normalize(raw),r=P.evaluate(t,context());
    const numeric=['damage','heal','barrier','summon'].includes(t.effect);
    return `<details class="technique" id="tech_${g}_${i}" ${open?'open':''}><summary><span class="tech-name" id="tech_name_${g}_${i}">${escapeHtml(t.name||'Técnica sem nome')}</span><span class="status-tag" id="tech_status_${g}_${i}">Rascunho</span></summary>
      <div class="tech-form">
      <label class="span-full">Nome da técnica<input data-tech="${g}:${i}" data-prop="name" maxlength="160" value="${escapeHtml(t.name)}" placeholder="Ex.: Lâminas de chuva"></label>
      <label class="span-full">Manifestação e vínculo com o dom<textarea data-tech="${g}:${i}" data-prop="flavor" rows="3" maxlength="6000" placeholder="Descreva a aparência, a intenção e a natureza física ou mental do efeito. Os números vêm das escolhas abaixo.">${escapeHtml(t.flavor)}</textarea></label>
      ${select(g,i,t,'effect','Efeito principal',Object.keys(P.effects),v=>P.effects[v])}
      ${select(g,i,t,'action','Ação para usar',Object.keys(P.actions),v=>P.actions[v].label+' · '+P.actions[v].points+' PP')}
      ${select(g,i,t,'range','Alcance base',Object.keys(P.ranges),v=>P.ranges[v].label+' · '+P.ranges[v].points+' PP')}
      ${numeric?num(g,i,t,'dice','Dados totais',1,r.band.dice)+select(g,i,t,'sides','Tipo do dado',[4,6,8,10],v=>'d'+v+' · '+P.faceCost[v]+' PP por dado')+num(g,i,t,'fixed','Bônus fixo comprado',0,r.band.fixed):''}
      ${num(g,i,t,'targets','Máximo de alvos',1,r.band.targets)}
      ${select(g,i,t,'area','Área', [0,3,6],v=>v===0?'Sem área':v+' m de raio · '+(v===3?2:4)+' PP')}
      ${select(g,i,t,'duration','Duração',Object.keys(P.durations),v=>P.durations[v].label+' · '+P.durations[v].points+' PP')}
      ${['damage','control'].includes(t.effect)?select(g,i,t,'control','Condição adicional',Object.keys(P.controls),v=>P.controls[v].label+' · '+P.controls[v].points+' PP'):''}
      ${t.effect==='utility'?select(g,i,t,'utility','Utilidade mecânica',Object.keys(P.utilities),v=>P.utilities[v].label+' · '+P.utilities[v].points+' PP'):''}
      ${t.effect==='damage'?select(g,i,t,'delivery','Entrega do dano',['instant','overTime'],v=>v==='instant'?'Todo o dano agora':'Dividir o total pelos ciclos'):''}
      ${select(g,i,t,'rangeSkill','Especialização de alcance',['none','Mira','Potência'],v=>v==='none'?'Sem extensão':v+' · dentro do teto de alcance')}
      ${t.effect==='damage'?`<label class="check-label span-full"><input type="checkbox" data-tech="${g}:${i}" data-prop="potency" ${t.potency?'checked':''}>Somar Potência, respeitando o teto fixo total</label>`:''}
      </div><div class="tech-output" id="tech_output_${g}_${i}"></div>
      <div class="tech-action-row"><button class="primary" type="button" data-cast="${g}:${i}" id="cast_${g}_${i}">Usar técnica</button><button class="ghost danger tech-remove" type="button" data-remove-tech="${g}:${i}">Excluir técnica</button></div>
    </details>`;
  }
  window.renderPowerGifts=function(n,force=false){
    const box=$('giftsContainer');
    while(state.gifts.length<n)state.gifts.push({name:'',type:'Primordial',description:'',techniques:[]});
    state.gifts.forEach(g=>{if(!Array.isArray(g.techniques))g.techniques=[];});
    if(!force&&Number(box.dataset.count??-1)===n)return;
    box.dataset.count=n;
    if(!n){box.innerHTML=`<div class="empty-state">${$('giftRoll').value?'Mundano excepcional: nenhum dom ativo. Seus atributos e perícias fazem a diferença.':'Registre o resultado do d20 para descobrir os dons e começar a criar técnicas.'}</div>${state.gifts.length?'<p class="archived-note">Seus dons anteriores estão arquivados na ficha. Eles reaparecem se a quantidade voltar a aumentar e continuam no JSON.</p>':''}`;return;}
    box.innerHTML=state.gifts.slice(0,n).map((g,gi)=>{
      const limit=P.slots(n,gi);
      return `<article class="gift-card"><div class="gift-card-head"><strong>Dom ${gi+1}</strong><span>${g.techniques.length} / ${limit} técnicas</span></div><div class="gift-concept"><label>Nome do dom<input data-gift="${gi}" data-field="name" value="${escapeHtml(g.name)}" placeholder="Ex.: Memória dos espelhos"></label><label>Categoria<select data-gift="${gi}" data-field="type">${options(D.giftTypes,g.type)}</select></label><label class="concept-description">Conceito e limites narrativos<textarea data-gift="${gi}" data-field="description" rows="3" placeholder="O que seu dom manipula? O que ele não consegue fazer?">${escapeHtml(g.description)}</textarea></label></div><p class="gift-category-help" id="category_${gi}"></p><label class="check-label" id="agreement_label_${gi}" ${g.type!=='Proibido'?'hidden':''}><input type="checkbox" data-agreement="${gi}" ${g.masterAgreement?'checked':''}>A mesa aceitou a origem, os riscos e o uso deste Dom Proibido.</label>
      ${state.sourceVersion!=='4.0'&&!g.techniques.length?'<p class="archived-note">Descrição da versão anterior preservada. Transforme cada habilidade em uma técnica para conferir seus parâmetros.</p>':''}
      <div class="tech-list">${g.techniques.map((t,i)=>techniqueHTML(gi,i,t)).join('')}</div>
      <div class="tech-presets" aria-label="Adicionar técnica ao Dom ${gi+1}">${Object.entries(P.effects).map(([key,label])=>`<button type="button" data-add-tech="${gi}" data-preset="${key}" ${g.techniques.length>=limit?'disabled':''}>+ ${label}</button>`).join('')}</div><p class="help">${limit} espaços neste despertar. Alterar a aparência é livre; mudar o efeito em combate exige uma técnica preparada. Técnicas excedentes ficam como rascunho, sem uso.</p></article>`;
    }).join('')+(state.gifts.length>n?'<p class="archived-note">Os dons além da quantidade atual estão arquivados. Nenhuma descrição ou técnica foi apagada.</p>':'');
    refreshPowerOutputs();
  };
  function renderWorkbench(){
    $('powerWorkbench').innerHTML=`<div class="workbench-intro"><div><span class="kicker">OFICINA DE DONS</span><h3>Uma ideia. Técnicas com limites.</h3><p class="help">PP são pontos de construção por técnica. Não são consumidos nem distribuídos entre os seus dons. Comece pelo efeito e ajuste as escolhas até caber no orçamento.</p></div><span class="tier-badge" id="tierBadge"></span></div>
    <details class="casting-settings"><summary>Acerto e combinações para usar técnicas</summary><div class="casting-columns"><div class="grid cols-2"><label>Defesa do alvo<input id="spellTarget" type="number" min="1" max="99" value="15"></label><label>Situação<select id="spellEdge"><option value="0">Normal</option><option value="1">Vantagem (+1d20)</option><option value="-1">Desvantagem (−1d20)</option></select></label></div><div class="combo-grid"><label>Fonte de combo 1<input id="comboSource1" placeholder="Ex.: alvo marcado" maxlength="80"></label><label>Bônus<input id="comboValue1" type="number" min="0" max="3" value="0"></label><label>Fonte de combo 2<input id="comboSource2" placeholder="Ex.: terreno elevado" maxlength="80"></label><label>Bônus<input id="comboValue2" type="number" min="0" max="3" value="0"></label></div></div><p class="help">Fontes diferentes podem somar até +6 no acerto, além da perícia e da vantagem. O mesmo efeito com outro nome ainda é a mesma fonte. Esses bônus não aumentam dano ou DT de resistência.</p><div id="comboErrors" class="help"></div></details><div id="powerResult" aria-live="polite"></div>`;
  }
  function refreshPowerOutputs(){
    if(!$('tierBadge'))return;
    const band=P.tierFor(level());$('tierBadge').textContent=`Patamar ${band.tier} · ${band.points} PP · até ${band.dice}d${band.sides}`;
    const c=spellCombo();$('comboErrors').textContent=c.errors.join(' ');
    state.gifts.slice(0,count()).forEach((g,gi)=>{
      if($(`category_${gi}`))$(`category_${gi}`).textContent=categories[g.type]||'';
      if($(`agreement_label_${gi}`))$(`agreement_label_${gi}`).hidden=g.type!=='Proibido';
      (g.techniques||[]).forEach((t,i)=>{
        const output=$(`tech_output_${gi}_${i}`);if(!output)return;
        const r=resultFor(gi,i),s=$(`tech_status_${gi}_${i}`),label=$(`tech_name_${gi}_${i}`);
        label.textContent=t.name||'Técnica sem nome';s.textContent=r.valid?'Dentro dos limites':'Revisar';s.className='status-tag '+(r.valid?'ready':'invalid');
        const blockers=[...P.canUse(r,{veil:Number($('veilCurrent').value),used:session.used,summon:session.ongoing?.technique.effect==='summon'}),...c.errors];
        if(r.longEffect&&session.ongoing)blockers.push('Encerre a concentração anterior antes de criar outra.');
        const cost=r.costs.map(x=>`${x.name}: ${x.points}`).join(' · ');
        output.innerHTML=`<div class="tech-metrics"><div><span>Orçamento</span><strong>${Number.isFinite(r.points)?r.points:'—'} / ${r.band.points} PP</strong></div><div><span>Ativação</span><strong>${Number.isFinite(r.veil)?r.veil:'—'} Véu</strong></div><div><span>Alcance final</span><strong>${r.range===0?'Pessoal':r.range+' m'}</strong></div><div><span>${r.numeric?'Média / máximo total':'Resistência'}</span><strong>${r.numeric?`${Number.isFinite(r.average)?r.average.toLocaleString('pt-BR'):'—'} / ${r.maximum}`:'DT '+r.dc}</strong></div></div><div class="budget-track ${r.points>r.band.points?'over':''}"><i style="width:${Number.isFinite(r.points)?Math.min(100,r.points/r.band.points*100):100}%"></i></div><p class="cost-breakdown">${escapeHtml(cost)}${r.numeric?`<br>Bônus fixo final: +${r.fixed} (teto compartilhado +${r.band.fixed}).` :''}${r.canCrit?` Crítico máximo: ${r.criticalMaximum}.`:''}</p>${r.errors.length?`<div class="tech-errors">${r.errors.map(e=>`<p>${escapeHtml(e)}</p>`).join('')}</div>`:''}<details class="tech-effect-note"><summary>Como resolver esta técnica na mesa</summary>${effectNote(r)}</details>${r.valid&&blockers.length?`<p class="help">${escapeHtml(blockers.join(' '))}</p>`:''}`;
        const btn=$(`cast_${gi}_${i}`);btn.disabled=blockers.length>0;btn.textContent=`Usar técnica · ${Number.isFinite(r.veil)?r.veil:'—'} Véu`;
      });
    });
    renderTurn();
  }
  window.refreshPowerOutputs=refreshPowerOutputs;
  function renderTurn(){
    const o=session.ongoing;
    $('turnTracker').innerHTML=`<div class="turn-head"><strong>Turno ${session.turn}</strong><button class="ghost" type="button" id="nextTurn">Próximo turno</button></div><div class="turn-controls">${Object.entries(P.actions).map(([k,v])=>`<button type="button" data-spend-action="${k}" aria-pressed="${session.used[k]}">${v.label} · ${session.used[k]?'usada':'livre'}</button>`).join('')}</div>${o?`<div class="ongoing-effect"><strong>Concentração: ${escapeHtml(o.technique.name)}</strong><p>${o.remaining} ciclo(s) incluindo o atual. ${o.pending?'A manutenção deste ciclo está pendente.':'Manutenção deste ciclo resolvida.'}</p><div class="turn-controls">${o.pending?'<button type="button" id="maintainPower">Sustentar · 1 Véu + ação bônus</button>':''}${o.technique.effect==='summon'?'<button type="button" id="commandSummon">Comandar · ação principal</button>':''}<button type="button" id="checkConcentration">Concentração após dano · DT 15</button><button type="button" class="ghost" id="endPower">Encerrar efeito</button></div></div>`:''}<p class="help">Avançar turno libera ações, sem recuperar Véu. Movimento segue o valor da ficha. Resistências e LP de outros personagens são resolvidos na mesa.</p>`;
  }
  function showResult(title,lines){
    lastResult=`<div class="cast-result"><h4>${escapeHtml(title)}</h4>${lines.map(l=>`<p>${escapeHtml(l)}</p>`).join('')}</div>`;
    $('powerResult').innerHTML=lastResult;
    notice(title+' — '+lines[0]);
  }
  function resolvePayload(r,isCritical){
    const values=P.rollPayload(r,isCritical);
    values.forEach(p=>pushRoll({label:`${r.technique.name} · ${P.effects[r.technique.effect]}${values.length>1?' · alvo '+p.target:''}`,dice:`${p.rolls.length}d${r.technique.sides}`,rolls:p.rolls,best:p.rolls.reduce((a,b)=>a+b,0),bonus:p.fixed,total:p.total,target:null,success:null,critical:isCritical&&r.canCrit}));
    return values.map(p=>`Alvo ${p.target}: ${p.total} de ${r.technique.effect==='summon'?'dano da invocação':P.effects[r.technique.effect].toLowerCase()} (${p.rolls.join(' + ')}${p.fixed?' + '+p.fixed+' fixo':''}).${p.cycles?' Distribuição pelos ciclos: '+p.cycles.join(' / ')+'. Não rolar novamente.':''}`);
  }
  function cast(g,i){
    const r=resultFor(g,i),t=r.technique,c=spellCombo();
    const errors=[...P.canUse(r,{veil:Number($('veilCurrent').value),used:session.used,summon:session.ongoing?.technique.effect==='summon'}),...c.errors];
    if(r.longEffect&&session.ongoing)errors.push('Encerre a concentração anterior.');
    if(errors.length){notice(errors.join(' '));return;}
    const target=Number($('spellTarget').value),edge=Number($('spellEdge').value);
    if((r.canCrit)&&(!Number.isInteger(target)||target<1||target>99)){notice('Informe uma Defesa de 1 a 99.');return;}
    $('veilCurrent').value=Number($('veilCurrent').value)-r.veil;session.used[t.action]=true;
    if(r.longEffect){session.used.bonus=true;session.ongoing={technique:JSON.parse(JSON.stringify(t)),remaining:t.duration,pending:false};}
    let lines=[`${r.veil} Véu gastos · ${P.actions[t.action].label}${r.longEffect?' e ação bônus':''}.`],hit=true,critical=false;
    if(r.canCrit){rollPool('gift','Canalização',c.total,edge,target,t.name+' · acerto');const roll=state.rollLog[0];hit=roll.success;critical=roll.critical;lines.push(`Acerto: ${roll.total} contra Defesa ${target}. ${hit?(critical?'Crítico natural 20.':'Acertou.'):'Errou: sem dano ou condição.'}`);}
    if(hit){
      if(r.numeric&&t.effect!=='summon')lines.push(...resolvePayload(r,critical));
      if(t.effect==='summon')lines.push(`Invocação criada: ${5*r.band.tier} LP, Defesa ${10+r.band.tier}, movimento 6 m. Comande nos próximos turnos usando sua ação principal; mantenha com 1 Véu + ação bônus.`);
      if(t.effect==='control'||(t.effect==='damage'&&!r.canCrit))lines.push(`Cada alvo testa resistência contra DT ${r.dc}. Sucesso anula condição e reduz dano à metade. Aplique os resultados na mesa.`);
      if(t.control!=='none')lines.push(`${P.controls[t.control].label}. Resistência DT ${r.dc} evita a condição. Não acumula com a mesma condição.`);
      if(t.effect==='utility'){lines.push(P.utilities[t.utility].label+'. Sem vantagens ou efeitos adicionais pela descrição.');if(t.utility==='thought')lines.push('SOR + Equilíbrio Espiritual contra DT '+r.dc+' evita a leitura. Tentativa perceptível; uma por alvo por cena para esta técnica.');if(t.utility==='aid')lines.push('Anote Auxílio como uma fonte +2 do próximo teste da perícia definida, dentro do teto de combo. Expira até seu próximo turno; não acumula com outro Auxílio.');}
      if(t.effect==='heal')lines.push('Aplique aos LP do alvo, até o máximo. Não recupera Véu.');
      if(t.effect==='barrier')lines.push('Anote a barreira no alvo. Absorve dano, sem renovar ou acumular; mantenha só a maior.');
      if(r.longEffect)lines.push(`Até ${t.duration} ciclos contando este. Sustentar: 1 Véu + ação bônus a cada ciclo adicional. Falha de concentração encerra.`);
    }
    if(Number($('veilCurrent').value)===0)lines.push('Véu esgotado: sinalize ao mestre as consequências espirituais descritas no livro.');
    showResult(t.name,lines);markDirty();recalc();
  }
  function commandSummon(){
    const o=session.ongoing;if(!o||o.technique.effect!=='summon')return;
    if(o.pending||session.used.main){notice(o.pending?'Sustente a invocação antes de comandar.':'A ação principal já foi usada.');return;}
    const r=P.evaluate(o.technique,context()),c=spellCombo(),target=Number($('spellTarget').value);
    if(!r.valid||!c.valid||!Number.isInteger(target)||target<1||target>99){notice('Revise os parâmetros e o combo antes de comandar.');return;}
    session.used.main=true;rollPool('gift','Canalização',c.total,Number($('spellEdge').value),target,o.technique.name+' · comando');
    const roll=state.rollLog[0],lines=[`Ação principal gasta · acerto ${roll.total} contra Defesa ${target}.`];
    if(roll.success)lines.push(...resolvePayload(r,false));else lines.push('O ataque errou.');
    showResult('Comando: '+o.technique.name,lines);markDirty();recalc();
  }
  window.getPowerSession=()=>JSON.parse(JSON.stringify(session));
  window.setPowerSession=raw=>{
    session={turn:Math.trunc(clamp(raw?.turn||1,1,99999)),used:{main:raw?.used?.main===true,bonus:raw?.used?.bonus===true,reaction:raw?.used?.reaction===true},ongoing:null};
    if(raw?.ongoing?.technique){const r=P.evaluate(raw.ongoing.technique,context());if(r.valid&&r.longEffect)session.ongoing={technique:r.technique,remaining:Math.trunc(clamp(raw.ongoing.remaining,1,r.technique.duration)),pending:raw.ongoing.pending===true};}
    lastResult='';if($('powerResult'))$('powerResult').innerHTML='';if($('turnTracker'))renderTurn();
  };
  document.addEventListener('input',e=>{
    const el=e.target;
    if(el.matches('[data-tech]')){
      const [g,i]=el.dataset.tech.split(':').map(Number),t=technique(g,i),prop=el.dataset.prop;
      if(!t)return;
      if(prop==='effect'){
        state.gifts[g].techniques[i]={...P.createTechnique(el.value),name:t.name,flavor:t.flavor};
        const old=$(`tech_${g}_${i}`),open=old.open;old.outerHTML=techniqueHTML(g,i,state.gifts[g].techniques[i],open);
        document.querySelector(`[data-tech="${g}:${i}"][data-prop="effect"]`).focus();
      }else if(['name','flavor','action','control','utility','rangeSkill','delivery'].includes(prop))t[prop]=el.value;
      else if(prop==='potency')t[prop]=el.checked;
      else if(['dice','sides','fixed','range','targets','area','duration'].includes(prop))t[prop]=el.value===''?null:Number(el.value);
      markDirty();refreshPowerOutputs();return;
    }
    if(el.matches('[data-agreement]')){state.gifts[Number(el.dataset.agreement)].masterAgreement=el.checked;markDirty();refreshPowerOutputs();return;}
    if(['comboSource1','comboSource2','comboValue1','comboValue2','spellTarget','spellEdge'].includes(el.id))refreshPowerOutputs();
  });
  document.addEventListener('click',e=>{
    const add=e.target.closest('[data-add-tech]');if(add){const g=Number(add.dataset.addTech);if(g>=count()||state.gifts[g].techniques.length>=P.slots(count(),g))return;state.gifts[g].techniques.push(P.createTechnique(add.dataset.preset));renderPowerGifts(count(),true);const i=state.gifts[g].techniques.length-1;$(`tech_${g}_${i}`).open=true;document.querySelector(`[data-tech="${g}:${i}"][data-prop="name"]`).focus();markDirty();return;}
    const remove=e.target.closest('[data-remove-tech]');if(remove){const [g,i]=remove.dataset.removeTech.split(':').map(Number);if(!confirm('Excluir esta técnica?'))return;state.gifts[g].techniques.splice(i,1);renderPowerGifts(count(),true);markDirty();return;}
    const use=e.target.closest('[data-cast]');if(use){cast(...use.dataset.cast.split(':').map(Number));return;}
    const spend=e.target.closest('[data-spend-action]');if(spend){const action=spend.dataset.spendAction;if(session.used[action]){notice('Ação já registrada. Avance o turno para liberar as ações.');return;}session.used[action]=true;if(action==='bonus'&&session.ongoing?.pending){session.ongoing=null;notice('Ação bônus gasta: a concentração sem manutenção terminou.');}markDirty();refreshPowerOutputs();return;}
    if(e.target.id==='nextTurn'){
      session.turn++;session.used={main:false,bonus:false,reaction:false};
      if(session.ongoing){if(session.ongoing.pending||--session.ongoing.remaining<=0){session.ongoing=null;notice('O efeito sustentado terminou.');}else session.ongoing.pending=true;}
      markDirty();refreshPowerOutputs();return;
    }
    if(e.target.id==='maintainPower'){
      if(!session.ongoing?.pending)return;
      if(session.used.bonus||Number($('veilCurrent').value)<1){notice('Sustentar exige 1 Véu e uma ação bônus livre.');return;}
      $('veilCurrent').value=Number($('veilCurrent').value)-1;session.used.bonus=true;session.ongoing.pending=false;markDirty();recalc();notice('Concentração sustentada neste ciclo.');return;
    }
    if(e.target.id==='endPower'){session.ongoing=null;markDirty();refreshPowerOutputs();notice('Efeito encerrado. Recursos gastos não são recuperados.');return;}
    if(e.target.id==='commandSummon'){commandSummon();return;}
    if(e.target.id==='checkConcentration'&&session.ongoing){rollPool('gift','Manipulação Arcana',0,0,15,'Concentração após dano');const success=state.rollLog[0].success;if(!success)session.ongoing=null;markDirty();refreshPowerOutputs();notice(success?'Concentração mantida.':'Falha: a concentração terminou.');}
  });
  function setupFiles(){
    $('exportCharacter').addEventListener('click',()=>{
      const ch=collect(),blob=new Blob([JSON.stringify(ch,null,2)],{type:'application/json'}),a=document.createElement('a');
      a.href=URL.createObjectURL(blob);a.download=(slug(ch.identity.name)||'personagem')+'-thaalemor-v4.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notice('Ficha exportada com todos os dons, incluindo rascunhos e arquivos.');
    });
    $('importCharacter').addEventListener('click',()=>$('importInput').click());
    $('importInput').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{
        if(file.size>8*1024*1024)throw new Error('Use um JSON de até 8 MB.');
        const ch=JSON.parse(await file.text());
        if(!ch||Array.isArray(ch)||typeof ch.identity!=='object'||!ch.identity||!ch.attributes||!ch.resources)throw new Error('Este arquivo não parece uma ficha Thaal’Emor.');
        if(ch.gifts&&(!Array.isArray(ch.gifts)||ch.gifts.length>20||ch.gifts.some(g=>!g||typeof g!=='object'||(g.techniques&&(!Array.isArray(g.techniques)||g.techniques.length>40)))))throw new Error('A estrutura dos dons neste arquivo é inválida.');
        if(state.dirty&&!confirm('Importar outra ficha e descartar as alterações não salvas?'))return;
        ch.id=makeId();applyCharacter(ch);markDirty();notice('Ficha importada como cópia. Confira e salve neste navegador.');
      }catch(error){notice(error instanceof SyntaxError?'JSON inválido. Sua ficha atual foi preservada.':error.message);}
      finally{e.target.value='';}
    });
  }
  function renderRules(){
    $('powerRules').innerHTML=`<p class="help">Proposta V4, baseada na ficha V3 e no cenário do livro. Os números abaixo são limites de criação e uso de técnicas. Precisam de teste em mesa junto das habilidades de classe e dos itens.</p><div class="table-wrap"><table><caption>Orçamento individual de cada técnica</caption><thead><tr><th>Nível</th><th>Patamar</th><th>PP</th><th>Dados totais</th><th>Fixo total</th><th>Alvos</th></tr></thead><tbody>${P.tiers.map(t=>`<tr><td>${t.min}–${t.max}</td><td>${t.tier}</td><td>${t.points}</td><td>até ${t.dice}d${t.sides}</td><td>até +${t.fixed}</td><td>até ${t.targets}</td></tr>`).join('')}</tbody></table></div>
    <p class="help">Todos os tetos valem ao mesmo tempo. Atingir o teto de dados não garante espaço para área, condição ou duração. Potência e bônus comprados dividem o teto fixo; múltiplos projéteis e alvos dividem os mesmos dados.</p>
    <h3>Quanto cada escolha custa</h3><div class="table-wrap"><table><thead><tr><th>Escolha</th><th>Custo em PP</th></tr></thead><tbody><tr><td>Dados</td><td>1 por d4 · 2 por d6 · 3 por d8 · 4 por d10</td></tr><tr><td>Fixo comprado</td><td>1 a cada +2 ou fração</td></tr><tr><td>Cura / barreira / invocação</td><td>+2 / +1 / +2, além dos dados</td></tr><tr><td>Alcance pessoal ou toque / 6 / 12 / 24 m</td><td>0 / 1 / 2 / 3</td></tr><tr><td>Alvos extras / área de raio 3 / 6 m</td><td>+2 por alvo / +2 / +4</td></tr><tr><td>Imediato / 3 / 5 ciclos</td><td>0 / +2 / +4</td></tr><tr><td>Principal / bônus / reação</td><td>0 / +2 / +2, com as restrições abaixo</td></tr><tr><td>Condições</td><td>Lentidão/empurrão 1 · desvantagem/desarmar 2 · imobilizar 3 · interromper 5</td></tr><tr><td>Utilidades</td><td>Luz/objeto 1 · auxílio/percepção/ilusão/espírito 2 · eco mental/passo místico 3 · voo 4</td></tr></tbody></table></div>
    <div class="rules-prose"><p><strong>Véu.</strong> Custo = 4 + teto((PP − 6) ÷ 3), com mínimo 4. Gasto ao ativar, mesmo ao errar. Nenhuma fraqueza narrativa compra mais PP ou permite custo zero. Recuperação de Véu segue o livro fora do construtor.</p><p><strong>Dom e técnica.</strong> Um dom é o conceito; cada técnica compra um efeito delimitado. Um dom singular tem 4 técnicas. Dois ou três dons têm 2 técnicas cada. Com quatro dons, os três primeiros têm 2 e o quarto tem 1. Memória, Foco e Canalização não concedem técnicas ou alvos gratuitos nesta revisão. A V4 permite repetir o tipo de efeito em técnicas diferentes, alterando a restrição de categorias do livro; cada técnica ocupa um espaço e paga seu orçamento completo.</p><p><strong>Combos.</strong> Classe, equipamento, terreno e preparo podem somar fontes distintas no acerto, até +6 além da perícia. Vantagem acrescenta 1d20. Potência dá +2 de dano por grau, dentro do fixo total de +2 por patamar. Trocar o nome de uma fonte não permite somá-la novamente.</p><p><strong>Alcance.</strong> Escolha Mira (+3 m/grau) OU Potência (+2 m/grau), com extensão máxima de +6 m por patamar, apenas a partir de alcance base 6 m. Isso não aumenta raio, alvos, distância de teleporte, luz ou movimento da invocação.</p><p><strong>Ações.</strong> Uma principal, uma bônus e uma reação. Principal permite qualquer técnica válida. Bônus só permite utilidade ou barreira pessoal. Reação só permite barreira pessoal para um golpe, após acerto e antes do dano. Não existem ações extras por descrição.</p><p><strong>Resistência.</strong> DT = 12 + patamar + mínimo(3, piso(Manipulação Arcana ÷ 2)). Física: FOR + Resistência; empurrar/desarmar: SAG + Reflexos; mental: SOR + Equilíbrio Espiritual. Resultado igual ou maior resiste. Controle é anulado; dano em área/múltiplos alvos cai pela metade.</p><p><strong>Controle.</strong> Um efeito forte não pode retirar turnos em sequência. Interromper exige patamar 3, controle sem dano, um alvo e um turno. Retira apenas a próxima ação principal; depois há 2 ciclos de imunidade a esse efeito de qualquer fonte. Imobilizar exige patamar 2 e ainda permite agir. Efeitos iguais nunca acumulam.</p><p><strong>Concentração.</strong> Apenas uma por personagem. Começar também usa a bônus. Cada ciclo extra exige 1 Véu + bônus; sem manutenção, o efeito acaba. Após dano: DOM + Manipulação Arcana contra DT 15. Falha ou inconsciência encerra. Controle sustentado também permite nova resistência ao fim de cada turno do alvo.</p><p><strong>Dano contínuo e área.</strong> Role o total uma vez. Divida os dados e o fixo entre os alvos e o resultado entre os ciclos; nunca multiplique. Dano contínuo permite resistência antes de cada parcela: sucesso reduz essa parcela pela metade e encerra as futuras. Área alcança as criaturas mais próximas do centro, inclusive aliados, até o limite comprado.</p><p><strong>Cura e barreira.</strong> Cura não ultrapassa LP máximos e não restaura Véu. Barreiras são reservas que se esgotam; use somente a maior, sem somar reservas. Duração não repete cura ou regenera proteção. Nenhuma técnica dá ressurreição ou imunidade absoluta.</p><p><strong>Invocação.</strong> Um ser, 5 × patamar LP, Defesa 10 + patamar, movimento 6 m e ataque a 2 m. Deve permanecer a até 12 m do dono. Criar não ataca; comandar usa a principal do invocador. Ataque usa DOM + Canalização e os dados comprados, sem crítico, Potência, técnica, reação ou ação própria. É uma concentração.</p><p><strong>Criatividade.</strong> Pode mudar elemento, aparência e encenação. Para acrescentar benefício mecânico, compre o efeito em uma técnica. Uma nova utilidade exige regra escrita com grandeza, resistência, duração e custo antes de entrar no construtor. Rituais e feitos de escala narrativa são tratados separadamente pela mesa.</p></div>
    <h3>Três formas de construir</h3><div class="example-grid"><article><h4>Lâminas de chuva · nível 1</h4><p>Dom de água. 2d6, 6 m, um alvo, ação principal. 4 PP de dados + 1 de alcance = 5 PP. Custa 4 Véu. Com Potência grau 1: 2d6 + 2, média 9 e máximo 14.</p></article><article><h4>Fios que prendem · nível 3</h4><p>Dom de fios. Controle de imobilização, 6 m, um alvo, 3 ciclos. 3 + 1 + 2 = 6 PP. Custa 4 Véu, mais manutenção. O alvo resiste e continua podendo agir.</p></article><article><h4>Eco guardião · nível 1</h4><p>Barreira pessoal de 1d4 como reação. 1 PP de dado + 1 de proteção + 2 de reação = 4 PP. Custa 4 Véu e protege apenas contra aquele golpe.</p></article></div><p class="help">A ficha verifica parâmetros e desconta recursos. A mesa verifica a coerência do conceito, as fontes de bônus, linha de efeito, resistências, alvos e condições. “Dentro dos limites” não substitui teste de equilíbrio com o restante do livro.</p>`;
  }
  const printState=[];
  window.addEventListener('beforeprint',()=>{
    document.querySelectorAll('#ficha details').forEach(el=>{printState.push({el,open:el.open});el.open=true;});
    document.querySelectorAll('#ficha textarea').forEach(el=>{el.dataset.printHeight=el.style.height;el.style.height=el.scrollHeight+'px';});
    const identity=$('identityBody');if(identity){identity.dataset.printHidden=String(identity.hidden);identity.hidden=false;}
  });
  window.addEventListener('afterprint',()=>{printState.splice(0).forEach(({el,open})=>el.open=open);document.querySelectorAll('#ficha textarea').forEach(el=>el.style.height=el.dataset.printHeight||'');const identity=$('identityBody');if(identity)identity.hidden=identity.dataset.printHidden==='true';});
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const id=entry.target.id;document.querySelectorAll('.side-nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));}},{rootMargin:'-15% 0px -70% 0px'});
    document.querySelectorAll('.view').forEach(el=>observer.observe(el));
  }
  renderWorkbench();renderRules();setupFiles();renderPowerGifts(count(),true);refreshPowerOutputs();
})();
