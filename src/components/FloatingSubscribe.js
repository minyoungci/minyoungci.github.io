'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function FloatingSubscribe() {
    const [isOpen, setIsOpen] = useState(false);
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            setStatus('error');
            setMessage('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        try {
            const { error } = await supabase
                .from('subscribers')
                .insert([{ email }]);

            if (error) {
                if (error.code === '23505') {
                    setStatus('error');
                    setMessage('This email is already subscribed.');
                } else {
                    throw error;
                }
            } else {
                setStatus('success');
                setMessage('Thank you for subscribing!');
                setEmail('');
                setTimeout(() => {
                    setIsOpen(false);
                    setStatus('idle');
                    setMessage('');
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setMessage('Something went wrong. Please try again.');
            console.error('Subscribe error:', error);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <div className="floating-subscribe">
                <button
                    className="floating-subscribe-btn"
                    onClick={() => setIsOpen(true)}
                >
                    <span>✉</span>
                    <span>Subscribe</span>
                </button>
            </div>

            {/* Modal */}
            <div
                className={`subscribe-modal ${isOpen ? 'open' : ''}`}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setIsOpen(false);
                        setStatus('idle');
                        setMessage('');
                    }
                }}
            >
                <div className="subscribe-modal-content" style={{ position: 'relative' }}>
                    <button
                        className="subscribe-close"
                        onClick={() => {
                            setIsOpen(false);
                            setStatus('idle');
                            setMessage('');
                        }}
                    >
                        ×
                    </button>

                    <h2 className="subscribe-modal-title">Stay Updated</h2>
                    <p className="subscribe-modal-desc">
                        Get the latest articles and insights delivered directly to your inbox.
                    </p>

                    {status === 'success' ? (
                        <div style={{
                            padding: '20px',
                            background: 'var(--color-surface)',
                            borderRadius: '8px',
                            color: 'var(--color-text-main)'
                        }}>
                            {message}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="subscribe-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className="subscribe-input"
                                disabled={status === 'loading'}
                            />
                            <button
                                type="submit"
                                className="subscribe-btn"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
                            </button>
                        </form>
                    )}

                    {status === 'error' && (
                        <p style={{
                            marginTop: '16px',
                            color: '#e74c3c',
                            fontSize: '14px'
                        }}>
                            {message}
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}
