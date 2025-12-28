
import Brief from '@/components/Brief';
import { getSortedPostsData } from '@/lib/posts';

export async function generateStaticParams() {
    try {
        // Define the categories we want to generate pages for
        // We can also extract this dynamically from all posts if we want
        const posts = await getSortedPostsData();
        const tags = new Set(posts ? posts.map(post => post.tag) : []);

        // Always ensure default categories exist
        tags.add('Classic');
        tags.add('Trend');
        tags.add('Guide');
        tags.add('News');

        return Array.from(tags).map(tag => ({
            category: tag,
        })).filter(p => p.category);
    } catch (error) {
        console.error("Error generating section params:", error);
        return [
            { category: 'Classic' },
            { category: 'Trend' },
            { category: 'Guide' },
            { category: 'News' }
        ];
    }
}

export default async function Section({ params }) {
    const { category } = await params;
    const allPostsData = await getSortedPostsData();
    if (!allPostsData) return <div className="container" style={{ padding: '80px' }}>Error loading posts.</div>;

    // Filter posts by category (Case insensitive)
    const filteredPosts = allPostsData.filter(post =>
        post.tag && post.tag.toLowerCase() === category.toLowerCase()
    );

    return (
        <>
            <section className="container" style={{ padding: '80px 20px 40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '20px', textTransform: 'capitalize' }}>
                    {category}
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '18px' }}>
                    Curated articles for {category}
                </p>
            </section>

            <section className="container" style={{ padding: '40px 20px 80px' }}>
                {filteredPosts.length > 0 ? (
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
                        No articles found in this section yet.
                    </div>
                )}
            </section>
        </>
    );
}
