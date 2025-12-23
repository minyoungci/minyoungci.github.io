'use client';

import Link from 'next/link';
import Subscribe from './Subscribe';

export default function Footer() {
    return (
        <footer style={{ background: 'var(--color-card-bg)', borderTop: '1px solid var(--color-border)', padding: '60px 0', marginTop: '60px' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px' }}>Subscribe to The Batch</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
                    Get the weekly AI news that matters. Join a community of AI engineers and enthusiasts.
                </p>
                <Subscribe />
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '40px' }}>
                    &copy; 2025 Minyoungci. (v2.0)
                </div>
            </div>
        </footer>
    );
}
