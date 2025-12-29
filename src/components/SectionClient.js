'use client';

import { useState, useEffect } from 'react';
import Brief from '@/components/Brief';
import { supabase } from '@/lib/supabase';

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

    if (!category) return <div className="container" style={{ padding: '80px' }}>Loading...</div>;

    return (
        <main className="container posts-section">
            <header style={{ marginBottom: '60px', textAlign: 'center' }} className="animate-fade-in">
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '15px', color: 'var(--color-primary)' }}>
                    {decodeURIComponent(category)}
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.25rem' }}>
                    Curated intelligence artifacts for {decodeURIComponent(category)}
                </p>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }}>
                    Scanning {category} frequency...
                </div>
            ) : filteredPosts.length > 0 ? (
                <div className="posts-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    {filteredPosts.map((post) => (
                        <Brief
                            key={post.id}
                            slug={post.id}
                            {...post}
                        />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }} className="animate-fade-in">
                    No articles found in this section yet.
                </div>
            )}
        </main>
    );
}
