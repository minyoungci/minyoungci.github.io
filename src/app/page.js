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

  const featuredPost = allPostsData[0];
  const remainingPosts = allPostsData.slice(1);

  return (
    <>
      <main className="container posts-section">
        {loading ? (
          <div className="loading-state">
            Loading articles...
          </div>
        ) : allPostsData.length > 0 ? (
          <section className="animate-fade-in">
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

            {/* Post List */}
            {remainingPosts.length > 0 && (
              <div className="posts-list">
                {remainingPosts.map((post) => (
                  <Brief
                    key={post.id}
                    title={post.title}
                    tag={post.tag}
                    summary={post.summary}
                    image={post.image}
                    slug={post.id}
                    date={post.date}
                    featured={false}
                  />
                ))}
              </div>
            )}
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
