import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "The Batch Clone | AI News",
  description: "Weekly AI news and insights.",
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
