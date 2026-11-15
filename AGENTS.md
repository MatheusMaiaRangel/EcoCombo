# Regras do Projeto — EcoCombo 3D (`MatheusMaiaRangel/EcoCombo`)

## 1. Regra Obrigatória de Sincronização com o GitHub Projects (`RN15`)

Sempre que o usuário:
- **Pedir para implementar / iniciar uma feature ou estória existente do backlog**,
- **Pedir para criar uma feature nova** (que ainda não exista no backlog),
- **Concluir uma feature / estória**, ou
- **Cancelar / remover / adiar uma feature ou estória**:

Você **DEVE obrigatoriamente atualizar as Issues e o GitHub Project** vinculado ao repositório `MatheusMaiaRangel/EcoCombo` usando a CLI `gh`:

1. **Nova Feature Solicitada:**
   - Verifique se ela já corresponde a uma das estórias existentes (`E1-01` a `E7-04`).
   - Se for inédita, crie a issue no repositório `MatheusMaiaRangel/EcoCombo` no formato ágil do projeto (*Como / Quero / Para* + Critérios de Aceite em Gherkin *Dado / Quando / Então* + Tarefas `- [ ]`), aplique a label `estória` (ou `épico`), vincule-a ao épico pai correspondente via sub-issue (`addSubIssue`) e adicione-a ao GitHub Project preenchendo `Status`, `Estimativa`, `Prioridade` e `Sprint`.
2. **Feature Iniciada / Concluída:**
   - Atualize as caixas de seleção (`- [x]`) das tarefas na issue correspondente.
   - Atualize o campo `Status` do item no GitHub Project (`Em andamento`, `Em revisão` ou `Concluído`) e o campo `Sprint` quando aplicável.
3. **Feature Cancelada ou Descartada:**
   - Feche a issue correspondente no GitHub (`gh issue close <num> --reason "not planned"`) com um comentário explicando o cancelamento/alteração de escopo e atualize ou remova o item do quadro da Sprint no GitHub Project.

## 2. Convenção de Commits

- Todos os commits deste repositório devem ser escritos **em português**, seguindo o padrão **Conventional Commits** e referenciando o ID da estória/épico quando aplicável (ex.: `feat(E2-02): adiciona invencibilidade temporaria ao sofrer dano`, `docs: ...`, `chore: ...`, `fix(E3-01): ...`).
