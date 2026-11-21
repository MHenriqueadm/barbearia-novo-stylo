# Plano de Testes E2E: Assets e Fluxo de Agendamento

Implementar uma suíte de testes automatizados com Playwright para validar a integridade dos assets (logo/imagens), o fluxo de upload e a persistência de dados em cenários multi-tenant, garantindo que o agendamento público funcione corretamente.

## Ações Físicas
- Criar script de teste E2E em `/tmp/browser/audit_assets_flow.py`.
- Validar o upload de logo nas configurações da barbearia.
- Verificar se a logo é exibida corretamente via proxy seguro (`/api/public/assets`).
- Simular recarregamento de página (F5) e garantir que a logo persiste.
- Testar o fluxo de agendamento público sem login, verificando se a logo e os dados da barbearia correta são exibidos.
- Atualizar o arquivo `src/routes/index.tsx` com as novas instruções de auditoria.

## Detalhes Técnicos
- Utilizar Playwright para automação do navegador.
- Injetar sessão do Supabase para ações administrativas.
- Validar headers de cache e tipos MIME na rota de proxy de assets.
- Garantir isolamento de dados entre tenants durante os testes.
