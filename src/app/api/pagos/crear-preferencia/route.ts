import { MercadoPagoConfig, Preference } from 'mercadopago';
import { NextRequest, NextResponse } from 'next/server';

const mp = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!
});

const PACKS: Record<string, { titulo: string; precio: number; tokens: number }> = {
  basico: {
    titulo: 'Pack Básico — 10 Tokens',
    precio: 7000,
    tokens: 10
  },
  pro: {
    titulo: 'Pack Pro — 30 Tokens',
    precio: 15000,
    tokens: 30
  }
};

export async function POST(req: NextRequest) {
  try {
    const { pack, userId, userEmail } = await req.json();

    if (!PACKS[pack]) {
      return NextResponse.json({ error: 'Pack inválido' }, { status: 400 });
    }

    const packData = PACKS[pack];
    const preference = new Preference(mp);

    const result = await preference.create({
      body: {
        items: [{
          id: pack,
          title: packData.titulo,
          unit_price: packData.precio,
          quantity: 1,
          currency_id: 'ARS'
        }],
        payer: { email: userEmail },
        // userId|pack para identificar en webhook
        external_reference: `${userId}|${pack}`,
        back_urls: {
          // Changed /tokens to /precios for compatibility with current app routing
          success: `${process.env.NEXT_PUBLIC_URL}/precios?estado=exitoso`,
          failure: `${process.env.NEXT_PUBLIC_URL}/precios?estado=fallido`,
          pending: `${process.env.NEXT_PUBLIC_URL}/precios?estado=pendiente`
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_URL}/api/pagos/webhook`
      }
    });

    return NextResponse.json({ init_point: result.init_point });

  } catch(error) {
    console.error('Error creando preferencia:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
