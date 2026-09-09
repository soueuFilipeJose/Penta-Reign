const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../js/character-engine.js');
const S = require('../js/creation-store.js');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const dataWindow = {};
vm.runInNewContext(read('js/data.js'), {window: dataWindow});
const D = dataWindow.RPG_DATA;
const points = () => ({attributes: Object.fromEntries(Object.keys(D.attributes).map(key => [key, 1])), skills: Object.fromEntries(Object.values(D.attributes).flatMap(a => a.skills).map(key => [key, 0]))});

test('o fluxo avisa antes de cada rolagem; cancelar não consome tentativas e só a decisão final libera pontos', async () => {
  const saved = new Map(), boxes = new Map(), notices = [], warnings = [];
  const decisions = [false, true, false, true], randoms = [.95, 0];
  const state = {id: 'flow', awakeningKey: 'flow', awakening: C.awakening(), build: {className: 'Livre', level: 1}, ...points()};
  const window = {
    PENTA_CREATION_STORAGE: S,
    localStorage: {getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value)},
    navigator: {locks: {request: async (name, action) => action()}},
    addEventListener() {}, confirm: question => { warnings.push(question); return decisions.shift(); }
  };
  const $ = id => { if (!boxes.has(id)) boxes.set(id, {}); return boxes.get(id); };
  const sandbox = {
    window, state, C, D, $, creationContext: () => ({...state.build, awakening: state.awakening}),
    budgets: () => C.budget(D, {...state.build, awakening: state.awakening}),
    notice: message => notices.push(message), recalc: () => window.refreshCreationUI?.(), markDirty() {}, showView() {},
    collect: () => ({...state}), makeId: () => 'copy', setTimeout() {}, clearTimeout() {},
    Math: Object.assign(Object.create(Math), {random: () => randoms.shift()})
  };
  vm.runInNewContext(read('js/creation-ui.js'), sandbox);
  await window.rollAwakening();
  assert.equal(state.awakening.attempts, 0);
  await window.rollAwakening();
  assert.equal(state.awakening.result, 20); assert.equal(state.awakening.locked, false);
  assert.equal(sandbox.budgets().ready, false); assert.equal($('keepGiftRoll').hidden, false);
  await window.rollAwakening();
  assert.equal(state.awakening.result, 20); assert.equal(state.awakening.attempts, 1);
  await window.rollAwakening();
  assert.equal(state.awakening.result, 1); assert.equal(state.awakening.attempts, 2);
  assert.equal(sandbox.budgets().ready, true); assert.equal($('rollGifts').disabled, true);
  assert.match(warnings[0], /máximo duas vezes/);
  assert.match(warnings[3], /segunda e última oportunidade/);
  assert.match(warnings[3], /substituirá 20, mesmo que seja menor/);
  await window.rollAwakening(); assert.equal(warnings.length, 4);
});

test('o formulário recusa classe e nível que deixariam investimentos excedentes', () => {
  const boxes = {className: {value: 'Arqueiro'}, level: {value: '1'}, saveState: {style: {}}};
  const sandbox = {window: {RPG_DATA: D, PENTA_CHARACTER: C}, document: {getElementById: id => boxes[id]}};
  const context = vm.createContext(sandbox);
  vm.runInContext(read('js/app.js').replace(/\ninit\(\);\s*$/, ''), context);
  vm.runInContext('recalc=()=>{};notice=message=>globalThis.lastNotice=message;', context);
  sandbox.initial = points();
  vm.runInContext('state.attributes=initial.attributes;state.skills=initial.skills;state.attributes.fortitude=4;state.attributes.gift=3;state.awakening={result:10,attempts:1,locked:true};changeBuild();', context);
  assert.equal(vm.runInContext('state.build.className', context), 'Livre');
  assert.equal(boxes.className.value, 'Livre');
  assert.match(sandbox.lastNotice, /Remova os pontos excedentes/);
  boxes.level.value = '5'; vm.runInContext('changeBuild()', context);
  assert.equal(vm.runInContext('state.build.level', context), 5);
  vm.runInContext('state.attributes.fortitude=5;state.attributes.gift=4;', context);
  boxes.level.value = '1'; vm.runInContext('changeBuild()', context);
  assert.equal(vm.runInContext('state.build.level', context), 5);
  assert.equal(boxes.level.value, 5);
});
