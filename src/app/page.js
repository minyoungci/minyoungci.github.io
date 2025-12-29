'use client';

import { useState, useEffect } from 'react';
import Hero from '@/components/Hero';
import Brief from '@/components/Brief';
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
      <Hero />

      <main className="container posts-section">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }}>
            Analyzing intelligence...
          </div>
        ) : (
          <>
            {featuredPosts.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <h2 className="section-title">Featured Intelligence</h2>
                <div className="posts-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', marginBottom: '60px' }}>
                  {featuredPosts.map((post) => (
                    <Brief key={post.id} {...post} slug={post.id} />
                  ))}
                </div>
              </div>
            )}

            {regularPosts.length > 0 && (
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <h2 className="section-title">Latest Updates</h2>
                <div className="posts-grid">
                  {regularPosts.map((post) => (
                    <Brief key={post.id} {...post} slug={post.id} />
                  ))}
                </div>
              </div>
            )}

            {allPostsData.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '100px', color: 'var(--color-text-muted)' }}>
                No posts found yet. Check back later.
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
