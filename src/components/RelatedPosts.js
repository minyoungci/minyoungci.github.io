import Link from 'next/link';

export default function RelatedPosts({ posts }) {
    if (!posts || posts.length === 0) return null;

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <section className="related-posts">
            <h3 className="related-posts-title">You Might Also Like</h3>
            <div className="related-posts-grid">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        href={`/${post.id}`}
                        style={{
                            display: 'block',
                            padding: '24px',
                            background: 'var(--color-surface)',
                            borderRadius: 'var(--border-radius)',
                            transition: 'all 0.2s ease',
                            textDecoration: 'none'
                        }}
                    >
                        {post.image && (
                            <div style={{
                                marginBottom: '16px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                height: '140px'
                            }}>
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover'
                                    }}
                                />
                            </div>
                        )}
                        <span style={{
                            display: 'inline-block',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--color-text-muted)',
                            marginBottom: '8px'
                        }}>
                            {post.tag}
                        </span>
                        <h4 style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '16px',
                            fontWeight: '700',
                            lineHeight: '1.4',
                            color: 'var(--color-text-main)',
                            marginBottom: '8px'
                        }}>
                            {post.title}
                        </h4>
                        <span style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                            color: 'var(--color-text-muted)'
                        }}>
                            {formatDate(post.date)}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
