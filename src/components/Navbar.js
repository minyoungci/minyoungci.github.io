import Link from 'next/link';

export default function Navbar() {
    return (
        <header className="header">
            <div className="header-inner container">
                <Link href="/" className="logo">
                    Minyoungci
                </Link>

                <nav className="nav">
                    <Link href="/admin" className="nav-link">Admin</Link>
                    <Link href="/section/Classic" className="nav-link">Classic</Link>
                    <Link href="/section/Trend" className="nav-link">Trend</Link>
                    <Link href="/section/Guide" className="nav-link">Guide</Link>
                    <button className="btn-subscribe">Subscribe</button>
                </nav>
            </div>
        </header>
    );
}
