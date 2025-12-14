import Link from 'next/link';

export default function Brief({ title, tag, summary, image, slug }) {
    return (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {image && (
                <div style={{ position: 'relative', height: '200px', width: '100%' }}>
                    {/* Using standard img for static export compatibility if domain not configured, 
               but using next/image with unoptimized: true handles it too. */}
                    <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{
                    color: 'var(--color-accent-purple)',
                    fontWeight: '600',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '12px'
                }}>
                    {tag}
                </span>
                <h3 style={{ fontSize: '20px', marginBottom: '12px', lineHeight: '1.4' }}>
                    <Link href={`/${slug}`} className="text-gradient-hover">
                        {title}
                    </Link>
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '16px', lineHeight: '1.6', flex: 1 }}>
                    {summary}
                </p>
                <div style={{ marginTop: '20px' }}>
                    <Link href={`/${slug}`} style={{ fontWeight: '600', fontSize: '14px', textDecoration: 'underline' }}>
                        Read more
                    </Link>
                </div>
            </div>
        </div>
    );
}
