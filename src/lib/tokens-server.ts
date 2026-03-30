import { supabaseAdmin } from './supabase';

export const descontarTokensServer = async (
  userId: string,
  cantidad: number,
  tipo: string,
  descripcion: string
): Promise<{ ok: boolean; error?: string; tokensRestantes?: number; }> => {
  if (!supabaseAdmin) {
    return { ok: false, error: 'Database connection error' };
  }

  // 1. Obtener balance actual
  const { data: perfil, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('tokens_disponibles')
    .eq('id', userId)
    .single();

  if (fetchError || !perfil) {
    return { ok: false, error: 'User profile not found' };
  }

  const tokensAntes = perfil.tokens_disponibles || 0;

  if (tokensAntes < cantidad) {
    return { 
      ok: false, 
      error: 'sin_tokens',
      tokensRestantes: tokensAntes
    };
  }

  const tokensNuevos = tokensAntes - cantidad;

  // 2. Actualizar balance
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ tokens_disponibles: tokensNuevos })
    .eq('id', userId);

  if (updateError) {
    return { ok: false, error: 'Error updating balance' };
  }

  // 3. Registrar transacción
  await supabaseAdmin
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

export const registrarErrorDiagnostico = async (userId: string, error: string, classroomId?: string) => {
  if (!supabaseAdmin) return;
  
  await supabaseAdmin
    .from('token_transactions')
    .insert([{
      user_id: userId,
      tipo: 'error_diagnostico',
      cantidad: 0,
      tokens_antes: 0,
      tokens_despues: 0,
      descripcion: `ERROR EN NORMATIVA: ${error.substring(0, 200)} | Aula: ${classroomId || 'N/A'}`
    }]);
};

export const leerTokensServer = async (userId: string): Promise<{ disponibles: number; totales: number }> => {
  if (!supabaseAdmin) return { disponibles: 0, totales: 0 };
  
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('tokens_disponibles, tokens_totales')
    .eq('id', userId)
    .single();
    
  return {
    disponibles: data?.tokens_disponibles || 0,
    totales: data?.tokens_totales || 0
  };
};
