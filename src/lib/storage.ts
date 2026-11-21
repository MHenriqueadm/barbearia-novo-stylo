import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to resolve a public URL for barbershop assets.
 * Since all assets are stored in the 'barbershop-assets' bucket which is intended to be public,
 * this helper ensures we return a proper public URL for display.
 */
export function getPublicAssetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  
  const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'] || 'https://ywzmbvpcekjthuxmpfte.supabase.co';
  
  // Se for uma URL completa (ex: Supabase signed URL antiga), tenta normalizar
  if (path.startsWith('http')) {
    // Se já for uma URL pública do Supabase, retorna ela mesma
    if (path.includes('/storage/v1/object/public/')) return path;

    // Se for uma URL assinada, extraímos o path e convertemos para pública
    if (path.includes('/storage/v1/object/sign/')) {
      const objectSignPart = '/storage/v1/object/sign/';
      const urlSplit = path.split(objectSignPart);
      
      if (urlSplit.length > 1 && urlSplit[1]) {
        const fullPathWithToken = urlSplit[1];
        const fullPath = fullPathWithToken.split('?')[0];
        
        if (fullPath) {
          return `${supabaseUrl}/storage/v1/object/public/${fullPath}`;
        }
      }
    }
    return path;
  }
  
  let cleanPath = path;
  let bucket = 'barbershop-assets';

  const knownBuckets = ['barbershop-assets', 'barbershop-logos', 'service-photos', 'professional-avatars'];
  for (const b of knownBuckets) {
    if (path.startsWith(`${b}/`)) {
      bucket = b;
      cleanPath = path.replace(`${b}/`, '');
      break;
    }
  }
  
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
}
