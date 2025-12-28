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
        <>
            <section className="container" style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', textTransform: 'capitalize' }}>
                    {decodeURIComponent(category)}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>
                    Curated articles for {decodeURIComponent(category)}
                </p>
            </section>

            <section className="container" style={{ padding: '40px 20px 80px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                        Loading articles...
                    </div>
                ) : filteredPosts.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '40px'
                    }}>
                        {filteredPosts.map(({ id, date, title, tag, summary, image }) => (
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
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
                        No articles found in this section.
                    </div>
                )}
            </section>
        </>
    );
}
