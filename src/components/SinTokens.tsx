'use client';
import { useRouter } from 'next/navigation';
import { useTokens } from '@/lib/TokenContext';

export const SinTokens = ({ accion = 'usar este agente' }: { accion?: string }) => {
  const router = useRouter();
  const { tokens, tokensTotal } = useTokens();

  return (
    <div style={{
      padding: '32px 24px',
      borderRadius: '16px',
      background: 'var(--color-background-secondary)',
      border: '1px solid #e85d2f',
      textAlign: 'center',
      margin: '24px 0'
    }}>
      <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎯</div>
      <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)', fontWeight: 500 }}>
        Sin tokens disponibles
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>
        Tus tokens actuales: 
        <strong style={{ color: '#e85d2f' }}>{' '}{tokens}/{tokensTotal}</strong>
      </p>
      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 24px' }}>
        Para {accion} necesitás recargar tu saldo de tokens.
      </p>
      <button
        onClick={() => router.push('/precios')} // en este proy se usa /precios para los planes
        style={{
          padding: '12px 32px',
          background: '#e85d2f',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer'
        }}>
        Ver planes y recargar tokens
      </button>
    </div>
  );
};
