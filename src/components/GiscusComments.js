'use client';

import { useEffect, useState } from 'react';

export default function GiscusComments() {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        // Get initial theme
        const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
        setTheme(savedTheme);

        // Watch for theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    const newTheme = document.documentElement.getAttribute('data-theme') || 'light';
                    setTheme(newTheme);
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        // Remove existing giscus if any
        const existingScript = document.querySelector('script[src="https://giscus.app/client.js"]');
        if (existingScript) {
            existingScript.remove();
        }

        const container = document.querySelector('.giscus-container');
        if (container) {
            container.innerHTML = '';
        }

        // Add giscus script
        const script = document.createElement('script');
        script.src = 'https://giscus.app/client.js';
        script.setAttribute('data-repo', 'minyoungci/minyoungci.github.io');
        script.setAttribute('data-repo-id', ''); // You need to fill this after enabling Giscus
        script.setAttribute('data-category', 'Announcements');
        script.setAttribute('data-category-id', ''); // You need to fill this after enabling Giscus
        script.setAttribute('data-mapping', 'pathname');
        script.setAttribute('data-strict', '0');
        script.setAttribute('data-reactions-enabled', '1');
        script.setAttribute('data-emit-metadata', '0');
        script.setAttribute('data-input-position', 'bottom');
        script.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
        script.setAttribute('data-lang', 'ko');
        script.setAttribute('data-loading', 'lazy');
        script.crossOrigin = 'anonymous';
        script.async = true;

        const container2 = document.querySelector('.giscus-container');
        if (container2) {
            container2.appendChild(script);
        }
    }, [theme]);

    return (
        <div className="giscus-wrapper">
            <h3 className="comments-title">Comments</h3>
            <div className="giscus-container" />
            <style jsx>{`
                .giscus-wrapper {
                    margin-top: 48px;
                    padding-top: 32px;
                    border-top: 1px solid var(--color-border);
                }
                .comments-title {
                    font-family: var(--font-sans);
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 24px;
                    color: var(--color-text-main);
                }
                .giscus-container {
                    min-height: 200px;
                }
            `}</style>
        </div>
    );
}
