'use client';

import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
// Import common languages
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

export default function CodeBlockEnhancer() {
  useEffect(() => {
    const enhanceCodeBlocks = () => {
      const codeBlocks = document.querySelectorAll('.article-content pre');

      codeBlocks.forEach((pre) => {
        // Skip if already enhanced
        if (pre.dataset.enhanced) return;
        pre.dataset.enhanced = 'true';

        const code = pre.querySelector('code');
        if (code) {
          // Detect language from class
          const langClass = code.className.match(/language-(\w+)/);
          const lang = langClass ? langClass[1] : 'plaintext';

          // Add language label
          if (lang !== 'plaintext') {
            const langLabel = document.createElement('span');
            langLabel.className = 'code-lang-label';
            langLabel.textContent = lang.toUpperCase();
            langLabel.style.cssText = `
              position: absolute;
              top: 8px;
              left: 12px;
              font-size: 10px;
              font-family: var(--font-sans);
              font-weight: 600;
              color: #888;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            `;
            pre.appendChild(langLabel);
          }

          // Apply Prism highlighting
          try {
            if (Prism.languages[lang]) {
              code.innerHTML = Prism.highlight(
                code.textContent,
                Prism.languages[lang],
                lang
              );
            }
          } catch (e) {
            console.warn('Prism highlighting failed:', e);
          }
        }

        pre.style.position = 'relative';

        // Add copy button
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
          background: rgba(255, 255, 255, 0.1);
          color: #a0a0a0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
        `;

        pre.addEventListener('mouseenter', () => {
          button.style.opacity = '1';
        });

        pre.addEventListener('mouseleave', () => {
          button.style.opacity = '0';
        });

        button.addEventListener('click', async () => {
          const codeElement = pre.querySelector('code');
          const text = codeElement ? codeElement.textContent : pre.textContent;

          try {
            await navigator.clipboard.writeText(text);
            button.textContent = 'Copied!';
            button.style.background = 'var(--color-primary)';
            button.style.color = 'white';

            setTimeout(() => {
              button.textContent = 'Copy';
              button.style.background = 'rgba(255, 255, 255, 0.1)';
              button.style.color = '#a0a0a0';
            }, 2000);
          } catch (err) {
            button.textContent = 'Failed';
            setTimeout(() => {
              button.textContent = 'Copy';
            }, 2000);
          }
        });

        button.addEventListener('mouseenter', () => {
          button.style.background = 'rgba(255, 255, 255, 0.2)';
          button.style.color = 'white';
        });

        button.addEventListener('mouseleave', () => {
          if (button.textContent === 'Copy') {
            button.style.background = 'rgba(255, 255, 255, 0.1)';
            button.style.color = '#a0a0a0';
          }
        });

        pre.appendChild(button);
      });
    };

    // Run after content loads
    const timer = setTimeout(enhanceCodeBlocks, 100);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
