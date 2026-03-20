import type { Metadata } from 'next'
import { Inter, Montserrat, Poppins } from 'next/font/google'
import './globals.css'
import SidebarWrapper from '@/components/SidebarWrapper'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'Aula Pro - Tu Copiloto Docente',
  description: 'Una IA que conoce a tus alumnos tanto como vos. Centraliza planificación, evaluación y gestión del aula.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

import { TokenProvider } from '@/lib/TokenContext'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${montserrat.variable} ${poppins.variable} ${inter.variable}`}>
      <body className="font-poppins bg-brand-bg text-foreground min-h-screen">
        <TokenProvider>
          <SidebarWrapper>
            {children}
          </SidebarWrapper>
        </TokenProvider>
      </body>
    </html>
  )
}
