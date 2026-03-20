'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TokenContextType {
  tokens: number;
  tokensTotal: number;
  cargando: boolean;
  refrescarTokens: () => Promise<void>;
}

const TokenContext = createContext<TokenContextType>({
  tokens: 0,
  tokensTotal: 0,
  cargando: true,
  refrescarTokens: async () => {}
});

// Obtiene el userId exclusivamente desde la cookie httpOnly (aislado por sesión)
async function getUserIdFromSession(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState(0);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const supabase = createClient();

  const refrescarTokens = useCallback(async () => {
    // Siempre leer el userId desde la cookie activa (nunca en caché)
    // Esto garantiza que al cambiar de cuenta, los tokens del nuevo usuario se carguen correctamente.
    const userId = await getUserIdFromSession();
    if (!userId) {
      // Sin sesión: limpiar los tokens para no mostrar datos de la sesión anterior
      setTokens(0);
      setTokensTotal(0);
      setCargando(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('tokens_disponibles, tokens_totales')
      .eq('id', userId)
      .single();

    if (data) {
      setTokens(data.tokens_disponibles ?? 0);
      setTokensTotal(data.tokens_totales ?? 0);
    }
    setCargando(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga inicial
  useEffect(() => {
    refrescarTokens();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling cada 30s: garantiza sincronización cuando el admin cambia tokens
  // desde el panel administrativo (no depende de Realtime ni de JWT en localStorage)
  useEffect(() => {
    const interval = setInterval(refrescarTokens, 10_000);
    return () => clearInterval(interval);
  }, [refrescarTokens]);

  // Refresco inmediato al volver al tab (ej: el docente regresa a la app)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refrescarTokens();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [refrescarTokens]);

  return (
    <TokenContext.Provider value={{ tokens, tokensTotal, cargando, refrescarTokens }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => useContext(TokenContext);
