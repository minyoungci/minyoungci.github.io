import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug, date, featured = false, grid = false }) {
    // Catalog date format: '11 Jun 2026'
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    };

    const readingTime = Math.max(3, Math.ceil((summary?.length || 0) / 100));

    const metaLine = [tag, formatDate(date)].filter(Boolean).join(', ');

    // Gallery card — museum wall label: image plate, ↗ metadata, quiet title
    if (featured || grid) {
        return (
            <article className={`gallery-card${featured ? ' gallery-card-featured' : ''}`}>
                {tag && image && (
                    <span className="gallery-card-tagmark" aria-hidden="true">{tag}</span>
                )}
                <Link href={`/${slug}/`} className="gallery-card-link">
                    <div className="gallery-card-media">
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                className="gallery-card-image"
                                loading={featured ? 'eager' : 'lazy'}
                                decoding="async"
                            />
                        ) : (
                            <div className="gallery-card-placeholder">
                                <span className="gallery-card-watermark">{tag || 'Article'}</span>
                            </div>
                        )}
                    </div>
                    <span className="gallery-card-meta">
                        <span className="arrow">↗</span>
                        {metaLine}
                    </span>
                    <h2 className="gallery-card-title">{title}</h2>
                    {featured && summary && (
                        <p className="gallery-card-summary">{summary}</p>
                    )}
                </Link>
            </article>
        );
    }

    // List layout (horizontal) — section pages fallback
    return (
        <article className="card-list">
            <Link href={`/${slug}/`} className="card-list-link">
                <div className="card-list-content">
                    <div className="card-list-header">
                        {tag && <span className="card-tag-small">{tag}</span>}
                    </div>
                    <h3 className="card-list-title">{title}</h3>
                    {summary && <p className="card-list-summary">{summary}</p>}
                    <div className="card-list-meta">
                        <span>{formatDate(date)}</span>
                        <span>·</span>
                        <span>{readingTime} min read</span>
                    </div>
                </div>
                {image && (
                    <div className="card-list-image-wrapper">
                        <img
                            src={image}
                            alt={title}
                            className="card-list-image"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                )}
            </Link>
        </article>
    );
}
