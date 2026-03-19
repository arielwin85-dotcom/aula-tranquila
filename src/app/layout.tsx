import type { Metadata } from 'next'
import { Inter, Montserrat, Poppins } from 'next/font/google'
import './globals.css'
import SidebarWrapper from '@/components/SidebarWrapper'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const poppins = Poppins({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-poppins' })

export const metadata: Metadata = {
  title: 'Aula Tranquila - Tu Copiloto Docente',
  description: 'Una IA que conoce a tus alumnos tanto como vos. Centraliza planificación, evaluación y gestión del aula.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${montserrat.variable} ${poppins.variable} ${inter.variable}`}>
      <body className="font-poppins bg-brand-bg text-foreground min-h-screen">
        <SidebarWrapper>
          {children}
        </SidebarWrapper>
      </body>
    </html>
  )
}
