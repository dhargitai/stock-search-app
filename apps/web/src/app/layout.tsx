import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TRPCProvider } from '@/components/providers/trpc-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Peak Finance - Stock Search Application',
  description: 'Search and analyze stocks with comprehensive financial data',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' data-theme='peak-finance'>
      <body className={inter.className}>
        <TRPCProvider>
          <main className='min-h-screen'>{children}</main>
        </TRPCProvider>
      </body>
    </html>
  );
}