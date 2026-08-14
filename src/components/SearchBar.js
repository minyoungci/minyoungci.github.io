'use client';

import { useState } from 'react';

export default function SearchBar({ onSearch, placeholder = "글 검색..." }) {
    const [query, setQuery] = useState('');

    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        onSearch(value);
    };

    const handleClear = () => {
        setQuery('');
        onSearch('');
    };

    return (
        <div className="search-bar">
            <div className="search-input-wrapper">
                <svg
                    className="search-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="search-input"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="search-clear"
                        aria-label="Clear search"
                    >
                        ×
                    </button>
                )}
            </div>
            <style jsx>{`
                .search-bar {
                    margin-bottom: 40px;
                }
                .search-input-wrapper {
                    position: relative;
                    max-width: 400px;
                }
                .search-icon {
                    position: absolute;
                    left: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--color-text-light);
                    pointer-events: none;
                }
                .search-input {
                    width: 100%;
                    padding: 12px 32px;
                    font-family: var(--font-sans);
                    font-size: 15px;
                    font-weight: 400;
                    border: none;
                    border-bottom: 1px solid var(--color-text-main);
                    border-radius: 0;
                    background: transparent;
                    color: var(--color-text-main);
                    transition: all 0.2s ease;
                }
                .search-input:focus {
                    outline: none;
                    border-bottom-width: 2px;
                }
                .search-input::placeholder {
                    color: var(--color-text-light);
                }
                .search-clear {
                    position: absolute;
                    right: 0;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    border-radius: 0;
                    color: var(--color-text-main);
                    font-size: 18px;
                    cursor: pointer;
                    transition: opacity 0.2s ease;
                }
                .search-clear:hover {
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
}
