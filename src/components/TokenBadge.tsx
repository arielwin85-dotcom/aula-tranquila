'use client';
import { useRouter } from 'next/navigation';
import { useTokens } from '@/lib/TokenContext';

export const TokenBadge = () => {
  const router = useRouter();
  const { tokens, tokensTotal } = useTokens();

  const porcentaje = tokensTotal > 0 ? tokens / tokensTotal : 0;
  
  const color =
    tokens === 0 ? '#ef4444' :
    porcentaje < 0.2 ? '#f59e0b' :
                       '#22c55e';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Contador */}
      <div
        onClick={() => tokens === 0 && router.push('/precios')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '20px',
          background: 'var(--color-background-secondary)',
          border: `1px solid ${color}`,
          cursor: tokens === 0 ? 'pointer' : 'default'
        }}>
        <span>🎯</span>
        <span style={{ fontSize: '13px', fontWeight: 600, color }}>
          {tokens}/{tokensTotal} tokens
        </span>
        {tokens === 0 && (
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 400 }}>
            · Recargar →
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div style={{
        width: '80px',
        height: '6px',
        borderRadius: '3px',
        background: 'var(--color-border-tertiary)',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          borderRadius: '3px',
          background: color,
          width: tokensTotal > 0 ? `${Math.min((tokens/tokensTotal)*100, 100)}%` : '0%',
          transition: 'width 0.4s ease'
        }}/>
      </div>
    </div>
  );
};
