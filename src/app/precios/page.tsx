"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function PreciosContent() {
  const [tokens, setTokens] = useState(0);
  const [cargando, setCargando] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const searchParams = useSearchParams();
  const estado = searchParams.get('estado');

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email || '');

      const { data: perfil } = await supabase
        .from('profiles')
        .select('tokens_disponibles')
        .eq('id', user.id)
        .single();

      setTokens(perfil?.tokens_disponibles || 0);
    };
    cargar();
  }, []);

  const handleComprar = async (pack: string) => {
    setCargando(pack);
    try {
      const res = await fetch('/api/pagos/crear-preferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack, userId, userEmail })
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch(error) {
      console.error('Error:', error);
    } finally {
      setCargando(null);
    }
  };

  return (
    <div style={{ padding: '24px' }} className="max-w-5xl mx-auto">
      {/* Mensajes de Retorno Mercado Pago */}
      {estado === 'exitoso' && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--color-background-success)',
          border: '1px solid var(--color-border-success)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{ fontWeight: 500, color: 'var(--color-text-success)' }}>
            ✓ Pago exitoso
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Tus tokens fueron acreditados. En unos segundos se actualizan.
          </p>
        </div>
      )}

      {estado === 'pendiente' && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--color-background-warning)',
          border: '1px solid var(--color-border-warning)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{ fontWeight: 500 }}>⏳ Pago pendiente</p>
          <p style={{ fontSize: '13px' }}>
            Cuando se confirme el pago tus tokens se acreditan automáticamente.
          </p>
        </div>
      )}

      {estado === 'fallido' && (
        <div style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'var(--color-background-danger)',
          border: '1px solid var(--color-border-danger)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <p style={{ fontWeight: 500 }}>✕ El pago no se completó</p>
          <p style={{ fontSize: '13px' }}>Podés intentarlo de nuevo.</p>
        </div>
      )}

      {/* Tokens actuales */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'var(--color-background-secondary)',
        border: '1px solid var(--color-border-tertiary)',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px' }}>🎯</span>
        <div>
          <div style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
            Tokens disponibles: {tokens}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            🤖 Asistente = 1 token por uso &nbsp;|&nbsp; 📋 Planificación mensual = 3 tokens
          </div>
        </div>
      </div>

      {/* Packs */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {/* Pack Básico */}
        <div style={{
          padding: '28px',
          borderRadius: '16px',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-tertiary)'
        }}>
          <h3 style={{ margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Pack Básico</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
            Ideal para 1 grado
          </p>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#e85d2f', marginBottom: '20px' }}>
            $7.000<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-secondary)' }}> / 10 tokens</span>
          </div>
          <ul style={{ 
            listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' 
          }}>
            {[
              '10 usos del Asistente Pedagógico',
              '3 Planificaciones mensuales',
              'Acceso completo al resto de la app',
              'Sin vencimiento'
            ].map(item => (
              <li key={item} style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: '#e85d2f' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleComprar('basico')}
            disabled={cargando === 'basico'}
            style={{
              width: '100%', padding: '12px',
              background: cargando === 'basico' ? '#888' : '#e85d2f',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              cursor: cargando === 'basico' ? 'not-allowed' : 'pointer'
            }}>
            {cargando === 'basico' ? 'Redirigiendo...' : 'Comprar Pack Básico'}
          </button>
        </div>

        {/* Pack Pro */}
        <div style={{
          padding: '28px', borderRadius: '16px',
          background: 'var(--color-background-secondary)',
          border: '2px solid #e85d2f', position: 'relative'
        }}>
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            background: '#e85d2f', color: 'white', padding: '4px 16px',
            borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap'
          }}>
            ★ MÁS ELEGIDO
          </div>
          <h3 style={{ margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Pack Pro</h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
            Ideal para 2 o más grados
          </p>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#e85d2f', marginBottom: '20px' }}>
            $15.000<span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--color-text-secondary)' }}> / 30 tokens</span>
          </div>
          <ul style={{
            listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {[
              '30 usos del Asistente Pedagógico',
              '10 Planificaciones mensuales',
              'Acceso completo al resto de la app',
              'Sin vencimiento',
              'Soporte prioritario'
            ].map(item => (
              <li key={item} style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: '#e85d2f' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleComprar('pro')}
            disabled={cargando === 'pro'}
            style={{
              width: '100%', padding: '12px',
              background: cargando === 'pro' ? '#888' : '#e85d2f',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 500,
              cursor: cargando === 'pro' ? 'not-allowed' : 'pointer'
            }}>
            {cargando === 'pro' ? 'Redirigiendo...' : 'Comprar Pack Pro'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PreciosPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <span className="text-brand-orange animate-pulse">Cargando planes...</span>
      </div>
    }>
      <PreciosContent />
    </Suspense>
  );
}
