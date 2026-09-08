const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../js/app.js'),'utf8').replace(/init\(\);\s*$/,'');
function runtime(values={},blocked=false){
  const store=new Map(Object.entries(values));
  const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{if(blocked)throw new Error('QuotaExceeded');store.set(k,v);}};
  const ctx=vm.createContext({window:{RPG_DATA:{}},document:{getElementById:()=>null},localStorage});
  vm.runInContext(source,ctx);return{store,run:s=>vm.runInContext(s,ctx)};
}
const old=JSON.stringify([{version:'3.0',id:'antigo-1',identity:{name:'Viajante',kingdom:'Reino da Chuva',location:'Submundo'},giftRoll:'15',gifts:[{name:'Vento',description:'Texto antigo completo.'},{name:'Sombra',description:'Outro conceito.'}],resources:{veilCurrent:'0'}}]);

test('a primeira abertura copia os personagens V3 sem apagar ou alterar os originais',()=>{
  const r=runtime({thaalemor_characters_v3:old});r.run('migrateStorage()');
  assert.equal(r.store.get('thaalemor_characters_v3'),old);
  assert.deepEqual(JSON.parse(r.store.get('thaalemor_characters_v4')),JSON.parse(old));
  assert.equal(r.run('readCharacters()[0].resources.veilCurrent'),'0');
  assert.equal(r.run('readCharacters()[0].gifts[1].description'),'Outro conceito.');
});
test('uma biblioteca V4 existente não é sobrescrita por uma versão antiga',()=>{
  const existing='[]',r=runtime({thaalemor_characters_v4:existing,thaalemor_characters_v3:old});r.run('migrateStorage()');
  assert.equal(r.store.get('thaalemor_characters_v4'),existing);
});
test('V2 também pode ser migrada quando não há V3',()=>{
  const r=runtime({thaalemor_characters_v2:old});r.run('migrateStorage()');
  assert.deepEqual(JSON.parse(r.store.get('thaalemor_characters_v4')),JSON.parse(old));
});
test('JSON corrompido e falta de espaço não apagam registros existentes',()=>{
  const damaged='{quebrado',r=runtime({thaalemor_characters_v3:damaged});r.run('migrateStorage()');
  assert.equal(r.store.has('thaalemor_characters_v4'),false);assert.equal(r.store.get('thaalemor_characters_v3'),damaged);
  const blocked=runtime({thaalemor_characters_v3:old},true);blocked.run('migrateStorage()');
  assert.equal(blocked.store.has('thaalemor_characters_v4'),false);assert.equal(blocked.store.get('thaalemor_characters_v3'),old);
  const badV4=runtime({thaalemor_characters_v4:damaged,thaalemor_characters_v3:old});badV4.run('migrateStorage()');
  assert.equal(badV4.store.get('thaalemor_characters_v4'),damaged);assert.throws(()=>badV4.run('readCharacters()'));
});
