'use client';

import { useEffect } from 'react';

export default function CodeBlockEnhancer() {
  useEffect(() => {
    const addCopyButtons = () => {
      const codeBlocks = document.querySelectorAll('.article-content pre');

      codeBlocks.forEach((pre) => {
        if (pre.querySelector('.copy-button')) return;

        pre.style.position = 'relative';

        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        button.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 10px;
          font-size: 12px;
          font-family: var(--font-sans);
          background: var(--color-surface);
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          border-radius: 4px;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
        `;

        pre.addEventListener('mouseenter', () => {
          button.style.opacity = '1';
        });

        pre.addEventListener('mouseleave', () => {
          button.style.opacity = '0';
        });

        button.addEventListener('click', async () => {
          const code = pre.querySelector('code');
          const text = code ? code.textContent : pre.textContent;

          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Copied!';
            button.style.background = 'var(--color-primary)';
            button.style.color = 'var(--color-background)';

            setTimeout(() => {
              button.textContent = 'Copy';
              button.style.background = 'var(--color-surface)';
              button.style.color = 'var(--color-text-muted)';
            }, 2000);
          } catch (err) {
            button.textContent = 'Failed';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          }
        });

        pre.appendChild(button);
      });
    };

    // Run after content loads
    const timer = setTimeout(addCopyButtons, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
