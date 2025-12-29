'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Subscribe() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;

        if (!supabase) {
            setStatus('error');
            setMessage('Database not connected. Please clear cache setup.');
            return;
        }

        setStatus('loading');

        try {
            const { error } = await supabase
                .from('subscribers')
                .insert([{ email }]);

            if (error) {
                if (error.code === '23505') { // Unique violation code
                    setStatus('success');
                    setMessage('You are already subscribed!');
                } else {
                    throw error;
                }
            } else {
                setStatus('success');
                setMessage('Thanks for subscribing!');
                setEmail('');
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                    type="email"
                    placeholder="Enter your email for intelligence updates..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading' || status === 'success'}
                    style={{
                        padding: '14px 24px',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        flex: 1,
                        fontSize: '15px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                    }}
                    className="subscribe-input"
                />
                <button
                    className="btn-subscribe"
                    disabled={status === 'loading'}
                    style={{
                        cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                        padding: '14px 28px'
                    }}
                >
                    {status === 'loading' ? '...' : 'Subscribe'}
                </button>
            </form>
            {message && (
                <p style={{
                    color: status === 'error' ? '#e53935' : 'var(--color-secondary)',
                    fontSize: '14px',
                    marginTop: '8px'
                }}>
                    {message}
                </p>
            )}
        </div>
    );
}
