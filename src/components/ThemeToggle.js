'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
    const [theme, setTheme] = useState('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    const setMode = (mode) => {
        setTheme(mode);
        localStorage.setItem('theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
    };

    return (
        <>
            <span className="theme-switcher" style={{ opacity: mounted ? 1 : 0 }}>
                <button
                    className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => setMode('light')}
                    aria-label="Switch to light mode"
                >
                    Light
                </button>
                <span className="theme-sep" aria-hidden="true">/</span>
                <button
                    className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => setMode('dark')}
                    aria-label="Switch to dark mode"
                >
                    Dark
                </button>
            </span>
            <style jsx>{`
                .theme-switcher {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: var(--font-sans);
                    font-size: 14px;
                    transition: opacity 0.3s ease;
                }

                .theme-option {
                    background: none;
                    border: none;
                    padding: 0;
                    font-family: inherit;
                    font-size: 14px;
                    font-weight: 400;
                    color: var(--color-text-light);
                    cursor: pointer;
                    transition: color 0.15s ease;
                }

                .theme-option:hover {
                    color: var(--color-text-main);
                }

                .theme-option.active {
                    color: var(--color-text-main);
                    text-decoration: underline;
                    text-underline-offset: 4px;
                }

                .theme-sep {
                    color: var(--color-text-light);
                }
            `}</style>
        </>
    );
}
