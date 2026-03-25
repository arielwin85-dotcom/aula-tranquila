"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTokens } from '@/lib/TokenContext';

function PreciosContent() {
  const [cargando, setCargando] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const { tokens } = useTokens();

  const searchParams = useSearchParams();
  const estado = searchParams.get('estado');

  useEffect(() => {
    const cargar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      setUserEmail(user.email || '');
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
    <div style={{ padding: '24px' }} className="max-w-6xl mx-auto">
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

      {/* Mensaje Empático / Colaborativo */}
      <div style={{
        padding: '32px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(232,93,47,0.1) 0%, rgba(232,93,47,0.05) 100%)',
        border: '1px solid rgba(232,93,47,0.2)',
        marginBottom: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          right: '-20px',
          top: '-20px',
          opacity: 0.1,
          transform: 'rotate(15deg)'
        }}>
          <span style={{ fontSize: '100px' }}>💝</span>
        </div>
        
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 800, 
          color: '#e85d2f', 
          marginBottom: '16px',
          fontFamily: 'var(--font-montserrat)'
        }}>
          Nuestra misión y compromiso con vos
        </h2>
        
        <p style={{ 
          fontSize: '15px', 
          lineHeight: '1.6', 
          color: 'var(--color-text-primary)', 
          fontWeight: 500,
          maxWidth: '800px',
          margin: 0
        }}>
          ¡Hola! Nos encantaría que Aula Pro fuera 100% gratuito para todos los docentes, pero para poder brindarte la potencia de 
          un **Agente de IA de primer nivel** —preparado con meses de desarrollo pedagógico y técnico— debemos afrontar altos costos 
          de procesamiento y mantenimiento del sistema. 
          <br /><br />
          Cada token representa el motor que nos permite sostener esta herramienta y seguir evolucionándola para que vos puedas 
          recuperar tu tiempo libre sin perder calidad educativa. ¡Gracias por apoyar este desarrollo y ser parte de nuestra comunidad! 🚀
        </p>

        <div style={{
          marginTop: '24px',
          padding: '12px 20px',
          background: 'rgba(232,93,47,0.1)',
          borderRadius: '12px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🎯</span>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Tus Tokens Actuales: {tokens}
          </span>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
        
        {/* Card Gratuito */}
        <div style={{
          padding: '28px',
          borderRadius: '16px',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-tertiary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div>
            {/* Badge plan actual */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(232,93,47,0.15)',
              border: '1px solid #e85d2f',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '11px',
              color: '#e85d2f',
              fontWeight: 500,
              marginBottom: '16px',
              alignSelf: 'flex-start'
            }}>
              ✓ Tu plan actual
            </div>

            {/* Badge de regalo */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid #22c55e',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              color: '#16a34a',
              fontWeight: 500,
              marginBottom: '12px',
              width: 'fit-content'
            }}>
              🎁 5 tokens de regalo
            </div>

            <h3 style={{ margin: '0 0 4px', color: 'var(--color-text-primary)' }}>
              Acceso Gratuito
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Incluido al registrarte
            </p>

            <div style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: '20px'
            }}>
              $0
              <span style={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'var(--color-text-secondary)'
              }}>
                {' '}/ de por vida
              </span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              {[
                'Gestión de Mis Clases',
                '5 Tokens de regalo iniciales',
                '5 Planificaciones Pedagógicas',
                '5 Planificaciones por Normativa',
                'Biblioteca y buscador de recursos (de por vida)',
                '5 Evaluaciones y Contenido Rápido',
                '5 Evidencias'
              ].map(item => (
                <li key={item} style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <span style={{ color: '#e85d2f', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Sin botón — solo indicador */}
          <div style={{
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--color-background-tertiary)',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            marginTop: 'auto'
          }}>
            Plan incluido en tu cuenta
          </div>
        </div>

        {/* Pack Básico */}
        <div style={{
          padding: '28px',
          borderRadius: '16px',
          background: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border-tertiary)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div>
            {/* Badge de oferta */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(232,93,47,0.15)',
              border: '1px solid #e85d2f',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              color: '#e85d2f',
              fontWeight: 500,
              marginBottom: '8px'
            }}>
              🎁 ¡Oferta! 5 tokens de regalo
            </div>

            <h3 style={{ margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Pack Básico</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Ideal para 1 grado
            </p>
            
            <div style={{ marginBottom: '4px' }}>
              <span style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#e85d2f'
              }}>
                $7.000
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              {/* Tokens originales tachados */}
              <span style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'line-through'
              }}>
                20 tokens
              </span>
              {/* Flecha */}
              <span style={{ 
                color: '#e85d2f',
                fontSize: '14px'
              }}>→</span>
              {/* Tokens con regalo */}
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#22c55e'
              }}>
                25 tokens ✓
              </span>
            </div>

            <ul style={{ 
              listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px' 
            }}>
              {[
                'Gestión de Mis Clases',
                '20 tokens + 5 de regalo',
                'Total: 25 usos de los agentes IA',
                'Biblioteca y buscador ilimitados',
                'Sin vencimiento'
              ].map(item => (
                <li key={item} style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#e85d2f', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
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
        </div>

        {/* Pack Pro */}
        <div style={{
          padding: '28px', borderRadius: '16px',
          background: 'var(--color-background-secondary)',
          border: '2px solid #e85d2f', 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div>
            <div style={{
              position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
              background: '#e85d2f', color: 'white', padding: '4px 16px',
              borderRadius: '20px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap'
            }}>
              ★ MÁS ELEGIDO
            </div>

            {/* Badge de oferta */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(232,93,47,0.15)',
              border: '1px solid #e85d2f',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              color: '#e85d2f',
              fontWeight: 500,
              marginBottom: '8px',
              marginTop: '4px'
            }}>
              🎁 ¡Oferta! 20 tokens de regalo
            </div>

            <h3 style={{ margin: '0 0 4px', color: 'var(--color-text-primary)' }}>Pack Pro</h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Ideal para 2 o más grados
            </p>

            <div style={{ marginBottom: '4px' }}>
              <span style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#e85d2f'
              }}>
                $15.000
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}>
              <span style={{
                fontSize: '14px',
                color: 'var(--color-text-secondary)',
                textDecoration: 'line-through'
              }}>
                50 tokens
              </span>
              <span style={{ 
                color: '#e85d2f',
                fontSize: '14px'
              }}>→</span>
              <span style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#22c55e'
              }}>
                70 tokens ✓
              </span>
            </div>

            <ul style={{
              listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '10px'
            }}>
              {[
                'Gestión de Mis Clases',
                '50 tokens + 20 de regalo',
                'Total: 70 usos de los agentes IA',
                'Biblioteca y buscador ilimitados',
                'Sin vencimiento',
                'Soporte prioritario'
              ].map(item => (
                <li key={item} style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#e85d2f', flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: 'auto' }}>
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
