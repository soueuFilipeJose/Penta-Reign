(function () {
  'use strict';
  // Access may throw when the browser blocks local storage.
  let storage, busy = false, draftTimer;
  try { storage = window.PENTA_CREATION_STORAGE.create(window.localStorage, C); storage.read(); }
  catch (error) { storage = null; notice('Não foi possível acessar o registro dos despertares. Habilite o armazenamento do navegador para rolar com segurança.'); }

  function syncAwakening(current) {
    state.awakening = current;
    const fitted = C.fit(D, creationContext(), state);
    if (fitted.changed) state.allocationArchive = {attributes: {...state.attributes}, skills: {...state.skills}};
    state.attributes = fitted.attributes; state.skills = fitted.skills;
    recalc();
  }
  window.refreshCreationUI = function () {
    const current = state.awakening, b = budgets();
    $('rollGifts').disabled = busy || !storage || current.locked;
    $('rollGifts').textContent = current.locked ? 'Despertar definido' : current.attempts ? 'Rolar pela última vez' : 'Rolar o despertar';
    $('keepGiftRoll').hidden = current.attempts !== 1 || current.locked;
    $('keepGiftRoll').disabled = busy;
    $('awakeningStatus').textContent = current.locked ? `Resultado definitivo · ${current.attempts} de 2 rolagens usadas. Não é possível voltar ao resultado anterior.` : current.attempts ? '1 de 2 rolagens usadas. Mantenha este resultado ou arrisque a última rolagem. O novo resultado substituirá este.' : 'Você tem até duas rolagens. Atributos e perícias serão liberados quando o resultado estiver definido.';
    $('creationProgress').textContent = b.ready ? 'Despertar definido · distribua seus pontos' : 'Escolha classe e nível · defina seu despertar · distribua os pontos';
    $('powerWorkbench').hidden = !b.ready; $('giftsContainer').hidden = !b.ready;
  };
  window.persistCharacterDraft = function () {
    clearTimeout(draftTimer);
    if (!storage) return false;
    try { storage.persist(collect(), state.dirty); return true; }
    catch (error) { notice('Não foi possível guardar o rascunho. O registro anterior foi preservado; exporte sua ficha antes de sair.'); return false; }
  };
  window.queueCharacterDraft = function () {
    clearTimeout(draftTimer);
    draftTimer = setTimeout(window.persistCharacterDraft, 250);
  };
  window.resolveCharacterCreation = character => {
    if (!storage) throw new Error('O registro de despertar está indisponível.');
    return storage.resolve(character);
  };
  window.prepareImportedCharacter = character => {
    if (!storage) throw new Error('O registro de despertar está indisponível.');
    return storage.importCopy(character, makeId());
  };
  function d20() {
    if (!window.crypto?.getRandomValues) return Math.floor(Math.random() * 20) + 1;
    const values = new Uint32Array(1);
    do { window.crypto.getRandomValues(values); } while (values[0] >= 4294967280);
    return values[0] % 20 + 1;
  }
  async function decide(action) {
    if (busy || !storage || state.awakening.locked) return;
    const key = state.awakeningKey;
    busy = true; window.refreshCreationUI();
    const perform = () => {
      if (state.awakeningKey !== key) return;
      const known = storage.known(key);
      if (known) syncAwakening(known);
      if (state.awakening.locked) { notice('O despertar deste personagem já está definido.'); return; }
      const current = state.awakening;
      const question = action === 'keep'
        ? `Manter o resultado ${current.result}? Você abrirá mão da segunda rolagem e poderá distribuir seus pontos.`
        : current.attempts === 0
          ? 'Você poderá rolar o d20 de despertar no máximo duas vezes. Depois desta primeira rolagem, poderá manter o resultado ou tentar uma última vez. Na segunda, o novo resultado será definitivo e não será possível voltar ao anterior. Rolar agora?'
          : `Esta é sua segunda e última oportunidade. O novo resultado substituirá ${current.result}, mesmo que seja menor. Não haverá outra rolagem e não será possível recuperar o resultado anterior. Rolar pela última vez?`;
      if (!window.confirm(question)) return;
      const result = storage.transition(key, current, action, collect(), d20);
      syncAwakening(result.current);
      if (!result.applied) { notice('O despertar foi atualizado em outra aba. O resultado mais recente foi mantido.'); return; }
      markDirty();
      notice(result.current.locked ? `Despertar definido: ${result.current.result}. Seus pontos estão disponíveis para distribuição.` : `Resultado: ${result.current.result}. Você ainda pode manter este resultado ou usar a última rolagem.`);
      if (result.current.locked) showView('overview', {focusPanel: true});
    };
    try {
      if (window.navigator.locks?.request) await window.navigator.locks.request('penta-reign-awakening', perform);
      else perform();
    } catch (error) { notice('Não foi possível registrar esta decisão. Nenhum novo resultado foi aplicado. Confira o armazenamento do navegador e tente novamente.'); }
    finally { busy = false; window.refreshCreationUI(); }
  }
  window.rollAwakening = () => decide('roll');
  window.keepAwakening = () => decide('keep');
  window.addEventListener('storage', event => {
    if (!storage || event.key !== storage.key) return;
    try {
      const known = storage.known(state.awakeningKey);
      if (known && JSON.stringify(known) !== JSON.stringify(state.awakening)) syncAwakening(known);
    } catch (error) { notice('O registro externo de despertar não pôde ser lido. A ficha atual foi preservada.'); }
  });
  if (storage) {
    try {
      const draft = storage.read().draft;
      if (draft?.character) {
        const restored = applyCharacter(draft.character, {fromDraft: true});
        if (!draft.dirty && !restored.adjusted) markSaved();
        window.persistCharacterDraft();
        notice('Seu último personagem foi retomado, com o despertar registrado.');
      }
    } catch (error) { notice('O rascunho anterior não pôde ser aberto e foi preservado.'); }
  }
  window.refreshCreationUI();
})();
