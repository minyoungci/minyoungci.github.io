'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-inner container">
                <Link href="/" className="logo">
                    The Gradient
                </Link>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                    <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Articles
                    </Link>
                    <Link href="/section/Classic" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Classic
                    </Link>
                    <Link href="/section/Trend" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Trend
                    </Link>
                    <Link href="/section/Guide" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Guide
                    </Link>
                    <Link href="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Write
                    </Link>
                    <button className="btn-subscribe">
                        Subscribe
                    </button>
                </nav>
            </div>
        </header>
    );
}
