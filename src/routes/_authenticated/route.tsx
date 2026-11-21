import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAccessState } from "@/hooks/useAccessState";
import { Sidebar, BottomNav, MobileNav } from "@/components/layout/AppLayout";


export const Route = createFileRoute("/_authenticated")({
  component: AdminLayout,
});

function AdminLayout() {
  const { state, isLoading: accessLoading, isAuthenticated } = useAccessState();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (accessLoading) return;

    if (state === 'UNAUTHENTICATED') {
      const currentUrl = location.href;
      if (!currentUrl.includes('/auth')) {
        navigate({ to: "/auth", search: { redirect: currentUrl }, replace: true });
      }
    } else if (state === 'AUTHENTICATED_NO_BARBERSHOP') {
      if (location.pathname !== '/onboarding') {
        navigate({ to: "/onboarding" as any, replace: true });
      }
    }
  }, [state, accessLoading, navigate, location.href]);

  useEffect(() => {
    // PWA Logic
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsStandalone(isStandaloneMode);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneMode) setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  if (accessLoading || state === 'AUTH_LOADING') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (state !== 'AUTHENTICATED_WITH_BARBERSHOP') return null;

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-blue-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileNav />
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />

      {/* PWA Banners */}
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl z-[60] animate-in slide-in-from-bottom-10 duration-500 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-restyle.png" 

                alt="RESTYLE" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <p className="text-sm font-bold">Instalar RESTYLE</p>
                <p className="text-xs text-slate-400">Acesse mais rápido da tela inicial</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowInstallBanner(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Agora não</button>
              <button onClick={handleInstallClick} className="bg-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold text-white">Instalar</button>
            </div>
          </div>
        </div>
      )}

      {isIOS && !isStandalone && (
        <div className="fixed bottom-24 left-4 right-4 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl z-[60] animate-in slide-in-from-bottom-10 duration-500 md:hidden">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-restyle.png" 

              alt="RESTYLE" 
              className="w-10 h-10 object-contain shrink-0"
            />
            <div className="flex-1">
              <p className="text-sm font-bold">Instalar no iPhone</p>
              <p className="text-[10px] text-slate-400 leading-tight">
                Toque em <span className="inline-block px-1 bg-white/10 rounded">Compartilhar</span> e depois em <span className="font-semibold text-white">Adicionar à Tela de Início</span>.
              </p>
            </div>
            <button onClick={() => setIsIOS(false)} className="text-slate-500 p-1"><span className="text-xs font-bold">OK</span></button>
          </div>
        </div>
      )}
    </div>
  );
}