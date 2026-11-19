# Documento Mestre: EcoCombo 3D (Projeto Integrado IA + Gestão Ágil)

## 1. Visão Geral e Duplo Propósito Acadêmico

Este projeto foi concebido para atender simultaneamente a duas disciplinas da graduação com escopo realista de desenvolvimento em $1\text{ semana}$:

1. **Curso de Extensão / Uso de IA (Simples-Médio):** Desenvolvimento de um jogo *web action-arcade* isométrico em 2.5D/3D sobre reciclagem e coleta seletiva, utilizando geração assistida por Inteligência Artificial para construção da arena isométrica (Three.js), estética HD-2D, sistema de combinação elemental de recicláveis, mira com o mouse contra inimigos da poluição e áudio procedural (Web Audio API).
2. **Gestão Ágil de Projetos de Software (Prof. Me. Orlando Saraiva Júnior — Fatec Araras):** Estruturação completa do produto no **GitHub Projects**, contendo $7\text{ épicos}$, $24\text{ estórias de usuário}$ (formato *Como / Quero / Para* e critérios Gherkin *Dado / Quando / Então*), planejamento da **Sprint 1 ($20\text{ pontos}$)** focado no MVP jogável (movimentação `WASD`, combinação das 4 cores formando objetos/energias, disparo mirado no mouse contra inimigos e multiplicador decrescente por repetição) e divisão de estórias segundo o modelo **INVEST**.

---

## 2. Direção de Arte e Estética: Design *Until Then* + Painel Lateral *Capsule*

Para alcançar um visual *indie* autoral sem depender de assets 3D externos pesados, a direção de arte segue uma divisão clara de referências:

### 2.1. Estética e Design Visual Principal: *Until Then* (`@docs/until-then-2.webp`)
* **Identidade Visual HD-2D (2.5D no Espaço 3D):** Toda a estética do jogo, paleta de cores, atmosfera e design do personagem/inimigos vêm de **Until Then**.
* **Câmera Isométrica e Cenário 3D com Texturas Pixel Art (`THREE.NearestFilter`):** A arena é vista em perspectiva isométrica. O chão em grid urbano/estilizado, os obstáculos, o protagonista, os inimigos ("bichos" da poluição) e os objetos/energias conjurados utilizam filtragem *pixel art* nítida sem interpolação linear (`NearestFilter`).
* **Iluminação Dramática, Sombras e Pós-Processamento:**
  * Uso de iluminação direcional dramática projetando sombras reais no piso da arena, combinada com luzes pontuais dinâmicas nas cores dos elementos combinados.
  * Pós-processamento com **UnrealBloomPass** para dar brilho neon às combinações de recicláveis, aos 4 orbes elementais e aos projéteis disparados contra os inimigos.

### 2.2. Referência Estrutural de Interface: *Capsule* (`@docs/2d.webp`)
* Da imagem de *Capsule*, aproveita-se **exclusivamente o conceito de layout lateral com o personagem e os 4 orbes em órbita**:
  * **Painel Lateral Esquerdo Fixo com o Personagem:** Exibe o retrato reativo do protagonista (desenhado na estética de *Until Then*), acompanhado do visor da combinação atual, do multiplicador ativo e da barra de integridade/pureza ambiental.
  * **Barra Inferior de Status:** Exibe o `STAGE` / onda atual e o `SCORE` total.
  * **4 Orbes Elementais em Órbita 3D:** Ao redor do protagonista na arena isométrica flutuam os $4\text{ orbes}$ nas cores da coleta seletiva.

---

## 3. Mecânicas de Jogo (Core Loop do MVP — Sem Esteira)

O jogo **não utiliza esteira**. A partida acontece em uma **Arena Isométrica 2.5D** com movimentação livre, síntese de combos pelas 4 cores da reciclagem e combate mirado com o mouse contra inimigos.

### 3.1. Movimentação Isométrica (`WASD`) e Mira com o Mouse
* **Movimentação (`W`, `A`, `S`, `D`):** O jogador caminha livremente em 8 direções pela arena isométrica para manter distância dos inimigos ("bichos" de poluição), coletar cargas e se posicionar para o tiro.
* **Mira Isométrica (`Mouse`):** O cursor do mouse projeta uma retícula/linha de mira no plano 3D da arena (`THREE.Raycaster`).
* **Disparo (`Clique Esquerdo do Mouse — LMB`):** Lança o objeto, conceito ou energia formado pelo combo na direção exata mirada pelo jogador para atingir os inimigos.

### 3.2. As 4 Opções da Coleta Seletiva (Padrão CONAMA) e Combinações
O jogador possui $4\text{ elementos}$ correspondentes às cores oficiais da reciclagem (acionados pelas teclas `1`, `2`, `3`, `4` ou `Q`, `E`, `R`, `F` enquanto anda no `WASD`):

| Tecla | Cor do Elemento | Categoria de Reciclável | Papel na Combinação |
| :---: | :--- | :--- | :--- |
| **`1`** (ou `Q`) | **Vermelho** (`#FF3B30`) | **Plástico** | Elasticidade, ricochete e polímeros cinéticos |
| **`2`** (ou `E`) | **Azul** (`#007AFF`) | **Papel / Papelão** | Lâminas de origami, área leve e propulsão |
| **`3`** (ou `R`) | **Verde** (`#34C759`) | **Vidro** | Cristais perfurantes, refração laser e prismas |
| **`4`** (ou `F`) | **Amarelo** (`#FFCC00`) | **Metal** | Impacto pesado, condução elétrica e magnetismo |

Ao combinar **2 elementos** (ex.: `Vermelho + Verde`, `Azul + Amarelo`, `Verde + Verde`, etc.), o protagonista **forma um Objeto, Conceito ou Energia Reciclada** que fica pronta para ser arremessada com o mouse contra o bicho:

| Receita do Combo | Cores Combinadas | Objeto / Conceito / Energia Formada | Efeito ao Atingir o Inimigo ("Bicho") |
| :--- | :--- | :--- | :--- |
| `Plástico + Plástico` | Vermelho + Vermelho | **Esfera Polimérica Ricocheteante** | Rebate do primeiro inimigo para outro próximo |
| `Papel + Papel` | Azul + Azul | **Rajada de Origami Cortante** | Dispara um leque triplo de lâminas de celulose |
| `Vidro + Vidro` | Verde + Verde | **Lança de Cristal Refrator** | Projétil veloz que atravessa inimigos em linha |
| `Metal + Metal` | Amarelo + Amarelo | **Bola de Liga Pesada** | Alto impacto físico com empurrão (*knockback*) |
| `Plástico + Papel` | Vermelho + Azul | **Cápsula Cinética Pressurizada** | Explode em área curta ao colidir com o bicho |
| `Plástico + Vidro` | Vermelho + Verde | **Feixe Prisma de Fibra Óptica** | Disparo energético de alta velocidade e precisão |
| `Plástico + Metal` | Vermelho + Amarelo | **Bobina Eletromagnética** | Descarga que reduz a velocidade do inimigo |
| `Papel + Vidro` | Azul + Verde | **Vórtice de Vento Vítreo** | Cria redemoinho de estilhaços que puxa inimigos |
| `Papel + Metal` | Azul + Amarelo | **Disco Laminado Condutor** | Chakram giratório largo de médio alcance |
| `Vidro + Metal` | Verde + Amarelo | **Espelho Solar Voltaico** | Orbe concentrado de alto dano térmico/luminoso |

### 3.3. Fórmulas Matemáticas: Multiplicador Decrescente por Repetição (*Stale Combo Decay*)

Para incentivar o jogador a dominar e variar todas as combinações das 4 cores da reciclagem — em vez de apertar sempre o mesmo botão —, o sistema aplica o **Decaimento de Multiplicador por Repetição**:

1. **Multiplicador Inicial em Combo Inédito ($M_{\text{max}}$):**
   Quando o jogador forma e dispara um combo diferente do anterior ($R = 0$ repetições), o multiplicador começa no valor máximo de **$4\times$**:
   $$M_0 = 4.0\times$$

2. **Decaimento Progressivo ao Repetir o Mesmo Combo ($M(R)$):**
   Se o jogador repetir consecutivamente o **mesmo tipo de combo / mesmo comando** ($R = 1, 2, 3\dots$ repetições seguidas da mesma receita), o multiplicador diminui a cada repetição até travar em **$1\times$** (onde deixa de ser um multiplicador e vira apenas o valor base $1\times$):
   $$M(R) = \begin{cases} 4.0\times, & \text{se } R = 0 \quad (\text{Combo variado / inédito}) \\ 2.5\times, & \text{se } R = 1 \quad (\text{1ª repetição seguida do mesmo combo}) \\ 1.5\times, & \text{se } R = 2 \quad (\text{2ª repetição seguida do mesmo combo}) \\ 1.0\times, & \text{se } R \ge 3 \quad (\text{Combo saturado: não multiplica mais nada!}) \end{cases}$$

3. **Cálculo de Pontuação ($P_{\text{acerto}}$) e Dano no Inimigo ($D_{\text{ataque}}$):**
   Tanto os pontos ganhos quanto o dano causado no inimigo ("bicho") são multiplicados diretamente por $M(R)$:
   $$P_{\text{acerto}} = \text{round}\left(100 \times M(R)\right)$$
   $$D_{\text{ataque}} = D_{\text{base}} \times M(R)$$
   * Quando $R \ge 3 \implies M(R) = 1.0\times$: o jogador causa apenas o dano mínimo ($1\times$) e recebe apenas os pontos base, além de ver o alerta `"1x — COMBO REPETIDO! VARIE OS RECICLÁVEIS!"`.
   * Assim que o jogador executa **qualquer combinação diferente**, o contador de repetição zera ($R = 0$) e o multiplicador volta imediatamente para **$4.0\times$**!

4. **Inimigos na Arena ("Bichos" da Poluição) e Pureza Ambiental:**
   * Os inimigos surgem nas bordas da arena isométrica e perseguem o protagonista.
   * Se um inimigo encostar no protagonista, a **Barra de Pureza/Integridade Ambiental** (que inicia em $100\%$) perde $15\%$ e o inimigo recua.
   * Derrotar inimigos com combos variados ($M \ge 2.5\times$) recupera $+2\%$ de Pureza Ambiental (até $100\%$).

### 3.4. Evolução Tática 2.0: Combos *Devil May Cry* + Comandos *Hwei (LoL)* + Inimigos Recicláveis
> Detalhamento completo em [`Docs/planejamento_combos_dmc_e_comandos_hwei.md`](./planejamento_combos_dmc_e_comandos_hwei.md).

Para elevar a profundidade tática e evitar que o jogador aperte combinações aleatórias sem analisar a arena, o combate evolui em três frentes integradas:
1. **Inimigos como Itens Recicláveis Específicos (`RN16`):** Os inimigos representam resíduos reais das 4 cores CONAMA — ex.: **Garrafa PET** (Plástico/Vermelho `Q`), **Caixa de Papelão** (Papel/Azul `E`), **Garrafa de Vidro** (Vidro/Verde `R`) e **Porca de Metal** (Metal/Amarelo `F`). O jogador precisa selecionar a **Lixeira da cor certa** para o item que está vindo.
2. **Sistema de Lixeiras e Leque de Modos Estilo *Hwei* — *League of Legends* (`RN17`):**
   * **1º Comando (`Q`, `E`, `R` ou `F`):** Abre a **Lixeira CONAMA** correspondente e exibe um **Leque Visual de Opções** daquela cor.
   * **2º Comando (Modo Tático no Leque):** Escolhe a ação ideal para o momento:
     * **Modo 1 (`Q` — Mais Dano):** Disparo focado de alto impacto para abater o item;
     * **Modo 2 (`E` — Controle de Grupo / Juntar & Expandir):** Puxa/agrupa itens espalhados ou expande em área;
     * **Modo 3 (`R` — Estunar / Paralisar):** Paralisa (*stun*) o item reciclável no lugar;
     * **Modo 4 (`F` — Protetivo / Escudo Seletivo):** Ativa um escudo da cor da lixeira que reduz drasticamente o dano recebido quando aquele tipo de item tenta encostar no protagonista.
3. **Medidor de Estilo *Devil May Cry* (`D` a `SSS`) com Multiplicador Destacado Abaixo (`RN18`):**
   * O HUD exibe a letra gigante do **Rank de Estilo (`D`, `C`, `B`, `A`, `S`, `SS`, `SSS`)** e, **logo abaixo em grande destaque**, o **Multiplicador ativo (`1.0x` até `6.0x`)**, recompensando acertos na lixeira certa com variedade de modos táticos.

---

## 4. Regras de Negócio do Sistema (`RN01` a `RN19`)

* **RN01 (Padrão de 4 Cores CONAMA):** Os elementos de reciclagem seguem as $4\text{ cores}$ oficiais: Vermelho/Plástico (`1`/`Q`), Azul/Papel (`2`/`E`), Verde/Vidro (`3`/`R`) e Amarelo/Metal (`4`/`F`).
* **RN02 (Movimentação Isométrica e Mira):** O protagonista se move livremente pela arena 3D com câmera isométrica usando `WASD` e mira na direção do cursor do mouse (`Raycaster` + Clique Esquerdo).
* **RN03 (Síntese de Objetos/Energias por Combo):** Combinar 2 elementos das 4 cores de recicláveis forma um objeto, conceito ou energia específica que é disparada contra os inimigos.
* **RN04 (Multiplicador Decrescente por Repetição — *Stale Decay*):** O multiplicador inicia em $4.0\times$ em combos variados e cai progressivamente ($4.0\times \rightarrow 2.5\times \rightarrow 1.5\times \rightarrow 1.0\times$) quando o jogador repete o mesmo combo seguido, deixando de multiplicar em $1.0\times$.
* **RN05 (Recuperação de Multiplicador por Variedade):** Trocar para uma combinação de recicláveis diferente da anterior restaura o multiplicador para $4.0\times$.
* **RN06 (Combate contra Inimigos na Arena):** Inimigos ("bichos" da poluição) surgem na arena, perseguem o jogador e sofrem dano proporcional ao multiplicador $M(R)$ quando atingidos pelos objetos/energias disparados.
* **RN07 (Estética *Until Then* + Painel Lateral *Capsule*):** O jogo aplica a estética 2.5D (HD-2D, iluminação dramática, sombras no chão em grid, `NearestFilter` e `UnrealBloomPass`) inspirada em *Until Then*, mantendo na esquerda o painel fixo com o personagem reativo inspirado em *Capsule*.
* **RN08 (Orbes Elementais do Protagonista):** O protagonista é rodeado por $4\text{ orbes}$ 3D nas cores CONAMA que refletem os elementos carregados no combo atual.
* **RN09 (Escalonamento de Ondas de Inimigos — Pós-MVP):** A velocidade e o HP dos inimigos escalonam a cada onda (*Stage*) concluída.
* **RN10 (Chefões da Poluição — Pós-MVP):** Ao final de cada estágio, surge um Chefão que exige combos variados ($M \ge 2.5\times$) para ter sua blindagem rompida.
* **RN11 (Encerramento de Partida):** Quando a Barra de Pureza/Integridade chega a $0\%$ por ataques dos inimigos, a partida encerra (*Game Over*).
* **RN12 (Execução Web Multiplataforma sem Login):** Execução direta no navegador via Vite + Three.js + WebGL sem exigir login ou instalação, compatível com Linux/Wayland (CachyOS com Niri).
* **RN13 (Privacidade e LGPD no Ranking Local):** Recordes locais em `localStorage` restritos a apelido curto ($3\text{ a }12\text{ caracteres}$), sem dados sensíveis e com limpeza total pelo usuário.
* **RN14 (Catálogo de Receitas e Educação Ambiental):** Exibição das receitas de fusão dos materiais recicláveis e seu impacto ambiental.
* **RN15 (Sincronização Obrigatória com GitHub Projects):** Sempre que uma nova funcionalidade/estória for solicitada, iniciada, concluída ou cancelada durante o desenvolvimento, as Issues e o quadro do GitHub Projects (`MatheusMaiaRangel/EcoCombo`) devem ser atualizados imediatamente (`Status`, `Sprint`, `Estimativa`, `Prioridade` e vínculo de sub-issue ao épico).
* **RN16 (Inimigos como Itens Recicláveis por Lixeira):** Os inimigos instanciados na arena representam resíduos recicláveis específicos das 4 categorias CONAMA (ex.: Garrafa PET = Plástico/Vermelho, Caixa de Papelão = Papel/Azul, Garrafa de Vidro = Vidro/Verde, Porca de Metal = Metal/Amarelo), exigindo o uso da Lixeira correspondente para reciclagem eficiente.
* **RN17 (Comandos de Lixeiras e Leque de Modos Táticos estilo *Hwei*):** As 4 teclas (`Q`, `E`, `R`, `F` ou `1`, `2`, `3`, `4`) abrem as respectivas Lixeiras CONAMA e exibem um Leque de Modos Táticos (Mais Dano, Controle de Grupo/Juntar/Expandir, Stun/Paralisar e Escudo Protetivo que mitiga o dano de aproximação daquele item).
* **RN18 (Rank de Estilo *Devil May Cry* + Multiplicador em Destaque Abaixo):** O sistema de combo exibe Ranks progressivos (`D`, `C`, `B`, `A`, `S`, `SS`, `SSS`) acompanhados de um Multiplicador em grande destaque logo abaixo, que sobe ao acertar a lixeira correta variando os modos táticos e cai ao errar a lixeira, repetir sempre o mesmo ataque ou sofrer dano sem escudo.
* **RN19 (Menu Inicial e Menu de Pausa com Opções na Tecla `ESC`):** O jogo inicia em uma tela de Menu Inicial com visão panorâmica da arena 3D, resumo das 4 lixeiras CONAMA, guia de controles e botão de início de partida. Durante a gameplay ativa, pressionar a tecla `ESC` pausa o loop de combate e abre o Menu de Pausa e Opções (permitindo configurar áudio sintetizado, volume mestre, ritmo/dificuldade da arena, brilho neon Bloom 3D e textos de dano flutuantes, além de continuar, reiniciar ou voltar ao menu inicial).

---

## 5. Arquitetura Técnica (Vite + Vanilla JS + Three.js + Web Audio API)

* **Stack Limpa (Zero Assets Externos):**
  * **Vite + Vanilla JavaScript (ES Modules)** para estrutura modular limpa.
  * **Three.js + Post-Processing (`EffectComposer`, `RenderPass`, `UnrealBloomPass`)** para câmera isométrica, iluminação dramática, sombras reais, texturas procedurais em `<canvas>` com `THREE.NearestFilter` e brilho neon nos combos.
  * **Web Audio API** para sintetizador sonoro via código (sons de canalização das 4 cores, formação do objeto/energia, disparo mirado, impacto no inimigo e som de combo desgastado em $1\times$).
