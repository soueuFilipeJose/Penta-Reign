const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function element(id, view) {
  const classes = new Set();
  return {
    id, dataset: {view}, attributes: {}, hidden: true, tabIndex: -1,
    classList: {toggle(name, active) { active ? classes.add(name) : classes.delete(name); }},
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; }
  };
}

function characterNavigation(hash = '') {
  const ids = ['overview', 'skills', 'gifts', 'combat', 'content', 'library'];
  const panels = ids.map(id => element(id));
  const tabs = ids.map(id => element('tab-' + id, id));
  const title = {};
  const pushes = [];
  const window = {
    RPG_DATA: {}, location: {hash}, scrollTo() {},
    history: {pushState(state, title, hash) { pushes.push(hash); window.location.hash = hash; }}
  };
  const context = vm.createContext({
    window,
    document: {
      getElementById: id => id === 'viewTitle' ? title : panels.find(panel => panel.id === id),
      querySelectorAll: selector => selector === '.view' ? panels : tabs
    }
  });
  vm.runInContext(read('js/app.js').replace(/\ninit\(\);\s*$/, ''), context);
  vm.runInContext('globalThis.libraryOpens=0; renderLibrary=()=>globalThis.libraryOpens++;', context);
  return {context, panels, tabs, title, pushes, window, run: code => vm.runInContext(code, context)};
}

test('trocar abas preserva a ficha e expõe somente o painel selecionado', () => {
  const app = characterNavigation();
  app.run('state.gifts=[{name:"Fios de chuva",description:"Rascunho ainda não salvo"}]; state.dirty=true;');
  app.run('showView("gifts",{focusPanel:true})');
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.id), ['gifts']);
  assert.equal(app.panels.find(panel => panel.id === 'gifts').focused, true);
  assert.equal(app.tabs.find(tab => tab.dataset.view === 'gifts').attributes['aria-selected'], 'true');
  assert.equal(app.tabs.filter(tab => tab.tabIndex === 0).length, 1);
  assert.equal(app.title.textContent, 'Dons');
  app.run('showView("combat");showView("overview")');
  assert.equal(app.run('state.gifts[0].description'), 'Rascunho ainda não salvo');
  assert.equal(app.run('state.dirty'), true);
  assert.deepEqual(app.pushes, ['#gifts', '#combat', '#overview']);
});

test('links diretos e retorno pelo histórico abrem a aba sem criar outra entrada', () => {
  const app = characterNavigation('#library');
  app.run('showView(viewFromHash(),{recordHistory:false})');
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.id), ['library']);
  assert.equal(app.run('libraryOpens'), 1);
  app.window.location.hash = '#skills';
  app.run('showView(viewFromHash(),{recordHistory:false})');
  assert.deepEqual(app.panels.filter(panel => !panel.hidden).map(panel => panel.id), ['skills']);
  assert.deepEqual(app.pushes, []);
  app.window.location.hash = '#invalid';
  assert.equal(app.run('viewFromHash()'), 'overview');
  app.run('showView("invalid")');
  assert.equal(app.title.textContent, 'Perícias');
});

test('links antigos da apresentação redirecionam para fichas no subdiretório correto', () => {
  for (const [fragment, target] of [['ficha', 'overview'], ['gifts', 'gifts'], ['library', 'library'], ['sistema', null]]) {
    const destinations = [];
    const window = {
      location: {hash: '#' + fragment, href: 'https://example.test/Penta-Reign/index.html#' + fragment, replace: url => destinations.push(url)},
      addEventListener() {}
    };
    const document = {body: {classList: {contains: () => true}}, querySelectorAll: () => [], getElementById: () => null};
    vm.runInNewContext(read('js/site.js'), {window, document, URL});
    assert.deepEqual(destinations, target ? ['https://example.test/Penta-Reign/fichas.html#' + target] : []);
  }
});

test('a referência de regras funciona sem inicializar ficha ou acessar o armazenamento', () => {
  const window = {THAAL_POWER: require('../js/power-engine.js')};
  vm.runInNewContext(read('js/data.js'), {window});
  const boxes = {powerRules: {}, rulesContent: {}};
  const localStorage = new Proxy({}, {get() { throw new Error('A apresentação não deve acessar personagens'); }});
  vm.runInNewContext(read('js/rules.js'), {window, document: {getElementById: id => boxes[id]}, localStorage});
  assert.match(boxes.powerRules.innerHTML, /até 2d6/);
  assert.match(boxes.powerRules.innerHTML, /até 6d10/);
  assert.match(boxes.rulesContent.innerHTML, /Penta-Reign/);
  assert.doesNotMatch(read('index.html'), /src="js\/(app|powers-ui)\.js"/);
  assert.match(read('index.html'), /href="fichas\.html"/);
});
