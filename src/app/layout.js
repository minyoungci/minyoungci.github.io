import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  metadataBase: new URL('https://minyoungci.github.io'),
  title: "The Batch Clone | AI News",
  description: "Weekly AI news and insights.",
  openGraph: {
    title: 'The Batch Clone | AI News',
    description: 'Weekly AI news and insights.',
    url: 'https://minyoungci.github.io',
    siteName: 'AI Blog',
    locale: 'ko_KR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: 'calc(100vh - 400px)' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
