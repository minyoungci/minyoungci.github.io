import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{ borderBottom: '1px solid var(--color-border)', height: 'var(--nav-height)', display: 'flex', alignItems: 'center' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    Minyoungci
                </Link>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Archive</Link>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Classic</Link>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Trend</Link>
                </div>
            </div>
        </nav>
    );
}
