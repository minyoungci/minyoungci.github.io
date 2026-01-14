'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ImageLightbox() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentImage, setCurrentImage] = useState({ src: '', alt: '' });

    const openLightbox = useCallback((src, alt) => {
        setCurrentImage({ src, alt });
        setIsOpen(true);
        document.body.style.overflow = 'hidden';
    }, []);

    const closeLightbox = useCallback(() => {
        setIsOpen(false);
        document.body.style.overflow = '';
    }, []);

    useEffect(() => {
        const handleImageClick = (e) => {
            const img = e.target;
            if (img.tagName === 'IMG' && img.closest('.article-content')) {
                e.preventDefault();
                openLightbox(img.src, img.alt);
            }
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                closeLightbox();
            }
        };

        // Add click listeners to article images
        const articleContent = document.querySelector('.article-content');
        if (articleContent) {
            const images = articleContent.querySelectorAll('img');
            images.forEach(img => {
                img.style.cursor = 'zoom-in';
            });
            articleContent.addEventListener('click', handleImageClick);
        }

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            if (articleContent) {
                articleContent.removeEventListener('click', handleImageClick);
            }
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, openLightbox, closeLightbox]);

    if (!isOpen) return null;

    return (
        <div
            className="lightbox-overlay"
            onClick={closeLightbox}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(4px)',
                cursor: 'zoom-out',
                animation: 'fadeIn 0.2s ease',
            }}
        >
            <button
                onClick={closeLightbox}
                aria-label="Close lightbox"
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                }}
            >
                ×
            </button>
            <img
                src={currentImage.src}
                alt={currentImage.alt}
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    cursor: 'default',
                    animation: 'scaleIn 0.2s ease',
                }}
            />
            {currentImage.alt && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '8px 16px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'var(--font-sans)',
                        maxWidth: '80%',
                        textAlign: 'center',
                    }}
                >
                    {currentImage.alt}
                </div>
            )}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
