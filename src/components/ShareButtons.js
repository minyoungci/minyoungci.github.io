'use client';

import { useState } from 'react';

export default function ShareButtons({ title, summary }) {
    const [copied, setCopied] = useState(false);

    const getUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.href;
        }
        return '';
    };

    const shareOnTwitter = () => {
        const url = encodeURIComponent(getUrl());
        const text = encodeURIComponent(title);
        window.open(
            `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareOnFacebook = () => {
        const url = encodeURIComponent(getUrl());
        window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const shareOnLinkedIn = () => {
        const url = encodeURIComponent(getUrl());
        const titleEncoded = encodeURIComponent(title);
        const summaryEncoded = encodeURIComponent(summary || '');
        window.open(
            `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${titleEncoded}&summary=${summaryEncoded}`,
            '_blank',
            'width=550,height=420'
        );
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(getUrl());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const buttonStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px solid var(--color-border)',
        background: 'var(--color-background)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        color: 'var(--color-text-muted)',
    };

    return (
        <div className="share-buttons">
            <span className="share-label">Share</span>
            <div className="share-icons">
                <button
                    onClick={shareOnTwitter}
                    style={buttonStyle}
                    title="Share on X (Twitter)"
                    aria-label="Share on X"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                </button>
                <button
                    onClick={shareOnFacebook}
                    style={buttonStyle}
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                </button>
                <button
                    onClick={shareOnLinkedIn}
                    style={buttonStyle}
                    title="Share on LinkedIn"
                    aria-label="Share on LinkedIn"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                </button>
                <button
                    onClick={copyLink}
                    style={{
                        ...buttonStyle,
                        background: copied ? 'var(--color-primary)' : 'var(--color-background)',
                        color: copied ? 'white' : 'var(--color-text-muted)',
                        borderColor: copied ? 'var(--color-primary)' : 'var(--color-border)',
                    }}
                    title={copied ? 'Link copied!' : 'Copy link'}
                    aria-label="Copy link"
                >
                    {copied ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                    )}
                </button>
            </div>
            <style jsx>{`
                .share-buttons {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid var(--color-border);
                }
                .share-label {
                    font-family: var(--font-sans);
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text-muted);
                }
                .share-icons {
                    display: flex;
                    gap: 8px;
                }
                .share-icons button:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
}
