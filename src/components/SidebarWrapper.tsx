"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  // Cerrar el menú al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return (
      <main className="w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-bg relative overflow-x-hidden">
      {/* Botón Hamburguesa (Solo Móvil) */}
      <button 
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[1001] bg-brand-orange border-none rounded-lg p-2.5 text-white shadow-xl active:scale-95 transition-all flex items-center justify-center"
        aria-label="Abrir menú"
      >
        <Menu size={20} strokeWidth={3} />
      </button>

      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <main className="flex-1 lg:ml-64 relative min-h-screen overflow-y-auto">
        <div className="p-6 md:p-12 lg:p-14">
          <div className="min-h-screen flex flex-col pt-16 lg:pt-0">
            <div className="flex-1">
              {children}
            </div>
            <footer className="py-12 mt-20 border-t border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-loose">
                AULATRANQUILA 2026 ® <br className="md:hidden" /> | Producto para uso personal | <br className="md:hidden" /> Copia o reproducción prohibida por ley.
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
