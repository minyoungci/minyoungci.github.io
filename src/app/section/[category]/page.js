import Brief from '@/components/Brief';
import { getSortedPostsData } from '@/lib/posts';

export function generateStaticParams() {
    // Define the categories we want to generate pages for
    // We can also extract this dynamically from all posts if we want
    const posts = getSortedPostsData();
    const tags = new Set(posts.map(post => post.tag));
    // Also explicitly add the menu items to ensure they exist even if empty
    tags.add('Classic');
    tags.add('Trend');

    return Array.from(tags).map(tag => ({
        category: tag,
    }));
}

export default async function Section({ params }) {
    const { category } = await params;
    const allPostsData = getSortedPostsData();

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
