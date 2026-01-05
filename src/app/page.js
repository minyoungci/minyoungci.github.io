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

  return (
    <>
      <main className="container posts-section">
        {loading ? (
          <div className="loading-state">
            Loading articles...
          </div>
        ) : allPostsData.length > 0 ? (
          <section className="animate-fade-in">
            <h2 className="section-title">Latest Articles</h2>
            <div className="posts-grid">
              {allPostsData.map((post) => (
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
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p className="empty-state-text">No articles published yet.</p>
          </div>
        )}
      </main>

      <FloatingSubscribe />
    </>
  );
}
