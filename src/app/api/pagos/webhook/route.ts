import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const PACKS: Record<string, { tokens: number }> = {
  basico: { tokens: 25 }, // 20 + 5 regalo
  pro: { tokens: 70 }    // 50 + 20 regalo
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // MP manda distintos tipos de notificaciones
    // Solo procesar pagos aprobados
    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true });
    }

    // Consultar el pago a MP para verificarlo
    const payment = new Payment(mp);
    const pago = await payment.get({
      id: body.data.id
    });

    // Solo procesar si está aprobado
    if (pago.status !== 'approved') {
      return NextResponse.json({ ok: true });
    }

    // Evitar procesar el mismo pago 2 veces
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: pagoExistente } = await supabase
      .from('pagos')
      .select('id')
      .eq('mp_payment_id', String(pago.id))
      .single();

    if (pagoExistente) {
      // Ya fue procesado — ignorar
      return NextResponse.json({ ok: true });
    }

    // Extraer userId y pack
    const [userId, pack] = pago.external_reference!.split('|');

    const tokens = PACKS[pack]?.tokens;
    if (!tokens) {
      console.error('Pack inválido:', pack);
      return NextResponse.json({ ok: true });
    }

    // Leer tokens actuales del docente
    const { data: perfil } = await supabase
      .from('profiles')
      .select('tokens_disponibles')
      .eq('id', userId)
      .single();

    const tokensAntes = perfil?.tokens_disponibles || 0;
    const tokensNuevos = tokensAntes + tokens;

    // Acreditar tokens
    await supabase
      .from('profiles')
      .update({
        tokens_disponibles: tokensNuevos
      })
      .eq('id', userId);

    // Registrar el pago
    await supabase
      .from('pagos')
      .insert([{
        user_id: userId,
        mp_payment_id: String(pago.id),
        mp_status: pago.status,
        pack,
        monto: pago.transaction_amount,
        tokens_otorgados: tokens
      }]);

    // Registrar transacción de tokens
    await supabase
      .from('token_transactions')
      .insert([{
        user_id: userId,
        tipo: 'carga_mp',
        cantidad: tokens,
        tokens_antes: tokensAntes,
        tokens_despues: tokensNuevos,
        descripcion: `Compra ${pack} — MP #${pago.id}`
      }]);

    console.log(`✓ ${tokens} tokens acreditados a ${userId}`);

    return NextResponse.json({ ok: true });

  } catch(error) {
    console.error('Webhook error:', error);
    // Siempre devolver 200 a MP
    // sino reintenta infinitamente
    return NextResponse.json({ ok: true });
  }
}

// IMPORTANTE: MP también manda GET para validar
export async function GET() {
  return NextResponse.json({ ok: true });
}
