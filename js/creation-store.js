/* A single storage write records a draw and the corresponding character draft. */
(function (root) {
  'use strict';
  const KEY = 'penta_reign_creation';
  function create(storage, rules) {
    const keyFor = character => String(character.awakeningKey || character.id || '');
    function read() {
      const raw = storage.getItem(KEY);
      if (raw === null) return {records: Object.create(null), draft: null};
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || !data.records || typeof data.records !== 'object' || Array.isArray(data.records)) throw new Error('Registro de despertar inválido.');
      return {records: Object.assign(Object.create(null), data.records), draft: data.draft || null};
    }
    const write = data => storage.setItem(KEY, JSON.stringify(data));
    function known(key, data = read()) {
      return Object.hasOwn(data.records, key) ? rules.awakening(data.records[key]) : null;
    }
    function resolve(character) {
      const recorded = known(keyFor(character));
      if (recorded) return recorded;
      const incoming = rules.awakening(character.awakening, character.giftRoll);
      // An imported or legacy result has no verifiable unused attempt here.
      return incoming.result === null ? incoming : {...incoming, attempts: 2, locked: true};
    }
    function persist(character, dirty = true) {
      const data = read(), key = keyFor(character);
      if (!key) throw new Error('Personagem sem identificador de despertar.');
      const incoming = known(key, data) || rules.awakening(character.awakening, character.giftRoll);
      if (incoming.attempts) data.records[key] = incoming;
      data.draft = {character: {...character, awakeningKey: key, awakening: incoming, giftRoll: incoming.result ?? ''}, dirty};
      write(data);
    }
    function transition(key, expected, action, character, roll) {
      const data = read(), current = known(key, data) || {attempts: 0, result: null, locked: false};
      const normalized = rules.awakening(expected);
      if (current.attempts !== normalized.attempts || current.result !== normalized.result || current.locked !== normalized.locked) return {applied: false, current};
      if (current.locked || current.attempts >= 2) throw new Error('O despertar já está definido.');
      const next = action === 'keep' ? rules.keepAwakening(current) : action === 'roll' ? rules.nextAwakening(current, roll()) : null;
      if (!next) throw new Error('Ação de despertar inválida.');
      data.records[key] = next;
      data.draft = {character: {...character, awakeningKey: key, awakening: next, giftRoll: next.result}, dirty: true};
      write(data);
      return {applied: true, current: next};
    }
    function importCopy(character, id) {
      const awakeningKey = keyFor(character) || id;
      const current = resolve({...character, awakeningKey});
      return {...character, id, awakeningKey, awakening: current, giftRoll: current.result ?? ''};
    }
    return {read, known, resolve, persist, transition, importCopy, key: KEY};
  }
  const api = {create, KEY};
  root.PENTA_CREATION_STORAGE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
