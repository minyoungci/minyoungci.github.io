'use client';

import Link from 'next/link';

export default function Footer() {
    return (
        <footer style={{ background: 'var(--color-card-bg)', borderTop: '1px solid var(--color-border)', padding: '60px 0', marginTop: '60px' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '20px' }}>Subscribe to The Batch</h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '30px', maxWidth: '600px', margin: '0 auto 30px' }}>
                    Get the weekly AI news that matters. Join a community of AI engineers and enthusiasts.
                </p>
                <form style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '40px' }} onSubmit={(e) => e.preventDefault()}>
                    <input
                        type="email"
                        placeholder="Email Address"
                        style={{
                            padding: '12px 20px',
                            borderRadius: '50px',
                            border: '1px solid var(--color-border)',
                            width: '300px',
                            fontSize: '16px'
                        }}
                    />
                    <button className="btn">Subscribe</button>
                </form>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                    &copy; {new Date().getFullYear()} AI Blog. Inspired by The Batch.
                </div>
            </div>
        </footer>
    );
}
