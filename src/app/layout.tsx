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
          <div className="min-h-screen flex flex-col">
            <main className="flex-1">
              {children}
            </main>
            <footer className="py-8 px-4 border-t border-white/5 text-center bg-black/20">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                AULATRANQUILA 2026 ® | Producto para uso personal | Copia o reproducción prohibida por ley.
              </p>
            </footer>
          </div>
        </SidebarWrapper>
      </body>
    </html>
  )
}
