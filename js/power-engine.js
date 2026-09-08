/* Thaal'Emor V4 — regras propostas para teste em mesa. Sem dependências. */
(function (root) {
  'use strict';
  const tiers = [
    {tier:1,min:1,max:2,points:6,dice:2,sides:6,targets:2,fixed:2},
    {tier:2,min:3,max:4,points:9,dice:3,sides:8,targets:3,fixed:4},
    {tier:3,min:5,max:6,points:12,dice:4,sides:8,targets:4,fixed:6},
    {tier:4,min:7,max:8,points:15,dice:5,sides:10,targets:5,fixed:8},
    {tier:5,min:9,max:10,points:18,dice:6,sides:10,targets:5,fixed:10}
  ];
  const effects = {damage:'Dano',heal:'Cura',barrier:'Barreira',control:'Controle',utility:'Utilidade',summon:'Invocação'};
  const controls = {
    none:{label:'Sem condição',points:0,tier:1},
    slow:{label:'Lentidão · −3 m de movimento',points:1,tier:1},
    push:{label:'Empurrão · 3 m',points:1,tier:1},
    hinder:{label:'Desvantagem no próximo ataque',points:2,tier:1},
    disarm:{label:'Desarmar · soltar um objeto empunhado',points:2,tier:1},
    root:{label:'Imobilizar · movimento 0, ainda age',points:3,tier:2},
    stun:{label:'Interromper · perde uma ação principal',points:5,tier:3}
  };
  const utilities = {
    aid:{label:'Auxílio · +2 no próximo teste de uma perícia definida',points:2,tier:1},
    thought:{label:'Eco mental · uma intenção superficial, com resistência',points:3,tier:2},
    spirit:{label:'Escutar espírito · uma pergunta, resposta voluntária',points:2,tier:1},
    light:{label:'Luz · ilumina até 6 m, sem cegar',points:1,tier:1},
    sense:{label:'Sentir magia · presença a até 6 m, sem ler mente',points:2,tier:1},
    object:{label:'Mover objeto · até 5 kg, 3 m, sem ferir',points:1,tier:1},
    illusion:{label:'Ilusão · imagem/som até 2 m³, sem dano',points:2,tier:1},
    step:{label:'Passo místico · 3 m até espaço visível livre',points:3,tier:2},
    flight:{label:'Voo · 6 m, até 3 m de altura',points:4,tier:3}
  };
  const ranges = {0:{label:'Pessoal',points:0},2:{label:'Toque · 2 m',points:0},6:{label:'Curto · 6 m',points:1},12:{label:'Médio · 12 m',points:2},24:{label:'Longo · 24 m',points:3}};
  const durations = {1:{label:'Imediato / até o próximo turno',points:0},3:{label:'Até 3 ciclos · concentração',points:2},5:{label:'Até 5 ciclos · concentração',points:4}};
  const actions = {main:{label:'Ação principal',points:0},bonus:{label:'Ação bônus',points:2},reaction:{label:'Reação',points:2}};
  const faceCost = {4:1,6:2,8:3,10:4};
  const integer = (v,min,max,fallback=min) => Number.isFinite(Number(v)) ? Math.max(min,Math.min(max,Math.trunc(Number(v)))) : fallback;
  function tierFor(level){return tiers.find(t=>integer(level,1,10)<=t.max);}
  function slots(count,index){return count===1?4:count===4&&index===3?1:2;}
  function createTechnique(preset='damage'){
    const base={name:'',flavor:'',effect:'damage',dice:1,sides:6,fixed:0,range:6,targets:1,area:0,duration:1,action:'main',control:'none',utility:'light',potency:true,rangeSkill:'none',delivery:'instant'};
    if(preset==='heal')Object.assign(base,{effect:'heal',range:2,potency:false});
    if(preset==='barrier')Object.assign(base,{effect:'barrier',range:0,action:'reaction',sides:4,potency:false});
    if(preset==='control')Object.assign(base,{effect:'control',control:'slow',dice:0,fixed:0,potency:false});
    if(preset==='utility')Object.assign(base,{effect:'utility',dice:0,range:0,potency:false});
    if(preset==='summon')Object.assign(base,{effect:'summon',sides:4,range:2,duration:3,potency:false});
    return base;
  }
  function normalize(raw){
    const t={...createTechnique(),...raw};
    t.name=String(t.name??'').slice(0,160);t.flavor=String(t.flavor??'').slice(0,6000);
    for(const k of ['dice','sides','fixed','range','targets','area','duration'])t[k]=Number(t[k]);
    return t;
  }
  function evaluate(raw,context={}){
    const t=normalize(raw),band=tierFor(context.level),errors=[],costs=[];
    const add=(name,value)=>{if(value)costs.push({name,points:value});};
    const require=(condition,message)=>{if(!condition)errors.push(message);};
    const numeric=['damage','heal','barrier','summon'].includes(t.effect);
    require(Object.hasOwn(effects,t.effect),'Escolha um efeito válido.');
    require(typeof t.potency==='boolean','O uso de Potência deve ser ligado ou desligado.');
    require(t.name.trim().length>0,'Dê um nome à técnica.');
    require(t.flavor.trim().length>0,'Descreva a manifestação e como ela pertence ao dom.');
    for(const key of ['dice','sides','fixed','range','targets','area','duration'])require(Number.isInteger(t[key]),`Valor inválido em ${key}.`);
    require(Object.hasOwn(ranges,t.range),'Escolha um alcance da tabela.');
    require(Object.hasOwn(durations,t.duration),'Escolha uma duração da tabela.');
    require(Object.hasOwn(actions,t.action),'Escolha uma ação da tabela.');
    require(Object.hasOwn(controls,t.control),'Escolha uma condição da tabela.');
    require(['none','Mira','Potência'].includes(t.rangeSkill),'Especialização de alcance inválida.');
    require([0,3,6].includes(t.area),'Área deve ser 0, 3 ou 6 m de raio.');
    require(t.targets>=1&&t.targets<=band.targets,`Máximo de ${band.targets} alvos neste patamar.`);
    require(t.range!==0||t.targets===1,'Alcance pessoal permite apenas o próprio conjurador.');
    require(t.range!==0||t.area===0,'Uma área precisa de alcance de toque ou maior.');
    if(numeric){
      require(t.dice>=1&&t.dice<=band.dice,`Use entre 1 e ${band.dice} dados totais.`);
      require(Object.hasOwn(faceCost,t.sides)&&t.sides<=band.sides,`Dado máximo: d${band.sides}.`);
      require(t.fixed>=0&&t.fixed<=band.fixed,`Bônus fixo comprado: entre 0 e ${band.fixed}.`);
      require(t.dice>=t.targets,'Cada alvo precisa de pelo menos um dado do total.');
      add(`${t.dice}d${t.sides} totais`,t.dice*(faceCost[t.sides]||0));
      add('Bônus fixo comprado',Math.ceil(t.fixed/2));
    } else {
      require(t.dice===0&&t.fixed===0,'Controle e utilidade não causam dano nem recebem dados ou bônus fixo.');
    }
    if(t.effect==='heal')add('Restauração',2);
    if(t.effect==='barrier')add('Proteção',1);
    if(t.effect==='summon'){
      add('Corpo invocado',2);
      require(t.duration>1,'Invocação exige duração de 3 ou 5 ciclos.');
      require(t.targets===1&&t.area===0,'Apenas uma invocação, sem área.');
      require(t.control==='none','A invocação usa seu ataque básico, sem condição adicional.');
      require(t.range<=6&&t.range>0,'Invoque em um ponto livre a até 6 m.');
      require(!t.potency,'Invocações não recebem Potência no dano.');
    }
    if(t.effect==='control')require(t.control!=='none','Escolha uma condição para a técnica de controle.');
    if(t.control!=='none'){
      const cc=controls[t.control];
      require(['damage','control'].includes(t.effect),'Condições só acompanham dano ou controle.');
      if(cc){add('Condição: '+cc.label,cc.points);require(band.tier>=cc.tier,`Esta condição exige patamar ${cc.tier}.`);}
      if(t.control==='stun')require(t.effect==='control'&&t.targets===1&&t.area===0&&t.duration===1,'Interromper exige controle puro, um alvo e duração de um turno.');
    }
    if(t.effect==='utility'){
      const u=utilities[t.utility];require(!!u,'Escolha uma utilidade da tabela.');
      if(u){add(u.label,u.points);require(band.tier>=u.tier,`Esta utilidade exige patamar ${u.tier}.`);}
      require(t.targets===1&&t.area===0,'Utilidade usa um alvo, sem área adicional.');
      if(['step','flight','sense'].includes(t.utility))require(t.range===0,'Passo, voo e percepção mágica são pessoais.');
      if(['aid','thought','spirit'].includes(t.utility))require(t.duration===1,'Auxílio, eco mental e pergunta ao espírito têm um uso, sem repetição por duração.');
      if(t.utility==='thought')require(t.range===2||t.range===6,'Eco mental exige alcance base de toque ou 6 m.');
      if(t.utility==='step')require(t.duration===1,'Passo místico é um deslocamento único.');
      if(t.utility==='flight')require(t.duration>1,'Voo exige concentração.');
    }
    require(['instant','overTime'].includes(t.delivery),'Distribuição de dano inválida.');
    if(t.delivery==='overTime')require(t.effect==='damage'&&t.duration>1,'Dano contínuo exige dano e duração maior que um ciclo.');
    if(['damage','heal'].includes(t.effect)&&t.duration>1)require(t.effect==='damage'&&t.delivery==='overTime','Cura e dano imediato são resolvidos uma vez; duração não multiplica a rolagem.');
    if(t.action==='bonus')require(['utility','barrier'].includes(t.effect)&&t.range===0,'Ação bônus permite somente utilidade ou barreira pessoal.');
    if(t.action==='reaction')require(t.effect==='barrier'&&t.range===0&&t.duration===1,'Reação permite apenas barreira pessoal contra um golpe, após acerto e antes do dano.');
    if(!['damage','summon'].includes(t.effect))require(!t.potency,'Potência de dano só se aplica a dano direto.');
    add('Alcance',ranges[t.range]?.points||0);add('Alvos adicionais',Math.max(0,t.targets-1)*2);
    add('Área',t.area===3?2:t.area===6?4:0);add('Duração',durations[t.duration]?.points||0);add('Ação',actions[t.action]?.points||0);
    const points=costs.reduce((n,c)=>n+c.points,0),veil=4+Math.ceil(Math.max(0,points-6)/3);
    require(points<=band.points,`Orçamento excedido: ${points} / ${band.points} PP.`);
    const potency=t.effect==='damage'&&t.potency?2*integer(context.potency,0,7):0;
    const fixed=numeric?Math.min(band.fixed,t.fixed+potency):0;
    const rank=t.rangeSkill==='Mira'?integer(context.mira,0,7):t.rangeSkill==='Potência'?integer(context.potency,0,7):0;
    const rangeBonus=t.range>=6&&t.effect!=='summon'?Math.min(6*band.tier,rank*(t.rangeSkill==='Mira'?3:2)):0;
    const range=t.range+rangeBonus,dc=12+band.tier+Math.min(3,Math.floor(integer(context.arcana,0,7)/2));
    const average=numeric?(t.dice*(t.sides+1)/2+fixed):0,maximum=numeric?t.dice*t.sides+fixed:0;
    const canCrit=t.effect==='damage'&&t.targets===1&&t.area===0&&t.delivery==='instant';
    const packets=[];
    if(numeric&&Number.isInteger(t.targets)&&t.targets>0&&t.targets<=5&&Number.isInteger(t.dice)){
      for(let i=0;i<t.targets;i++)packets.push({dice:Math.floor(t.dice/t.targets)+(i<t.dice%t.targets?1:0),fixed:Math.floor(fixed/t.targets)+(i<fixed%t.targets?1:0)});
    }
    const longEffect=t.duration>1;
    return {technique:t,band,errors:[...new Set(errors)],valid:errors.length===0,costs,points,veil,fixed,potency,range,rangeBonus,dc,average,maximum,criticalMaximum:canCrit?2*t.dice*t.sides+fixed:maximum,canCrit,packets,numeric,longEffect,maintenance:longEffect?1:0};
  }
  function combo(sources){
    const used=(sources||[]).filter(s=>Number(s.value)!==0),errors=[];
    const key=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
    if(used.some(s=>!key(s.name)))errors.push('Nomeie a origem de cada bônus de combo.');
    if(new Set(used.map(s=>key(s.name))).size!==used.length)errors.push('A mesma fonte de combo não acumula.');
    if(used.some(s=>!Number.isInteger(Number(s.value))||Number(s.value)<0||Number(s.value)>3))errors.push('Cada fonte de combo concede no máximo +3.');
    const total=used.reduce((n,s)=>n+Number(s.value),0);if(total>6)errors.push('O combo de acerto tem teto de +6.');
    return{total,errors,valid:errors.length===0};
  }
  function canUse(result,session){
    const errors=[...result.errors];
    if(!Number.isFinite(session.veil)||session.veil<result.veil)errors.push(`Véu insuficiente: precisa de ${result.veil}.`);
    if(session.used?.[result.technique.action])errors.push('Esta ação já foi usada no turno.');
    if(result.longEffect&&session.used?.bonus)errors.push('Uma técnica com concentração também exige a ação bônus livre.');
    if(result.technique.effect==='summon'&&session.summon)errors.push('Encerre a invocação anterior antes de criar outra.');
    return [...new Set(errors)];
  }
  function rollPayload(result,critical=false,random=Math.random){
    return result.packets.map((p,i)=>{
      const count=p.dice*(critical&&result.canCrit?2:1);
      const rolls=Array.from({length:count},()=>1+Math.min(result.technique.sides-1,Math.floor(Math.max(0,random())*result.technique.sides)));
      const total=rolls.reduce((a,b)=>a+b,0)+p.fixed;
      const cycles=result.technique.delivery==='overTime'?Array.from({length:result.technique.duration},(_,n)=>Math.floor(total/result.technique.duration)+(n<total%result.technique.duration?1:0)):null;
      return{target:i+1,rolls,fixed:p.fixed,total,cycles};
    });
  }
  const api={tiers,effects,controls,utilities,ranges,durations,actions,faceCost,tierFor,slots,createTechnique,normalize,evaluate,combo,canUse,rollPayload};
  root.THAAL_POWER=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
