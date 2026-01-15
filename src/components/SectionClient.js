'use client';

import { useState, useEffect } from 'react';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import { supabase } from '@/lib/supabase';

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

            // Check if supabase client is available
            if (!supabase) {
                console.error("Supabase client not available");
                setError("데이터베이스 연결을 사용할 수 없습니다.");
                setLoading(false);
                return;
            }

            try {
                const { data, error: fetchError } = await supabase
                    .from('posts')
                    .select('id, title, tag, summary, image, date')
                    .eq('tag', category)
                    .order('date', { ascending: false });

                if (fetchError) {
                    console.error("Error fetching section posts:", fetchError);
                    setError("글을 불러오는데 실패했습니다.");
                } else {
                    setFilteredPosts(data || []);
                }
            } catch (err) {
                console.error("Unexpected error:", err);
                setError("예상치 못한 오류가 발생했습니다.");
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
                        글을 불러오는 중...
                    </div>
                ) : error ? (
                    <div className="empty-state animate-fade-in">
                        <div className="empty-state-icon">⚠️</div>
                        <p className="empty-state-text">{error}</p>
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
                        <div className="empty-state-icon">📝</div>
                        <p className="empty-state-text">아직 이 카테고리에 글이 없습니다.</p>
                    </div>
                )}
            </main>

            <FloatingSubscribe />
        </>
    );
}
