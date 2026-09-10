import type { Metadata } from 'next'
import { Source_Serif_4, Public_Sans, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

// Titulares: serif de lectura clínica/documental (reportes, no landing de producto)
const display = Source_Serif_4({ subsets: ['latin'], weight: ['600', '700'], variable: '--font-display' })
// Cuerpo/UI: diseñada para legibilidad en interfaces cívicas/regulatorias densas
const sans = Public_Sans({ subsets: ['latin'], variable: '--font-sans' })
// Códigos: IDs de donante, números de unidad ISBT, timestamps — no decorativo
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Sanguis — Panel de Administración',
  description: 'Plataforma de gestión de banco de sangre',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
