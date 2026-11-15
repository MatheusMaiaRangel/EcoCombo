# EcoCombo 3D — MVP Sprint 1

Jogo web *action-arcade* isométrico em 2.5D/3D sobre reciclagem e coleta seletiva (padrão CONAMA), desenvolvido com **Vite + Vanilla JavaScript + Three.js + Web Audio API** (100% procedural via código).

## Escopo do MVP (Sprint 1 — 20 Pontos)

| ID | Estória de Usuário | Pontos |
| :--- | :--- | :---: |
| **E1-01** | Renderizar arena isométrica 2.5D com estética *Until Then* e iluminação dramática | 3 |
| **E1-02** | Movimentar protagonista no `WASD` com 4 orbes em órbita e mira no Mouse | 3 |
| **E2-01** | Instanciar inimigos da poluição na arena isométrica que perseguem o jogador | 3 |
| **E3-01** | Combinar as 4 cores de recicláveis para formar um objeto/energia e disparar com o Mouse | 5 |
| **E3-02** | Reduzir o multiplicador ao repetir o mesmo combo até ficar em `1x` (*Stale Decay*) | 3 |
| **E4-01** | Exibir painel lateral com retrato reativo do personagem, receita do combo e multiplicador | 3 |

## Controles

- **`W`, `A`, `S`, `D` (ou Setas):** Movimentação livre em 8 direções pela arena isométrica.
- **`1`/`Q` (Vermelho — Plástico), `2`/`E` (Azul — Papel), `3`/`R` (Verde — Vidro), `4`/`F` (Amarelo — Metal):** Canaliza 2 elementos para sintetizar um dos 10 Objetos/Energias recicladas.
- **`Mouse + Clique Esquerdo (LMB)`:** Mira no plano 3D da arena (`THREE.Raycaster`) e dispara o combo formado contra os "bichos" da poluição.

## Como Executar Localmente

```bash
npm install
npm run dev
```

Para gerar o bundle de produção:

```bash
npm run build
```
