'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import ServiceStatusBanner from '../components/ServiceStatusBanner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NewsAgent</title>
        <meta name="description" content="Privacy-first news aggregation with local AI ranking and summarization" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <ServiceStatusBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
