'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    // The admin editor needs the full viewport — keep only the registration line
    const isAdmin = pathname?.startsWith('/admin');

    return (
        <header className="header">
            {/* M—Y—C registration line: letters at left / center / right */}
            <div className="reg-line">
                <Link href="/" className="reg-mark reg-left" aria-label="Minyoungci — Home">
                    M
                </Link>
                <span className="reg-mark reg-center" aria-hidden="true">
                    Y
                    <span className="reg-arrow">↑</span>
                </span>
                <span className="reg-mark reg-right" aria-hidden="true">
                    C
                </span>
            </div>

            {!isAdmin && (
            <button
                className="mobile-menu-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
            >
                {isMenuOpen ? '✕' : '☰'}
            </button>
            )}

            {/* Desktop: right-edge vertical nav · Mobile: fullscreen overlay */}
            {!isAdmin && (
            <nav className={`nav ${isMenuOpen ? 'open' : ''}`}>
                <Link href="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Articles
                </Link>
                <Link href="/section/Science" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Science
                </Link>
                <Link href="/section/Medical" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Medical
                </Link>
                <Link href="/section/AI" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    AI
                </Link>
                <Link href="/section/Finance" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Finance
                </Link>
                <Link href="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    Write
                </Link>
            </nav>
            )}

            {/* Bottom-left edge switcher (V–A–C 'Ru / En' analog) */}
            {!isAdmin && (
            <div className="edge-theme">
                <ThemeToggle />
            </div>
            )}
        </header>
    );
}
