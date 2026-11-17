# EcoCombo 3D

Jogo web *action-arcade* isométrico em 2.5D/3D sobre reciclagem e coleta seletiva (padrão CONAMA), desenvolvido com **Vite + Vanilla JavaScript + Three.js + Web Audio API** (100% procedural via código).

## Mecânicas e Controles (Grimório *Hwei* + Ranks *Devil May Cry*)

- **Movimentação (`W`, `A`, `S`, `D` ou Setas) e Mira (`Mouse`):** Deslocamento livre em 8 direções pela arena isométrica 2.5D com mira projetada no chão via `THREE.Raycaster`.
- **1º Toque — Abrir a Lixeira do Item (`Q`, `E`, `R`, `F` ou `1`, `2`, `3`, `4`):**
  - **`Q` (`1`) — Lixeira Vermelha (Plástico):** Ideal contra **Garrafa PET**
  - **`E` (`2`) — Lixeira Azul (Papel / Papelão):** Ideal contra **Caixa de Papelão**
  - **`R` (`3`) — Lixeira Verde (Vidro):** Ideal contra **Garrafa de Vidro**
  - **`F` (`4`) — Lixeira Amarela (Metal):** Ideal contra **Porca de Metal**
- **2º Toque — Escolher o Modo Tático no Leque Aberto:**
  - **`Q` (`1`) — Mais Dano:** Disparo concentrado de alto dano (exige a lixeira correta do item atingido para dano máximo e ganho de estilo).
  - **`E` (`2`) — Controle de Grupo Exclusivo da Lixeira:**
    - *Plástico (`Q` → `E`):* **Separar** (onda elástica que afasta os itens)
    - *Papel (`E` → `E`):* **Juntar** (vórtice de origami que agrupa os itens no centro)
    - *Vidro (`R` → `E`):* **Lentidão + Frágil** (desacelera em 70% e aumenta em +35% o dano recebido)
    - *Metal (`F` → `E`):* **Estunar** (paralisa os itens no lugar por 2.8s)
  - **`R` (`3`) — Escudo Protetivo Seletivo:** Ativa uma redoma da cor da lixeira ao redor do protagonista que bloqueia 100% do dano de aproximação do item correspondente, repelindo-o e subindo o Rank.
  - **`F` (`4`) ou Clique Direito (`RMB`):** Fecha o leque atual para trocar de lixeira.
- **Rank de Estilo *Devil May Cry* (`D`, `C`, `B`, `A`, `S`, `SS`, `SSS`):** Exibe o Rank no topo e o **Multiplicador (`1.0x` a `6.0x`) em destaque logo embaixo**, recompensando acertos na lixeira certa e combinação de modos táticos.

## Como Executar Localmente

```bash
npm install
npm run dev
```

Para gerar o bundle de produção:

```bash
npm run build
```
