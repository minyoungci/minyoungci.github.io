'use client';

import { useState, useEffect } from 'react';
import Brief from '@/components/Brief';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [allPostsData, setAllPostsData] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const featuredPosts = allPostsData.slice(0, 2);
  const regularPosts = allPostsData.slice(2);

  return (
    <>
      <main className="container posts-section">
        {loading ? (
          <div className="loading-state">
            Loading articles...
          </div>
        ) : (
          <>
            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <section className="animate-fade-in">
                <h2 className="section-title">Featured Articles</h2>
                <div className="posts-grid" style={{ marginBottom: '60px' }}>
                  {featuredPosts.map((post) => (
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
              </section>
            )}

            {/* Latest Posts */}
            {regularPosts.length > 0 && (
              <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="section-title">Latest Articles</h2>
                <div className="posts-grid">
                  {regularPosts.map((post) => (
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
              </section>
            )}

            {/* Empty State */}
            {allPostsData.length === 0 && !loading && (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <p className="empty-state-text">No articles published yet. Check back soon!</p>
              </div>
            )}
          </>
        )}
      </main>

      <FloatingSubscribe />
    </>
  );
}
