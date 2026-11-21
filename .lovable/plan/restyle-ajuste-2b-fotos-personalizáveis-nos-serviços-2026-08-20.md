# RESTYLE — AJUSTE 2B: FOTOS PERSONALIZÁVEIS NOS SERVIÇOS

Adicionar suporte para imagens personalizadas em cada serviço, permitindo que a barbearia tenha um catálogo visual mais profissional tanto na área administrativa quanto no agendamento público.

## User Review Required

> [!IMPORTANT]
> - As imagens serão armazenadas no bucket existente `barbershop-assets` na pasta `services/`.
> - Como o projeto não possui login e o bucket é privado devido a políticas do ambiente, continuaremos usando **Signed URLs** de longa duração (10 anos) para garantir que as imagens sejam visíveis publicamente.

- Nenhuma dúvida técnica impeditiva.

## Proposed Changes

### Database & Security
- Adicionar coluna `image_url` na tabela `services`.
- Garantir que as permissões (RLS) e `GRANT` permitam que o papel `anon` leia as imagens dos serviços.

### Backend (Services)
- `src/services/barbearia.ts`:
    - Adicionar `uploadServiceImage` para gerenciar o upload de fotos de serviços.
    - Adicionar `removeServiceImage` para deletar arquivos do Storage.
    - Atualizar `Service` type para incluir `image_url`.

### Frontend (Admin - /servicos)
- `src/routes/servicos/route.tsx`:
    - Atualizar o modal de criação/edição com campo de upload de imagem.
    - Adicionar preview da imagem, botão de trocar e remover.
    - Melhorar o visual do Card de serviço para exibir a imagem (ou fallback elegante).

### Frontend (Public - /agendar)
- `src/routes/agendar/route.tsx`:
    - Atualizar o Step 1 (Seleção de Serviço) para exibir cards visuais com a foto do serviço.
    - Manter a responsividade (Mobile First) para que os cards fiquem bem apresentados em telas pequenas.

## Technical Details

### Database Migration
```sql
ALTER TABLE public.services ADD COLUMN image_url text;
```

### Storage Structure
- Bucket: `barbershop-assets`
- Path: `services/{serviceId}/{timestamp}_{filename}` (para evitar conflitos de cache e facilitar limpeza se necessário, ou apenas um nome aleatório como na logo).

### Fallback Logic
- Se `image_url` for nulo ou falhar no carregamento:
    - Exibir um placeholder com fundo grafite e o ícone de tesoura (ou a inicial do serviço).
    - Garantir que não apareçam ícones de imagem quebrada.

## Verification Plan

### Automated Tests (Playwright)
- Criar script para:
    1. Acessar `/servicos`.
    2. Editar um serviço e fazer upload de uma imagem mock.
    3. Verificar se o preview aparece.
    4. Salvar e recarregar a página (F5) para garantir persistência.
    5. Acessar `/agendar` e verificar se a imagem aparece no card de serviço.
    6. Remover a imagem e verificar o fallback.

### Manual Verification
- Testar em resoluções de 375px, 390px e 430px (Mobile).
- Verificar se o build termina sem erros de tipos.
