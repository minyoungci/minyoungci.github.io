import Link from 'next/link';

export default function RelatedPosts({ posts }) {
    if (!posts || posts.length === 0) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };

    return (
        <section className="related-posts">
            <h3 className="related-posts-title">You Might Also Like</h3>
            <div className="related-posts-grid">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        href={`/${post.id}`}
                        className="gallery-card-link gallery-card"
                        style={{ display: 'block', textDecoration: 'none' }}
                    >
                        <div className="gallery-card-media" style={{ aspectRatio: '16 / 10', marginBottom: '12px' }}>
                            {post.image ? (
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="gallery-card-image"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="gallery-card-placeholder">
                                    <span className="gallery-card-watermark">{post.tag || 'Article'}</span>
                                </div>
                            )}
                        </div>
                        <span className="gallery-card-meta">
                            <span className="arrow">↗</span>
                            {[post.tag, formatDate(post.date)].filter(Boolean).join(', ')}
                        </span>
                        <h4 className="gallery-card-title" style={{ fontSize: '19px' }}>
                            {post.title}
                        </h4>
                    </Link>
                ))}
            </div>
        </section>
    );
}
