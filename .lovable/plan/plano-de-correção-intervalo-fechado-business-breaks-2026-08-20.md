# Plano de Correção: Intervalo Fechado (Business Breaks)

Corrigir o fluxo de salvamento de intervalos fechados na tela de Configurações, garantindo que o botão de confirmação funcione, valide os dados, persista no banco e atualize a interface.

## Mudanças Técnicas

### 1. Frontend (`src/routes/configuracoes/route.tsx`)
- Adicionar estado `isSavingBreak` para evitar cliques duplicados.
- Refatorar `handleSaveBreak` para ser `async` e usar `createBreakAsync` / `updateBreakAsync` para aguardar a resposta antes de resetar o formulário.
- Garantir que o formulário de criação/edição seja fechado e resetado apenas após o sucesso.
- Adicionar tratamento de erros com `try/catch/finally` e feedbacks visuais via `toast`.

### 2. Hooks (`src/hooks/useBarbearia.ts`)
- Expor `createBreakAsync`, `updateBreakAsync` e `isPending` (renomeado como `isCreating` e `isUpdating`) para permitir controle granular no componente.

### 3. Validação
- Manter validações existentes (horário de término > início, dentro do expediente, sem sobreposição).

## Plano de Teste
1. Acessar `/configuracoes`.
2. Expandir um dia da semana (ex: Segunda-feira).
3. Clicar em "Adicionar intervalo fechado".
4. Preencher 12:00 → 13:00.
5. Clicar no ícone verde.
6. Verificar se o formulário fecha e o intervalo aparece na lista.
7. Atualizar a página (F5) e verificar persistência.
