import Link from 'next/link';



export default function Brief({ title, tag, summary, image, slug }) {
    return (
        <Link href={`/${slug}`} style={{ display: 'block', height: '100%' }}>
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {image && (
                    <div style={{ position: 'relative', height: '240px', width: '100%', overflow: 'hidden' }}>
                        <img
                            src={image}
                            alt={title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)'
                            }}
                            className="card-image"
                        />
                    </div>
                )}
                <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--color-secondary)'
                        }}></span>
                        <span style={{
                            color: 'var(--color-text-muted)',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            {tag}
                        </span>
                    </div>

                    <h3 style={{
                        fontSize: '24px',
                        marginBottom: '16px',
                        lineHeight: '1.3',
                        letterSpacing: '-0.5px'
                    }}>
                        <span className="text-gradient-hover">
                            {title}
                        </span>
                    </h3>

                    <p style={{
                        color: 'var(--color-text-muted)',
                        fontSize: '16px',
                        lineHeight: '1.7',
                        flex: 1,
                        marginBottom: '24px'
                    }}>
                        {summary}
                    </p>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'var(--color-text-main)',
                        fontWeight: '600',
                        fontSize: '14px',
                        marginTop: 'auto'
                    }}>
                        Read Analysis <span style={{ marginLeft: '6px' }}>→</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
