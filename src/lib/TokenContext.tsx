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

    setTokens(data?.tokens_disponibles || 0);
    setTokensTotal(data?.tokens_totales || 0);
    setCargando(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refrescarTokens();
  }, [refrescarTokens]);

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
