# Penta-Reign

Site do universo e gerenciador de personagens. A apresentação e as fichas ficam em páginas separadas. A cor padrão é **#473329**; o seletor da barra superior alterna entre Penta-Reign e os cinco reinos. Os títulos principais usam a **Cinzel Decorative** incluída no projeto, com sua licença.

## Usar

1. Abra `index.html` ou acesse a publicação do repositório.
2. Clique em **Fichas** e escolha a classe e o nível.
3. Em **Dons**, faça a primeira rolagem. Mantenha o resultado ou use a última tentativa.
4. Com o despertar definido, distribua os pontos disponíveis em atributos e perícias.
5. Crie as técnicas dos dons e clique em **Salvar ficha**.

A barra superior rola até Início, Sobre os reinos e Sistema na apresentação. Fichas abre `fichas.html`. Os atalhos antigos para fichas continuam funcionando. Na ficha, as setas, Home e End navegam pelas abas, e **Regras dos dons** abre uma referência sem sair da edição.

## Criação de personagem

- O local de nascimento é escolhido entre doze opções, além de Submundo para o Reino da Chuva.
- O alinhamento é calculado pela dupla de maiores atributos. As 21 combinações têm nomes e descrições próprios. Fortitude + Dom resulta em **Pecador**.
- Pontos disponíveis = base do despertar + ajuste da classe + progressão do nível.
- Cada nível após o primeiro concede +1 ponto de perícia. Os níveis 2, 4, 6, 8 e 10 concedem +1 ponto de atributo.
- A distribuição permanece bloqueada até manter a primeira rolagem ou concluir a segunda.
- O saldo e os tetos são aplicados a botões, digitação, carregamento e importação. Mudanças de classe ou nível que invalidem a distribuição atual são recusadas até os pontos excedentes serem retirados.

As tabelas e as diferenças em relação ao livro estão em [Criação de personagens](docs/CRIACAO-PERSONAGENS.md). O livro tem progressões incompletas e escolhas entre pontos e talentos; a ficha usa uma progressão padronizada de investimento, sem somar novamente os ganhos de atributos e perícias dos textos de classe. Os graus de especialização existentes continuam separados.

## Despertar e salvamento

O personagem tem até duas rolagens. Manter a primeira encerra a decisão; a segunda substitui a anterior e é definitiva.

Cada decisão é gravada junto do rascunho antes de ser aplicada na tela. O rascunho é retomado ao reabrir a ficha. O registro de despertar é separado da lista de personagens, preserva o resultado mais recente e é compartilhado por cópias importadas que mantêm a mesma identidade de despertar. Importar um arquivo antigo não devolve tentativas. Resultados recebidos sem histórico local são considerados definitivos.

O navegador precisa permitir armazenamento para registrar rolagens. Falhas de gravação bloqueiam a decisão; dados existentes não são substituídos por um registro vazio. A coordenação entre abas usa Web Locks quando disponível.

Fichas antigas são preservadas. Distribuições incompatíveis são ajustadas aos limites, com uma cópia dos valores recebidos em **Registros preservados**. Nascimentos livres e alinhamentos antigos também podem ser consultados ali. O botão de exportação leva esses registros junto do personagem.

Os personagens ficam **neste navegador e neste endereço**. A migração automática exige a mesma origem: protocolo, domínio e porta. Para trocar de navegador, dispositivo ou endereço, exporte JSON e importe no destino. O comportamento do armazenamento de arquivos locais varia entre navegadores; para continuidade previsível, use o mesmo endereço HTTP/HTTPS.

## Técnicas e combate

Conceitos permanecem livres; técnicas têm limites de dados, dano, alcance, alvos, duração, ações e Véu. O construtor desconta recursos e acompanha turnos e concentração. A mesa acompanha resistências, linha de efeito, condições, recursos de alvos e coerência do conceito.

Consulte [Dons e técnicas](docs/DONS-V4.md) para custos e exemplos. Classes, itens e rituais não têm todas as suas habilidades automatizadas. A progressão de pontos e o construtor são regras para teste em mesa, não uma comprovação de equilíbrio definitivo de todo o livro.

## Organização

- `index.html` e `fichas.html`: apresentação e gerenciador.
- `js/data.js`: classes, atributos, perícias e base do despertar.
- `js/character-engine.js`: orçamentos, alinhamentos, locais e validação de investimentos.
- `js/creation-store.js`: registro de despertar e rascunhos.
- `js/creation-ui.js`: decisões de rolagem e retomada do personagem.
- `js/app.js`: ficha, dados e lista de personagens.
- `js/power-engine.js`, `js/powers-ui.js` e `js/rules.js`: técnicas, combate e referência.
- `js/theme.js` e `css/realms.css`: temas e tipografia.
- `assets/fonts/OFL.txt`: licença da Cinzel Decorative.

Para GitHub Pages, mantenha as páginas e as pastas de recursos juntas na pasta publicada. Os caminhos relativos funcionam no subdiretório do repositório. Não há dependências de rede, instalação de pacotes ou etapa de compilação para usar o site. As configurações do repositório determinam a publicação.

## Verificação

Com Node.js, execute:

```sh
node --test tests/*.test.cjs
```

Os testes verificam limites de pontos, todas as classes e níveis, alinhamentos, duas tentativas, persistência, importação, migração, navegação e limites dos dons. A validação não inclui teste visual em navegador.

Não há sincronização por servidor ou mecanismo de autenticação: quem altera o código ou apaga o armazenamento controla a própria cópia local.
