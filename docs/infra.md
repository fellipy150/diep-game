# Documentação de Arquitetura do Jogo

A estrutura do projeto foi desenhada focando em modularidade, separação de responsabilidades e escalabilidade. O código adota padrões modernos de design de jogos, separando estritamente os **Dados** (Estado/Status) do **Comportamento** (Sistemas/Loop).

## Diretório Raiz: `src/`

A pasta `src/` contém todo o código-fonte principal do jogo, estruturada nas seguintes áreas de domínio:


src/
├── config/     # Gerenciamento de dados estáticos e configurações globais
├── core/       # Motores de baixo nível, matemática e utilitários agnósticos
├── game/       # Lógica de gameplay, entidades, sistemas e loop principal
└── main.js     # Ponto de entrada (Entry Point) e Bootstrapper


📄 main.js (O Bootstrapper)
É o ponto de ignição (Entry Point) da aplicação. Sua responsabilidade é puramente arquitetural: ele prepara o terreno de forma segura antes da engine começar a rodar.
Principais etapas de execução:
 * Setup do Canvas: Captura o elemento <canvas> no DOM, ajusta a resolução para tela cheia e implementa um listener de redimensionamento (resize) para garantir responsividade contínua.
 * Preload Assíncrono: Orquestra o carregamento paralelo (via Promise.all) dos módulos vitais antes de liberar o jogo para o usuário:
   * Carregamento de configurações estáticas (loadAllConfigs).
   * Varredura e registro dos DNAs dos inimigos (initEnemyTypes).
   * Inicialização do pool de escolhas dinâmicas (UpgradeSystem.init()).
 * Transferência de Controle: Após o boot ser concluído com sucesso, ele invoca o startGameLoop(), entregando a execução para a thread de atualização contínua do jogo. Em caso de falha, ele intercepta o erro e emite logs críticos no console.
📁 config/
Atua como o "banco de dados estático" do jogo. Esta pasta é reservada para arquivos que exportam dicionários, constantes e tabelas de balanceamento (ex: configManager.js). Ela responde "o que" as coisas são, abstendo-se totalmente de lógicas de "como" elas funcionam.
📁 core/
O "chassi" da engine. Contém módulos de baixo nível e algoritmos fundamentais que são independentes do domínio específico do jogo. Isso garante que o código seja reutilizável e livre de dependências circulares.
 * (Exemplos do que reside aqui: Matemática vetorial de interceptação (mathUtils.js), captura de comandos do usuário (input.js) e a fundação de cálculo de atributos de RPG (StatSheet.js)).
📁 game/
O coração da gameplay. É onde as regras de negócio, a física, as colisões e a renderização tomam vida. Esta é a maior pasta do projeto e é altamente subdividida em subdomínios isolados:
 * Atores principais (player/, enemy/, projectiles/).
 * Regras de RPG e crescimento (upgrades/, synergies/).
 * Elementos visuais fora do Canvas (ui/).
 * O maestro do tempo em tempo real (gameLoop.js).


## Diretório: `src/core/`

A pasta `core/` abriga os sistemas de baixo nível da engine. Estes módulos são agnósticos em relação à lógica de negócios do jogo (eles não sabem o que é um "Player" ou um "Inimigo"); eles apenas fornecem utilitários matemáticos, captura de hardware e estruturas de dados primitivas para o resto da aplicação.

---

### 📄 `input.js` (Gerenciador de Interface Mobile)

Este módulo implementa um controlador de "Dual-Stick" (dois joysticks virtuais) otimizado para telas sensíveis ao toque. Ele traduz gestos físicos no DOM em vetores matemáticos normalizados que o `gameLoop` pode consumir nativamente.

**Padrão de Projeto: Singleton**
A classe `Input` é instanciada automaticamente no final do arquivo (`export const input = new Input();`). Isso garante uma "Fonte Única de Verdade". Qualquer arquivo do jogo pode importar `input` e ler instantaneamente o estado atual dos controles, sem precisar de injeção de dependências.

#### Principais Mecanismos:

* **Gerenciamento de Multi-Touch (Toque Simultâneo):**
    Em vez de reagir a qualquer toque na tela, o sistema rastreia os dedos individualmente usando `touch.identifier`. As variáveis `moveTouchId` e `aimTouchId` garantem que o dedo da esquerda só controle o movimento e o dedo da direita só controle a mira, evitando cruzamento de dados caso o jogador deslize o dedo para o lado oposto da tela.

* **Prevenção de Comportamento Nativo:**
    A função `handlePrevention` no `initEvents` intercepta eventos de `touchstart` e `touchmove` globais, aplicando `e.preventDefault()`. Isso é crítico em web games mobile para impedir que a tela role (scroll), dê zoom ou ative os gestos nativos do navegador durante o combate.

* **Cálculo Vetorial e Normalização (`updateJoystick`):**
    O método não apenas move o elemento HTML (o "pino" do joystick), mas converte pixels em uma força de física para o jogo:
    1.  Calcula a distância do toque em relação ao centro do joystick usando o Teorema de Pitágoras (`Math.hypot(dx, dy)`).
    2.  Restringe o alcance visual ao `maxRadius` (40px).
    3.  **Vetor de Movimento (`move`):** Retorna um vetor de força que vai de `0` a `1`. Se o jogador empurrar o joystick até a metade, o personagem andará na metade da velocidade.
    4.  **Vetor de Mira (`aim`):** Retorna um vetor estritamente direcional. A partir do momento em que o dedo toca o joystick direito, a flag `isShooting` vira `true` e a mira aponta na direção exata do ângulo, independentemente da força.

#### Contrato de Consumo (O que o jogo lê):
Quando módulos como o `Player` importam este arquivo, eles acessam apenas estes dados processados:
* `input.move`: Objeto `{ x, y }` (Força de movimentação de 0.0 a 1.0).
* `input.aim`: Objeto `{ x, y }` (Vetor de direção do tiro).
* `input.isShooting`: Booleano (Ativo enquanto o dedo estiver no joystick de mira).


### 📄 `mathUtils.js` (Motor de Matemática e Balística)

Este módulo é a espinha dorsal do combate da engine. Ele centraliza todos os cálculos vetoriais complexos, normalização de espaço e algoritmos de interceptação (Targeting). O seu objetivo é processar posições brutas em direções de ataque precisas.

**O Contrato Universal Vetorial:**
Para garantir consistência em toda a engine de projéteis (e evitar quebras no renderizador ou no sistema de física), todos os métodos matemáticos de mira delegam a formatação final para o helper interno `toDir`. O retorno é sempre um objeto com a seguinte assinatura padronizada:
* `{ x, y }`: O vetor de direção normalizado (valores de -1.0 a 1.0).
* `{ targetX, targetY }`: As coordenadas absolutas do ponto futuro de impacto.

#### Estratégias de Mira (Aiming Behaviours)

O módulo atua como um roteador de inteligência artificial balística através da função **`getSmartAim`**. Em vez da lógica de inimigos fazer os cálculos, eles simplesmente invocam esta função informando o tipo de bala, e o motor seleciona a melhor estratégia:

* **`predictIntercept` (A Interceptação Perfeita):**
    É o algoritmo de estado da arte para "tiro ao alvo em movimento". Em vez de atirar onde o alvo *está*, ele calcula exatamente onde o alvo *estará* quando a bala chegar. Para isso, ele resolve uma equação cinemática quadrática da forma $at^2 + bt + c = 0$, onde:
    * $a$ é a diferença entre a velocidade ao quadrado do alvo e do projétil.
    * $b$ lida com o vetor de aproximação.
    * $c$ é a distância absoluta ao quadrado.
    Se o discriminante ($\Delta$) for negativo, significa que o alvo é rápido demais para ser alcançado, e o algoritmo faz um *fallback* inteligente atirando diretamente na posição atual.

* **`predictLobbed` (Mira em Arco/Granada):**
    Ignora a velocidade da bala e calcula a posição futura estritamente baseada em um tempo de voo pré-determinado (`flightTime`). Ideal para áreas de efeito (AoE), projéteis de morteiro, veneno ou explosivos.

* **`predictInaccurate` (Efeito Stormtrooper/Spread):**
    Aplica um desvio angular aleatório (`inaccuracy`) ao vetor de mira direta usando `Math.atan2` para descobrir o ângulo base e injetando ruído. Usado para balas normais de "bucha de canhão", armas de dispersão ou para evitar que múltiplos inimigos atirem exatamente no mesmo pixel de forma robótica.

* **`predictEdge` (Mira de Tangente/Colisão Periférica):**
    Resolve a interceptação quadrática, mas em vez de mirar no centro do alvo, recua o ponto de impacto pelo raio do alvo (`_targetRadius`). Isso é crucial para ataques contra chefes gigantes, garantindo que a bala não tente penetrar o sprite inteiro antes de registrar a colisão.

## Diretório: `src/config/`

A pasta `config/` atua como o banco de dados e o dicionário central do jogo. A principal premissa arquitetural aqui é a separação entre "Código" e "Dados" (Data-Driven Design). Nenhuma lógica de negócio, laço de repetição ou manipulação de Canvas reside nesta camada; ela existe apenas para fornecer as plantas baixas (blueprints) que os sistemas da pasta `game/` irão instanciar.

---

### 📄 `configManager.js` (Gerenciador de Dados Estáticos)

Este arquivo é o provedor central de configurações. Atualmente, ele se encontra em um estado de "tábula rasa" (Clean Slate), tendo sido limpo intencionalmente para receber a nova arquitetura "Projéteis 2.0" e os novos comportamentos modulares.

#### Estrutura Atual e Papel Arquitetural:

* **O Objeto `gameData`:**
    Um objeto estático global que funciona como a "Fonte da Verdade" para a criação de entidades. Ele é pré-estruturado para receber dicionários de `bullets` (projéteis), `enemies` (inimigos) e `synergies` (sinergias). Quando os sistemas do jogo precisam spawnar um inimigo ou criar uma bala, eles consultam este objeto em vez de ter valores "chumbados" (hardcoded) diretamente nas classes. Isso facilita imensamente o balanceamento do jogo no futuro.

* **O Contrato Assíncrono (`loadAllConfigs`):**
    Embora atualmente a função apenas resolva a promessa imediatamente (`Promise.resolve(gameData)`), mantê-la como `async` é uma decisão de design crucial. Isso "blinda" o motor do jogo para o futuro. 
    * Se, mais tarde, o jogo crescer e os dados de `bullets` ou `enemies` precisarem ser carregados de arquivos `.json` externos via requisições `fetch()`, ou de um banco de dados remoto, o `main.js` (que aguarda com `await Promise.all`) não precisará ser alterado em absolutamente nada. O fluxo assíncrono já está garantido na fundação.

## Diretório: `src/game/` (Fundação do Jogo)

A pasta `game/` é onde o motor ganha vida. Diferente das bibliotecas passivas na `core/`, os arquivos aqui são **agentes ativos**. Eles orquestram o tempo, invocam regras de colisão, criam instâncias de objetos e definem quando o jogador ganha ou perde.

---

### 📄 `gameloop.js` (O Coração Pulsante)

O `gameLoop` é o maestro da aplicação. Ele é responsável por manter a ilusão de movimento contínuo executando o ciclo de atualização centenas de vezes por segundo.

* **Padrão de Delta Time (`dt`):**
    O jogo não se baseia na velocidade do processador, mas no tempo real transcorrido. A linha `const dt = Math.min((time - lastTime) / 1000, 0.1);` garante que, independentemente de o jogador estar rodando a 30 FPS ou 144 FPS, os personagens se moverão na mesma velocidade. O `Math.min(..., 0.1)` atua como um "limitador de lag": se o jogador minimizar a aba do navegador por 5 segundos, o jogo não vai calcular 5 segundos de dano de uma vez, limitando o pulso máximo a 0.1s para evitar física bizarra.

* **Separação entre Atualização (`update`) e Renderização:**
    O loop segue rigidamente o padrão `Update -> Render`. Primeiro, todo o estado lógico do jogo é recalculado na função `update(dt)`. Só depois de todos os cálculos concluídos é que a câmera (`updateCamera`) e os gráficos (`renderGame`) são chamados. Isso evita artefatos visuais onde um objeto é desenhado no meio de um cálculo de física.

* **Delegação de Interrupções (O Fluxo de Level Up):**
    O `gameLoop` injeta um callback `onLevelUp` no `Player` logo ao instanciá-lo. Quando esse callback é disparado, o loop invoca `handleProgress`. Essa função define `gameState.isPaused = true`, paralisando todos os cálculos da função `update(dt)` (inimigos congelam, tiros param no ar), abre o Menu de UI, e aguarda a decisão do usuário (callback) para retomar o jogo (`isPaused = false`).

---

### 📄 `physics.js` (Motor de Colisão)

Este módulo lida com a detecção de contato entre as entidades. Como o jogo é top-down com visão superior, a física utiliza o modelo de **Colisão Circular Ampla (Circle-to-Circle)**.



* **Teorema de Pitágoras Otimizado (`verificarColisao`):**
    Para calcular a distância entre dois objetos, a fórmula correta seria $d = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$. No entanto, extrair a raiz quadrada (`Math.sqrt`) milhares de vezes por segundo é extremamente custoso para a CPU. O método `verificarColisao` faz uma otimização matemática clássica de games: ele compara a distância *ao quadrado* com a soma dos raios *ao quadrado*, eliminando a necessidade da raiz quadrada.

* **Separação e "Push-back" (`resolverSobreposicao`):**
    Quando dois inimigos andam em direção um ao outro, eles não param imediatamente como blocos de pedra. O algoritmo calcula o vetor de sobreposição (overlap) entre eles e "empurra" gentilmente (push-back) cada entidade na direção oposta proporcionalmente. Isso cria aquele efeito de "enxame fluído" onde hordas de inimigos escorregam ao redor uns dos outros e do jogador, em vez de se empilharem no exato mesmo pixel.

* **O Ciclo Violento (`processarColisoes`):**
    Esta função varre todos os arrays ativos do jogo (`enemies`, `player.bullets`, `enemies.bullets`, `hazards`) com laços aninhados verificando quem acertou quem. É aqui que o dano é subtraído e os efeitos visuais, como trepidação de câmera (`camera.shake = 8`) e os textos saltitantes (`criarNumeroDano`), são disparados.

---

### 📄 `enemySpawner.js` (Gerador de Hordas)

Este módulo funciona como o "Diretor IA" do jogo. Ele controla o ritmo da partida e garante que o jogador nunca fique entediado.

* **Aceleração de Dificuldade:**
    A variável `spawnInterval` dita o tempo de espera entre a criação de inimigos. A cada spawn bem-sucedido, o tempo de intervalo é multiplicado por `0.98` (`this.spawnInterval * 0.98`), o que significa que o jogo se torna progressivamente e infinitamente mais caótico.
* **Aritmética de Spawn Periférico:**
    Para evitar que um inimigo surja "do nada" exatamente em cima do jogador, o Spawner usa geometria polar. Ele sorteia um ângulo aleatório de 0 a $2\pi$ e calcula um raio dinâmico que garante que o inimigo nasça *fora do alcance da tela atual* (no escuro), mas não tão longe a ponto de nunca encontrar o jogador.

### 📄 `state.js` (O Cofre de Estado Global)

Este módulo atua como a **Single Source of Truth (Fonte Única de Verdade)** do jogo. Ele isola as variáveis que mudam frame a frame das lógicas que as manipulam, garantindo que qualquer sistema possa consultar a situação atual da partida sem precisar de instâncias complexas.

* **O Objeto `gameState`:**
    Um contêiner de memória que guarda absolutamente tudo o que está vivo no jogo: listas de inimigos, projéteis soltos, perigos (hazards), o jogador em si e o contexto nativo do Canvas (`ctx`). Ao manter isso centralizado, o salvamento de jogo (Save State) futuro pode ser feito simplesmente serializando este objeto.

* **Gerenciamento de Memória In-Place (`limparListaInPlace`):**
    Em jogos rodando a 60 FPS, criar novos arrays a cada frame (usando o método `.filter()`, por exemplo) gera um acúmulo massivo de lixo (Garbage Collection), causando engasgos (stutters) na tela. Esta função resolve isso iterando a lista de trás para a frente e usando `.splice()` para remover entidades mortas (com a flag `dead`) diretamente na memória existente, mantendo a performance impecável.

* **Feedback de Combate (`criarNumeroDano`):**
    Uma função de utilidade injetável. Em vez de o motor de física saber *como* desenhar um dano, ele simplesmente chama esta função, que joga um novo objeto com coordenadas, valor, vida (duração) e cor na lista `damageNumbers` do estado global. O renderizador cuidará do resto.

---

### 📄 `renderer.js` (O Motor Gráfico)

Se o `gameLoop` é o cérebro e o `physics` são os músculos, o `renderer` são os olhos. Ele traduz os dados frios do `gameState` em pixels na tela através da API nativa do Canvas 2D. 

#### A Câmera e Interpolação Linear (Lerp):
A câmera não está colada rigidamente ao jogador de forma instantânea. Ela utiliza uma fórmula de Interpolação Linear (Lerp) para criar um movimento suave e cinematográfico:
$C_{novo} = C_{atual} + (C_{alvo} - C_{atual}) \times 0.1$
Além disso, ela possui inteligência de foco: se o jogador disparar um projétil do tipo `drone` ativo, a câmera abandona o jogador e passa a seguir o drone remotamente, criando uma mecânica de visão tática. O sistema de trepidação (`camera.shake`) usa geração de ruído aleatório que decai exponencialmente (multiplicando por `0.9` a cada frame) para dar peso aos impactos e explosões.

#### Renderização em Camadas (Z-Ordering):
A função `renderGame` pinta o quadro do zero a cada frame, respeitando uma ordem de pintura (painter's algorithm) estrita:
1.  **O Vazio:** Limpa a tela com um cinza muito escuro (`#111`).
2.  **A Grelha Holográfica:** Desenha o fundo infinito.
3.  **Ameaças de Chão:** Renderiza os perigos (hazards), como poças de ácido, para que fiquem por baixo dos personagens.
4.  **Atores:** Desenha o Player e depois os Inimigos por cima do chão.
5.  **Interface de Combate:** Por último, no topo absoluto, desenha os números flutuantes de dano (`damageNumbers`). Estes números ganham um efeito de *fade out* (esmaecimento) ajustando o `ctx.globalAlpha` dinamicamente conforme sua variável de `life` diminui.

#### A Ilusão do Mundo Infinito (`desenharGrelha`):
Para dar ao jogador a sensação de que o mundo é gigantesco sem precisar desenhar milhões de linhas de grade, a função usa aritmética modular. 
```javascript
const offsetX = Math.floor(camera.x) % tamanhoCelula;
```
Ao aplicar o módulo (%) do tamanho da célula sobre a posição atual da câmera, o código desloca o ponto inicial de desenho da grelha (grid) constantemente. A tela só desenha as linhas visíveis daquele exato pedaço do monitor, mas, conforme a câmera avança, as linhas se repetem, criando um chão perfeitamente contínuo (efeito parallax de background) com custo de processamento quase zero.

## Diretório: `src/game/enemy/`

Esta pasta encapsula toda a lógica relacionada às ameaças controladas pelo computador (IA). A arquitetura aqui segue um modelo híbrido inspirado em **ECS (Entity Component System)** e **Padrão Strategy**, onde a classe principal do inimigo atua apenas como um "corpo físico", enquanto seu cérebro e aparência são injetados dinamicamente.

---

### 📄 `index.js` (A Entidade Base do Inimigo)

O arquivo `index.js` exporta a classe `Enemy`. Esta classe não representa um monstro específico (como um "Zumbi" ou "Nave"), mas sim um contêiner universal de física, vida e estado. A grande vantagem dessa abordagem é que o motor do jogo (`gameLoop` e `physics`) só precisa entender como interagir com essa classe única, independentemente de existirem 5 ou 50 tipos diferentes de inimigos no jogo.

#### 1. Separação de Responsabilidades (Delegação)
A classe `Enemy` é intencionalmente "ignorante" sobre suas próprias regras de negócio. Ela delega as três funções primárias de um ator de videogame para sistemas especialistas:
* **Status e Identidade:** Ao nascer, busca seu "DNA" através de `getType(typeName)`.
* **Inteligência Artificial (Cérebro):** No método `update`, ela não decide para onde andar. Ela pergunta ao seu DNA (`this.type.think(...)`) o que fazer, e recebe de volta um vetor de intenção de movimento (`moveIntent`).
* **Renderização (Aparência):** No método `draw`, ela passa seu próprio contexto (`this`) para o sistema `RenderEnemy`, que sabe exatamente como desenhá-la com base em suas tags e status.

#### 2. Escalonamento de Dificuldade (Level Scaling)
Para que o jogo permaneça desafiador conforme o jogador evolui, os inimigos possuem atributos escaláveis no construtor. A vida máxima, por exemplo, não é estática. Ela é calculada usando um fator de crescimento linear de 20% por nível acima do nível 1:
$HP_{max} = HP_{base} \times (1 + (Nível - 1) \times 0.2)$
Isso garante que um inimigo gerado no final da partida seja matematicamente superior ao mesmo tipo de inimigo gerado no primeiro minuto.

#### 3. O Ciclo de Física e Intenção de Movimento

O método `update` gerencia o tempo real do inimigo processando os temporizadores (cooldowns de tiro e corpo a corpo) e, em seguida, aplicando a física de movimento:
1.  **Captura da Intenção:** O cérebro da IA (`think`) analisa o mapa e devolve um vetor normalizado `{ x, y }`.
2.  **Aceleração:** O vetor é multiplicado pela aceleração base da entidade e pelo tempo real transcorrido (`dt`).
3.  **Atrito (Friction):** A velocidade total é multiplicada por `0.85` a cada frame. Isso cria uma movimentação fluida (steering), onde os inimigos deslizam suavemente ao mudar de direção em vez de virarem de forma robótica.

#### 4. Gestão de Projéteis Embutida
Ao invés do sistema global gerenciar os tiros dos inimigos, cada instância de `Enemy` gerencia o ciclo de vida de suas próprias balas através do array interno `this.bullets` e do método `updateBullets`. A iteração reversa (`for (let i = this.bullets.length - 1; i >= 0; i--)`) é utilizada aqui também para remover balas "mortas" da memória sem quebrar o índice do laço de repetição, mantendo a performance otimizada.

#### 5. Otimização Espacial (`getDistSq`)
Assim como no motor de física principal, o inimigo possui seu próprio método utilitário para verificar distâncias usando o Teorema de Pitágoras sem a raiz quadrada ($d^2 = \Delta x^2 + \Delta y^2$). Isso é crucial para as lógicas internas da IA, permitindo que o inimigo calcule rapidamente quem está mais perto (jogador ou aliados) sem sobrecarregar a CPU.

## Diretório: `src/game/enemy/actions/` (O Cérebro Modulado da IA)

Esta pasta contém as **Ações Atômicas** (ou Primitivas de Comportamento) dos inimigos. A arquitetura aqui segue os princípios de **Steering Behaviors** (Comportamentos de Direcionamento) e **Composição**. Em vez de programar uma IA monolítica gigante para cada tipo de inimigo, o jogo fornece um "cardápio" de pequenos comportamentos isolados. O "DNA" de um inimigo simplesmente escolhe quais ações executar e em qual ordem.



Podemos dividir estes módulos em três categorias principais: Aquisição de Alvo, Movimentação e Combate.

---

### 🎯 1. Aquisição e Tomada de Decisão

**📄 `TargetingActions.js`**
Antes de agir, o inimigo precisa saber contra quem agir. O método `getClosestTarget` é o sensor de visão da IA.
* **Infighting (Fogo Amigo/Facções):** Note que o algoritmo verifica a distância não apenas para o `player`, mas também itera sobre o array `enemies`. Isso significa que o motor já tem suporte nativo para inimigos que atacam outros inimigos (como monstros "Berserk" ou de facções rivais), bastando que a IA do tipo solicite o alvo mais próximo em geral.
* **Otimização de Distância:** Novamente, a otimização de "distância ao quadrado" (`minDistSq`) é usada aqui para varrer dezenas de entidades na tela sem sobrecarregar a matemática.

---

### 🏃‍♂️ 2. Comportamentos de Movimento (Steering)

**📄 `MoveActions.js` (Agregador de Movimento)**
Este módulo centraliza as rotinas de locomoção. Ele atua como um exportador principal, muitas vezes absorvendo lógicas de arquivos avulsos menores (como `Pursue.js`, `dodge.js` e `wandering.js`).

* **`pursue` (Perseguir):** A matemática mais fundamental. Calcula o vetor de distância até o alvo e o normaliza (divide pela distância total) para retornar uma direção pura `{ x, y }`.
* **`flee` (Fugir):** Brilhantemente simples. Ele chama a função `pursue` para descobrir onde o alvo está, e simplesmente inverte o vetor (`-p.x, -p.y`). Usado por inimigos atiradores (Snipers) que tentam manter distância.
* **`wandering` (Vadiar):** Um comportamento exploratório. A cada ciclo de 1 a 3 segundos (`randomMoveTimer`), a IA sorteia um novo ângulo aleatório (`Math.random() * Math.PI * 2`) e anda naquela direção. Cria o efeito de "patrulha" para inimigos ociosos.
* **`dodge` (Esquiva Vetorial):** 
    Este é o comportamento de locomoção mais avançado. A IA varre os tiros inimigos (`threatBullets`) em um raio de proximidade (120 pixels, representado por `14400` ao quadrado). Se detectar perigo, ela não corre para trás; ela pega o vetor de velocidade da bala `(vx, vy)` e retorna o seu **vetor perpendicular** `{-vy, vx}`, fazendo o inimigo dar um "passo para o lado" (sidestep) matematicamente perfeito para desviar do tiro.

---

### ⚔️ 3. Ações de Combate

**📄 `Attack.js` (O Atirador Tático)**
Esta é a evolução do sistema de tiros. Ele abandona a mira simples e se integra ao nosso motor balístico (`mathUtils.js`).
* Ele aciona o `getSmartAim` para tentar prever o movimento do jogador (Interceptação).
* **Bifurcação de Projéteis:** Ele verifica o `bulletType`. Se for uma arma de arco (`isLobbed`, como bombas ou ácido), ele instancia um `LobbedProjectile` com uma posição física estática (`targetX, targetY`). Se for um tiro normal, ele cria uma `Bullet` com vetor direcional.
* Gerencia automaticamente a cadência de tiro recarregando o `shootCooldown`.

**📄 `meleeAction.js` (Combate Corpo a Corpo e Física)**
Responsável pelo dano de toque dos inimigos (Zumbis, Batedores, etc).
* **Feedback Visceral:** Ele não apenas subtrai HP. Ele aciona um `camera.shake` dinâmico (com base no "peso" do inimigo) e gera o número vermelho de dano para o jogador.
* **Knockback (Repulsão):**
    
    Se o inimigo tiver o atributo `knockbackPower`, o impacto injeta força bruta no vetor de velocidade (`velX`, `velY`) do alvo. Isso faz com que o jogador (ou outro inimigo) seja fisicamente arremessado para trás após sofrer o golpe, quebrando seu ritmo de movimento.

**📄 `CombatActions.js` vs `simpleShoot.js`**
O arquivo `simpleShoot.js` encontra-se vazio por ser um resquício do processo de refatoração, tendo sido absorvido por `CombatActions.js`. A função `simpleShoot` realiza disparos de "mira burra" (aponta direto para a posição atual, usando `Math.atan2`), servindo como uma alternativa barata em CPU para inimigos de nível baixo que não merecem a precisão preditiva do `Attack.js`.

## Diretório: `src/game/enemy/systems/` (Sistemas Especialistas de Inimigos)

Esta camada segue fortemente a filosofia do Entity-Component-System (ECS). Os módulos aqui são estritamente funções de serviço: eles não guardam estado próprio, mas recebem uma entidade (`enemy`) e operam sobre os dados dela.

---

### 🎨 `RenderSystem.js` (Motor Visual Dinâmico)

Responsável por traduzir os dados frios do "DNA" do inimigo em formas e cores renderizadas no Canvas, utilizando técnicas de translação de matriz para otimizar os desenhos geométricos.

#### 1. Dicionário de Formas Geométricas (`SHAPES`)
Em vez de desenhar inimigos usando sprites estáticos (arquivos PNG/JPG) carregados na memória, o jogo utiliza geometria vetorial gerada proceduralmente. O dicionário `SHAPES` contém instruções matemáticas para polígonos complexos (`circle`, `triangle`, `diamond`, `hexagon`). Isso garante que os inimigos escalonem perfeitamente (resolução infinita) e mantenham o estilo visual minimalista e abstrato (semelhante ao *Diep.io*).

#### 2. Matriz de Transformação (`ctx.save()` e `ctx.translate()`)
Em vez de calcular o offset da câmera $X$ e $Y$ em cada vértice da forma poligonal (o que causaria lentidão monstruosa num array de dezenas de inimigos), o renderizador move a *prancheta de desenho inteira* (a matriz global do Canvas) para as coordenadas corrigidas pela câmera e desenha a forma puramente ao redor do seu eixo `(0, 0)`. O `ctx.restore()` desfaz a alteração da matriz para o próximo ciclo de loop, protegendo o restante do jogo.

#### 3. Direção do Olhar (Feedforward Visual)
Se um inimigo atirador possuir um alvo atrelado (`enemy.shootTarget`), o renderizador calcula o ângulo real usando $Math.atan2$ e desenha um pequeno círculo preto atuando como "olho" na extremidade exterior do raio. Esse elemento fornece aos jogadores uma dica vital e inconsciente de qual inimigo vai disparar, garantindo mais previsibilidade nas esquivas num ambiente de alto estresse.

#### 4. Barra de Progresso Inteligente (`drawHealthBar`)
* **Coloração Dinâmica:** Ela transita de um tom verde vivo (`#2ecc71`) até vermelho (`#e74c3c`) através de marcos (thresholds) matemáticos (`hpRatio > 0.4`), comunicando perigo instantaneamente.
* **Culling de Render:** Por otimização extrema, a barra de vida não existe na UI contínua. Ela só é instanciada e pintada na tela se o inimigo houver levado dano (`enemy.hp < enemy.maxHp`). Inimigos ilesos são desenhados sem custo de UI, reduzindo o *fill rate* (taxa de preenchimento) da GPU do usuário.

---

### 🧬 `UpgradeSystem.js` (Evolução Procedural)

Este sistema cuida da matemática de balanceamento em runtime dos inimigos. Para que um inimigo nasça com nível alto (Level Scaling), este arquivo gera seus atributos aleatoriamente, porém focados.

#### 1. Algoritmo de Sorteio Ponderado (Weighted Random)

Em vez de dar "um ponto para cada atributo", o sistema simula uma tabela de chances. As `STRATEGIES` definem os pesos (probabilidades). Por exemplo, um inimigo da classe `tank` tem peso 60 para evoluir `maxHp` e apenas 10 para `speed`. O `chooseWeightedStat` sorteia um número na amplitude do peso total e escolhe iterativamente qual estatística venceu a loteria naquele nível de evolução.

#### 2. Bônus por Evolução (`BUFF_VALUES`)
Os incrementos são estritamente matemáticos. Enquanto o HP soma valores diretos de adição (`type: 'add', value: 20`), a velocidade e a cadência de tiros atuam numa proporção percentual de melhoria através de multiplicadores escalares (`type: 'multiply', value: 1.05` representando +5%). O sistema de cadência atua como um decaimento: `0.95` significa -5% de atraso, ou seja, atira mais rápido.

#### 3. Simbiose com a `StatSheet`
Assim como a classe do Jogador, o Inimigo não aplica os pontos brutos numa variável; o módulo gera strings hash pseudo-aleatórias (ex: `evo_damage_a2k9x`) e aciona o motor base do jogo (`enemy.stats.addModifier`). Dessa forma, todas as bonificações temporárias futuras, magias ou auras interagem perfeitamente, garantindo escalabilidade total no *framework* arquitetural de RPG.

## Diretório: `src/game/enemy/types/` (Catálogo de DNA e Auto-Discovery)

Esta pasta é onde a "receita" de cada inimigo é definida. A arquitetura aqui brilha por utilizar dois padrões de projeto poderosos: o **Data-Driven Design** (onde os dados ditam o comportamento) e o **Registry/Auto-Discovery Pattern** (onde o sistema encontra e registra os inimigos automaticamente, sem precisar que o programador os cadastre manualmente em um arquivo central).

---

### 📄 `typeLoader.js` (O Motor de Auto-Descoberta)

Este é um dos arquivos mais inteligentes da engine. Ele atua como uma "Fábrica de Inimigos" (Factory Pattern) automatizada, utilizando recursos modernos do *bundler* (Vite).

* **Importação Global (`import.meta.glob`)**:
    Em vez de importar manualmente cada novo inimigo (ex: `import { Zumbi } from './zumbi.js'`), o script usa `import.meta.glob('./*.js', { eager: true })`. O Vite varre a pasta no momento da compilação e empacota todos os arquivos `.js` automaticamente.
* **Registro Dinâmico (`initEnemyTypes`)**:
    Durante o boot do jogo (lá no `main.js`), esta função itera sobre os arquivos encontrados. Ela ignora os arquivos de sistema (`typeLoader.js` e `index.js`), extrai o nome do arquivo, converte para minúsculas e armazena o objeto exportado dentro do `enemyRegistry`.
* **A Grande Vantagem Arquitetural**:
    Isso significa que o seu jogo obedece ao princípio *Open/Closed* (Aberto para expansão, fechado para modificação). **Para criar um inimigo novo no jogo, você não precisa alterar nenhuma linha de código existente.** Basta criar um novo arquivo (ex: `boss-mutante.js`) nesta pasta, e o `typeLoader` vai descobri-lo, registrá-lo e o `EnemySpawner` já começará a jogá-lo na arena.

---

### 📄 `cannon-fodder.js` (Arquétipo: O Batedor Básico)

Este arquivo é um exemplo perfeito de como um inimigo é definido na engine. Ele não herda classes complexas; ele simplesmente exporta um objeto literal (um "Contrato" ou "DNA") com duas propriedades principais: `stats` e `think`.

#### 1. O Chassi (`stats`)
Um dicionário estático que define os atributos base antes de qualquer mutação ou Level Scaling.
* Define a vida (`hp`), velocidade (`acceleration`), aparência (`color`, `radius`) e atributos bélicos (`fireRate`, `damage`).
* O renderizador dinâmico e a classe genérica `Enemy` usam esses valores para construir o corpo físico na tela.

#### 2. O Cérebro (`think`)
Lembra da pasta `actions/` que vimos anteriormente? É aqui que aquelas ações isoladas se transformam em uma Inteligência Artificial funcional. O método `think` é injetado no loop de `update` do inimigo a cada frame.

**O Fluxo de Decisão do Cannon Fodder:**
1.  **Visão:** Chama `TargetingActions.getClosestTarget` para escanear a arena.
2.  **Engajamento:** Se encontrar um alvo, ele o trava na mira (`enemy.shootTarget = target`).
3.  **Combate:** Mede a distância (`distSq`). Se o alvo estiver num raio de 400 pixels (400 * 400 por causa da otimização de raiz quadrada), ele aciona o gatilho (`CombatActions.simpleShoot`).
4.  **Caçada:** Retorna o vetor de perseguição implacável (`MoveActions.pursue`).
5.  **Ociosidade:** Se não houver alvos na tela, ele não fica travado; ele entra em modo de patrulha (`MoveActions.wandering`).

O `CannonFodder` é a "bucha de canhão": sua IA é reta e agressiva. Um inimigo do tipo "Sniper", por exemplo, teria uma função `think` que calcularia a distância e retornaria `MoveActions.flee` caso o jogador chegasse muito perto!

## Diretórios: `src/game/upgrades/` e `src/game/synergies/` (Motor de RPG e Progressão)

Estas pastas formam o ecossistema de recompensas e *power-creeping* do jogo. A arquitetura foi desenhada para ser altamente escalável, utilizando injeção de dependências e leitura de "tags" invisíveis para criar interações complexas sem acoplar o código.

---

### 🌟 O Sistema de Upgrades (`upgrades/`)

#### 📄 `index.js` (O Gerenciador de "Gacha" e Aplicação)
Este arquivo é o banqueiro e o crupiê do seu jogo. Ele descobre, sorteia e aplica os atributos.

* **Auto-Discovery de Cartas:** Assim como os inimigos, o sistema usa `import.meta.glob('./types/*.js')` para carregar o catálogo de upgrades automaticamente. Adicionar um novo poder ao jogo é tão simples quanto criar um novo arquivo na pasta `types/`.
* **Sorteio Ponderado por Raridade (`getChoices`):**
    O jogo não escolhe 4 upgrades aleatoriamente. Ele utiliza um algoritmo de roleta viciada (Weighted Random). Cada raridade tem um peso (ex: `common: 50`, `legendary: 1`). O algoritmo calcula o peso total das opções elegíveis e gera um número aleatório dentro desse espectro. A probabilidade de um item específico ser escolhido é $P = \frac{w_i}{\sum w_{total}}$, o que garante que itens lendários sejam eventos raros e emocionantes.
* **Stacking Seguro (`apply`):**
    Quando um jogador escolhe o mesmo upgrade várias vezes (Stacks), o sistema não sobrescreve o modificador anterior. Ele gera um ID único dinâmico (`${id}_stack_${currentStack}`) e injeta na `StatSheet`. Isso permite que o jogador acumule bônus matematicamente perfeitos.

#### 📁 `types/` (O Payload Declarativo)
Os arquivos aqui (como `max-hp.js`) são estritamente declarativos. Eles definem as tags, a raridade e o objeto `modifier` (`stat`, `value`, `type`). A lógica de aplicação matemática é delegada inteiramente para a `StatSheet` do core do jogo, enquanto a função `apply` local é restrita a acionar efeitos colaterais visuais ou curas instantâneas.

---

### ✨ O Motor de Sinergias (`synergies/`)

#### 📄 `index.js` (O Cérebro de Meta-Progressão)
Se os upgrades são as peças de lego, o `SynergyEngine` é o manual de instruções que percebe quando você montou o castelo.

* **Leitura de Tags (Composição Espacial):**
    O motor não verifica se o jogador "comprou o upgrade de Fogo e o de Gelo". Em vez disso, ele conta abstrações chamadas **Tags** (ex: `offensive: 2`, `fire_rate: 1`). Isso cria um ecossistema extremamente flexível: dezenas de combinações diferentes de itens podem ativar a mesma Sinergia, desde que batam as cotas numéricas de tags.
* **Injeção de Dependência Fixa:**
    Para evitar o erro de *Dependency Cycle* (onde Upgrades chamam Sinergias, e Sinergias chamam Upgrades), a função `evaluate` exige que o `UpgradeRegistry` seja passado como argumento (`evaluate: (player, UpgradeRegistry)`). Isso mantém a arquitetura limpa e amigável ao empacotador do Vite.
* **Injeção de Comportamento Trocável:**
    Quando uma sinergia como o "Modo Berserker" é ativada, ela não apenas adiciona um modificador de dano. Ela injeta um código inteiramente novo no ciclo de tiro do jogador (`player.onShootEffect = (p) => { p.hp -= p.hp * 0.05; };`). Isso prova que a arquitetura suporta mudanças de regra profundas (game-breaking mechanics) em tempo real, recompensando construções de *builds* específicas.

## Diretório: `src/game/ui/` (Interface de Usuário e Feedback Visceral)

Esta pasta gerencia a camada de comunicação visual entre o motor do jogo e o jogador. A grande sacada arquitetural aqui é a adoção de um modelo de **Interface Híbrida (Canvas + DOM)**. 
Em vez de tentar reinventar a roda e programar cliques de botões matematicamente dentro do `<canvas>`, o jogo desenha informações estáticas (como o Game Over) no Canvas, mas delega menus complexos e botões para o HTML/CSS padrão do navegador (DOM), aproveitando toda a aceleração de hardware e recursos de layout da web.

---

### 🃏 `LevelUpMenu.js` (O Sistema de "Draft" de Upgrades)

Este é o arquivo responsável por pausar a ação e apresentar o menu estilo "Roguelite" quando o jogador sobe de nível. Ele constrói a interface de forma programática (CSS-in-JS) sem precisar de arquivos HTML ou CSS externos.

#### 1. Transparência de RPG (`getPreview`)
O destaque técnico deste menu é a forma como ele interage com a nossa `StatSheet`. Em vez de o jogador adivinhar o que a carta faz, o menu invoca:
```javascript
const { before, after } = player.stats.getPreview(up.modifier.stat, up.modifier);
Isso calcula a matemática em tempo real e renderiza a alteração exata (10.0 \rightarrow 15.0), aplicando os modificadores simulados para dar ao jogador 100% de clareza sobre o impacto da sua escolha.
​2. Design Visual e "Juice"
​Codificação por Cores (Raridade): O dicionário rarityColors aplica contornos neon vibrantes (#3498db para raro, #f1c40f para lendário) criando hierarquia visual instantânea.
​Animações Nativas: Usando transition: 'transform 0.2s' e eventos de onmouseover/onmouseout, os cartões saltam ao toque do mouse ou dedo, adicionando um polimento profissional ("juice") essencial para a satisfação do jogador.
​Sistema de Dicas (Synergy Hints): A interface tenta ler o getSynergyHint, preparando espaço estrutural para avisar o jogador: "Ei, se você pegar essa carta, vai completar a Sinergia Berserker!".
​✨ SynergyToast.js (Feedback Não-Obstrutivo)
​Quando o jogador ativa uma Sinergia, o jogo não pausa para dar um aviso chato. Ele invoca um "Toast" (uma notificação flutuante temporária).
​Coreografia de Animação Assíncrona:
O script cria o elemento invisível (opacity: 0) e "fora" do lugar (translateY(100px)). Então, ele usa o requestAnimationFrame em conjunto com a curva de animação elástica do CSS (cubic-bezier(0.175, 0.885, 0.32, 1.275)) para fazer a notificação "pular" suavemente para a tela.
​Auto-Limpeza: Usando encadeamento temporal (setTimeout), a notificação desaparece sozinha após 3 segundos e ativa .remove() no DOM para evitar vazamento de memória.
​🎨 index.js (O Fallback e Renderização Direta)
​Este arquivo agrupa renderizadores utilitários, incluindo a tela de fim de jogo.
​desenharGameOver (Renderização de Canvas):
Ao contrário dos menus acima, a tela de derrota é desenhada puramente no ctx (Canvas 2D). Ela aplica uma camada semi-transparente preta (rgba(0,0,0,0.7)) sobre o frame congelado exato em que o jogador morreu, escrevendo o Nível Final no centro da tela.
​Nota Técnica (mostrarMenuLevelUp):
Este arquivo ainda retém uma função chamada mostrarMenuLevelUp. Trata-se de uma função legacy (legada/antiga) que foi substituída pela interface muito superior do LevelUpMenu.js. Embora esteja inativa, seu código demonstra a evolução da UI desde um formato simples de "lista de botões" até o formato atual de "cartas mágicas".

## Diretório: `src/game/player/` (O Protagonista e Hub de Sistemas)

A arquitetura do Jogador segue o padrão de **Facade (Fachada) e Composição**. Em jogos mal estruturados, a classe `Player` costuma virar um "God Object" (um arquivo gigante de 2.000 linhas que faz tudo). Aqui, a classe `Player` é propositalmente "magra": ela atua apenas como um hub central que delega física, combate, renderização e progressão para sub-módulos especializados.

---

### 🧮 `status.js` (O Coração do RPG: A `StatSheet`)

Este é indiscutivelmente um dos sistemas mais robustos da engine. A `StatSheet` resolve o problema mais comum de jogos com upgrades: a mutação destrutiva de status.

* **Imutabilidade Base:** Os status originais do jogador (`this.base`) nunca são sobrescritos. O nível 1 do jogador é preservado para sempre.
* **Pipeline de Modificadores (Add/Multiply):** Quando o jogo pede `stats.get('damage')`, a planilha recalcula o valor em tempo real obedecendo à regra de ouro do RPG: **Primeiro as somas, depois as multiplicações**.
  $Atributo_{Final} = (Base + \sum Modificadores_{Add}) \times \prod Modificadores_{Multiply}$
* **Limpeza e Efeitos Temporários:** Graças ao design de "lista de modificadores" (`this.modifiers`), o sistema de efeitos visuais (`updateStatusEffects`) pode injetar um buff de "+50% de Dano por 5 segundos" e, ao final do tempo, simplesmente remover o ID da lista. O dano do jogador volta perfeitamente ao normal sem sobras de casas decimais.
* **Simulação de Previsão (`getPreview`):** Um método genial que permite à UI injetar um modificador "fantasma" na lista, rodar os cálculos e devolver a diferença exata para mostrar ao jogador antes dele confirmar uma escolha.

---

### 🦸‍♂️ `player.js` (A Classe Agregadora)

A entidade central. Ela instancia a `StatSheet` e gerencia as coordenadas espaciais (`x`, `y`).

* **Getters Reativos:** A classe expõe propriedades como `get damage() { return this.stats.get('damage'); }`. Isso significa que o resto do jogo (inimigos, UI, física) pode ler `player.damage` como se fosse uma variável normal, mas por baixo dos panos, está sempre consultando a `StatSheet` com todos os buffs e sinergias atualizados em tempo real.
* **Inversão de Controle no Level Up:** O jogador não abre o menu de Level Up por conta própria. Ele simplesmente grita "Subi de nível!" através do evento genérico `player.onLevelUp()`. O `gameLoop` ouve isso e orquestra a pausa do jogo e a abertura do menu. Isso mantém a classe do jogador totalmente isolada de lógicas de HTML/DOM.

---

### ⚔️ `Combat.js` (Motor Balístico do Jogador)

Separa estritamente a intenção de atirar da matemática do tiro em si.

* **Reatividade Total:** A cada frame que o jogador aperta o gatilho, o script puxa os dados do `StatSheet` (`damage`, `fireRate`, `multishot`). Se uma Sinergia aumentar a cadência no meio do tiroteio, o próximo tiro já sai com a nova velocidade automaticamente.
* **Matemática do Multishot (Spread):** Se o jogador possuir tiros múltiplos (`shotCount > 1`), o código não atira todas as balas na mesma linha. Ele calcula um ângulo base a partir do joystick de mira, define uma abertura (spread) de 15 graus (`15 * Math.PI / 180`), e distribui os projéteis simetricamente em forma de leque (cone de tiro).

---

### 📈 `progress.js` (O Elo de Evolução)

Faz a ponte entre a coleta de experiência, o sistema de arquivos de upgrades e as sinergias.

* **Aplicações e Callbacks:** Quando um upgrade é escolhido (`applyUpgrade`), este módulo notifica o `UpgradeSystem` (para gravar na ficha do jogador) e imediatamente dispara uma reavaliação do `SynergyEngine` injetando a dependência dinamicamente. Ele garante que a matemática de meta-progressão corra solta sem poluir a gameplay principal.

---

### 🎨 `render.js` e 🕹️ `Controller.js` (Periféricos Visuais e Sensoriais)

* **`Controller.js`:** Puxa os vetores limpos do `input.js` (core) e aplica a inércia (`friction`), aceleração e limitação vetorial (para impedir que o jogador ande mais rápido na diagonal do que em linha reta).
* **`render.js`:** Em vez de depender de um sprite de HUD estático, ele desenha no Canvas um arco cibernético pulsante ao redor do jogador, mira a laser se o direcional estiver ativo, indicadores de barras de vida e XP afixados aos "pés" do personagem, e um anel dourado adicional caso uma Sinergia esteja ativa.

 src/game/projectiles/ (A Fronteira da Refatoração)
​Este diretório é responsável por gerenciar as entidades ofensivas que cruzam a arena. Atualmente, ele se encontra em um estado de "Tabula Rasa" (Página em Branco), servindo como uma fundação mínima para garantir que o motor do jogo permaneça operacional enquanto o novo sistema modular é projetado.
​📄 index.js (Classes Base e Mocks de Estabilidade)
​O arquivo index.js exporta as definições primitivas de projéteis. No estágio atual da refatoração, estas classes atuam como Mocks ou Stubs: elas existem para satisfazer as dependências de importação de outros módulos (como o Combat.js do Player e o Attack.js dos Inimigos) sem introduzir bugs ou comportamentos obsoletos.
