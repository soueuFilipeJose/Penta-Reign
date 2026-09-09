const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const C = require('../js/character-engine.js');
const S = require('../js/creation-store.js');
const sandbox = {window: {}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'), sandbox);
const D = sandbox.window.RPG_DATA;
const attributes = Object.keys(D.attributes);
const skills = Object.values(D.attributes).flatMap(attribute => attribute.skills);
const allocation = () => ({attributes: Object.fromEntries(attributes.map(key => [key, 1])), skills: Object.fromEntries(skills.map(key => [key, 0]))});
const context = (className = 'Livre', level = 1, result = 10) => ({className, level, awakening: {attempts: 1, result, locked: true}});
function memory() {
  const values = new Map();
  let blocked = false;
  const storage = {getItem: key => values.get(key) ?? null, setItem(key, value) { if (blocked) throw new Error('quota'); values.set(key, value); }};
  return {store: S.create(storage, C), values, block: () => { blocked = true; }};
}

test('todas as classes têm orçamento e afinidades definidos; existem pelo menos oito locais de nascimento', () => {
  assert.deepEqual(Object.keys(C.profiles).sort(), Object.keys(D.classes).sort());
  assert.ok(C.birthplaces.length >= 8);
  assert.equal(new Set(C.birthplaces).size, C.birthplaces.length);
  assert.ok(C.locationsFor('Reino da Chuva').includes('Submundo'));
  assert.ok(!C.locationsFor('Reino de Ferro').includes('Submundo'));
});

test('classe, nível e despertar compõem um orçamento reproduzível, sem conceder pontos duas vezes', () => {
  assert.equal(C.budget(D, context('Assassino')).s, 4);
  assert.equal(C.budget(D, context('Lutador / Monge')).a, 4);
  assert.equal(C.budget(D, context('Arqueiro', 1, 1)).a, 4);
  assert.equal(C.budget(D, context('Samurai')).s, 5);
  assert.equal(C.budget(D, context('Livre', 10)).a, 10);
  assert.equal(C.budget(D, context('Livre', 10)).s, 15);
  const first = C.budget(D, context('Livre', 1));
  C.budget(D, context('Livre', 10));
  assert.deepEqual(C.budget(D, context('Livre', 1)), first);
  assert.ok(C.budget(D, context('Livre', 1, 1)).s > C.budget(D, context('Livre', 1, 20)).s);
});

test('antes de definir os dons nenhum atributo ou perícia aceita investimento, inclusive após a primeira rolagem', () => {
  for (const awakening of [{attempts: 0, result: null, locked: false}, {attempts: 1, result: 20, locked: false}]) {
    const ctx = {...context(), awakening};
    const initial = allocation();
    assert.equal(C.setPoint(D, ctx, initial, 'attributes', 'fortitude', 6).value, 1);
    assert.equal(C.setPoint(D, ctx, initial, 'skills', 'Força', 5).value, 0);
  }
});

test('digitar valores ou usar incrementos nunca ultrapassa o saldo restante ou o teto individual', () => {
  let points = allocation();
  const ctx = context('Livre', 1, 20);
  points = C.setPoint(D, ctx, points, 'attributes', 'fortitude', 999).allocation;
  points = C.setPoint(D, ctx, points, 'attributes', 'gift', 999).allocation;
  assert.equal(points.attributes.fortitude, 4);
  assert.equal(points.attributes.gift, 2);
  assert.equal(C.spent(points.attributes, 1), 4);
  assert.equal(C.setPoint(D, ctx, points, 'attributes', 'vision', 2).value, 1);
  points = C.setPoint(D, ctx, points, 'attributes', 'fortitude', 3).allocation;
  assert.equal(C.setPoint(D, ctx, points, 'attributes', 'vision', 2).value, 2);
  for (const skill of skills) points = C.setPoint(D, ctx, points, 'skills', skill, 100).allocation;
  assert.equal(C.spent(points.skills, 0), 4);
  assert.ok(Object.values(points.skills).every(value => value <= 2));
});

test('importação de valores excessivos, negativos, fracionários e não finitos respeita todos os orçamentos', () => {
  for (const className of Object.keys(D.classes)) for (let level = 1; level <= 10; level++) for (const result of [1, 10, 16, 19, 20]) {
    const ctx = context(className, level, result), b = C.budget(D, ctx);
    const source = {attributes: Object.fromEntries(attributes.map((key, i) => [key, i === 1 ? Infinity : 900])), skills: Object.fromEntries(skills.map((key, i) => [key, i % 3 === 0 ? -5 : i % 3 === 1 ? 4.8 : 900]))};
    const fitted = C.fit(D, ctx, source);
    assert.ok(C.spent(fitted.attributes, 1) <= b.a);
    assert.ok(C.spent(fitted.skills, 0) <= b.s);
    assert.ok(Object.values(fitted.attributes).every(value => Number.isInteger(value) && value >= 1 && value <= b.attributeCap));
    assert.ok(Object.values(fitted.skills).every(value => Number.isInteger(value) && value >= 0 && value <= b.skillCap));
    assert.equal(source.attributes.fortitude, 900);
  }
});

test('reduzir classe ou nível detecta investimentos incompatíveis em vez de oferecer saldo negativo', () => {
  let points = allocation();
  for (const key of attributes) points = C.setPoint(D, context('Livre', 10), points, 'attributes', key, 6).allocation;
  assert.equal(C.fit(D, context('Livre', 1), points).changed, true);
  const initial = allocation(); initial.attributes.fortitude = 4; initial.attributes.gift = 3;
  assert.equal(C.fit(D, context('Arqueiro'), initial).changed, true);
});

test('as 21 duplas têm alinhamentos únicos e Fortitude com Dom resulta em Pecador nas duas ordens', () => {
  const names = new Set();
  for (const [a, b, name] of C.pairEntries) {
    for (const [first, second] of [[a, b], [b, a]]) {
      const values = allocation().attributes; values[first] = 5; values[second] = 4;
      const result = C.alignment(D, values, 'Livre');
      assert.equal(result.name, name); assert.ok(result.description.length > 20);
    }
    names.add(name);
  }
  assert.equal(names.size, 21);
  const values = allocation().attributes; values.fortitude = 4; values.gift = 4;
  assert.equal(C.alignment(D, values, 'Livre').name, 'Pecador');
  assert.deepEqual(C.alignment(D, allocation().attributes, 'Bruxo').pair, ['gift', 'vitality']);
});

test('a segunda rolagem substitui a primeira e impede uma terceira, mesmo após recarregar', () => {
  const m = memory(), ch = {id: 'hero', awakeningKey: 'hero'}, initial = C.awakening();
  const first = m.store.transition('hero', initial, 'roll', ch, () => 20);
  assert.equal(first.current.locked, false);
  const second = m.store.transition('hero', first.current, 'roll', ch, () => 1);
  assert.equal(second.current.result, 1); assert.equal(second.current.locked, true);
  assert.throws(() => m.store.transition('hero', second.current, 'roll', ch, () => 20), /definido/);
  assert.deepEqual(m.store.resolve({...ch, giftRoll: 20}), C.awakening(second.current));
  assert.equal(m.store.read().draft.character.giftRoll, 1);
});

test('manter o primeiro resultado também encerra o despertar e uma gravação antiga não o reabre', () => {
  const m = memory(), ch = {id: 'kept'};
  const first = m.store.transition('kept', C.awakening(), 'roll', ch, () => 14);
  const kept = m.store.transition('kept', first.current, 'keep', ch);
  m.store.persist({...ch, awakening: first.current});
  assert.equal(m.store.resolve(ch).locked, true);
  assert.equal(m.store.resolve(ch).attempts, 1);
  assert.throws(() => m.store.transition('kept', kept.current, 'roll', ch, () => 15));
});

test('uma cópia de JSON antigo mantém o último resultado conhecido e não recupera tentativas', () => {
  const m = memory(), ch = {id: 'original'};
  const first = m.store.transition('original', C.awakening(), 'roll', ch, () => 18);
  const oldExport = {...ch, awakening: first.current, giftRoll: 18};
  m.store.transition('original', first.current, 'roll', ch, () => 4);
  const copy = m.store.importCopy(oldExport, 'copy');
  assert.equal(copy.id, 'copy'); assert.equal(copy.awakeningKey, 'original');
  assert.equal(copy.giftRoll, 4); assert.equal(copy.awakening.attempts, 2);
  const foreign = m.store.importCopy({id: 'foreign', giftRoll: 17}, 'foreign-copy');
  assert.equal(foreign.awakening.locked, true); assert.equal(foreign.awakening.attempts, 2);
});

test('uma tentativa desatualizada em outra aba é recusada antes de sortear outro dado', () => {
  const m = memory(), ch = {id: 'shared'}, initial = C.awakening();
  m.store.transition('shared', initial, 'roll', ch, () => 8);
  let rolled = false;
  const stale = m.store.transition('shared', initial, 'roll', ch, () => { rolled = true; return 20; });
  assert.equal(stale.applied, false); assert.equal(stale.current.attempts, 1); assert.equal(rolled, false);
});

test('falhas de gravação e dados corrompidos não substituem o registro existente', () => {
  const m = memory(), ch = {id: 'safe'};
  const first = m.store.transition('safe', C.awakening(), 'roll', ch, () => 9);
  const before = m.values.get(S.KEY); m.block();
  assert.throws(() => m.store.transition('safe', first.current, 'roll', ch, () => 11));
  assert.equal(m.values.get(S.KEY), before);
  m.values.set(S.KEY, '{corrompido');
  assert.throws(() => m.store.persist(ch));
  assert.equal(m.values.get(S.KEY), '{corrompido');
  assert.throws(() => C.awakening({attempts: 2, result: null}));
});
