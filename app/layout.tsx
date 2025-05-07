import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';import './globals.css';
import { Inter, Rajdhani, IBM_Plex_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

// Font configurations
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-cyber',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-mono',
});

export const metadata = {
  title: 'CyberPulse | Predictive Cybersecurity Intelligence',
  description: 'Real-time cyber threat prediction using machine learning with data from CISA, NVD, and other authoritative sources.',
  keywords: ['cybersecurity', 'threat intelligence', 'machine learning', 'predictive analytics', 'CISA', 'NVD', 'vulnerability'],
  authors: [{ name: 'CyberPulse Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={`${inter.variable} ${rajdhani.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-cyber bg-background text-foreground">
        <div className="scanline" />
        
        {/* Page content */}
        <main>{children}</main>
        
        {/* Vercel Analytics */}
        <Analytics />
      </body>
    </html>
  );
}