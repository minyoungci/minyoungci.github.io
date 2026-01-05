import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug, date }) {
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

    return (
        <div className="card-wrapper">
            <article className="card">
                <Link href={`/${slug}/`} className="card-link" aria-label={`Read: ${title}`} />

                {/* Share buttons */}
                <div className="card-share">
                    <button
                        className="share-btn"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.origin + '/' + slug + '/')}`, '_blank');
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
                            navigator.clipboard.writeText(window.location.origin + '/' + slug + '/');
                        }}
                        title="Copy link"
                    >
                        🔗
                    </button>
                </div>

                {image && (
                    <div className="card-image-wrapper">
                        <img
                            src={image}
                            alt={title}
                            className="card-image"
                            loading="lazy"
                            decoding="async"
                            width={400}
                            height={225}
                        />
                    </div>
                )}

                <div className="card-content">
                    {tag && <span className="card-tag">{tag}</span>}
                    <h3 className="card-title">{title}</h3>
                    {summary && <p className="card-summary">{summary}</p>}
                    <div className="card-meta">
                        {date && <span>{formatDate(date)}</span>}
                        {date && <span>•</span>}
                        <span>{readingTime} min read</span>
                    </div>
                </div>
            </article>
        </div>
    );
}
