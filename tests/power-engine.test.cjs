const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/power-engine.js');
const technique = (preset, overrides={}) => ({...P.createTechnique(preset), name:'Técnica de teste', flavor:'Manifestação física do conceito do dom.', ...overrides});

test('exemplos do guia usam custos reproduzíveis e mantêm a base de 4 Véu', () => {
  const rain=P.evaluate(technique('damage',{dice:2}),{level:1,potency:1});
  assert.equal(rain.valid,true);assert.equal(rain.points,5);assert.equal(rain.veil,4);
  assert.equal(rain.average,9);assert.equal(rain.maximum,14);assert.equal(rain.criticalMaximum,26);
  const wires=P.evaluate(technique('control',{control:'root',duration:3}),{level:3});
  assert.equal(wires.valid,true);assert.equal(wires.points,6);assert.equal(wires.veil,4);
  const shield=P.evaluate(technique('barrier'),{level:1});
  assert.equal(shield.valid,true);assert.equal(shield.points,4);assert.equal(shield.veil,4);
});

test('muitos projéteis/alvos nunca duplicam o conjunto de dados ou o bônus fixo', () => {
  const r=P.evaluate(technique('damage',{dice:3,sides:4,targets:3,fixed:4,range:2}),{level:3,potency:7});
  assert.equal(r.valid,true);assert.equal(r.fixed,4);
  const payload=P.rollPayload(r,false,()=>.9999);
  assert.equal(payload.length,3);assert.equal(payload.reduce((n,p)=>n+p.rolls.length,0),3);
  assert.equal(payload.reduce((n,p)=>n+p.fixed,0),4);
  assert.equal(payload.reduce((n,p)=>n+p.total,0),16);
  assert.equal(P.rollPayload(r,true,()=>.9999).reduce((n,p)=>n+p.total,0),16,'área/múltiplos alvos não critam');
});

test('dano ao longo dos ciclos conserva o dano total, sem reaplicar Potência', () => {
  const r=P.evaluate(technique('damage',{dice:2,sides:4,duration:3,delivery:'overTime'}),{level:3,potency:2});
  assert.equal(r.valid,true);
  const [p]=P.rollPayload(r,true,()=>.99);
  assert.equal(p.total,12);assert.deepEqual(p.cycles,[4,4,4]);
  assert.equal(p.cycles.reduce((a,b)=>a+b,0),p.total);
});

test('modificadores são compartilhados; crítico só dobra os dados', () => {
  const r=P.evaluate(technique('damage',{dice:2,fixed:2}),{level:1,potency:7});
  assert.equal(r.valid,true);assert.equal(r.fixed,2);
  const [p]=P.rollPayload(r,true,()=>.999);assert.equal(p.rolls.length,4);assert.equal(p.total,26);
});

test('sem Véu, sem ação ou sem espaço de concentração não há uso válido', () => {
  const r=P.evaluate(technique('damage'),{level:1});
  assert.equal(P.canUse(r,{veil:4,used:{}}).length,0);
  assert.ok(P.canUse(r,{veil:0,used:{}}).some(e=>e.includes('Véu insuficiente')));
  assert.ok(P.canUse(r,{veil:4,used:{main:true}}).some(e=>e.includes('ação já')));
  const sustained=P.evaluate(technique('control',{duration:3}),{level:3});
  assert.ok(P.canUse(sustained,{veil:20,used:{bonus:true}}).some(e=>e.includes('bônus livre')));
  const summon=P.evaluate(technique('summon'),{level:1});
  assert.equal(summon.valid,true);
  assert.ok(P.canUse(summon,{veil:10,used:{},summon:true}).some(e=>e.includes('invocação anterior')));
});

test('controle severo não combina com dano, área ou duração prolongada', () => {
  assert.equal(P.evaluate(technique('control',{control:'stun'}),{level:3}).valid,false);
  assert.equal(P.evaluate(technique('control',{control:'stun'}),{level:5}).valid,true);
  for(const change of [{effect:'damage',dice:1},{targets:2},{duration:3},{area:3}]){
    assert.equal(P.evaluate(technique('control',{control:'stun',...change}),{level:10}).valid,false);
  }
});

test('atalhos de ação e utilidades não dão ataques ou restauração grátis', () => {
  for(const effect of ['damage','heal','control','summon']){
    assert.equal(P.evaluate(technique(effect,{action:'bonus'}),{level:10}).valid,false);
    assert.equal(P.evaluate(technique(effect,{action:'reaction'}),{level:10}).valid,false);
  }
  assert.equal(P.evaluate(technique('heal',{duration:3}),{level:10}).valid,false);
  assert.equal(P.evaluate(technique('utility',{utility:'step'}),{level:1}).valid,false);
  assert.equal(P.evaluate(technique('utility',{utility:'step'}),{level:3}).valid,true);
  assert.equal(P.evaluate(technique('utility',{dice:2,fixed:10}),{level:10}).valid,false);
  assert.equal(P.evaluate(technique('utility',{utility:'thought',range:6}),{level:3}).valid,true);
  assert.equal(P.evaluate(technique('utility',{utility:'thought',range:6}),{level:1}).valid,false);
  assert.equal(P.evaluate(technique('utility',{utility:'aid',duration:3}),{level:10}).valid,false);
});

test('acerto permite fontes diferentes; fontes iguais e valores ilegais são recusados', () => {
  assert.deepEqual(P.combo([{name:'Marca',value:3},{name:'Terreno',value:3}]),{total:6,errors:[],valid:true});
  assert.equal(P.combo([{name:'Már ca',value:2},{name:' MAR  CA ',value:2}]).valid,false);
  assert.equal(P.combo([{name:'',value:3}]).valid,false);
  assert.equal(P.combo([{name:'Marca',value:4}]).valid,false);
  assert.equal(P.combo([{name:'Marca',value:-2}]).valid,false);
});

test('alcance respeita uma especialização e nunca estende toque ou invocação', () => {
  const base=technique('damage',{rangeSkill:'Mira'});
  assert.equal(P.evaluate(base,{level:1,mira:7,potency:7}).range,12);
  assert.equal(P.evaluate({...base,range:2},{level:10,mira:7}).range,2);
  assert.equal(P.evaluate(technique('summon',{rangeSkill:'Mira'}),{level:10,mira:7}).range,2);
});

test('todos os parâmetros enumerados mantêm os tetos e custos quando válidos', () => {
  let accepted=0,rejected=0;
  for(let level=1;level<=10;level++)for(let dice=1;dice<=7;dice++)for(const sides of [4,6,8,10,12])for(let targets=1;targets<=6;targets++){
    const r=P.evaluate(technique('damage',{dice,sides,targets,fixed:0}),{level,potency:7});
    if(!r.valid){rejected++;continue;}accepted++;
    assert.ok(r.points<=r.band.points);assert.ok(r.veil>=4);assert.ok(r.fixed<=r.band.fixed);
    assert.ok(r.technique.dice<=r.band.dice);assert.ok(r.technique.sides<=r.band.sides);
    assert.equal(r.packets.reduce((n,p)=>n+p.dice,0),dice);
    assert.equal(r.packets.reduce((n,p)=>n+p.fixed,0),r.fixed);
  }
  assert.ok(accepted>100);assert.ok(rejected>100);
});

test('JSON editado à mão não injeta números ou propriedades fora do modelo', () => {
  for(const overrides of [{dice:-3},{dice:1.5},{sides:100},{range:99},{targets:0},{duration:99},{area:100},{action:'free'},{control:'morte'},{effect:'vencer'},{fixed:NaN},{potency:'false'}]){
    assert.equal(P.evaluate(technique('damage',overrides),{level:10}).valid,false);
  }
});
