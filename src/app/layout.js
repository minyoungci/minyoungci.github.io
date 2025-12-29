import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL('https://minyoungci.github.io'),
  title: {
    default: "The Gradient | AI & Machine Learning Insights",
    template: "%s | The Gradient"
  },
  description: "In-depth articles and analysis on artificial intelligence, machine learning, and the future of technology.",
  keywords: ["AI", "Artificial Intelligence", "Machine Learning", "Deep Learning", "Tech Blog", "Research"],
  authors: [{ name: "The Gradient Team" }],
  openGraph: {
    title: 'The Gradient',
    description: 'In-depth articles and analysis on artificial intelligence and machine learning.',
    url: 'https://minyoungci.github.io',
    siteName: 'The Gradient',
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
    title: 'The Gradient',
    description: 'In-depth AI & ML insights.',
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
