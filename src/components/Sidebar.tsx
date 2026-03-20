"use client";

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react';
import { 
  Home, 
  MessageSquareText, 
  Users, 
  FolderOpen, 
  Settings,
  BookOpenCheck,
  CreditCard,
  Shield,
  LogOut,
  ChevronRight,
  LifeBuoy,
  Sparkles,
  FileVideo,
  X
} from 'lucide-react'
import { User } from '@/types';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login');
          return;
        }
        setUser(data.user);
      });
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Mis Clases', href: '/clases', icon: Users },
    { name: '✦ Asistente Pedagógico', href: '/chat', icon: MessageSquareText },
    { name: 'Planificación Normativa', href: '/normativa', icon: BookOpenCheck },
    { name: 'Valuaciones y Contenidos Rápido', href: '/generador', icon: Sparkles },
    { name: 'Evidencias', href: '/evidencias', icon: FileVideo }, 
    { name: 'Mi Biblioteca', href: '/biblioteca', icon: FolderOpen },
    { name: 'Soporte', href: '/soporte', icon: LifeBuoy },
  ];

  // Agregar acceso admin si corresponde
  if (user?.role === 'admin') {
    navItems.push({ name: 'Gestión Accesos', href: '/admin', icon: Shield });
  }

  const bottomItems = [
    { name: 'Mi Plan', href: '/precios', icon: CreditCard },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
  ];

  return (
    <>
      {/* Overlay Backdrop (Móvil) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] lg:hidden animate-in fade-in duration-300" 
          onClick={onClose}
        />
      )}

      <div className={`
        w-64 bg-brand-navy h-full fixed left-0 top-0 flex flex-col shadow-2xl z-[1000] border-r border-white/5 transition-transform duration-500
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-black/20">
                 A
              </div>
              <span className="font-montserrat font-black text-xl text-white tracking-tight">Aula Pro</span>
           </div>
           {onClose && (
             <button onClick={onClose} className="lg:hidden p-2 text-slate-500 hover:text-white transition-colors">
               <X size={20} />
             </button>
           )}
        </div>

      <div className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-3">Herramientas</p>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${
                isActive 
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon 
                size={20} 
                className={isActive ? 'text-white' : 'text-white/50'} 
                strokeWidth={isActive ? 3 : 2}
              />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-white/10">
           <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 mb-3">Cuenta</p>
           {bottomItems.map((item) => {
             const isActive = pathname === item.href;
             const Icon = item.icon;
             
             return (
               <Link
                 key={item.href}
                 href={item.href}
                 className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm ${
                   isActive 
                     ? 'bg-white/20 text-white' 
                     : 'text-white/70 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 <Icon size={20} />
                 {item.name}
               </Link>
             );
           })}
        </div>
      </div>
      
      {/* User Profile Mini */}
      <div className="p-6 border-t border-white/10">
         <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 px-1">
               <div className="w-10 h-10 rounded-2xl bg-white/10 overflow-hidden flex-shrink-0 border border-white/20 shadow-inner">
                  <img src={`https://ui-avatars.com/api/?name=${user?.name || 'Profe'}&background=E85D44&color=fff`} alt="Docente" className="w-full h-full object-cover"/>
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate leading-tight">{user?.name || 'Docente'}</p>
                  <p className="text-[10px] text-brand-peach font-black uppercase truncate tracking-widest">{user?.plan || 'Gratuito'}</p>
               </div>
            </div>
            <button 
              onClick={handleLogout}
              className="group flex items-center justify-between gap-2 px-4 py-3 text-xs font-black text-white/60 hover:text-white hover:bg-red-500/20 rounded-2xl transition-all border border-transparent hover:border-red-500/30"
            >
               <div className="flex items-center gap-2">
                 <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                 CERRAR SESIÓN
               </div>
               <ChevronRight size={14} className="opacity-30" />
            </button>
         </div>
      </div>
      </div>
    </>
  )
}


