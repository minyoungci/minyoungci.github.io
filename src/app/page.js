'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import SearchBar from '@/components/SearchBar';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [allPostsData, setAllPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setAllPostsData(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return allPostsData;
    const query = searchQuery.toLowerCase();
    return allPostsData.filter(post =>
      post.title?.toLowerCase().includes(query) ||
      post.summary?.toLowerCase().includes(query) ||
      post.tag?.toLowerCase().includes(query)
    );
  }, [allPostsData, searchQuery]);

  const featuredPost = searchQuery ? null : allPostsData[0];
  const remainingPosts = searchQuery ? filteredPosts : allPostsData.slice(1);

  // Group posts by category
  const categories = ['Trend', 'Research', 'Series', 'Life'];
  const postsByCategory = categories.reduce((acc, category) => {
    acc[category] = remainingPosts.filter(post => post.tag === category);
    return acc;
  }, {});

  return (
    <>
      <main className="container posts-section">
        {/* Search Bar */}
        <SearchBar onSearch={setSearchQuery} placeholder="제목, 내용, 카테고리 검색..." />

        {loading ? (
          <div className="loading-state">
            글을 불러오는 중...
          </div>
        ) : allPostsData.length > 0 ? (
          <section className="animate-fade-in">
            {/* Search Results */}
            {searchQuery ? (
              <div className="search-results">
                <div className="category-header">
                  <h2 className="category-title">
                    검색 결과 ({filteredPosts.length}건)
                  </h2>
                  {filteredPosts.length > 0 && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="category-link"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      검색 초기화
                    </button>
                  )}
                </div>
                {filteredPosts.length > 0 ? (
                  <div className="posts-grid-3">
                    {filteredPosts.map((post) => (
                      <Brief
                        key={post.id}
                        title={post.title}
                        tag={post.tag}
                        summary={post.summary}
                        image={post.image}
                        slug={post.id}
                        date={post.date}
                        featured={false}
                        grid={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <p className="empty-state-text">
                      "{searchQuery}"에 대한 검색 결과가 없습니다.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Featured Post */}
                {featuredPost && (
                  <div className="featured-post">
                    <Brief
                      key={featuredPost.id}
                      title={featuredPost.title}
                      tag={featuredPost.tag}
                      summary={featuredPost.summary}
                      image={featuredPost.image}
                      slug={featuredPost.id}
                      date={featuredPost.date}
                      featured={true}
                    />
                  </div>
                )}

                {/* Posts by Category */}
                {categories.map(category => {
                  const posts = postsByCategory[category];
                  if (!posts || posts.length === 0) return null;

                  return (
                    <div key={category} className="category-section">
                      <div className="category-header">
                        <h2 className="category-title">{category}</h2>
                        <Link href={`/section/${category}/`} className="category-link">
                          모두 보기 →
                        </Link>
                      </div>
                      <div className="posts-grid-3">
                        {posts.slice(0, 6).map((post) => (
                          <Brief
                            key={post.id}
                            title={post.title}
                            tag={post.tag}
                            summary={post.summary}
                            image={post.image}
                            slug={post.id}
                            date={post.date}
                            featured={false}
                            grid={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </section>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">아직 작성된 글이 없습니다.</p>
          </div>
        )}
      </main>

      <FloatingSubscribe />
    </>
  );
}
