import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL('https://minyoungci.github.io'),
  title: {
    default: "Minyoungci | Tech, Life & Beyond",
    template: "%s | Minyoungci"
  },
  description: "기술 트렌드, 연구, 일상을 탐구하는 개인 블로그입니다.",
  keywords: ["Tech Blog", "Research", "Life", "Series", "Personal Blog", "Technology", "AI", "기술 블로그"],
  authors: [{ name: "Minyoungci" }],
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  alternates: {
    canonical: 'https://minyoungci.github.io'
  },
  openGraph: {
    title: 'Minyoungci',
    description: '기술 트렌드, 연구, 일상을 탐구하는 개인 블로그',
    url: 'https://minyoungci.github.io',
    siteName: 'Minyoungci',
    images: [
      {
        url: '/icon.svg',
        width: 100,
        height: 100,
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Minyoungci',
    description: 'Tech, Life & Beyond',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    }
  }
};

export default function RootLayout({ children }) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Minyoungci",
    "url": "https://minyoungci.github.io",
    "description": "기술 트렌드, 연구, 일상을 탐구하는 개인 블로그",
    "author": {
      "@type": "Person",
      "name": "Minyoungci",
      "url": "https://minyoungci.github.io"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://minyoungci.github.io/?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
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
