'use client';

import { useState, useEffect } from 'react';

export default function TableOfContents({ contentHtml }) {
  const [headings, setHeadings] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const articleContent = document.querySelector('.article-content');
      if (!articleContent) return;

      const h2s = articleContent.querySelectorAll('h2, h3');

      const items = Array.from(h2s).map((heading, index) => {
        const id = `heading-${index}`;
        heading.id = id;
        return {
          id,
          text: heading.textContent,
          level: heading.tagName === 'H2' ? 2 : 3
        };
      });

      setHeadings(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [contentHtml]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-100px 0px -70% 0px',
        threshold: 0
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const handleClick = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Don't show TOC if less than 3 headings
  if (headings.length < 3) return null;

  return (
    <nav className="toc" aria-label="Table of Contents">
      <div className="toc-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="toc-title">Contents</span>
        <span className="toc-toggle">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && (
        <ul className="toc-list">
          {headings.map(({ id, text, level }) => (
            <li
              key={id}
              className={`toc-item toc-item-${level} ${activeId === id ? 'active' : ''}`}
            >
              <a
                href={`#${id}`}
                onClick={(e) => handleClick(e, id)}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
