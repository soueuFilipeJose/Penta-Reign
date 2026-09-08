window.RPG_DATA = {
  version: "4.0",
  balance: {
    skillBonusPerRank: 2,
    attributeCreationCap: 4,
    attributeAbsoluteCap: 6,
    baseMovement: 10,
    vigorMetersPerRank: 2,
    miraMetersPerRank: 3,
    potencyMetersPerRank: 2,
    potencyDamagePerRank: 2,
    armorBonuses: [0,1,2,3],
    skillFullBonusRanks: 4,
    skillEffectiveAbsoluteCap: 7,
    comboModifierCap: 6
  },
  attributes: {
    fortitude: {label:"Fortitude", short:"FOR", skills:["Constituição","Defesa","Força","Resistência"]},
    intellect: {label:"Intelecto", short:"INT", skills:["Conhecimento","Criatividade","Memória"]},
    luck: {label:"Sorte", short:"SOR", skills:["Equilíbrio Espiritual","Presságio","Proteção Divina","Karma"]},
    cunning: {label:"Sagacidade", short:"SAG", skills:["Comunicação","Investigação","Persuasão","Presença","Reflexos"]},
    vision: {label:"Visão", short:"VIS", skills:["Foco","Mira","Observação","Leitura"]},
    vitality: {label:"Vitalidade", short:"VIT", skills:["Recuperação","Tolerância","Vida","Vigor"]},
    gift: {label:"Dom", short:"DOM", skills:["Canalização","Manipulação Arcana","Potência"]}
  },
  origins: {
    "Humano":"Versatilidade e Determinação permanecem como traços narrativos nesta ficha; os modificadores raciais conflitantes do texto original não são aplicados automaticamente.",
    "Elfo":"Visão Aguçada, precisão natural e afinidade com Chuva. O modificador de Furtividade continua sem automação por aparecer de formas divergentes no material.",
    "Ser Sombrio":"Visão das Sombras, afinidade sombria e fragilidade sob sol direto.",
    "Ser Místico":"Faísca Arcana e afinidade com Dons Primordiais. Bônus numéricos raciais devem respeitar a escala curta de -3 a +3.",
    "Animal Impuro":"Instinto Selvagem, Força Bruta, resistência física e níveis de Impureza I–IV."
  },
  kingdoms:["Reino de Ferro","Reino da Chuva","Reino do Trigo","Reino de Fogo","Reino do Eco","Outro"],
  locations:{
    "Reino da Chuva":["Submundo"]
  },
  classes: {
    "Livre": {veilDivisor:3, freeRanks:{}, flatMods:{}, traits:["Sem pacote automático de especialização."]},
    "Assassino": {veilDivisor:3, freeRanks:{"Reflexos":1,"Vigor":1}, flatMods:{"Presença":-1}, traits:["Especialista móvel: graus de Classe se somam aos graus investidos e permitem ultrapassar o teto comum de investimento."]},
    "Apotecário": {veilDivisor:3, freeRanks:{"Conhecimento":1,"Resistência":1}, flatMods:{}, traits:["Recebe vantagem em testes diretamente ligados à identificação/preparo de venenos e medicamentos, quando a ficção justificar."]},
    "Arqueiro": {veilDivisor:3, freeRanks:{"Mira":2,"Observação":1}, flatMods:{"Defesa":-1,"Comunicação":-1}, traits:["Olho de Caçador: ignora a primeira penalidade circunstancial de distância.","Combo de Precisão: os 2 graus gratuitos de Mira se somam integralmente aos graus investidos."]},
    "Bruxo": {veilDivisor:2, freeRanks:{"Manipulação Arcana":1,"Potência":1}, flatMods:{"Força":-1}, traits:["Véu máximo = metade dos LP."]},
    "Cavaleiro": {veilDivisor:3, freeRanks:{"Defesa":1,"Vigor":1}, flatMods:{}, traits:["Linha de frente: Defesa e Vigor de Classe podem se acumular com investimento, armadura e efeitos de postura."]},
    "Escravo": {veilDivisor:3, freeRanks:{}, flatMods:{}, traits:["Pacote mecânico ainda livre porque o material-base não fecha modificadores consistentes para a Classe."]},
    "Feiticeiro": {veilDivisor:3, freeRanks:{"Manipulação Arcana":1,"Mira":1}, flatMods:{"Força":-1}, traits:["Conjurador especializado em controle e precisão arcana."]},
    "Lutador / Monge": {veilDivisor:3, freeRanks:{"Reflexos":1,"Vigor":1}, flatMods:{"Comunicação":-1}, traits:["Combate técnico: mobilidade, reação e efeitos encadeados podem formar combos; os graus de Classe se somam ao investimento."]},
    "Músico": {veilDivisor:3, freeRanks:{"Comunicação":1,"Criatividade":1,"Presença":1}, flatMods:{}, traits:["Performance: vantagem pode ser concedida quando música/preparação tiver impacto real na cena."]},
    "Nobre": {veilDivisor:3, freeRanks:{"Presença":2}, flatMods:{"Constituição":-1}, minGifts:2, traits:["Requer pelo menos 2 Dons.","Etiqueta: vantagem em situações formais de corte, autoridade ou protocolo quando aplicável."]},
    "Peso Tanque": {veilDivisor:3, freeRanks:{"Defesa":2,"Constituição":1}, flatMods:{}, traits:["Armadura pesada: ataques à distância sofrem Desvantagem enquanto o personagem estiver usando armadura pesada."]},
    "Pirata": {veilDivisor:3, freeRanks:{"Reflexos":1,"Mira":1,"Vigor":1}, flatMods:{}, traits:["Improviso: vantagem circunstancial pode substituir bônus fixos quando a cena favorecer truques, terreno ou armas improvisadas."]},
    "Sábio": {veilDivisor:2, freeRanks:{"Conhecimento":1,"Mira":1}, flatMods:{"Força":-1}, traits:["Véu máximo = metade dos LP."]},
    "Samurai": {veilDivisor:3, freeRanks:{"Força":1,"Mira":1}, flatMods:{}, traits:["Disciplina de duelo: postura, arma, alvo marcado e graus de Classe podem ser encadeados para criar picos de eficiência."]}
  },
  giftTable: [
    {min:1,max:3,count:0,attributes:6,skills:8,label:"Mundano Excepcional"},
    {min:4,max:14,count:1,attributes:5,skills:7,label:"Dom Singular"},
    {min:15,max:17,count:2,attributes:5,skills:6,label:"Duplo Despertar"},
    {min:18,max:19,count:3,attributes:4,skills:5,label:"Tríade Desperta"},
    {min:20,max:20,count:4,attributes:4,skills:4,label:"Despertar Supremo"}
  ],
  giftTypes:["Primordial","Vitálio","Synithar","Occultus","Phantaso","Sanátio","Summanu","Indilus","Proibido"],
  skillEffects: {
    "Memória":"Cada grau pode ampliar espaços de habilidades/rituais conforme a mesa; evite somar bônus numéricos extras fora da escala curta.",
    "Equilíbrio Espiritual":"Pode reduzir conjuração em 1 turno quando a habilidade permitir; não acumula indefinidamente.",
    "Foco":"Benefícios de alvos adicionais devem ser tratados como propriedade da ação, não como bônus de acerto.",
    "Mira":"+3m de alcance aplicável por grau efetivo.",
    "Vida":"Ajustes de LP devem ser definidos pela progressão da Classe; a ficha não soma LP automaticamente para evitar duplicidade.",
    "Vigor":"+2m de deslocamento por grau efetivo.",
    "Canalização":"Pode ampliar alvos de Dons multi-alvo conforme a habilidade.",
    "Manipulação Arcana":"Pode reduzir conjuração em 1 turno quando aplicável.",
    "Potência":"+2 de dano por grau, dentro do teto fixo compartilhado da técnica V4. No alcance, escolha Mira OU Potência; a extensão tem teto por patamar."
  },
  rules:[
    ["Escala universal","Bônus isolados continuam curtos, mas Thaal'Emor permite combos. Fontes diferentes — Classe, equipamento, habilidade, terreno e preparação — podem se acumular. Modificador de combo recomendado: até +6 além da Perícia."],
    ["Teste de Atributo","Role 1d20 por ponto no Atributo e mantenha o maior. Vantagem adiciona +1d20; Desvantagem remove -1d20, sempre com mínimo de 1 dado."],
    ["Perícias e especialização","O limite por nível vale para pontos INVESTIDOS. Graus gratuitos de Classe se somam por cima, permitindo builds especializadas. Graus 1–4 valem +2 cada; a partir do 5º, cada grau adicional vale +1 para reduzir inflação sem matar combos."],
    ["Atributos","Todos começam em 1. Limite de criação: 4. Limite absoluto: 6. O pool de d20 já fornece grande parte da especialização do personagem."],
    ["Defesa","10 + Fortitude + bônus total da Perícia Defesa + Armadura. Armaduras: nenhuma +0, leve +1, média +2, pesada +3."],
    ["Crítico","20 natural: role os dados de dano duas vezes e some modificadores uma única vez. Evite multiplicar modificadores fixos."],
    ["Véu","Bruxos e Sábios: 1/2 dos LP. Demais Classes: 1/3 dos LP. Técnicas V4: 4 + teto((PP − 6) / 3), mínimo 4 de Véu. A manutenção custa 1 Véu e uma ação bônus por ciclo adicional."],
    ["Movimento","Base 10m. Cada grau efetivo de Vigor adiciona +2m."],
    ["Mira e Potência","Na V4, cada técnica escolhe Mira OU Potência para ampliar seu alcance (até +6m por patamar). Potência soma +2 de dano por grau ao total compartilhado, limitado a +2 por patamar junto dos outros bônus fixos."],
    ["Dons — d20 completo","1–3: 0 Dons; 4–14: 1; 15–17: 2; 18–19: 3; 20: 4. Quanto mais Dons, menor o orçamento mundano inicial."],
    ["Economia de ações","Referência ficha: 1 Ação Principal + 1 Ação Bônus + Movimento + 1 Reação por ciclo. Ações/turnos extras devem vir de habilidades específicas e raras."],
    ["Condições","Leve: -1; moderada: -2; severa: -3 ou Desvantagem. Estados fortes devem alterar ações/movimento diretamente em vez de empilhar penalidades -5/-10."],
    ["Armas","Referência de dano: leve 1d4, média 1d6, pesada 1d8, colossal 1d10/1d12. Alcance, recarga e propriedades fazem parte do orçamento de poder."],
    ["Combos","Combos são parte intencional do sistema. O objetivo não é impedir 90%+ de chance em uma situação preparada; é exigir investimento, sinergia e custo. Fontes idênticas não acumulam, mas fontes distintas podem formar picos fortes."],
    ["Probabilidade alvo","Contra oposição equivalente: fraco 30–40%, comum 50–60%, especialista 65–80%. Uma build combada e preparada pode passar de 90% na própria especialidade, desde que pague por isso em recursos, posicionamento ou oportunidades."]
  ]
};
