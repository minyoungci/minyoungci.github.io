'use client';

import { useState, useEffect, useMemo } from 'react';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import SearchBar from '@/components/SearchBar';
import { supabase } from '@/lib/supabase';
import { SAMPLE_POSTS } from '@/lib/samplePosts';

const categories = ['Trend', 'Research', 'Series', 'Life'];

export default function Home() {
    const [allPostsData, setAllPostsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    useEffect(() => {
        async function fetchPosts() {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .order('date', { ascending: false });

                if (error || !data || data.length === 0) {
                    if (error) console.warn('Supabase unavailable, showing sample posts:', error.message);
                    setAllPostsData(SAMPLE_POSTS);
                } else {
                    setAllPostsData(data);
                }
            } catch (err) {
                console.warn('Supabase unavailable, showing sample posts:', err?.message || err);
                setAllPostsData(SAMPLE_POSTS);
            }
            setLoading(false);
        }

        fetchPosts();
    }, []);

    // Filter posts by search query, then by active category
    const filteredPosts = useMemo(() => {
        let posts = allPostsData;

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            posts = posts.filter((post) =>
                post.title?.toLowerCase().includes(query) ||
                post.summary?.toLowerCase().includes(query) ||
                post.tag?.toLowerCase().includes(query)
            );
        }

        if (activeCategory !== 'All') {
            posts = posts.filter((post) => post.tag === activeCategory);
        }

        return posts;
    }, [allPostsData, searchQuery, activeCategory]);

    const countFor = (category) => {
        if (category === 'All') return allPostsData.length;
        return allPostsData.filter((post) => post.tag === category).length;
    };

    // Featured treatment only on the untouched front page view
    const showFeatured = !searchQuery && activeCategory === 'All';

    return (
        <>
            <main className="container posts-section">
                {/* Masthead */}
                <header className="masthead animate-fade-in">
                    <h1 className="masthead-title">The Gradient</h1>
                    <p className="masthead-sub">
                        기술 트렌드, 연구, 그리고 일상. AI와 머신러닝을 중심으로 기록하는 아카이브.
                    </p>
                </header>

                {/* Search */}
                <SearchBar onSearch={setSearchQuery} placeholder="제목, 내용, 카테고리 검색..." />

                {/* Category Filter */}
                <nav className="filter-row" aria-label="Categories">
                    {['All', ...categories].map((category) => (
                        <button
                            key={category}
                            className={`filter-link${activeCategory === category ? ' active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            {category}
                            <sup className="filter-count">{countFor(category)}</sup>
                        </button>
                    ))}
                </nav>

                {loading ? (
                    <div className="loading-state">글을 불러오는 중...</div>
                ) : filteredPosts.length > 0 ? (
                    <section className="gallery-grid animate-fade-in">
                        {filteredPosts.map((post, index) => (
                            <Brief
                                key={post.id}
                                title={post.title}
                                tag={post.tag}
                                summary={post.summary}
                                image={post.image}
                                slug={post.id}
                                date={post.date}
                                featured={showFeatured && index === 0}
                                grid={true}
                            />
                        ))}
                    </section>
                ) : searchQuery ? (
                    <div className="empty-state">
                        <p className="empty-state-text">
                            "{searchQuery}"에 대한 검색 결과가 없습니다.
                        </p>
                    </div>
                ) : (
                    <div className="empty-state">
                        <p className="empty-state-text">아직 작성된 글이 없습니다.</p>
                    </div>
                )}
            </main>

            <FloatingSubscribe />
        </>
    );
}
