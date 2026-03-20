import { createClient } from '@/lib/supabase/client';

export const leerTokens = async (userId: string): Promise<{ disponibles: number; totales: number }> => {
  const supabase = createClient();
  const { data } = await supabase
    .from('profiles')
    .select('tokens_disponibles, tokens_totales')
    .eq('id', userId)
    .single();
    
  return {
    disponibles: data?.tokens_disponibles || 0,
    totales: data?.tokens_totales || 0
  };
};

export const tieneTokens = async (userId: string, cantidad: number = 1): Promise<boolean> => {
  const { disponibles } = await leerTokens(userId);
  return disponibles >= cantidad;
};

export const descontarTokens = async (
  userId: string,
  cantidad: number,
  tipo: string,
  descripcion: string
): Promise<{ ok: boolean; error?: string; tokensRestantes?: number; }> => {
  const supabase = createClient();

  const { data: perfil } = await supabase
    .from('profiles')
    .select('tokens_disponibles')
    .eq('id', userId)
    .single();

  const tokensAntes = perfil?.tokens_disponibles || 0;

  if (tokensAntes < cantidad) {
    return { 
      ok: false, 
      error: 'sin_tokens',
      tokensRestantes: tokensAntes
    };
  }

  const tokensNuevos = tokensAntes - cantidad;

  await supabase
    .from('profiles')
    .update({ tokens_disponibles: tokensNuevos })
    .eq('id', userId);

  await supabase
    .from('token_transactions')
    .insert([{
      user_id: userId,
      tipo,
      cantidad: -cantidad,
      tokens_antes: tokensAntes,
      tokens_despues: tokensNuevos,
      descripcion
    }]);

  return { ok: true, tokensRestantes: tokensNuevos };
};
