import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';

import { SonnerProvider } from '@/components/providers/sonner-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
});

export const metadata: Metadata = {
  title: 'Finora',
  description: 'Smart personal finance management built with Next.js 15, Prisma, and Supabase.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${manrope.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <SonnerProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}