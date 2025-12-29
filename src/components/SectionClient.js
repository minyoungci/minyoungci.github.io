'use client';

import { useState, useEffect } from 'react';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import { supabase } from '@/lib/supabase';

const categoryDescriptions = {
    'Classic': 'Timeless articles and foundational concepts in AI and machine learning.',
    'Trend': 'The latest developments and emerging trends in artificial intelligence.',
    'Guide': 'Practical tutorials and how-to guides for AI practitioners.',
    'News': 'Breaking news and updates from the AI industry.'
};

export default function SectionClient({ category }) {
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!category) return;

        async function fetchPosts() {
            setLoading(true);
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('tag', category)
                .order('date', { ascending: false });

            if (error) {
                console.error("Error fetching section posts:", error);
            } else {
                setFilteredPosts(data || []);
            }
            setLoading(false);
        }

        fetchPosts();
    }, [category]);

    if (!category) return <div className="loading-state">Loading...</div>;

    const decodedCategory = decodeURIComponent(category);

    return (
        <>
            <main className="container posts-section">
                <header className="animate-fade-in" style={{ marginBottom: '48px' }}>
                    <h1 style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        marginBottom: '12px',
                        color: 'var(--color-text-main)'
                    }}>
                        {decodedCategory}
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '18px',
                        color: 'var(--color-text-muted)',
                        maxWidth: '600px'
                    }}>
                        {categoryDescriptions[decodedCategory] || `Articles tagged with ${decodedCategory}`}
                    </p>
                </header>

                {loading ? (
                    <div className="loading-state">
                        Loading articles...
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="posts-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        {filteredPosts.map((post) => (
                            <Brief
                                key={post.id}
                                title={post.title}
                                tag={post.tag}
                                summary={post.summary}
                                image={post.image}
                                slug={post.id}
                                date={post.date}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">📂</div>
                        <p className="empty-state-text">No articles in this category yet.</p>
                    </div>
                )}
            </main>

            <FloatingSubscribe />
        </>
    );
}
