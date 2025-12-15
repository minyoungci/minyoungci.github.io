import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="glass-nav" style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: 'var(--nav-height)',
            display: 'flex',
            alignItems: 'center'
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    Minyoungci
                </Link>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Archive</Link>
                    <Link href="/section/Classic" style={{ color: 'var(--color-text-muted)' }}>Classic</Link>
                    <Link href="/section/Trend" style={{ color: 'var(--color-text-muted)' }}>Trend</Link>
                </div>
            </div>
        </nav>
    );
}
