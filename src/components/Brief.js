import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug, date }) {
    // Format date if provided
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate reading time (rough estimate)
    const readingTime = Math.max(3, Math.ceil((summary?.length || 0) / 100));

    return (
        <article className="card">
            <Link href={`/${slug}`} className="card-link" aria-label={`Read more about ${title}`} />

            {/* Share buttons on hover */}
            <div className="card-share">
                <button
                    className="share-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.origin + '/' + slug)}`, '_blank');
                    }}
                    title="Share on Twitter"
                >
                    𝕏
                </button>
                <button
                    className="share-btn"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigator.clipboard.writeText(window.location.origin + '/' + slug);
                        alert('Link copied!');
                    }}
                    title="Copy link"
                >
                    🔗
                </button>
            </div>

            {image && (
                <div style={{ overflow: 'hidden', borderRadius: 'var(--border-radius)' }}>
                    <img
                        src={image}
                        alt={`Cover for: ${title}`}
                        className="card-image"
                    />
                </div>
            )}

            <div className="card-content">
                {tag && <span className="card-tag">{tag}</span>}
                <h3 className="card-title">{title}</h3>
                {summary && <p className="card-summary">{summary}</p>}
                <div className="card-meta">
                    {date && <span>{formatDate(date)}</span>}
                    {date && <span style={{ opacity: 0.5 }}>•</span>}
                    <span>{readingTime} min read</span>
                </div>
            </div>
        </article>
    );
}
