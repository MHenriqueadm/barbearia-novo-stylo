# RESTYLE - Remover Dependência do Proxy de Assets na Cloudflare

O objetivo deste plano é simplificar a arquitetura de imagens do RESTYLE, removendo a dependência do proxy `/api/public/assets` (que falha na Cloudflare por falta de variáveis de ambiente no runtime) e utilizando URLs públicas diretas do Supabase Storage.

## Ações Técnicas

### 1. Configurar Buckets como Públicos
Vou alterar a visibilidade dos buckets usados para assets públicos para permitir leitura anônima via Supabase Storage.
- Buckets: `barbershop-assets`, `barbershop-logos`, `service-photos`, `professional-avatars`.
- A escrita continuará protegida por RLS (Row Level Security), exigindo autenticação e vínculo com a barbearia (`barbershop_id`).

### 2. Atualizar Helper de URLs (`src/lib/storage.ts`)
- Substituir a lógica que aponta para o proxy `/api/public/assets`.
- Implementar `supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl`.
- Garantir que caminhos absolutos no banco sejam convertidos em URLs públicas estáveis.

### 3. Ajustar Componentes de UI
- Revisar `ImageWithFallback` e o uso de `getPublicAssetUrl` em:
  - `src/routes/_authenticated/configuracoes/route.tsx` (Logo)
  - `src/routes/_authenticated/equipe/route.tsx` (Avatares)
  - `src/routes/_authenticated/servicos/route.tsx` (Fotos de serviços)
  - `src/routes/$slug/agendar/route.tsx` e `src/routes/agendar/route.tsx` (Público)

### 4. Limpeza
- Desativar ou remover o endpoint `/api/public/assets.ts` para evitar erros 500 desnecessários em produção.

## Verificação e Segurança
- **Leitura:** Testar acesso deslogado às imagens (booking público).
- **Escrita:** Tentar upload/deleção via API deslogado (deve ser bloqueado).
- **Tenant Isolation:** Verificar se o Tenant A consegue sobrescrever arquivos no path do Tenant B via RLS.
- **Produção:** Validar se as imagens carregam corretamente no domínio `.lovable.app` (simulando Cloudflare).

## Relatório Final
Informarei os buckets tornados públicos e confirmarei o sucesso da remoção do proxy.
