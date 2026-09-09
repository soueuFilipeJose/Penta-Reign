/* Character creation rules. Pure functions shared by the sheet and its tests. */
(function (root) {
  'use strict';
  const attributeOrder = ['fortitude', 'intellect', 'luck', 'cunning', 'vision', 'vitality', 'gift'];
  const profiles = {
    Livre: {a: 0, s: 0, affinity: ['fortitude', 'intellect']},
    Assassino: {a: 0, s: -2, affinity: ['vitality', 'vision', 'cunning']},
    'Apotecário': {a: 0, s: -2, affinity: ['intellect', 'vitality', 'cunning']},
    Arqueiro: {a: 0, s: 0, initialAttributeMax: 4, affinity: ['vision', 'cunning', 'vitality']},
    Bruxo: {a: 0, s: -2, affinity: ['gift', 'vitality', 'intellect']},
    Cavaleiro: {a: -1, s: 0, affinity: ['fortitude', 'vitality', 'vision']},
    Escravo: {a: 0, s: 1, affinity: ['vitality', 'cunning', 'fortitude']},
    Feiticeiro: {a: 0, s: -2, affinity: ['gift', 'intellect', 'vision']},
    'Lutador / Monge': {a: -1, s: 0, affinity: ['fortitude', 'vitality', 'cunning']},
    'Músico': {a: 0, s: -2, affinity: ['cunning', 'intellect', 'luck']},
    Nobre: {a: 0, s: -2, affinity: ['cunning', 'gift', 'luck']},
    'Peso Tanque': {a: -1, s: -1, affinity: ['fortitude', 'vitality', 'luck']},
    Pirata: {a: -1, s: 0, affinity: ['cunning', 'vision', 'vitality']},
    'Sábio': {a: 0, s: -2, affinity: ['intellect', 'gift', 'luck']},
    Samurai: {a: 0, s: -1, affinity: ['fortitude', 'vision', 'cunning']}
  };
  const birthplaces = ['Capital', 'Burgo', 'Cidadela', 'Aldeia', 'Vila', 'Porto', 'Fortaleza', 'Mosteiro', 'Acampamento', 'Fronteira', 'Terras rurais', 'Ruínas'];
  const pairEntries = [
    ['fortitude', 'intellect', 'Arquiteto', 'A força ergue o que a razão primeiro desenhou.'],
    ['fortitude', 'luck', 'Juramentado', 'O corpo sustenta uma promessa feita ao destino.'],
    ['fortitude', 'cunning', 'Conquistador', 'A vontade abre caminho onde a astúcia encontra uma brecha.'],
    ['fortitude', 'vision', 'Sentinela', 'Olhos atentos e mãos firmes guardam aquilo que não pode cair.'],
    ['fortitude', 'vitality', 'Inquebrável', 'A carne conhece a dor, mas ainda se recusa a ceder.'],
    ['fortitude', 'gift', 'Pecador', 'O corpo sustenta o poder que o espírito ousou tomar.'],
    ['intellect', 'luck', 'Oráculo', 'A razão procura sentido nos sinais que o destino deixa.'],
    ['intellect', 'cunning', 'Tecelão', 'Cada ideia é um fio; cada escolha, uma trama possível.'],
    ['intellect', 'vision', 'Decifrador', 'Enxerga o sinal e compreende a verdade escondida nele.'],
    ['intellect', 'vitality', 'Alquimista', 'Transforma conhecimento em fôlego para resistir e renascer.'],
    ['intellect', 'gift', 'Arcanista', 'Dá nome ao impossível e aprende a conversar com suas leis.'],
    ['luck', 'cunning', 'Errante', 'Lê as encruzilhadas e aposta no caminho que ainda não existe.'],
    ['luck', 'vision', 'Profeta', 'Vê no presente as sombras do que ainda está por vir.'],
    ['luck', 'vitality', 'Abençoado', 'A vida insiste onde o destino parecia ter fechado a porta.'],
    ['luck', 'gift', 'Escolhido', 'O improvável responde quando sua voz atravessa o Véu.'],
    ['cunning', 'vision', 'Caçador', 'Percebe a abertura e conhece o instante exato de agir.'],
    ['cunning', 'vitality', 'Sobrevivente', 'Muda de caminho, guarda o fôlego e encontra uma saída.'],
    ['cunning', 'gift', 'Herege', 'Encontra no sagrado uma pergunta que ninguém ousou fazer.'],
    ['vision', 'vitality', 'Peregrino', 'Mantém os olhos no horizonte e a vida acesa a cada passo.'],
    ['vision', 'gift', 'Vidente', 'Enxerga o que habita além da superfície do mundo.'],
    ['vitality', 'gift', 'Renascido', 'O poder corre junto ao sangue; cada ferida aprende a florescer.']
  ];
  const pairs = new Map(pairEntries.map(([a, b, name, description]) => [[a, b].sort().join('|'), {name, description}]));
  const int = (value, min, max) => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : min;
  };
  const validRoll = value => (typeof value === 'number' || typeof value === 'string') && value !== '' && Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 20;
  const profileFor = name => Object.hasOwn(profiles, name) ? profiles[name] : profiles.Livre;
  const attributeCap = level => level === 1 ? 4 : level <= 4 ? 5 : 6;
  const skillCap = level => level === 1 ? 2 : level <= 4 ? 3 : level <= 7 ? 4 : 5;
  function awakening(value, legacyResult) {
    if (value && validRoll(value.result)) {
      const attempts = int(value.attempts, 1, 2);
      return {result: Number(value.result), attempts, locked: attempts === 2 || value.locked === true};
    }
    if (validRoll(legacyResult)) return {result: Number(legacyResult), attempts: 2, locked: true};
    if (value && Number(value.attempts) > 0) throw new Error('O registro de despertar está incompleto.');
    return {result: null, attempts: 0, locked: false};
  }
  function nextAwakening(previous, result) {
    const current = awakening(previous);
    if (current.locked || current.attempts >= 2) throw new Error('O despertar já está definido.');
    if (!validRoll(result)) throw new Error('Resultado de d20 inválido.');
    const attempts = current.attempts + 1;
    return {attempts, result: Number(result), locked: attempts === 2};
  }
  function keepAwakening(previous) {
    const current = awakening(previous);
    if (!current.attempts) throw new Error('Role o despertar antes de confirmar.');
    return {...current, locked: true};
  }
  function budget(data, context) {
    const level = int(context.level, 1, 10), profile = profileFor(context.className);
    const current = awakening(context.awakening);
    const row = data.giftTable.find(row => current.result >= row.min && current.result <= row.max);
    const baseA = row?.attributes || 0, baseS = row?.skills || 0;
    const classA = Math.min(baseA + profile.a, profile.initialAttributeMax ?? Infinity) - baseA;
    const growthA = Math.floor(level / 2), growthS = level - 1;
    return {
      ready: current.locked && current.result !== null, count: row?.count ?? null,
      a: row ? Math.max(0, baseA + classA + growthA) : 0,
      s: row ? Math.max(0, baseS + profile.s + growthS) : 0,
      baseA, baseS, classA, classS: profile.s, growthA, growthS,
      attributeCap: attributeCap(level), skillCap: skillCap(level)
    };
  }
  function spent(values, minimum) { return Object.values(values).reduce((sum, value) => sum + Math.max(0, Number(value) - minimum), 0); }
  function fitBucket(keys, values, minimum, cap, allowance) {
    const fitted = Object.fromEntries(keys.map(key => [key, int(values?.[key] ?? minimum, minimum, cap)]));
    // Trim the highest investments first; the caller preserves a copy for review.
    while (spent(fitted, minimum) > allowance) {
      const key = keys.reduce((best, key) => fitted[key] > fitted[best] ? key : best, keys[0]);
      fitted[key]--;
    }
    return fitted;
  }
  function fit(data, context, allocation) {
    const b = budget(data, context), attributes = Object.keys(data.attributes), skills = Object.values(data.attributes).flatMap(a => a.skills);
    const result = {
      attributes: fitBucket(attributes, allocation.attributes, 1, b.attributeCap, b.ready ? b.a : 0),
      skills: fitBucket(skills, allocation.skills, 0, b.skillCap, b.ready ? b.s : 0)
    };
    result.changed = attributes.some(key => Number(allocation.attributes?.[key] ?? 1) !== result.attributes[key]) || skills.some(key => Number(allocation.skills?.[key] ?? 0) !== result.skills[key]);
    return result;
  }
  function setPoint(data, context, allocation, type, key, requested) {
    const b = budget(data, context), minimum = type === 'attributes' ? 1 : 0;
    const keys = type === 'attributes' ? Object.keys(data.attributes) : Object.values(data.attributes).flatMap(a => a.skills);
    if (!['attributes', 'skills'].includes(type) || !keys.includes(key)) throw new Error('Campo de distribuição inválido.');
    const fitted = fit(data, context, allocation), values = fitted[type];
    const allowance = b.ready ? (type === 'attributes' ? b.a : b.s) : 0;
    const cap = type === 'attributes' ? b.attributeCap : b.skillCap;
    const available = Math.max(0, allowance - spent(values, minimum));
    const maximum = Math.min(cap, values[key] + available);
    const value = int(requested, minimum, maximum);
    return {value, maximum, limited: !b.ready || !Number.isFinite(Number(requested)) || Number(requested) !== value, allocation: {...fitted, [type]: {...values, [key]: value}}};
  }
  function alignment(data, attributes, className) {
    const priorities = [...new Set([...profileFor(className).affinity, ...attributeOrder])];
    const ranked = [...attributeOrder].sort((a, b) => Number(attributes[b] || 1) - Number(attributes[a] || 1) || priorities.indexOf(a) - priorities.indexOf(b));
    const pair = ranked.slice(0, 2), result = pairs.get([...pair].sort().join('|'));
    const tied = ranked.some((key, index) => index > 1 && Number(attributes[key] || 1) === Number(attributes[pair[1]] || 1));
    return {...result, pair, labels: pair.map(key => data.attributes[key].label), tied};
  }
  const locationsFor = kingdom => kingdom === 'Reino da Chuva' ? [...birthplaces, 'Submundo'] : [...birthplaces];
  const api = {profiles, pairEntries, birthplaces, profileFor, attributeCap, skillCap, awakening, nextAwakening, keepAwakening, budget, spent, fit, setPoint, alignment, locationsFor, validRoll};
  root.PENTA_CHARACTER = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
