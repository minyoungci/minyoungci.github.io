import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Inter, Outfit } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  metadataBase: new URL('https://minyoungci.github.io'),
  title: {
    default: "AI Intelligence Blog | Deep Insights for Leaders",
    template: "%s | AI Intelligence"
  },
  description: "Weekly AI news, deep analysis, and intelligence for engineers and leaders. Stay ahead of the curve.",
  keywords: ["AI", "Artificial Intelligence", "Machine Learning", "Tech Blog", "Engineering"],
  authors: [{ name: "AI Editorial Team" }],
  openGraph: {
    title: 'AI Intelligence Blog',
    description: 'Weekly AI news, deep analysis, and intelligence for engineers and leaders.',
    url: 'https://minyoungci.github.io',
    siteName: 'AI Intelligence',
    images: [
      {
        url: '/favicon.ico', // Fallback image
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Intelligence Blog',
    description: 'Weekly AI news and deep insights.',
    images: ['/favicon.ico'],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true} className={`${inter.variable} ${outfit.variable}`}>
      <body className={inter.className} suppressHydrationWarning={true}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 400px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
