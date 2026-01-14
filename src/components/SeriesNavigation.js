'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SeriesNavigation({ currentPostId, seriesName }) {
    const [seriesPosts, setSeriesPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!seriesName) {
            setLoading(false);
            return;
        }

        async function fetchSeriesPosts() {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, date')
                .eq('series', seriesName)
                .order('date', { ascending: true });

            if (!error && data) {
                setSeriesPosts(data);
            }
            setLoading(false);
        }

        fetchSeriesPosts();
    }, [seriesName]);

    if (loading || !seriesName || seriesPosts.length <= 1) {
        return null;
    }

    const currentIndex = seriesPosts.findIndex(post => post.id === currentPostId);
    const prevPost = currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
    const nextPost = currentIndex < seriesPosts.length - 1 ? seriesPosts[currentIndex + 1] : null;

    return (
        <div className="series-navigation">
            <div className="series-header">
                <span className="series-label">Series</span>
                <h3 className="series-name">{seriesName}</h3>
                <span className="series-progress">
                    {currentIndex + 1} / {seriesPosts.length}
                </span>
            </div>

            <div className="series-list">
                {seriesPosts.map((post, index) => (
                    <Link
                        key={post.id}
                        href={`/${post.id}/`}
                        className={`series-item ${post.id === currentPostId ? 'current' : ''}`}
                    >
                        <span className="series-number">{index + 1}</span>
                        <span className="series-title">{post.title}</span>
                        {post.id === currentPostId && (
                            <span className="series-current-badge">현재 글</span>
                        )}
                    </Link>
                ))}
            </div>

            <div className="series-nav-buttons">
                {prevPost && (
                    <Link href={`/${prevPost.id}/`} className="series-nav-btn prev">
                        <span className="nav-direction">← 이전</span>
                        <span className="nav-title">{prevPost.title}</span>
                    </Link>
                )}
                {nextPost && (
                    <Link href={`/${nextPost.id}/`} className="series-nav-btn next">
                        <span className="nav-direction">다음 →</span>
                        <span className="nav-title">{nextPost.title}</span>
                    </Link>
                )}
            </div>

            <style jsx>{`
                .series-navigation {
                    background: var(--color-surface);
                    border: 1px solid var(--color-border);
                    border-radius: var(--border-radius-lg);
                    padding: 24px;
                    margin: 32px 0;
                }
                .series-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--color-border);
                }
                .series-label {
                    font-family: var(--font-sans);
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--color-primary);
                    background: rgba(26, 137, 23, 0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .series-name {
                    font-family: var(--font-sans);
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--color-text-main);
                    margin: 0;
                    flex: 1;
                }
                .series-progress {
                    font-family: var(--font-sans);
                    font-size: 13px;
                    color: var(--color-text-muted);
                }
                .series-list {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 20px;
                }
                .series-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: var(--border-radius);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .series-item:hover {
                    background: var(--color-background);
                }
                .series-item.current {
                    background: var(--color-background);
                    border: 1px solid var(--color-primary);
                }
                .series-number {
                    font-family: var(--font-mono);
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--color-text-muted);
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--color-border);
                    border-radius: 50%;
                }
                .series-item.current .series-number {
                    background: var(--color-primary);
                    color: white;
                }
                .series-title {
                    font-family: var(--font-sans);
                    font-size: 14px;
                    color: var(--color-text-main);
                    flex: 1;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .series-current-badge {
                    font-family: var(--font-sans);
                    font-size: 11px;
                    font-weight: 500;
                    color: var(--color-primary);
                }
                .series-nav-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }
                .series-nav-btn {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 12px;
                    background: var(--color-background);
                    border: 1px solid var(--color-border);
                    border-radius: var(--border-radius);
                    text-decoration: none;
                    transition: all 0.2s ease;
                }
                .series-nav-btn:hover {
                    border-color: var(--color-primary);
                }
                .series-nav-btn.next {
                    text-align: right;
                }
                .nav-direction {
                    font-family: var(--font-sans);
                    font-size: 12px;
                    color: var(--color-text-muted);
                }
                .nav-title {
                    font-family: var(--font-sans);
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--color-text-main);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                @media (max-width: 480px) {
                    .series-nav-buttons {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
}
