"use client";

import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  Mail, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  HelpCircle,
  AlertTriangle,
  Paperclip,
  Power,
  ToggleLeft
} from 'lucide-react';
import { User } from '@/types';
import { useTokens } from '@/lib/TokenContext';

type AdminTab = 'usuarios' | 'soporte';

export default function AdminPage() {
  const { refrescarTokens } = useTokens();
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'docente'>('docente');
  const [formLevel, setFormLevel] = useState('Primaria');
  const [formTokens, setFormTokens] = useState<number>(5);

  useEffect(() => {
    fetchUsers();
    fetchTickets();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/soporte');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSolveTicket = async (id: string) => {
    try {
      const res = await fetch('/api/soporte', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'Solucionado' })
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormName(user.name);
      setFormEmail(user.email);
      setFormPassword(''); 
      setFormRole(user.role);
      setFormLevel(user.level);
      setFormTokens(user.tokens_disponibles ?? 0);
    } else {
      setEditingUser(null);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setFormRole('docente');
      setFormLevel('Primaria');
      setFormTokens(5);
    }
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formName,
      email: formEmail,
      password: formPassword || undefined,
      role: formRole,
      level: formLevel,
      tokens_disponibles: formTokens
    };

    try {
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
        await refrescarTokens(); // Actualiza el contexto global por si el Admin modificó sus propios tokens
      }
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const toggleUserStatus = async (user: User) => {
    // Si active es undefined o true, lo pasamos a false. Si es false, lo pasamos a true.
    const newStatus = user.active === false ? true : false;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, active: newStatus })
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este acceso?')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8 mb-10 pt-14 md:pt-0">
        <div className="px-4 md:px-0">
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center gap-3 font-montserrat tracking-tight">
            <Shield className="text-brand-orange" size={40} />
            Panel Maestro
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 leading-relaxed">Control central de usuarios y soporte técnico.</p>
        </div>
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 mx-4 md:mx-0">
           <button 
             onClick={() => setActiveTab('usuarios')}
             className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'usuarios' ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20' : 'text-slate-400 hover:text-white'}`}
           >
             Usuarios
           </button>
           <button 
             onClick={() => setActiveTab('soporte')}
             className={`px-6 md:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'soporte' ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20' : 'text-slate-400 hover:text-white'}`}
           >
             Soporte ({tickets.filter(t => t.status === 'Abierto').length})
           </button>
        </div>
      </div>

      {activeTab === 'usuarios' ? (
        <>
          <div className="flex justify-end mb-8">
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-8 py-4 bg-white text-brand-navy rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-brand-peach transition-all shadow-2xl"
            >
              <UserPlus size={18} />
              Nuevo Usuario
            </button>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
             <div className="bg-brand-navy p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-6 hover:translate-y-[-4px] transition-all group">
                <div className="w-16 h-16 bg-brand-orange/10 text-brand-orange rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-brand-orange group-hover:text-white transition-all">
                   <Users size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Total Usuarios</p>
                   <p className="text-4xl font-black text-white font-montserrat">{users.length}</p>
                </div>
             </div>
             <div className="bg-brand-navy p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-6 hover:translate-y-[-4px] transition-all group">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-emerald-500 group-hover:text-white transition-all">
                   <CheckCircle2 size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activos Hoy</p>
                   <p className="text-4xl font-black text-white font-montserrat">{Math.ceil(users.length * 0.8)}</p>
                </div>
             </div>
             <div className="bg-brand-navy p-8 rounded-[2.5rem] border border-white/5 shadow-2xl flex items-center gap-6 hover:translate-y-[-4px] transition-all group">
                <div className="w-16 h-16 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-brand-blue group-hover:text-white transition-all">
                   <AlertCircle size={32} />
                </div>
                <div>
                   <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">Pendientes</p>
                   <p className="text-4xl font-black text-white font-montserrat">{tickets.filter(t => t.status === 'Abierto').length}</p>
                </div>
             </div>
          </div>

          <div className="bg-brand-navy rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-black text-white focus:bg-white/10 focus:border-brand-orange/50 focus:ring-8 focus:ring-brand-orange/5 outline-none transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/40 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-10 py-5">Usuario</th>
                    <th className="px-10 py-5">Email</th>
                    <th className="px-10 py-5">Tokens</th>
                    <th className="px-10 py-5">Estado</th>
                    <th className="px-10 py-5">Nivel / Plan</th>
                    <th className="px-10 py-5">Rol</th>
                    <th className="px-10 py-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <Loader2 className="animate-spin text-brand-orange mx-auto" size={48} />
                      </td>
                    </tr>
                  ) : filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-brand-orange text-white flex items-center justify-center font-black text-xl shadow-lg shadow-brand-orange/20">
                            {user.name.charAt(0)}
                          </div>
                          <span className="font-black text-white tracking-tight">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 font-bold text-slate-400">{user.email}</td>
                      <td className="px-10 py-6">
                        <span className="text-xl font-black text-brand-orange">{user.tokens_disponibles ?? 0}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.active !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {user.active !== false ? 'Activo' : 'Inhibido'}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-white uppercase tracking-widest">{user.level}</span>
                          <span className="text-[10px] font-black uppercase text-brand-peach tracking-widest">{user.plan}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${user.role === 'admin' ? 'bg-brand-orange text-white border-brand-orange shadow-lg shadow-brand-orange/20' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => toggleUserStatus(user)}
                            title={user.active !== false ? 'Desactivar acceso' : 'Activar acceso'}
                            className={`w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-2xl transition-all shadow-xl ${user.active !== false ? 'hover:bg-amber-500 hover:text-white hover:border-amber-500 text-slate-400' : 'hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-emerald-400'}`}
                          >
                            <Power size={18} />
                          </button>
                          <button 
                            onClick={() => openModal(user)}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all shadow-xl"
                          >
                            <Edit3 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="w-12 h-12 flex items-center justify-center bg-white/5 border border-white/10 text-slate-400 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-xl"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           {tickets.length === 0 ? (
             <div className="bg-brand-navy rounded-[2.5rem] p-24 text-center border border-white/5 shadow-2xl">
                <HelpCircle className="mx-auto text-slate-700 mb-6" size={80} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">No hay reportes de soporte pendientes.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 gap-6">
                {tickets.filter(t => t.status === 'Abierto').map((ticket) => (
                  <div key={ticket.id} className="bg-brand-navy rounded-[3rem] p-10 border border-white/5 shadow-2xl hover:border-brand-orange/30 transition-all relative overflow-hidden group">
                     
                     <div className="flex justify-between items-start mb-8 relative z-10">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center shadow-inner group-hover:bg-red-500 group-hover:text-white transition-all">
                              <AlertTriangle size={32} />
                           </div>
                           <div>
                              <h3 className="text-2xl font-black text-white font-montserrat tracking-tight">{ticket.subject}</h3>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString()}</p>
                           </div>
                        </div>
                        <span className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                           {ticket.status}
                        </span>
                     </div>

                     <div className="bg-black/20 rounded-[2.5rem] p-8 mb-8 border border-white/5 relative z-10">
                        <p className="text-sm font-bold text-slate-300 leading-relaxed whitespace-pre-wrap">
                           {ticket.description}
                        </p>
                     </div>

                     <div className="flex items-center justify-between pt-8 border-t border-white/5 relative z-10">
                        <div className="flex items-center gap-10">
                           <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Contacto Docente</p>
                              <div className="flex items-center gap-3 text-sm font-black text-white">
                                 <Mail size={16} className="text-brand-orange" />
                                 <a href={`mailto:${ticket.userEmail}`} className="hover:text-brand-orange transition-colors">
                                    {ticket.userEmail}
                                 </a>
                              </div>
                           </div>
                           {ticket.attachments && ticket.attachments.length > 0 && (
                             <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Documentos adjuntos</p>
                                <div className="flex gap-3">
                                   {ticket.attachments.map((file: string, i: number) => (
                                      <a 
                                        key={i} 
                                        href={`/uploads/${file}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-slate-400 hover:bg-brand-orange hover:text-white hover:border-brand-orange transition-all uppercase tracking-widest"
                                      >
                                         <Paperclip size={12} />
                                         {file}
                                      </a>
                                   ))}
                                </div>
                             </div>
                           )}
                        </div>
                        <div className="flex gap-4">
                           <a 
                             href={`mailto:${ticket.userEmail}?subject=RE: ${ticket.subject}&body=Hola, recibimos tu reporte sobre "${ticket.subject}"...`}
                             className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:text-brand-navy transition-all shadow-xl"
                           >
                              Contactar
                           </a>
                           {ticket.status === 'Abierto' && (
                             <button 
                               onClick={() => handleSolveTicket(ticket.id)}
                               className="px-8 py-4 bg-brand-orange text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand-orange/20"
                             >
                                Marcar Solucionado
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-brand-navy w-full max-w-xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div>
                <h3 className="text-2xl font-black text-white font-montserrat">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Configuración de credenciales de acceso.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-inner"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Laura Martínez"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="profe@ejemplo.com"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nivel Escolar</label>
                  <select 
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-6 py-4 bg-brand-navy border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-orange/50 outline-none transition-all"
                  >
                    <option>Inicial</option>
                    <option>Primaria</option>
                    <option>Secundaria</option>
                    <option>Terciario</option>
                    <option>Administración</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Rol</label>
                  <select 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as 'admin' | 'docente')}
                    className="w-full px-6 py-4 bg-brand-navy border border-white/10 rounded-2xl text-sm font-bold text-white focus:border-brand-orange/50 outline-none transition-all"
                  >
                    <option value="docente">Docente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tokens Asignados</label>
                  <input 
                    type="number" 
                    min="0"
                    required
                    value={formTokens}
                    onChange={(e) => setFormTokens(Number(e.target.value))}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Contraseña</label>
                  <input 
                    type="password" 
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingUser ? "Mantener actual" : "••••••••"}
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white focus:bg-white/10 focus:border-brand-orange/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-brand-orange text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-orange/20 hover:scale-[1.05] transition-all"
                >
                  {editingUser ? 'Actualizar' : 'Guardar Acceso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
