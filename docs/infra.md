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
