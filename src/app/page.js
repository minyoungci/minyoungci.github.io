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

  return (
    <>
      <Hero />
      <section className="container" style={{ padding: '40px 20px 80px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px' }}>Loading updates...</div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '40px'
          }}>
            {allPostsData.map(({ id, date, title, tag, summary, image }) => (
              <Brief
                key={id}
                slug={id}
                title={title}
                tag={tag}
                summary={summary}
                image={image}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
