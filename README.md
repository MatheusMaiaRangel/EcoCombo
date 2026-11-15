# EcoCombo 3D

Jogo web *action-arcade* isométrico em 2.5D/3D sobre reciclagem e coleta seletiva (padrão CONAMA), desenvolvido com **Vite + Vanilla JavaScript + Three.js + Web Audio API** (100% procedural via código).

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
