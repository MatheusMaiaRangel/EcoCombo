---
trigger: always_on
description: Sincroniza automaticamente qualquer feature nova, concluída ou cancelada com as Issues e o GitHub Projects do repositório MatheusMaiaRangel/EcoCombo.
---

# Sincronização Automática com GitHub Projects (`MatheusMaiaRangel/EcoCombo`)

Esta regra é **sempre ativa** neste workspace:

1. **Ao adicionar uma feature nova:**
   - Crie (ou atualize) a Issue correspondente em `MatheusMaiaRangel/EcoCombo` com a label `estória`, estrutura *Como / Quero / Para* e critérios Gherkin (*Dado / Quando / Então*), vinculada como sub-issue do seu Épico pai (`E1` a `E7`).
   - Adicione a Issue ao GitHub Project `"EcoCombo 3D — Backlog & Sprints"` e preencha os campos `Status`, `Estimativa`, `Prioridade` e `Sprint`.
2. **Ao iniciar ou concluir uma feature do backlog:**
   - Marque os checkboxes (`- [x]`) das tarefas concluídas na Issue e mova o `Status` no GitHub Project para `Em andamento` ou `Concluído`.
3. **Ao cancelar ou remover uma feature:**
   - Comente o motivo na Issue, feche-a como `not planned` (`gh issue close --reason "not planned"`) e atualize seu status no GitHub Project.
4. **Idioma dos Commits:**
   - Mantenha todos os commits atômicos e escritos em **português** no padrão Conventional Commits (`feat(EX-XX): ...`, `fix(EX-XX): ...`, `docs: ...`, `chore: ...`).
