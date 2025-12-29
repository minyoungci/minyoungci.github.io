import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug }) {
    return (
        <article className="card">
            <Link href={`/${slug}`} className="card-link" aria-label={`Read more about ${title}`} />
            {image && (
                <img
                    src={image}
                    alt={`Cover for blog post: ${title}`}
                    className="card-image"
                />
            )}
            <div className="card-content">
                <span className="card-tag">{tag}</span>
                <h3 className="card-title">{title}</h3>
                <p className="card-summary">{summary}</p>
                <div className="card-meta">
                    <span>Analysis Insight</span>
                    <span style={{ fontSize: '10px' }}>●</span>
                    <span>Read More →</span>
                </div>
            </div>
        </article>
    );
}
