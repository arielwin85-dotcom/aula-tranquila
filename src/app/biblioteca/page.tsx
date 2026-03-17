"use client";

import { useState } from 'react';
import { Search, FileText, File, FileIcon, Link as LinkIcon, AlertCircle, LibraryBig, Loader2, Info, ChevronRight, Printer } from 'lucide-react';
import Link from 'next/link';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  createdTime: string;
}

export default function BibliotecaPage() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<DriveFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/biblioteca/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Error al buscar en Google Drive");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError((err as Error).message || "Ocurrió un error inesperado.");
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="text-brand-orange" />;
    return <File className="text-slate-500" />;
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="w-24 h-24 bg-brand-navy border border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl group transition-all hover:scale-110">
          <LibraryBig size={48} className="text-brand-orange" />
        </div>
        <h1 className="text-5xl font-black text-white mb-4 font-montserrat tracking-tight">Mi Biblioteca Drive</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xl mx-auto">
          Material didáctico y evaluaciones en un solo lugar seguro.
        </p>
      </div>

      {/* Info Banner */}
      <div className="max-w-3xl mx-auto mb-10 bg-brand-orange/5 border border-brand-orange/20 rounded-[1.5rem] p-6 flex gap-4 text-slate-300 text-sm">
         <Info className="flex-shrink-0 text-brand-orange" size={20} />
         <p className="font-medium leading-relaxed">
            <strong className="text-white">Modo de Prueba:</strong> Si aún no has configurado las credenciales, verás resultados simulados para probar la interfaz.
         </p>
      </div>

      {/* Featured: Recursos Imprimibles */}
      <div className="max-w-3xl mx-auto mb-10">
        <a 
          href="https://drive.google.com/drive/u/0/folders/1sEAstORG-s3n2SeV-ccZOI8psBQ2ey5A"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden bg-gradient-to-br from-brand-orange/40 to-brand-peach/20 p-[1px] rounded-[2.5rem] block hover:scale-[1.02] transition-all shadow-2xl shadow-brand-orange/10"
        >
          <div className="bg-brand-navy/90 backdrop-blur-3xl rounded-[2.4rem] p-8 flex items-center justify-between gap-6 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute -right-20 -top-20 w-60 h-60 bg-brand-orange/5 rounded-full blur-[100px] group-hover:bg-brand-orange/15 transition-all"></div>
              
              <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-orange/10 border border-brand-orange/20 rounded-2xl flex items-center justify-center text-brand-orange shrink-0 shadow-inner">
                      <Printer size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-white font-montserrat tracking-tight">Recursos Imprimibles</h3>
                        <span className="px-2 py-0.5 bg-brand-orange text-white text-[8px] font-black uppercase tracking-widest rounded-md">Nuevo</span>
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">
                          Accedé a evaluaciones, guías y material didáctico listo para usar.
                      </p>
                  </div>
              </div>
              <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-brand-orange group-hover:text-white transition-all shadow-xl">
                  <ChevronRight size={24} />
              </div>
          </div>
        </a>
      </div>

      {/* Search Bar */}
      <div className="bg-brand-navy rounded-[3rem] border border-white/5 shadow-2xl p-6 mb-12 max-w-3xl mx-auto focus-within:ring-8 focus-within:ring-brand-blue/10 focus-within:border-brand-blue/40 transition-all">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
           <Search className="text-slate-600 ml-4" size={28} />
           <input 
             type="text" 
             value={query}
             onChange={(e) => setQuery(e.target.value)}
             placeholder="Ej: sistema solar 4to grado..."
             className="flex-1 bg-transparent text-xl text-white placeholder:text-slate-700 font-black focus:outline-none"
           />
           <button 
             type="submit"
             disabled={isSearching || !query.trim()}
             className="bg-brand-orange text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 disabled:opacity-50 transition-all shadow-xl shadow-brand-orange/20 flex items-center gap-3"
           >
             {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'Buscar'}
           </button>
        </form>
      </div>

      {/* Results Area */}
      {error && (
        <div className="bg-red-500/5 text-red-400 border border-red-500/20 p-8 rounded-[2rem] max-w-3xl mx-auto flex items-center gap-4 shadow-2xl">
          <AlertCircle size={28} />
          <p className="font-bold uppercase tracking-wide text-sm">{error}</p>
        </div>
      )}

      {results && results.length > 0 && (
         <div className="max-w-4xl mx-auto">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 px-4">
               {results.length} resultados encontrados en tu Drive
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((file) => (
                 <a 
                   key={file.id} 
                   href={file.webViewLink} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="bg-brand-navy border border-white/5 rounded-[2.5rem] p-8 hover:border-brand-orange/50 hover:shadow-2xl transition-all flex items-start gap-6 group"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-all duration-300 shadow-inner">
                       {getFileIcon(file.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-white text-lg truncate mb-2 group-hover:text-brand-orange transition-colors font-montserrat tracking-tight">
                          {file.name}
                       </h4>
                       <div className="flex items-center justify-between mt-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(file.createdTime).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1 text-brand-orange text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                             ABRIR <ChevronRight size={14} />
                          </span>
                       </div>
                    </div>
                 </a>
              ))}
            </div>
         </div>
      )}

      {/* Initial State */}
      {!results && !isSearching && !error && (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-brand-navy border border-white/5 p-8 rounded-[2.5rem] text-center shadow-2xl opacity-60">
               <FileText className="mx-auto text-brand-orange mb-4" size={32} />
               <p className="text-[10px] font-black text-white uppercase tracking-widest leading-widest">Busca en tus PDFs y Docs.</p>
            </div>
            <div className="bg-brand-navy border border-white/5 p-8 rounded-[2.5rem] text-center shadow-2xl opacity-60">
               <LibraryBig className="mx-auto text-brand-blue mb-4" size={32} />
               <p className="text-[10px] font-black text-white uppercase tracking-widest leading-widest">Organización Inteligente.</p>
            </div>
            <div className="bg-brand-navy border border-white/5 p-8 rounded-[2.5rem] text-center shadow-2xl opacity-60">
               <Search className="mx-auto text-slate-600 mb-4" size={32} />
               <p className="text-[10px] font-black text-white uppercase tracking-widest leading-widest">Motor de búsqueda Drive.</p>
            </div>
         </div>
      )}

    </div>
  );
}
