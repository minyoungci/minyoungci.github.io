'use client';

import { useState, useEffect, useRef } from 'react';

export default function TextHighlightShare() {
  const [selection, setSelection] = useState(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    const handleSelection = () => {
      const selected = window.getSelection();
      const text = selected?.toString().trim();

      if (text && text.length > 10 && text.length < 500) {
        const range = selected.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelection(text);
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10 + window.scrollY
        });
        setCopied(false);
      } else {
        setSelection(null);
      }
    };

    const handleClick = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        // Small delay to allow button clicks to register
        setTimeout(() => {
          const selected = window.getSelection();
          if (!selected?.toString().trim()) {
            setSelection(null);
          }
        }, 100);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('mousedown', handleClick);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('mousedown', handleClick);
    };
  }, []);

  const shareOnTwitter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`"${selection}"`);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      '_blank',
      'width=550,height=420'
    );
  };

  const copyToClipboard = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(selection);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setSelection(null);
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!selection) return null;

  return (
    <div
      ref={tooltipRef}
      className="highlight-share-tooltip"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <button onClick={shareOnTwitter} title="Share on Twitter">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </button>
      <button onClick={copyToClipboard} title={copied ? 'Copied!' : 'Copy text'}>
        {copied ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
