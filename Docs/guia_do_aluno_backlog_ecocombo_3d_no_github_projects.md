# Guia do Projeto: Backlog do EcoCombo 3D no GitHub Projects

**Disciplina:** Gestão Ágil de Projetos de Software — Prof. Me. Orlando Saraiva Júnior (Fatec Araras)
**Projeto Aplicado:** EcoCombo 3D — Jogo Web Isométrico 2.5D/3D de Combos de Reciclagem contra Inimigos da Poluição

Este guia segue rigorosamente todos os critérios de avaliação do documento original da disciplina: **7 épicos**, **24 estórias de usuário** (acima do mínimo de 20), **6 estórias na Sprint 1 ($20\text{ pts}$: E1-01, E1-02, E2-01, E3-01, E3-02 e E4-01)** com tarefas detalhadas, **comentário de divisão de estória (INVEST)** e **README do Project**.

---

## Ordem de Trabalho (Passo a Passo)

- [ ] **Passo 1.** Crie o repositório público `ecocombo-backlog-<seu-usuario>` (ou o nome que preferir).
- [ ] **Passo 2.** Crie as labels `épico`, `estória` e `tarefa`, cada uma com uma cor diferente.
- [ ] **Passo 3.** Crie o Project, vincule-o ao repositório e configure os campos:

| Campo | Tipo | Opções |
| :--- | :--- | :--- |
| **Status** | Single select (já existe) | `Backlog`, `Pronto para sprint`, `Em andamento`, `Em revisão`, `Concluído` |
| **Sprint** | Iteration | Duração de $1\text{ semana}$ |
| **Estimativa** | Number | — |
| **Prioridade** | Single select | `Alta`, `Média`, `Baixa` |

- [ ] **Passo 4.** Crie as $7\text{ issues}$ de épico (seção 2), todas com a label `épico`.
- [ ] **Passo 5.** Abra cada épico e use **Create sub-issue** para criar as estórias dele (seção 3), com a label `estória`.
- [ ] **Passo 6.** Adicione todas as issues ao Project e preencha `Estimativa`, `Prioridade`, `Sprint` e `Status` de cada estória conforme a ficha.
- [ ] **Passo 7.** Escreva o comentário de divisão de estória (INVEST) na issue **E3-01** (seção 4).
- [ ] **Passo 8.** Cole o texto do README nas configurações do Project (seção 5).
- [ ] **Passo 9.** Crie as duas visualizações: Quadro `"Sprint 1"` e Tabela `"Backlog por épico"` (seção 6).
- [ ] **Passo 10.** Deixe o Project público e teste o link em uma janela anônima.

---

## 1. Visão Geral do Backlog

| ID | Estória | Pts | Prioridade | Sprint |
| :--- | :--- | :---: | :--- | :--- |
| **E1** | **Arena Isométrica 2.5D, Movimentação WASD e Mira** | **11** | | |
| E1-01 | Renderizar arena isométrica 2.5D com estética *Until Then* e iluminação dramática | 3 | Alta | Sprint 1 |
| E1-02 | Movimentar protagonista no `WASD` com 4 orbes em órbita e mira no Mouse | 3 | Alta | Sprint 1 |
| E1-03 | Adicionar obstáculos 3D na arena que bloqueiam projéteis e inimigos | 3 | Média | |
| E1-04 | Alterar atmosfera e iluminação da arena conforme o nível de pureza | 2 | Baixa | |
| **E2** | **Inimigos da Poluição ("Bichos" / Itens Recicláveis) e IA de Arena** | **16** | | |
| E2-01 | Instanciar inimigos da poluição na arena isométrica que perseguem o jogador | 3 | Alta | Sprint 1 |
| E2-02 | Causar perda de pureza ambiental quando o inimigo encosta no protagonista | 3 | Alta | |
| E2-03 | Escalonar velocidade e vida dos inimigos a cada estágio (onda) | 2 | Média | |
| E2-04 | Instanciar inimigos resistentes a uma cor específica de reciclável | 2 | Baixa | |
| E2-05 | Instanciar inimigos como itens recicláveis (Garrafa PET, Porca de Metal, Papelão e Vidro) por lixeira | 3 | Alta | Sprint 1 |
| E2-06 | Expandir arena após 1m30s (Estágio 2) e acumular +1 novo inimigo reciclável por lixeira | 3 | Alta | Sprint 1 |
| **E3** | **Combinação de Recicláveis, Grimório *Hwei* e Multiplicador** | **18** | | |
| E3-01 | Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse | 5 | Alta | Sprint 1 |
| E3-02 | Reduzir o multiplicador ao repetir o mesmo combo até ficar em $1\times$ (*Stale Decay*) | 3 | Alta | Sprint 1 |
| E3-03 | Aplicar efeitos elementais secundários (ricochete, empurrão, lentidão) por receita | 3 | Média | |
| E3-04 | Conceder bônus de Maestria Elemental ao alternar 4 combos inéditos seguidos | 2 | Baixa | |
| E3-05 | Implementar comandos de Lixeiras e Leque de Modos Táticos estilo *Hwei* (Dano, Controle por Lixeira e Escudo) | 5 | Alta | Sprint 1 |
| **E4** | **Painel Lateral do Personagem (HUD), Rank *Devil May Cry* e Feedback Audiovisual** | **24** | | |
| E4-01 | Exibir painel lateral com retrato reativo do personagem, receita do combo e multiplicador | 3 | Alta | Sprint 1 |
| E4-02 | Atualizar expressão do personagem na lateral ao repetir combo ($1\times$) ou sofrer dano | 3 | Média | |
| E4-03 | Emitir partículas 3D e áudio sintetizado progressivo ao conjurar e atingir inimigos | 3 | Média | |
| E4-04 | Exibir tela de Game Over com resumo da partida e botão de reinício | 3 | Alta | |
| E4-05 | Exibir Rank de Estilo *Devil May Cry* (`D` a `SSS`) com Multiplicador destacado embaixo e Leque Visual | 3 | Alta | Sprint 1 |
| E4-06 | Exibir Menu Inicial antes da partida e Menu de Pausa com Opções na tecla `ESC` durante a gameplay | 3 | Alta | Sprint 1 |
| E4-07 | Implementar Tutorial Interativo Guiado na Arena ao clicar em "Como Jogar" com travamento progressivo de teclas | 3 | Alta | Sprint 1 |
| E4-08 | Exibir Cutscene Inicial Legendada e Pulável em Pixel Art apresentando a história do jogo | 3 | Alta | Sprint 1 |
| **E5** | **Chefões da Poluição e Eventos de Arena** | **13** | | |
| E5-01 | Instanciar Chefão Colosso de Entulho ao final do estágio | 5 | Alta | |
| E5-02 | Exigir combos variados ($M \ge 2.5\times$) para quebrar o escudo do chefão | 3 | Alta | |
| E5-03 | Disparar poças tóxicas do chefão no chão da arena isométrica | 3 | Média | |
| E5-04 | Derrotar chefão e purificar o cenário com bônus de estágio | 2 | Média | |
| **E6** | **Progressão, Recordes e Privacidade (LGPD)** | **9** | | |
| E6-01 | Salvar os 5 maiores recordes localmente com apelido | 3 | Média | |
| E6-02 | Desbloquear insígnias por descobrir todas as 10 combinações de recicláveis | 3 | Baixa | |
| E6-03 | Consultar e limpar meu histórico e recordes salvos (LGPD) | 3 | Baixa | |
| **E7** | **Grimório de Combinações e Educação Ambiental** | **10** | | |
| E7-01 | Exibir relatório de combinações mais usadas e taxa de variedade na partida | 3 | Média | |
| E7-02 | Consultar catálogo interativo das 10 fusões de materiais recicláveis | 3 | Média | |
| E7-03 | Mostrar tempo de decomposição real dos 4 materiais (Plástico, Papel, Vidro, Metal) | 2 | Baixa | |
| E7-04 | Exportar estatísticas agregadas da sessão para apresentação acadêmica | 2 | Baixa | |
| **Total** | **24 Estórias** | **78** | | **Sprint 1 = $20\text{ pts}$** |

* **Status no Project:** As $6\text{ estórias}$ da Sprint 1 (`E1-01`, `E1-02`, `E2-01`, `E3-01`, `E3-02` e `E4-01`) ficam em `Pronto para sprint` (ou `Concluído` conforme avançarmos no código). Todas as outras $18\text{ estórias}$ ficam em `Backlog`.

---

## 2. Issues de Épico

Crie as $7\text{ issues}$ abaixo, cada uma com a label **`épico`**. Os épicos não recebem `Estimativa` nem `Sprint`.

### E1 — Arena Isométrica 2.5D, Movimentação WASD e Mira
**Título:** `E1 - Arena Isométrica 2.5D, Movimentação WASD e Mira`
```markdown
## Objetivo
Construir a arena 3D com câmera isométrica e estética 2.5D (HD-2D inspirada em Until Then), permitindo que o jogador se movimente livremente no WASD com seus 4 orbes em órbita e mire com o mouse.

## Problema que resolve
Para um jogo de ação dinâmico sem esteira, o jogador precisa de liberdade espacial para andar pela arena, manter distância dos inimigos e mirar seus disparos em 360 graus no plano isométrico.

## Perfis envolvidos
Jogador, Visitante

## Regras de negócio
- RN01 — Padrão de 4 cores da coleta seletiva: Vermelho (Plástico), Azul (Papel), Verde (Vidro) e Amarelo (Metal).
- RN02 — Movimentação em 8 direções via WASD em câmera isométrica e mira direcional pelo cursor do Mouse.
- RN07 — Estética 2.5D (HD-2D) inspirada em Until Then: iluminação direcional dramática, sombras no chão em grid, texturas pixel art (NearestFilter) e UnrealBloomPass.
- RN08 — Protagonista acompanhado por 4 orbes elementais em órbita 3D.
- RN12 — Execução direta no navegador via WebGL sem necessidade de instalação ou login.
```

### E2 — Inimigos da Poluição ("Bichos") e IA de Arena
**Título:** `E2 - Inimigos da Poluição ("Bichos") e IA de Arena`
```markdown
## Objetivo
Instanciar inimigos ("bichos" da poluição) nas bordas da arena isométrica que perseguem o protagonista e são combatidos através dos objetos e energias recicladas disparados pelo jogador.

## Problema que resolve
Cria o desafio ativo de posicionamento, mira e combate na arena, exigindo que o jogador se mova com WASD enquanto prepara e dispara seus combos contra alvos em movimento.

## Perfis envolvidos
Jogador

## Regras de negócio
- RN06 — Inimigos surgem na arena isométrica, perseguem o jogador e possuem pontos de vida (HP) reduzidos pelos disparos de combos.
- RN09 — Escalonamento progressivo de ondas de inimigos.
- RN11 — O contato dos inimigos reduz a pureza/integridade ambiental até o encerramento da partida em 0%.
```

### E3 — Combinação de Recicláveis, Objetos/Energias e Multiplicador Decrescente
**Título:** `E3 - Combinação de Recicláveis, Objetos/Energias e Multiplicador Decrescente`
```markdown
## Objetivo
Permitir que o jogador combine as 4 opções de recicláveis (Plástico, Papel, Vidro e Metal) para formar um objeto, conceito ou energia e arremessá-lo com o mouse nos inimigos, aplicando um multiplicador alto para combos variados que diminui progressivamente se o jogador repetir sempre o mesmo combo.

## Problema que resolve
Evita que o jogador vença apertando sempre o mesmo comando ("spam") e transforma a diversidade da reciclagem em uma mecânica tática onde variar as combinações mantém o multiplicador no topo.

## Perfis envolvidos
Jogador

## Regras de negócio
- RN01 — 4 elementos de combinação: Vermelho/Plástico (1/Q), Azul/Papel (2/E), Verde/Vidro (3/R) e Amarelo/Metal (4/F).
- RN03 — A combinação de elementos forma um objeto, conceito ou energia que é lançada na direção da mira do mouse (Clique Esquerdo).
- RN04 — Multiplicador Decrescente por Repetição: começa em 4x para um combo inédito/variado e diminui a cada repetição seguida do mesmo combo (4x -> 2.5x -> 1.5x -> 1x), deixando de multiplicar em 1x.
- RN05 — Executar uma combinação diferente da anterior restaura o multiplicador imediatamente para 4x.
```

### E4 — Painel Lateral do Personagem (HUD) e Feedback Audiovisual
**Título:** `E4 - Painel Lateral do Personagem (HUD) e Feedback Audiovisual`
```markdown
## Objetivo
Exibir o painel lateral esquerdo fixo mostrando o personagem (inspirado na disposição de Capsule, mas com a estética visual de Until Then), a combinação de recicláveis atual, o estado do multiplicador (incluindo alerta de combo repetido em 1x) e a barra inferior de Stage/Score.

## Problema que resolve
Comunica claramente ao jogador qual objeto/energia está formado, qual é o multiplicador atual e quando um combo perdeu força por repetição excessiva.

## Perfis envolvidos
Jogador

## Regras de negócio
- RN04, RN05 — Exibição imediata do multiplicador atual (4x até 1x) e aviso visual quando o combo repetido cai para 1x.
- RN07 — Painel lateral esquerdo com o retrato reativo do protagonista e barra inferior de Stage/Score.
- RN11 — Exibição da tela de Game Over quando a integridade/pureza chega a 0%.
```

### E5 — Chefões da Poluição e Eventos de Arena
**Título:** `E5 - Chefões da Poluição e Eventos de Arena`
```markdown
## Objetivo
Adicionar chefões de final de estágio na arena isométrica que exigem variedade de combinações elementais para serem derrotados.

## Problema que resolve
Amplia a profundidade de combate nas sprints seguintes ao MVP com confrontos contra grandes monstros de entulho.

## Perfis envolvidos
Jogador

## Regras de negócio
- RN06, RN10 — Chefões só sofrem dano total quando atingidos por combos não saturados (multiplicador >= 2.5x).
```

### E6 — Progressão, Recordes e Privacidade (LGPD)
**Título:** `E6 - Progressão, Recordes e Privacidade (LGPD)`
```markdown
## Objetivo
Registrar os maiores placares localmente, conceder conquistas pelas combinações descobertas e garantir controle total ao jogador sobre seus dados locais conforme a LGPD.

## Problema que resolve
Incentiva a rejogabilidade e o domínio de todas as receitas de combinação sem coletar dados pessoais sensíveis.

## Perfis envolvidos
Jogador

## Regras de negócio
- RN12 — Jogo acessível sem cadastro de conta ou senha.
- RN13 — Armazenamento local (localStorage) restrito a apelido curto e estatísticas de partida, com opção de exclusão imediata (LGPD).
```

### E7 — Grimório de Combinações e Educação Ambiental
**Título:** `E7 - Grimório de Combinações e Educação Ambiental`
```markdown
## Objetivo
Apresentar o catálogo das combinações de materiais recicláveis (Plástico, Papel, Vidro e Metal), métricas de variedade da partida e informações educativas sobre reciclagem.

## Problema que resolve
Conecta a mecânica de combinação elemental do jogo ao propósito educativo do projeto de extensão universitária.

## Perfis envolvidos
Jogador, Avaliador / Coordenador

## Regras de negócio
- RN01, RN03 — Catálogo baseado nas 4 cores da coleta seletiva e suas fusões.
- RN13, RN14 — Exibição educativa sem coleta de dados pessoais sensíveis.
```

---

## 3. Issues de Estória (Sub-issues) — Destaque para as 6 Estórias da Sprint 1 (MVP)

Abra cada épico, clique em **Create sub-issue**, cole o título e o corpo e adicione a label **`estória`**.

---

### Épico E1 — Arena Isométrica 2.5D, Movimentação WASD e Mira

#### E1-01 Renderizar arena isométrica 2.5D com estética *Until Then* e iluminação dramática
* **Título:** `E1-01 Renderizar arena isométrica 2.5D com estética Until Then e iluminação dramática`
* **Ficha:** label `estória` · pai `E1` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** visualizar a arena em câmera isométrica com a estética 2.5D (HD-2D) inspirada em *Until Then*, **para** explorar um cenário com iluminação dramática, sombras reais no chão em grid e texturas pixel art crocantes.

**Regras:** RN02, RN07, RN12

### Critérios de aceite
- **Dado** que o jogador abre o jogo no navegador, **quando** a cena Three.js carrega, **então** a arena é exibida em visão isométrica sem esteira, com chão texturizado em grid pixelado (`THREE.NearestFilter`) e bordas delimitadas.
- **Dado** que a cena 3D está ativa, **quando** as luzes direcionais e pontuais iluminam a arena, **então** sombras são projetadas no piso e o pós-processamento (`UnrealBloomPass`) aplica brilho neon aos elementos luminosos.
- **Dado** um usuário no navegador (incluindo Linux/Wayland), **quando** redimensiona a janela, **então** a câmera isométrica e o canvas WebGL se ajustam sem distorção e sem exigir login.

### Tarefas
- [ ] Configurar a cena Three.js com câmera em perspectiva isométrica, WebGLRenderer com sombras e UnrealBloomPass
- [ ] Gerar via código as texturas pixel art crocantes (`THREE.NearestFilter`) do chão em grid e elementos de cenário no estilo *Until Then*
- [ ] Configurar a iluminação direcional dramática, neblina atmosférica e sombras projetadas no piso da arena
- [ ] Garantir responsividade da viewport 3D ao lado do painel lateral esquerdo
```

#### E1-02 Movimentar protagonista no `WASD` com 4 orbes em órbita e mira no Mouse
* **Título:** `E1-02 Movimentar protagonista no WASD com 4 orbes em órbita e mira no Mouse`
* **Ficha:** label `estória` · pai `E1` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** andar livremente pela arena isométrica usando `WASD`, rodeado pelos 4 orbes das cores da reciclagem e mirando com o cursor do mouse, **para** me posicionar estrategicamente e apontar meus ataques contra os inimigos.

**Regras:** RN01, RN02, RN08

### Critérios de aceite
- **Dado** que a partida está ativa, **quando** o jogador pressiona `W`, `A`, `S` ou `D` (incluindo diagonais), **então** o protagonista se desloca suavemente pelo plano $(X, Z)$ respeitando os limites da arena isométrica.
- **Dado** o protagonista na arena, **quando** o loop de animação roda, **então** os 4 orbes elementais (Vermelho/Plástico, Azul/Papel, Verde/Vidro e Amarelo/Metal) orbitam em 3D ao seu redor.
- **Dado** que o jogador move o mouse sobre a arena, **quando** o `Raycaster` intercepta o plano do chão, **então** uma retícula/indicador de mira isométrica mostra exatamente a direção para onde o próximo combo será lançado.

### Tarefas
- [ ] Criar o protagonista 2.5D/3D (estética *Until Then*) com movimentação em 8 direções via `WASD` e limites de colisão da arena
- [ ] Posicionar os 4 orbes elementais emissivos (Vermelho, Azul, Verde e Amarelo) em órbita trigonométrica ($\sin/\cos$) ao redor do personagem
- [ ] Implementar o sistema de mira com `THREE.Raycaster` projetando a retícula e linha direcional no chão da arena conforme a posição do mouse
- [ ] Orientar o protagonista e a órbita de conjuração em direção ao ponto mirado pelo mouse
```

#### E1-03 Adicionar obstáculos 3D na arena que bloqueiam projéteis e inimigos
* **Título:** `E1-03 Adicionar obstáculos 3D na arena que bloqueiam projéteis e inimigos`
* **Ficha:** label `estória` · pai `E1` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** utilizar pilares e lixeiras urbanas 3D na arena como cobertura, **para** bloquear a aproximação direta dos inimigos.

**Regras:** RN02, RN07

### Critérios de aceite
- **Dado** um obstáculo 3D na arena, **quando** o jogador ou inimigo colide com ele, **então** o movimento é bloqueado pela caixa de colisão.
- **Dado** um projétil comum disparado contra um obstáculo sólido, **quando** ocorre o impacto, **então** o projétil se dissipa em partículas.
```

#### E1-04 Alterar atmosfera e iluminação da arena conforme o nível de pureza
* **Título:** `E1-04 Alterar atmosfera e iluminação da arena conforme o nível de pureza`
* **Ficha:** label `estória` · pai `E1` · Estimativa `2` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** que a iluminação da arena fique mais limpa ou mais turva conforme minha pureza ambiental, **para** sentir visualmente o estado do ambiente.

**Regras:** RN07, RN11

### Critérios de aceite
- **Dado** pureza ambiental acima de 80%, **quando** a cena é renderizada, **então** a luz direcional apresenta tons quentes e limpos estilo *Until Then*.
- **Dado** pureza ambiental abaixo de 30%, **quando** o jogador sofre ataques, **então** a neblina fica mais densa e arroxeada.
```

---

### Épico E2 — Inimigos da Poluição ("Bichos") e IA de Arena

#### E2-01 Instanciar inimigos da poluição na arena isométrica que perseguem o jogador
* **Título:** `E2-01 Instanciar inimigos da poluição na arena isométrica que perseguem o jogador`
* **Ficha:** label `estória` · pai `E2` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** que inimigos ("bichos" da poluição) surjam na arena isométrica e avancem em minha direção, **para** que eu precise me movimentar no `WASD`, mirar com o mouse e derrotá-los com meus combos de reciclagem.

**Regras:** RN06, RN11

### Critérios de aceite
- **Dado** que a partida está em andamento, **quando** o temporizador de geração dispara, **então** um inimigo ("bicho" da poluição) é instanciado nas bordas da arena isométrica com barra de vida (HP) visível.
- **Dado** um inimigo ativo na arena, **quando** o loop de atualização roda, **então** ele se move continuamente no plano $(X, Z)$ perseguindo a posição atual do protagonista.
- **Dado** que um inimigo encosta no protagonista, **quando** a colisão é detectada, **então** o jogador sofre redução de 15% na Barra de Pureza/Integridade e o inimigo sofre um recuo.

### Tarefas
- [ ] Construir a geometria/sprite 2.5D dos inimigos ("bichos" da poluição) com barra de HP flutuante
- [ ] Implementar o gerador (*spawner*) que instancia inimigos periodicamente ao redor do perímetro da arena isométrica
- [ ] Programar o vetor de perseguição contínua dos inimigos em direção às coordenadas $(X, Z)$ do protagonista
- [ ] Implementar a colisão inimigo-protagonista (descontando 15% de pureza/integridade) e a destruição do inimigo quando seu HP chega a zero
```

#### E2-02 Causar perda de pureza ambiental quando o inimigo encosta no protagonista
* **Título:** `E2-02 Causar perda de pureza ambiental quando o inimigo encosta no protagonista`
* **Ficha:** label `estória` · pai `E2` · Estimativa `3` · Prioridade `Alta` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** receber invencibilidade curta e feedback visual claro quando um bicho me atinge, **para** conseguir me afastar no `WASD` sem perder toda a barra instantaneamente.

**Regras:** RN06, RN11

### Critérios de aceite
- **Dado** que o protagonista foi atingido por um bicho, **quando** perde 15% de pureza, **então** recebe 1 segundo de invencibilidade com piscar visual.
- **Dado** que a pureza chega a 0% após o ataque de um inimigo, **quando** o dano é processado, **então** a partida encerra em Game Over.
```

#### E2-03 Escalonar velocidade e vida dos inimigos a cada estágio (onda)
* **Título:** `E2-03 Escalonar velocidade e vida dos inimigos a cada estágio (onda)`
* **Ficha:** label `estória` · pai `E2` · Estimativa `2` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** que cada novo Stage traga bichos mais rápidos e resistentes, **para** manter o desafio crescente.

**Regras:** RN09

### Critérios de aceite
- **Dado** que o jogador derrota 10 inimigos e avança para o Stage 2, **quando** novos inimigos surgem, **então** possuem +15% de HP e +8% de velocidade.
- **Dado** o avanço de estágio, **quando** a nova onda começa, **então** o indicador `STAGE` na barra inferior é atualizado.
```

#### E2-04 Instanciar inimigos resistentes a uma cor específica de reciclável
* **Título:** `E2-04 Instanciar inimigos resistentes a uma cor específica de reciclável`
* **Ficha:** label `estória` · pai `E2` · Estimativa `2` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador avançado, **quero** enfrentar bichos com aura de uma cor que exigem elementos opostos para sofrerem dano crítico, **para** aprofundar a estratégia de combinação.

**Regras:** RN01, RN06

### Critérios de aceite
- **Dado** um inimigo blindado em Plástico, **quando** atingido por um combo de Vidro + Metal, **então** recebe dano crítico dobrado.
- **Dado** o mesmo inimigo, **quando** atingido por Plástico puro, **então** sofre apenas 50% do dano.
```

#### E2-06 Expandir arena após 1m30s (Estágio 2) e acumular +1 novo inimigo reciclável por lixeira
* **Título:** `E2-06 Expandir arena após 1m30s (Estágio 2) e acumular +1 novo inimigo reciclável por lixeira`
* **Ficha:** label `estória` · pai `E2` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Concluído`
```markdown
**Como** jogador, **quero** que após 1 minuto e 30 segundos de partida o mapa se expanda suavemente para o Estágio 2 e passe a acumular +1 novo tipo de inimigo reciclável por lixeira CONAMA (totalizando 8 variedades), **para** experimentar uma progressão clara de desafio e maior variedade visual e tática na arena.

**Regras:** RN09, RN16, RN20

### Critérios de aceite
- **Dado** que o jogador está jogando no Estágio 1, **quando** o cronômetro de partida ativa atinge `01:30` (90 segundos), **então** o jogo transita automaticamente para o Estágio 2, expandindo suavemente a praça (chão, muretas, lixeiras de canto, bancos, postes, arbustos, árvores e limites de colisão/mira/spawn) e ajustando a câmera isométrica.
- **Dado** que o Estágio 2 foi ativado, **quando** novos inimigos são instanciados nas bordas da arena expandida, **então** o gerenciador acumula os 4 itens recicláveis do Estágio 1 com +1 novo item por lixeira CONAMA (**Sacola Plástica** em Plástico `Q`, **Jornal Velho** em Papel `E`, **Pote de Vidro** em Vidro `R` e **Lata de Alumínio** em Metal `F`), cada um com sprite pixel art próprio, etiqueta legível e comportamento/atributos distintos.
- **Dado** que o jogador reinicia a partida ou volta ao Menu Inicial, **quando** uma nova partida começa, **então** o cronômetro retorna para `00:00`, a arena volta imediatamente ao tamanho do Estágio 1 e o pool de inimigos reinicia nos 4 itens base.

### Tarefas
- [x] Adicionar cronômetro de partida ativa no loop principal (`PLAYING`) e exibição no HUD com marco de `01:30` para o Estágio 2
- [x] Implementar expansão dinâmica e suave da arena 2.5D (`ArenaScene`) e sincronizar limites de movimento, mira, projéteis e spawn (`PlayerController`, `ComboSystem`, `EnemyManager`)
- [x] Criar sprites 2D pixel art, etiquetas e catálogo dos +4 novos inimigos recicláveis do Estágio 2 (1 por lixeira CONAMA) acumulando com os 4 originais
- [x] Adicionar feedback audiovisual de transição para o Estágio 2 (banner temporário no HUD + fanfarra sintetizada) e atualizar documentação (`RN20` / `E2-06`)
```

---

### Épico E3 — Combinação de Recicláveis, Objetos/Energias e Multiplicador Decrescente

#### E3-01 Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse
* **Título:** `E3-01 Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse`
* **Ficha:** label `estória` · pai `E3` · Estimativa `5` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** combinar as 4 opções de recicláveis (Vermelho/Plástico, Azul/Papel, Verde/Vidro e Amarelo/Metal) pelos botões de elemento para formar um objeto, conceito ou energia e lançá-lo com a mira do mouse contra o bicho, **para** derrotar os inimigos usando o poder da reciclagem.

**Regras:** RN01, RN02, RN03, RN06

### Critérios de aceite
- **Dado** que o jogador está na arena, **quando** aciona duas opções entre os 4 recicláveis (`1/Q` Vermelho/Plástico, `2/E` Azul/Papel, `3/R` Verde/Vidro, `4/F` Amarelo/Metal), **então** os elementos selecionados se fundem formando um objeto/conceito/energia reciclada visível junto ao protagonista (ex.: *Esfera Polimérica*, *Rajada de Origami*, *Lança de Cristal*, *Feixe Prisma*, *Bola de Liga*, etc.).
- **Dado** que um objeto/energia de combo foi formado, **quando** o jogador mira com o mouse e clica com o botão esquerdo (`LMB`), **então** o projétil/energia é disparado na direção mirada em direção aos inimigos.
- **Dado** um projétil/energia em trajetória na arena, **quando** colide com um inimigo ("bicho"), **então** causa dano ao HP do inimigo, emite partículas nas cores combinadas e soma pontos ao placar.

### Tarefas
- [ ] Mapear os botões das 4 opções de recicláveis (`1, 2, 3, 4` e `Q, E, R, F`) para carregar o buffer de combinação de 2 elementos sem conflitar com a movimentação `WASD`
- [ ] Implementar a tabela de receitas que transforma os pares das 4 cores em objetos/conceitos/energias 3D distintos (geometria, cor combinada, velocidade e dano base)
- [ ] Programar o disparo mirado no clique do mouse (`LMB`) lançando o objeto/energia formado ao longo do vetor calculado pelo `Raycaster`
- [ ] Implementar a detecção de colisão entre os objetos/energias disparados e os inimigos ("bichos") na arena
```

#### E3-02 Reduzir o multiplicador ao repetir o mesmo combo até ficar em $1\times$ (*Stale Decay*)
* **Título:** `E3-02 Reduzir o multiplicador ao repetir o mesmo combo até ficar em 1x (Stale Decay)`
* **Ficha:** label `estória` · pai `E3` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** que o multiplicador comece alto em combos novos mas diminua progressivamente caso eu repita sempre o mesmo tipo de combo até cair para $1\times$, **para** que eu seja desafiado a variar minhas combinações de recicláveis em vez de repetir o mesmo comando.

**Regras:** RN03, RN04, RN05

### Critérios de aceite
- **Dado** que o jogador forma e dispara uma combinação de recicláveis diferente da anterior ($R = 0$ repetições), **quando** atinge um inimigo, **então** o ataque aplica o multiplicador máximo inicial de $4.0\times$ sobre os pontos e o dano.
- **Dado** que o jogador começa a repetir o mesmo tipo de combo/comando consecutivamente ($R = 1, 2$), **quando** dispara o mesmo combo de novo, **então** o multiplicador diminui progressivamente ($4.0\times \rightarrow 2.5\times \rightarrow 1.5\times$).
- **Dado** que o jogador insiste em repetir o mesmo combo pela 3ª vez seguida ou mais ($R \ge 3$), **quando** o ataque é executado, **então** o multiplicador trava em $1.0\times$ (não multiplica mais nada) até que ele faça uma combinação diferente.

### Tarefas
- [ ] Implementar o rastreador da última combinação executada (`lastComboId`) e o contador de repetições seguidas ($R$)
- [ ] Implementar a função matemática de decaimento do multiplicador $M(R)$: $4.0\times (R=0) \rightarrow 2.5\times (R=1) \rightarrow 1.5\times (R=2) \rightarrow 1.0\times (R \ge 3)$ (RN04)
- [ ] Restaurar imediatamente o multiplicador para $4.0\times$ quando o jogador executar qualquer receita diferente da anterior (RN05)
- [ ] Multiplicar os pontos ganhos ($\text{round}(100 \times M(R))$) e o dano causado no bicho por $M(R)$, exibindo texto flutuante no impacto
```

#### E3-03 Aplicar efeitos elementais secundários (ricochete, empurrão, lentidão) por receita
* **Título:** `E3-03 Aplicar efeitos elementais secundários (ricochete, empurrão, lentidão) por receita`
* **Ficha:** label `estória` · pai `E3` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** que cada combinação de cores tenha um comportamento físico próprio (como ricochete no Plástico ou empurrão no Metal), **para** escolher o melhor combo para cada situação na arena.

**Regras:** RN01, RN03

### Critérios de aceite
- **Dado** um combo com elemento Metal (`4`), **quando** o objeto atinge o inimigo, **então** aplica força de empurrão (*knockback*).
- **Dado** um combo com Plástico + Plástico (`1+1`), **quando** atinge o primeiro inimigo, **então** ricocheteia para o inimigo mais próximo.
```

#### E3-04 Conceder bônus de Maestria Elemental ao alternar 4 combos inéditos seguidos
* **Título:** `E3-04 Conceder bônus de Maestria Elemental ao alternar 4 combos inéditos seguidos`
* **Ficha:** label `estória` · pai `E3` · Estimativa `2` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador habilidoso, **quero** ganhar um pulso de purificação em área ao acertar 4 receitas diferentes em sequência sem repetir nenhuma, **para** premiar o domínio completo das 4 cores.

**Regras:** RN04, RN05

### Critérios de aceite
- **Dado** que o jogador executou 4 combos distintos seguidos mantendo $M = 4.0\times$, **quando** o 4º acerto ocorre, **então** recupera +10% de pureza ambiental.
- **Dado** que o jogador repete um combo antes de completar 4 distintos, **quando** a repetição ocorre, **então** a contagem de maestria reinicia.
```

---

### Épico E4 — Painel Lateral do Personagem (HUD) e Feedback Audiovisual

#### E4-01 Exibir painel lateral com retrato reativo do personagem, receita do combo e multiplicador
* **Título:** `E4-01 Exibir painel lateral com retrato reativo do personagem, receita do combo e multiplicador`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Pronto para sprint`
```markdown
**Como** jogador, **quero** ver na lateral esquerda o personagem reativo junto com o visor do objeto/combo formado, o multiplicador atual e a barra inferior de Stage/Score, **para** acompanhar meu estado de combate sem poluir o centro da arena isométrica.

**Regras:** RN04, RN05, RN07

### Critérios de aceite
- **Dado** que a partida está aberta, **quando** a interface é renderizada, **então** exibe o painel lateral esquerdo fixo (inspirado na disposição de *Capsule*, com arte no estilo *Until Then*) contendo o personagem, os slots dos elementos combinados, o nome do objeto/energia formado e o multiplicador atual, além da barra inferior com `STAGE` e `SCORE`.
- **Dado** que o jogador repete o mesmo combo e o multiplicador cai ($4.0\times \rightarrow 2.5\times \rightarrow 1.5\times \rightarrow 1.0\times$), **quando** o valor muda, **então** o visor lateral atualiza imediatamente o número do multiplicador e destaca o alerta de desgaste em $1.0\times$.

### Tarefas
- [ ] Estruturar o layout com painel lateral esquerdo fixo para o personagem e barra inferior de `STAGE` / `SCORE`
- [ ] Desenhar via código (Canvas pixel art) o retrato reativo do protagonista no estilo *Until Then*
- [ ] Exibir no painel lateral os 2 slots da combinação ativa, o nome do Objeto/Energia formado e o visor de Multiplicador ($4.0\times$ até $1.0\times$)
- [ ] Exibir a Barra de Pureza/Integridade Ambiental e atualizar todos os contadores em tempo real
```

#### E4-02 Atualizar expressão do personagem na lateral ao repetir combo ($1\times$) ou sofrer dano
* **Título:** `E4-02 Atualizar expressão do personagem na lateral ao repetir combo (1x) ou sofrer dano`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** que o retrato lateral do protagonista mude de expressão quando está com multiplicador máximo ($4\times$), quando o combo desgasta para $1\times$ ou quando leva dano de um bicho, **para** dar feedback visual imediato.

**Regras:** RN04, RN07

### Critérios de aceite
- **Dado** que o multiplicador está em $4.0\times$, **quando** o jogador varia seus combos, **então** o personagem exibe expressão confiante e energizada.
- **Dado** que o jogador repete o mesmo combo até $1.0\times$ ou sofre impacto de um inimigo, **então** o retrato exibe expressão de fadiga/alerta.
```

#### E4-03 Emitir partículas 3D e áudio sintetizado progressivo ao conjurar e atingir inimigos
* **Título:** `E4-03 Emitir partículas 3D e áudio sintetizado progressivo ao conjurar e atingir inimigos`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** ouvir sons sintetizados distintos ao selecionar cada cor, disparar e acertar os bichos, **para** sentir o peso e a potência do multiplicador atual.

**Regras:** RN01, RN04

### Critérios de aceite
- **Dado** um disparo com multiplicador $4.0\times$, **quando** atinge o inimigo, **então** o sintetizador Web Audio API toca um acorde brilhante e dezenas de partículas 3D se espalham.
- **Dado** um disparo desgastado em $1.0\times$, **quando** é lançado, **então** emite um som mais opaco indicando que o combo precisa ser variado.
```

#### E4-04 Exibir tela de Game Over com resumo da partida e botão de reinício
* **Título:** `E4-04 Exibir tela de Game Over com resumo da partida e botão de reinício`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Alta` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** ver minha pontuação final e total de inimigos purificados quando minha barra chegar a 0%, **para** reiniciar a partida imediatamente.

**Regras:** RN11

### Critérios de aceite
- **Dado** que a pureza chegou a 0%, **quando** a partida encerra, **então** exibe o modal de Fim de Partida com Pontuação Final, Inimigos Derrotados e botão "Jogar Novamente".
- **Dado** o modal aberto, **quando** o jogador clica em "Jogar Novamente", **então** a arena é limpa, os status voltam ao estado inicial e uma nova partida começa.
```

#### E4-06 Exibir Menu Inicial antes da partida e Menu de Pausa com Opções na tecla `ESC` durante a gameplay
* **Título:** `E4-06 Exibir Menu Inicial antes da partida e Menu de Pausa com Opções na tecla ESC durante a gameplay`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Concluído`
```markdown
**Como** jogador, **quero** visualizar um Menu Inicial com fundo ilustrado em Pixel Art do Parque Ecológico e o protagonista em primeiro plano à esquerda (composição inspirada na tela título de *Dead Cells*) antes da partida começar e poder pressionar a tecla `ESC` no meio da gameplay para pausar e abrir o Menu de Opções, **para** ter uma tela título épica em pixel art e configurar som, volume, ritmo da arena e efeitos visuais a qualquer momento.

**Regras:** RN07, RN12, RN19

### Critérios de aceite
- **Dado** que o jogador abre o jogo no navegador, **quando** a aplicação carrega, **então** exibe o Menu Inicial com uma ilustração panorâmica em Pixel Art inspirada em *Dead Cells* ao fundo (em vez do início da gameplay), trazendo o protagonista do jogo em primeiro plano à esquerda canalizando a esfera de energia de reciclagem com as 4 estrelas CONAMA e observando o parque ecológico em pixel art ao fundo.
- **Dado** que o jogador está no meio da gameplay ativa, **quando** pressiona a tecla `ESC` (ou clica no botão `⚙ MENU [ESC]`), **então** a partida é pausada imediatamente e o Menu de Pausa com Opções é exibido de forma translúcida permitindo ver a arena ao fundo.
- **Dado** que o Menu de Opções está aberto, **quando** o jogador altera Áudio Sintetizado (Ligado/Desligado), Volume do Som (0% a 100%), Ritmo da Arena (Calmo, Normal, Intenso), Brilho Neon Bloom 3D ou Textos Flutuantes de Dano, **então** as configurações são aplicadas em tempo real e salvas localmente (`localStorage`), podendo continuar a partida (`ESC`), reiniciar ou voltar ao Menu Inicial.

### Tarefas
- [x] Implementar máquina de estados de fluxo do jogo (`MENU`, `PLAYING`, `PAUSED`, `GAMEOVER`)
- [x] Criar ilustração Pixel Art do Menu Inicial inspirada em *Dead Cells* (protagonista em primeiro plano à esquerda + parque ecológico em pixel art ao fundo)
- [x] Aplicar a ilustração Pixel Art como fundo do Menu Inicial (substituindo o fundo de início da gameplay)
- [x] Criar animação por frames em Pixel Art para o fundo do Menu Inicial (vento no cabelo/roupa do protagonista, folhas das árvores se mexendo, pássaros batendo asa, pulso da esfera e reflexo na água)
- [x] Implementar o Menu de Pausa e Opções acionado pela tecla `ESC` durante a gameplay com controles em tempo real e persistência em `localStorage`
```

#### E4-07 Implementar Tutorial Interativo Guiado na Arena ao clicar em "Como Jogar" com travamento progressivo de teclas
* **Título:** `E4-07 Implementar Tutorial Interativo Guiado na Arena ao clicar em 'Como Jogar' com travamento progressivo de teclas`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Concluído`
```markdown
**Como** jogador iniciante, **quero** clicar em **Como Jogar** no Menu Inicial para entrar diretamente em um tutorial rápido e interativo na arena 2.5D (máximo ~2 minutos) que destaca as teclas permitidas em cada etapa e bloqueia as demais até eu completar a ação, **para** aprender na prática a movimentação, mira, lixeiras CONAMA, leque Hwei e combos antes de jogar.

**Regras:** RN01, RN02, RN16, RN17, RN18, RN19, RN21

### Critérios de aceite
- **Dado** que o jogador está no Menu Inicial, **quando** clica no botão `📖 COMO JOGAR`, **então** o jogo carrega diretamente a arena 2.5D em modo Tutorial Interativo (sem inimigos aleatórios e sem risco de Game Over).
- **Dado** que o jogador está em uma etapa do tutorial, **quando** pressiona qualquer tecla não liberada naquela etapa, **então** o comando é bloqueado e um destaque visual/sonoro indica qual tecla deve ser utilizada.
- **Dado** que o jogador conclui as 6 etapas guiadas (`WASD`, abrir Lixeira `Q` Plástico, disparar `Q` Mais Dano na PET, Controle de Grupo `E`→`E` Papel, Escudo Seletivo `F`→`R` Metal e prática final livre), **então** o tutorial conclui em no máximo ~2 minutos exibindo resumo e botões para jogar ou voltar ao menu.
- **Dado** que o jogador deseja sair antes do fim, **quando** pressiona `ESC` ou clica em `✖ SAIR [ESC]`, **então** retorna ao Menu Inicial com os controles liberados.

### Tarefas
- [x] Criar controlador de estado e roteiro do Tutorial Interativo (`src/game/tutorialManager.js`) com 6 etapas curtas (~2 min total)
- [x] Implementar filtro de travamento de teclas (`setInputGate`) em `PlayerController`, `ComboSystem` e `main.js` para liberar apenas as teclas da etapa atual
- [x] Adicionar spawning didático/controlado de inimigos recicláveis (`spawnTutorialEnemy`) no `EnemyManager` durante o modo tutorial
- [x] Criar HUD guiado de instruções do tutorial com teclas destacadas, barra de progresso das etapas e tela de conclusão
- [x] Conectar o botão `📖 COMO JOGAR` do Menu Inicial ao modo Tutorial Interativo na arena
```

#### E4-08 Exibir Cutscene Inicial Legendada e Pulável em Pixel Art apresentando a história do jogo
* **Título:** `E4-08 Exibir Cutscene Inicial Legendada e Pulável em Pixel Art apresentando a história do jogo`
* **Ficha:** label `estória` · pai `E4` · Estimativa `3` · Prioridade `Alta` · Sprint `Sprint 1` · Status `Concluído`
```markdown
**Como** jogador, **quero** assistir a uma cutscene inicial legendada em Pixel Art (com opção de pular a qualquer momento) apresentando a história do EcoCombo — humanos piorando o descarte incorreto nas ruas e lixeiras erradas, esses itens ganhando vida e o protagonista sendo a única pessoa no mundo com poderes para combatê-los —, **para** mergulhar na narrativa antes da minha primeira partida e poder revê-la quando quiser.

**Regras:** RN07, RN12, RN19, RN22

### Critérios de aceite
- **Dado** que o jogador clica em `▶ JOGAR AGORA` pela primeira vez (ainda não visto no `localStorage`), **quando** a partida é iniciada, **então** a cutscene inicial em Pixel Art é reproduzida automaticamente antes da gameplay e inicia a partida ao término.
- **Dado** que a cutscene está em exibição, **quando** as 4 cenas avançam, **então** cada cena apresenta ilustração em Pixel Art consistente com o jogo (efeito Ken Burns + partículas), legendas em português animadas estilo máquina de escrever e áudio sintetizado via Web Audio API.
- **Dado** que o jogador já assistiu à cutscene anteriormente, **quando** clica em `▶ JOGAR AGORA`, **então** vai direto para a arena, mantendo o botão `🎬 HISTÓRIA` no Menu Inicial para rever quando desejar.
- **Dado** que o jogador está assistindo à cutscene, **quando** pressiona `ESC` ou clica em `⏭ PULAR CUTSCENE [ESC]`, **então** a cutscene encerra imediatamente e segue para o destino esperado.

### Tarefas
- [x] Produzir cenas panorâmicas (16:9) em Pixel Art consistentes com o protagonista e a tela título (`public/cutscene/scene-1.jpg`, `scene-2.jpg` + composição animada com as 4 estrelas CONAMA)
- [x] Criar controlador da Cutscene Inicial (`src/ui/cutscenePlayer.js`) com 4 capítulos, efeito Ken Burns, canvas atmosférico, legendas typewriter, avanço (`ESPAÇO`/`ENTER`/clique) e pular (`ESC`/botão)
- [x] Adicionar sons sintetizados de narrativa/transição de cena na `SoundEngine` (Web Audio API)
- [x] Integrar a cutscene na máquina de estados (`CUTSCENE`) com exibição automática na 1ª vez em `Jogar Agora` (`localStorage`) e botão `🎬 HISTÓRIA` no Menu Inicial
```

---

### Épico E5 — Chefões da Poluição e Eventos de Arena

#### E5-01 Instanciar Chefão Colosso de Entulho ao final do estágio
* **Título:** `E5-01 Instanciar Chefão Colosso de Entulho ao final do estágio`
* **Ficha:** label `estória` · pai `E5` · Estimativa `5` · Prioridade `Alta` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** enfrentar um Chefão gigante na arena isométrica a cada 3 ondas, **para** testar minha habilidade de movimentação e mira.

**Regras:** RN10

### Critérios de aceite
- **Dado** que o jogador concluiu o Stage 3, **quando** o evento de chefão inicia, **então** o Colosso de Entulho surge na arena com barra de HP destacada.
- **Dado** o chefão ativo, **quando** se move pela arena, **então** persegue o jogador com ataques de alcance médio.
```

#### E5-02 Exigir combos variados ($M \ge 2.5\times$) para quebrar o escudo do chefão
* **Título:** `E5-02 Exigir combos variados (M >= 2.5x) para quebrar o escudo do chefão`
* **Ficha:** label `estória` · pai `E5` · Estimativa `3` · Prioridade `Alta` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** que o escudo do chefão bloqueie ataques repetidos em $1.0\times$, **para** que só seja possível vencê-lo alternando as combinações das 4 cores.

**Regras:** RN04, RN10

### Critérios de aceite
- **Dado** o chefão com escudo ativo, **quando** atingido por um combo com multiplicador $\ge 2.5\times$, **então** o escudo sofre dano total.
- **Dado** o chefão com escudo ativo, **quando** atingido por um combo repetido em $1.0\times$, **então** o dano é reduzido em 80% com aviso "VARIE O COMBO!".
```

#### E5-03 Disparar poças tóxicas do chefão no chão da arena isométrica
* **Título:** `E5-03 Disparar poças tóxicas do chefão no chão da arena isométrica`
* **Ficha:** label `estória` · pai `E5` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** desviar no `WASD` de zonas tóxicas lançadas pelo chefão no chão da arena, **para** tornar o posicionamento isométrico ainda mais importante.

**Regras:** RN02, RN10

### Critérios de aceite
- **Dado** o chefão em combate, **quando** lança um ataque de área, **então** um círculo de aviso aparece no chão antes da poça tóxica surgir.
- **Dado** uma poça ativa, **quando** o jogador pisa nela, **então** sofre lentidão e perda gradual de pureza.
```

#### E5-04 Derrotar chefão e purificar o cenário com bônus de estágio
* **Título:** `E5-04 Derrotar chefão e purificar o cenário com bônus de estágio`
* **Ficha:** label `estória` · pai `E5` · Estimativa `2` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** receber um grande bônus de pontos e restaurar minha pureza ao derrotar o chefão, **para** celebrar a vitória da fase.

**Regras:** RN10

### Critérios de aceite
- **Dado** o chefão com HP chegando a zero, **quando** recebe o golpe final, **então** explode em partículas limpas e concede +3.000 pontos.
- **Dado** a derrota do chefão, **quando** o próximo estágio começa, **então** a pureza ambiental é restaurada em +50%.
```

---

### Épico E6 — Progressão, Recordes e Privacidade (LGPD)

#### E6-01 Salvar os 5 maiores recordes localmente com apelido
* **Título:** `E6-01 Salvar os 5 maiores recordes localmente com apelido`
* **Ficha:** label `estória` · pai `E6` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** registrar meu apelido curto quando bato um recorde na partida, **para** ver minha pontuação salva no Top 5 do navegador.

**Regras:** RN13

### Critérios de aceite
- **Dado** uma partida encerrada com pontuação entre as 5 maiores, **quando** o jogador informa um apelido de 3 a 12 caracteres, **então** o recorde é salvo no `localStorage`.
- **Dado** a tabela de recordes aberta, **quando** exibida na tela, **então** lista os 5 maiores placares em ordem decrescente.
```

#### E6-02 Desbloquear insígnias por descobrir todas as 10 combinações de recicláveis
* **Título:** `E6-02 Desbloquear insígnias por descobrir todas as 10 combinações de recicláveis`
* **Ficha:** label `estória` · pai `E6` · Estimativa `3` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador explorador, **quero** desbloquear uma conquista ao utilizar todas as 10 receitas únicas de recicláveis em uma mesma partida, **para** ser recompensado por experimentar todas as fusões.

**Regras:** RN03, RN04

### Critérios de aceite
- **Dado** que existem 10 combinações únicas de pares entre as 4 cores, **quando** o jogador dispara a 10ª receita distinta na partida, **então** desbloqueia a medalha "Alquimista da Reciclagem".
- **Dado** a medalha desbloqueada, **quando** exibida no painel, **então** concede +1.000 pontos extras.
```

#### E6-03 Consultar e limpar meu histórico e recordes salvos (LGPD)
* **Título:** `E6-03 Consultar e limpar meu histórico e recordes salvos (LGPD)`
* **Ficha:** label `estória` · pai `E6` · Estimativa `3` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** visualizar quais dados o jogo guarda no navegador e apagá-los quando quiser, **para** ter controle sobre minha privacidade conforme a LGPD.

**Regras:** RN13

### Critérios de aceite
- **Dado** o modal "Meus Dados (LGPD)", **quando** aberto pelo jogador, **então** exibe os dados locais salvos e informa que nenhuma informação é enviada a servidores externos.
- **Dado** o clique em "Apagar dados locais", **quando** confirmado, **então** o `localStorage` é limpo imediatamente.
```

---

### Épico E7 — Grimório de Combinações e Educação Ambiental

#### E7-01 Exibir relatório de combinações mais usadas e taxa de variedade na partida
* **Título:** `E7-01 Exibir relatório de combinações mais usadas e taxa de variedade na partida`
* **Ficha:** label `estória` · pai `E7` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador ou avaliador, **quero** ver ao final da partida quais elementos e receitas usei mais e qual foi meu multiplicador médio, **para** avaliar minha variedade de jogo.

**Regras:** RN01, RN04

### Critérios de aceite
- **Dado** o encerramento da partida, **quando** o relatório é exibido, **então** mostra o percentual de uso de Plástico, Papel, Vidro e Metal e a média do multiplicador obtida.
- **Dado** uma partida sem repetições em $1.0\times$, **quando** o relatório abre, **então** destaca "100% de Eficiência de Variedade".
```

#### E7-02 Consultar catálogo interativo das 10 fusões de materiais recicláveis
* **Título:** `E7-02 Consultar catálogo interativo das 10 fusões de materiais recicláveis`
* **Ficha:** label `estória` · pai `E7` · Estimativa `3` · Prioridade `Média` · Sprint `—` · Status `Backlog`
```markdown
**Como** visitante ou jogador, **quero** consultar a lista das 10 combinações possíveis entre Plástico, Papel, Vidro e Metal, **para** conhecer os objetos/energias que cada par forma antes de entrar em combate.

**Regras:** RN01, RN03, RN14

### Critérios de aceite
- **Dado** o jogador que abre o "Grimório de Combos", **quando** seleciona duas cores das lixeiras CONAMA, **então** vê o nome do objeto/energia resultante, seu efeito contra os bichos e exemplos reais daquele material.
- **Dado** o grimório aberto, **quando** fecha a janela, **então** retorna imediatamente à arena isométrica.
```

#### E7-03 Mostrar tempo de decomposição real dos 4 materiais (Plástico, Papel, Vidro, Metal)
* **Título:** `E7-03 Mostrar tempo de decomposição real dos 4 materiais (Plástico, Papel, Vidro, Metal)`
* **Ficha:** label `estória` · pai `E7` · Estimativa `2` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** jogador, **quero** visualizar fatos educativos sobre o tempo de decomposição do Plástico, Papel, Vidro e Metal, **para** conectar os poderes do jogo à conscientização ambiental.

**Regras:** RN14

### Critérios de aceite
- **Dado** a tela de resumo ou guia educativo, **quando** exibida ao jogador, **então** informa o tempo estimado de decomposição de cada um dos 4 materiais na natureza.
- **Dado** cada material listado, **quando** consultado, **então** exibe dicas práticas de descarte seletivo correto.
```

#### E7-04 Exportar estatísticas agregadas da sessão para apresentação acadêmica
* **Título:** `E7-04 Exportar estatísticas agregadas da sessão para apresentação acadêmica`
* **Ficha:** label `estória` · pai `E7` · Estimativa `2` · Prioridade `Baixa` · Sprint `—` · Status `Backlog`
```markdown
**Como** aluno apresentando o projeto de extensão, **quero** visualizar o total acumulado de partidas, combos e inimigos purificados na sessão, **para** demonstrar os resultados à banca/professor.

**Regras:** RN13, RN14

### Critérios de aceite
- **Dado** várias partidas realizadas na sessão, **quando** o painel de estatísticas é aberto, **então** exibe os totais agregados sem expor dados pessoais (LGPD).
- **Dado** o painel aberto, **quando** o apresentador clica em "Copiar Resumo", **então** gera um texto formatado em Markdown com os indicadores da sessão.
```

---

## 4. Comentário de Divisão de Estória (INVEST)

Abra a issue **E3-01** no GitHub e cole o texto abaixo como comentário. Ele cumpre exatamente o requisito obrigatório da avaliação (*"pelo menos 1 estória dividida, com o padrão explicado em comentário"*):

```markdown
## Divisão de estória (Aplicação do INVEST)

**Estória original:** "Como jogador, quero andar pela arena isométrica combinando as 4 cores de recicláveis para formar objetos com efeitos especiais, atirar com o mouse nos inimigos e chefões e ter um multiplicador que diminui quando repito o mesmo combo."

**Problema:** A estória original era grande demais para caber em uma única sprint de 1 semana, pois misturava a síntese e disparo base de combos, a regra matemática de decaimento do multiplicador por repetição (*Stale Decay*), efeitos físicos secundários avançados e a luta contra chefões. Falhava diretamente no **S** (*Small* / Pequena) e no **E** (*Estimable* / Estimável) do acrônimo **INVEST**, além de criar alta acoplagem (**I** - *Independent*).

**Padrão de divisão usado:** Divisão por **fluxo principal de combate vs. regras matemáticas e variações de complexidade incremental**.

**Resultado da divisão:**
- **E3-01 — Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse (5 pts):** Entrega a mecânica central de combinar os elementos e arremessar o projétil mirado no bicho → *entra na Sprint 1 (MVP)*.
- **E3-02 — Reduzir o multiplicador ao repetir o mesmo combo até ficar em 1x (3 pts):** Isola a regra matemática do multiplicador decrescente por repetição ($4.0\times \rightarrow 2.5\times \rightarrow 1.5\times \rightarrow 1.0\times$) → *entra na Sprint 1 (MVP)*.
- **E3-03 — Aplicar efeitos elementais secundários por receita (3 pts):** Isola comportamentos físicos extras para evolução incremental → *fica no Backlog para a Sprint 2*.
- **E5-01 e E5-02 — Chefão Colosso de Entulho com escudo sensível ao multiplicador (8 pts somados):** Isolam o confronto contra chefões após o loop de combate contra inimigos comuns já estar validado → *ficam no Backlog*.

Cada estória resultante entrega valor testável de forma independente e garante uma fatia vertical 100% jogável já na Sprint 1.
```

---

## 5. README do Project

No GitHub Project, clique em **Settings** (canto superior direito) e, no campo **README**, cole o texto abaixo:

```markdown
# Backlog — EcoCombo 3D: Jogo Web Isométrico 2.5D de Combos de Reciclagem

## Meta da Sprint 1
Permitir que o jogador se movimente livremente no `WASD` em uma arena isométrica 2.5D (estética *Until Then*), combine as 4 opções de cores da coleta seletiva para formar objetos/energias, mire e dispare com o Mouse contra os inimigos ("bichos" da poluição) e vivencie a regra do multiplicador que começa alto ($4\times$) mas diminui até $1\times$ caso repita sempre o mesmo combo, acompanhando tudo pelo painel lateral do personagem.

## Capacidade assumida
20 pontos (sprint de 1 semana).

| Estória | Pontos |
|---|---|
| E1-01 Renderizar arena isométrica 2.5D com estética Until Then e iluminação dramática | 3 |
| E1-02 Movimentar protagonista no WASD com 4 orbes em órbita e mira no Mouse | 3 |
| E2-01 Instanciar inimigos da poluição na arena isométrica que perseguem o jogador | 3 |
| E3-01 Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse | 5 |
| E3-02 Reduzir o multiplicador ao repetir o mesmo combo até ficar em 1x (Stale Decay) | 3 |
| E4-01 Exibir painel lateral com retrato reativo do personagem, receita do combo e multiplicador | 3 |
| **Total** | **20** |

## Justificativa do MVP
A Sprint 1 entrega uma fatia vertical 100% jogável (Core Gameplay Loop completo):
1. O cenário isométrico 2.5D carrega no navegador com iluminação dramática, sombras no chão em grid, texturas pixel art (`NearestFilter`) e brilho neon (`UnrealBloomPass`) inspirados em *Until Then* (`E1-01`);
2. O jogador anda no `WASD` com os 4 orbes das cores da reciclagem orbitando o personagem e mira com o cursor do mouse (`E1-02`);
3. Inimigos ("bichos" da poluição) surgem na arena e perseguem o protagonista (`E2-01`);
4. O jogador combina as 4 cores de recicláveis para sintetizar um objeto/conceito/energia e o arremessa com o clique do mouse nos inimigos (`E3-01`);
5. O multiplicador recompensa combos variados ($4\times$) e penaliza a repetição do mesmo comando caindo até $1\times$ (`E3-02`), tudo exibido em tempo real no painel lateral do personagem inspirado na disposição de *Capsule* (`E4-01`).

Ficaram planejados no Backlog para as próximas sprints:
- **E5 (Chefões da Poluição e Eventos de Arena)**, que expandem o combate básico já entregue pela `E2-01`;
- **E6 (Ranking local Top 5, insígnias e painel LGPD)** e **E7 (Grimório de Combinações e Relatórios Ambientais)**.

## Épicos
O produto foi estruturado em 7 épicos (E1 a E7) cobrindo arena isométrica/movimentação, inimigos da poluição, sistema de combinação elemental com multiplicador decrescente, painel lateral HUD/áudio, chefões, recordes/LGPD e educação ambiental.

## Uso de IA
Utilizamos Inteligência Artificial generativa como copiloto tanto na engenharia ágil quanto na arquitetura técnica:
1. **Gestão Ágil:** Apoio no refinamento dos 7 épicos e 24 estórias de usuário, aplicação do modelo INVEST na divisão da estória `E3-01` e escrita dos critérios de aceite em Gherkin (*Dado / Quando / Então*).
2. **Desenvolvimento Web 3D:** Geração assistida da arquitetura em Vite + Vanilla JS + Three.js (câmera isométrica, iluminação 2.5D estilo *Until Then*, texturas procedurais em Canvas pixelado e sintetizador Web Audio API).
```

---

## 6. Visualizações do Project (Obrigatórias no Checklist)

### Quadro `"Sprint 1"`
1. No GitHub Project, clique em **+ New view** $\rightarrow$ escolha o layout **Board**.
2. Renomeie a visualização para `Sprint 1`.
3. Em **Group by** (*Column field*), escolha `Status`.
4. Na barra de filtro superior, digite: `sprint:"Sprint 1"` (use o nome exato da sua iteração).
5. Clique em **Save**.

### Tabela `"Backlog por épico"`
1. Clique em **+ New view** $\rightarrow$ escolha o layout **Table**.
2. Renomeie a visualização para `Backlog por épico`.
3. Em **Fields**, deixe visíveis: `Title`, `Estimativa`, `Prioridade`, `Sprint` e `Parent issue`.
4. Em **Group by**, escolha `Parent issue`.
5. Na barra de filtro superior, digite: `label:estória` para exibir apenas as estórias agrupadas dentro de seus respectivos épicos.
6. Clique em **Save**.
