import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL('https://minyoungci.github.io'),
  title: {
    default: "Minyoungci | Tech, Life & Beyond",
    template: "%s | Minyoungci"
  },
  description: "Personal blog exploring technology trends, research insights, life experiences, and curated series.",
  keywords: ["Tech Blog", "Research", "Life", "Series", "Personal Blog", "Technology"],
  authors: [{ name: "Minyoungci" }],
  openGraph: {
    title: 'Minyoungci',
    description: 'Personal blog exploring technology trends, research, and life.',
    url: 'https://minyoungci.github.io',
    siteName: 'Minyoungci',
    images: [
      {
        url: '/favicon.ico',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Minyoungci',
    description: 'Tech, Life & Beyond',
    images: ['/favicon.ico'],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body suppressHydrationWarning={true}>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 300px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
