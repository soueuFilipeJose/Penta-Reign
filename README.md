# Penta-Reign — Universo e Gerenciador de Fichas V4

Site de Penta-Reign com apresentação do mundo, página própria de fichas e um construtor mecânico de técnicas de Dom. A interface usa verde profundo, vermelho e dourado, com uma cor para cada reino. Perícias, classes, retratos, rolagens, recursos e personagens da V4 foram preservados.

## Abrir e usar

1. Baixe ou clone este repositório, mantendo a estrutura de pastas.
2. Abra `index.html` no navegador. Também pode usar o Live Server do VS Code.
3. Clique em **Fichas**, preencha a identidade e registre a rolagem de despertar em **Dons**.
4. Dê nome e conceito a cada Dom. Adicione técnicas, escolha os parâmetros e confira orçamento e custo.
5. Clique em **Salvar ficha**. Os personagens são guardados neste navegador.

Não há instalação, npm, cadastro, servidor ou dependência externa para jogar. Dados, código e arte estão incluídos. O site não usa solicitações de rede para carregar suas regras.

Para GitHub Pages, mantenha `index.html`, `fichas.html`, `css`, `js` e `assets` juntos na pasta publicada. Os caminhos são relativos e funcionam em subdiretórios. Não é necessário configurar redirecionamento de rotas. A publicação depende das configurações do repositório.

## O que mudou

- **Início:** apresentação do Firmamento, cinco reinos e explicação do sistema.
- **Navegação:** Início, Sobre os reinos e Sistema rolam apenas a apresentação. **Fichas** abre `fichas.html` na mesma aba do navegador.
- **Ficha separada:** Identidade, Perícias, Dons, Combate & Dados, Anotações e Personagens são abas; somente a aba selecionada fica visível. Setas, Home e End navegam pelo seletor de abas. O histórico do navegador permite voltar à aba anterior.
- **Referência:** o botão **Regras dos dons** abre uma janela dentro da ficha. Fechar ou pressionar Escape retorna à edição.
- **Links antigos:** atalhos como `index.html#ficha`, `#gifts` e `#library` redirecionam para a aba correspondente em `fichas.html`.
- **Dons:** conceito separado das técnicas. Orçamento por patamar, limites de dados, custo em Véu, alcance, alvos, duração, ações, condições, resistência, utilidades e invocação.
- **Mesa:** ativar desconta Véu e ação. O painel acompanha turnos, concentração, manutenção e comando da invocação.
- **Combos:** fontes distintas continuam somando no acerto, até +6. Potência entra no teto fixo compartilhado. Técnicas diferentes podem repetir o mesmo tipo de efeito.
- **Personagens:** migração de V3/V2 na mesma origem do navegador, preservando os registros anteriores.
- **Portabilidade:** importação e exportação de fichas JSON. Importar abre uma cópia, que deve ser salva.
- **Impressão:** inclui atributos, perícias, dons e anotações, abrindo os painéis da ficha ao imprimir.

## Trazer fichas da V3

A migração automática depende da **mesma origem**: protocolo, domínio e porta. Dados de outro navegador, dispositivo, endereço, porta ou arquivo local podem não estar disponíveis. O armazenamento em `file://` varia entre navegadores.

- Se a V3 estava publicada, substitua os arquivos no mesmo endereço.
- A V4 copia `thaalemor_characters_v3`, ou V2 se não houver V3, para `thaalemor_characters_v4`. A cópia antiga não é modificada.
- Se mudar de endereço, abra temporariamente a V4 na origem anterior, exporte os personagens como JSON e importe no novo endereço.
- Descrições antigas são preservadas. Elas não viram técnicas válidas automaticamente: crie os parâmetros para cada habilidade.
- Reduzir a quantidade de dons os arquiva. Eles reaparecem se a quantidade aumentar e continuam no JSON.
- Técnicas que excedem os espaços são mantidas como rascunhos, com uso bloqueado.
- Falta de espaço e JSON corrompido não provocam substituição silenciosa dos dados existentes.
- Salve e exporte cópias antes de limpar o navegador.

## Criar e usar técnicas

1. Escolha Dano, Cura, Barreira, Controle, Utilidade ou Invocação.
2. Preencha nome e manifestação. Escolha alcance, ação e parâmetros.
3. A soma de PP e todos os tetos precisam ser respeitados simultaneamente. Rascunhos inválidos podem ser salvos, mas não usados.
4. Para dano contra um alvo, abra **Acerto e combinações** e informe Defesa, situação e fontes de combo.
5. **Usar técnica** gasta Véu e ação mesmo quando o ataque erra.
6. Em **Combate & Dados**, avance o turno e sustente ou encerre a concentração. Avançar não recupera Véu.
7. Registre ali ações gastas com armas ou habilidades fora do construtor.

Resistências, posicionamento, linha de efeito, condições, barreiras, LP da invocação e recursos de outros personagens são acompanhados pela mesa. O botão de concentração deve ser usado após sofrer dano; não detecta dano automaticamente.

## Escopo da revisão

É uma **proposta para teste em mesa**, não uma afirmação de equilíbrio definitivo. O motor confere parâmetros e custos, mas não conhece a coerência narrativa nem a identidade real das fontes de combo.

As classes, itens, caminhos e rituais do livro não foram integralmente recalculados. A V4 mantém a escala da V3 para perícias, atributos e crítico, que diverge de trechos do livro. Esses outros conteúdos continuam como consulta manual e precisam ser compatibilizados pela mesa. Bônus do texto antigo não devem ultrapassar os limites das técnicas V4.

Não há sincronização online nem proteção contra edição manual do código ou da ficha.

## Organização

- `index.html`: apresentação do universo, reinos e sistema.
- `fichas.html`: área exclusiva de fichas, com abas e referência de regras.
- `css/styles.css`: base da V3; `css/v4.css`: componentes da V4; `css/penta-reign.css`: identidade visual e navegação atual.
- `js/data.js`: atributos, perícias e classes.
- `js/power-engine.js`: motor independente de limites e custos.
- `js/app.js`: ficha, recursos, rolagens e salvamento.
- `js/powers-ui.js`: construtor e uso das técnicas.
- `js/rules.js`: referência de regras compartilhada pelas duas páginas, sem acessar personagens.
- `js/site.js`: navegação da apresentação, compatibilidade de links antigos e janela de regras.
- `assets/firmamento.png`: arte incluída.
- `data/regras-v3.json`: referência anterior, não executada.
- `data/regras-v4.json`: configuração estruturada da revisão.
- `docs/DONS-V4.md`: regras e exemplos.
- `docs/REFERENCIAS.md`: fontes e decisões.
- `tests/`: testes do motor, da migração e da navegação entre apresentação e fichas.

## Verificações

Com Node.js instalado, na pasta do projeto:

```sh
node --test tests/*.test.cjs
```

Os 19 testes cobrem custos, dano dividido, crítico, duração, ações, combos, valores inválidos, migração sem perda dos registros antigos, preservação de rascunhos ao trocar de aba, links antigos e carregamento independente das regras. HTML, IDs, referências locais e sintaxe dos scripts também foram conferidos. Não foi realizado teste visual em navegador nesta entrega.
