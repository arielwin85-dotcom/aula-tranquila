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

export const TokenProvider = ({ children }: { children: ReactNode }) => {
  const [tokens, setTokens] = useState(0);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const supabase = createClient();

  const refrescarTokens = useCallback(async () => {
    // Obtener el usuario de la sesión Supabase nativa (seteada en login via setSession)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCargando(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('tokens_disponibles, tokens_totales')
      .eq('id', user.id)
      .single();

    setTokens(data?.tokens_disponibles ?? 0);
    setTokensTotal(data?.tokens_totales ?? 0);
    setCargando(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Carga inicial
  useEffect(() => {
    refrescarTokens();
  }, [refrescarTokens]);

  // Suscripción Realtime: escucha cambios en el perfil del usuario actual.
  // Esto permite que cuando el admin cambia los tokens, el usuario los vea reflejados
  // instantáneamente sin recargar la página.
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel(`profile-tokens-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload: { new: Record<string, any> }) => {
            const newData = payload.new;
            if (newData?.tokens_disponibles !== undefined) {
              setTokens(newData.tokens_disponibles ?? 0);
            }
            if (newData?.tokens_totales !== undefined) {
              setTokensTotal(newData.tokens_totales ?? 0);
            }
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TokenContext.Provider value={{
      tokens,
      tokensTotal,
      cargando,
      refrescarTokens
    }}>
      {children}
    </TokenContext.Provider>
  );
};

export const useTokens = () => useContext(TokenContext);
