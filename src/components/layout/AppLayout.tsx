import { Link } from "@tanstack/react-router";
import { Home, Calendar, Users, DollarSign, Scissors, Settings, UserPlus, LogOut, Search, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useBarbershopSettings } from "@/hooks/useBarbearia";
import { useCurrentBarbershop } from "@/contexts/BarbershopContext";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getPublicAssetUrl } from "@/lib/storage";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/servicos", label: "Serviços", icon: Scissors },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/equipe", label: "Equipe", icon: UserPlus },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

const getInitialsFrom = (name: string) =>
  name
    .split(" ")
    .filter((word) => word.length > 0)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const BOTTOM_ITEMS = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/agenda", label: "Agenda", icon: Calendar },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/financeiro", label: "Caixa", icon: DollarSign },
];

const MORE_ITEMS = [
  { to: "/servicos", label: "Serviços", icon: Scissors },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/equipe", label: "Equipe", icon: UserPlus },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
];

export function BottomNav() {
  const { currentBarbershop } = useCurrentBarbershop();
  const { data: settings } = useBarbershopSettings();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const name = currentBarbershop?.name || settings?.name || "RESTYLE";
  const logo = getPublicAssetUrl(currentBarbershop?.logo_url || settings?.logo_url)!;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl border-t border-white/5 flex justify-around items-center py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden z-50">
      {BOTTOM_ITEMS.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="flex flex-col items-center gap-1 text-slate-500 transition-all duration-300 [&.active]:text-blue-500 active:scale-90"
        >
          <item.icon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
        </Link>
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Mais opções"
            className="flex flex-col items-center gap-1 text-slate-500 transition-all duration-300 active:scale-90 data-[state=open]:text-blue-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mais</span>
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[86vw] max-w-xs bg-black border-white/5 p-0 flex flex-col">
          <SheetTitle className="sr-only">Menu completo</SheetTitle>

          <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-5 border-b border-white/5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
                <ImageWithFallback
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm">
                      {name ? getInitialsFrom(name) : <Scissors className="w-5 h-5" />}
                    </div>
                  }
                />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="font-bold tracking-tighter leading-tight break-words">{name}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">
                  RESTYLE Premium
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {MORE_ITEMS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-blue-600/10 [&.active]:text-blue-500 [&.active]:font-bold"
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="text-sm tracking-tight truncate">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/5">
            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border border-white/5 group text-left"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-white/10 shrink-0">
                {user?.email ? getInitialsFrom(user.email.split("@")[0]) : "OC"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user?.email?.split("@")[0] || "Equipe"}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sair</p>
              </div>
              <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors shrink-0" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}


export function Sidebar() {
  const { currentBarbershop } = useCurrentBarbershop();
  const { data: settings } = useBarbershopSettings();
  // Removed logoError state in favor of ImageWithFallback
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const items = NAV_ITEMS;
  const getInitials = getInitialsFrom;

  return (
    <aside className="hidden md:flex flex-col w-72 bg-black border-r border-white/5 min-h-screen sticky top-0 z-50">
      <div className="px-8 py-10">
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105 border border-white/5">
            <ImageWithFallback 
              src={getPublicAssetUrl(currentBarbershop?.logo_url || settings?.logo_url)!} 
              alt="Logo" 
              className="w-full h-full object-cover" 
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-lg">
                  {currentBarbershop?.name ? getInitials(currentBarbershop.name) : settings?.name ? getInitials(settings.name) : <Scissors className="w-6 h-6" />}
                </div>
              }
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className={cn(
              "font-bold tracking-tighter leading-[1.1] transition-all break-words",
              (settings?.name?.length || 0) > 12 ? "text-lg" : "text-2xl"
            )}>
              {currentBarbershop?.name || settings?.name || "RESTYLE"}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5 opacity-60">
              Premium
            </p>
          </div>
        </Link>
      </div>
      
      <div className="px-6 mb-8">
        <div className="bg-slate-900 rounded-2xl border border-white/5 p-3 flex items-center gap-3 group focus-within:border-blue-500/50 transition-all">
          <Search className="w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none text-sm focus:outline-none w-full placeholder:text-slate-600 font-medium"
          />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex items-center gap-3 px-6 py-3.5 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 transition-all duration-300 group [&.active]:bg-blue-600/10 [&.active]:text-blue-500 [&.active]:font-bold"
            )}
          >
            <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span className="text-sm tracking-tight">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-6 space-y-4">
        <div 
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/auth";
          }}
          className="flex items-center gap-4 p-4 rounded-3xl bg-slate-900/50 border border-white/5 relative group cursor-pointer hover:border-white/10 transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-white/10">
            {user?.email ? getInitials(user.email.split('@')[0]) : "OC"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{user?.email?.split('@')[0] || "Equipe"}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Membro</p>
          </div>
          <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
        </div>
      </div>
    </aside>
  );
}
export function MobileNav() {
  const { currentBarbershop } = useCurrentBarbershop();
  const { data: settings } = useBarbershopSettings();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const name = currentBarbershop?.name || settings?.name || "RESTYLE";
  const logo = getPublicAssetUrl(currentBarbershop?.logo_url || settings?.logo_url)!;

  const logoBlock = (
    <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border border-white/5">
      <ImageWithFallback
        src={logo}
        alt="Logo"
        className="w-full h-full object-cover"
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm">
            {name ? getInitialsFrom(name) : <Scissors className="w-5 h-5" />}
          </div>
        }
      />
    </div>
  );

  return (
    <header className="md:hidden sticky top-0 z-50 bg-black/70 backdrop-blur-2xl border-b border-white/5 pt-[env(safe-area-inset-top)]">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Abrir menu"
              className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-300 active:scale-90 transition-transform shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[86vw] max-w-xs bg-black border-white/5 p-0 flex flex-col">
            <SheetTitle className="sr-only">Menu de navegação</SheetTitle>

            <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-5 border-b border-white/5">
              <div className="flex min-w-0 items-center gap-3">
                {logoBlock}
                <div className="flex flex-col min-w-0">
                  <p className="font-bold tracking-tighter leading-tight break-words">{name}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-0.5">
                    RESTYLE Premium
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all [&.active]:bg-blue-600/10 [&.active]:text-blue-500 [&.active]:font-bold"
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm tracking-tight truncate">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-white/5">
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await supabase.auth.signOut();
                  window.location.href = "/auth";
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-900/50 border border-white/5 group text-left"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-sm font-bold border border-white/10 shrink-0">
                  {user?.email ? getInitialsFrom(user.email.split("@")[0]) : "OC"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{user?.email?.split("@")[0] || "Equipe"}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sair</p>
                </div>
                <LogOut className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors shrink-0" />
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-bold tracking-tight">{name}</p>
        </div>
      </div>
    </header>
  );
}
