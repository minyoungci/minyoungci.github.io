import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner container">
                <div className="footer-text">
                    &copy; {new Date().getFullYear()} Minyoungci Blog. All rights reserved.
                </div>
                <div className="footer-links">
                    <Link href="/admin" className="footer-link">Admin Access</Link>
                    <Link href="/sitemap.xml" className="footer-link">Sitemap</Link>
                </div>
            </div>
        </footer>
    );
}
