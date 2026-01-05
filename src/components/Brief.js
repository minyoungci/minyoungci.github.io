import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug, date, featured = false, grid = false }) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const readingTime = Math.max(3, Math.ceil((summary?.length || 0) / 100));

    // Featured Post Layout (Large Hero Style)
    if (featured) {
        return (
            <article className="card-featured">
                <Link href={`/${slug}/`} className="card-featured-link">
                    <div className="card-featured-image-wrapper">
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                className="card-featured-image"
                                loading="eager"
                                decoding="async"
                            />
                        ) : (
                            <div className="card-featured-placeholder" />
                        )}
                    </div>
                    <div className="card-featured-content">
                        {tag && <span className="card-tag">{tag}</span>}
                        <h2 className="card-featured-title">{title}</h2>
                        {summary && <p className="card-featured-summary">{summary}</p>}
                        <div className="card-author">
                            <img src="/icon.svg" alt="Minyoungci" className="card-author-avatar" />
                            <div className="card-author-info">
                                <span className="card-author-name">Minyoungci</span>
                                <span className="card-author-meta">
                                    {formatDate(date)} · {readingTime} min read
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    // Grid Card Layout (3-column)
    if (grid) {
        return (
            <article className="card-grid">
                <Link href={`/${slug}/`} className="card-grid-link">
                    <div className="card-grid-image-wrapper">
                        {image ? (
                            <img
                                src={image}
                                alt={title}
                                className="card-grid-image"
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className="card-grid-placeholder" />
                        )}
                    </div>
                    <div className="card-grid-content">
                        <h3 className="card-grid-title">{title}</h3>
                        {summary && <p className="card-grid-summary">{summary}</p>}
                        <div className="card-grid-meta">
                            <span>{formatDate(date)}</span>
                            <span>·</span>
                            <span>{readingTime} min</span>
                        </div>
                    </div>
                </Link>
            </article>
        );
    }

    // List Post Layout (Horizontal Style) - for section pages
    return (
        <article className="card-list">
            <Link href={`/${slug}/`} className="card-list-link">
                <div className="card-list-content">
                    <div className="card-list-header">
                        <div className="card-author-small">
                            <img src="/icon.svg" alt="Minyoungci" className="card-author-avatar-small" />
                            <span className="card-author-name-small">Minyoungci</span>
                        </div>
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
