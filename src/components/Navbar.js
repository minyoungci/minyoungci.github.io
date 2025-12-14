import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{ borderBottom: '1px solid var(--color-border)', height: 'var(--nav-height)', display: 'flex', alignItems: 'center' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    The Batch Clone
                </Link>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Archive</Link>
                    <Link href="/" style={{ color: 'var(--color-text-muted)' }}>Subscribe</Link>
                </div>
            </div>
        </nav>
    );
}
