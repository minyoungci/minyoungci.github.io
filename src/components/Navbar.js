'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-inner container">
                <Link href="/" className="logo">
                    Minyoungci
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ThemeToggle />
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? '✕' : '☰'}
                    </button>
                </div>

                <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                    <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Articles
                    </Link>
                    <Link href="/section/Trend" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Trend
                    </Link>
                    <Link href="/section/Research" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Research
                    </Link>
                    <Link href="/section/Series" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Series
                    </Link>
                    <Link href="/section/Life" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Life
                    </Link>
                    <Link href="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                        Write
                    </Link>
                </nav>
            </div>
        </header>
    );
}
