'use client';

import { useState, useEffect } from 'react';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import { supabase } from '@/lib/supabase';
import { SAMPLE_POSTS } from '@/lib/samplePosts';

const categoryDescriptions = {
    'Trend': 'The latest developments and emerging trends in technology and AI.',
    'Research': 'Deep dives into academic research, papers, and technical analysis.',
    'Series': 'Multi-part articles and curated collections on specific topics.',
    'Life': 'Personal reflections, experiences, and life lessons.'
};

export default function SectionClient({ category }) {
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!category) return;

        async function fetchPosts() {
            setLoading(true);
            setError(null);

            const decodedTag = decodeURIComponent(category);
            let supabasePosts = [];
            let localPosts = [];

            if (supabase) {
                try {
                    const { data, error: fetchError } = await supabase
                        .from('posts')
                        .select('id, title, tag, summary, image, date')
                        .eq('tag', category)
                        .order('date', { ascending: false });
                    if (!fetchError && data) supabasePosts = data;
                } catch (err) {
                    console.warn("Supabase unavailable:", err?.message || err);
                }
            }

            try {
                const res = await fetch('/posts-index.json');
                if (res.ok) {
                    const index = await res.json();
                    localPosts = index.filter((post) => post.tag === decodedTag);
                }
            } catch (err) {
                console.warn("Local post index unavailable:", err?.message || err);
            }

            const seen = new Set(supabasePosts.map((post) => post.id));
            const merged = [
                ...supabasePosts,
                ...localPosts.filter((post) => !seen.has(post.id))
            ].sort((a, b) => (a.date < b.date ? 1 : -1));

            setFilteredPosts(merged.length > 0
                ? merged
                : SAMPLE_POSTS.filter((post) => post.tag === decodedTag));
            setLoading(false);
        }

        fetchPosts();
    }, [category]);

    if (!category) return <div className="loading-state">Loading...</div>;

    const decodedCategory = decodeURIComponent(category);

    return (
        <>
            <main className="container posts-section">
                <header className="masthead animate-fade-in">
                    <h1 className="masthead-title">{decodedCategory}</h1>
                    <p className="masthead-sub">
                        {categoryDescriptions[decodedCategory] || `Articles tagged with ${decodedCategory}`}
                    </p>
                </header>

                {loading ? (
                    <div className="loading-state">
                        글을 불러오는 중...
                    </div>
                ) : error ? (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">⚠️</div>
                        <p className="empty-state-text">{error}</p>
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div className="gallery-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        {filteredPosts.map((post) => (
                            <Brief
                                key={post.id}
                                title={post.title}
                                tag={post.tag}
                                summary={post.summary}
                                image={post.image}
                                slug={post.id}
                                date={post.date}
                                grid={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">📝</div>
                        <p className="empty-state-text">아직 이 카테고리에 글이 없습니다.</p>
                    </div>
                )}
            </main>

            <FloatingSubscribe />
        </>
    );
}
