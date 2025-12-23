import Subscribe from './Subscribe';

export default function Hero() {
    return (
        <section style={{
            padding: '120px 0 100px',
            textAlign: 'center',
            position: 'relative',
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 59, 48, 0.05) 0%, transparent 50%)'
        }}>
            <div className="container animate-fade-in">
                <div
                    style={{
                        marginBottom: '30px',
                        display: 'inline-block',
                        padding: '8px 16px',
                        background: 'rgba(255, 59, 48, 0.1)',
                        borderRadius: '100px',
                        color: 'var(--color-secondary)',
                        fontWeight: '600',
                        fontSize: '14px',
                        letterSpacing: '0.5px'
                    }}
                >
                    WEEKLY INTELLIGENCE
                </div>

                <h1 style={{
                    fontSize: 'clamp(48px, 6vw, 72px)',
                    fontWeight: '800',
                    marginBottom: '24px',
                    letterSpacing: '-2px',
                    lineHeight: '1.05'
                }}>
                    <div className="motion-title motion-delay-1">What Matters in</div>
                    <div className="motion-title motion-delay-2"><span className="text-gradient">AI</span> Right Now</div>
                </h1>

                <p style={{
                    fontSize: '20px',
                    color: 'var(--color-text-muted)',
                    maxWidth: '600px',
                    margin: '0 auto 48px',
                    lineHeight: '1.6'
                }}>
                    A curated digest for engineers and leaders. <br />
                    Stay ahead of the curve with deep insights, sans noise.
                </p>

                <div className="glass-panel" style={{
                    display: 'inline-block',
                    padding: '8px',
                    borderRadius: '100px',
                    boxShadow: 'var(--shadow-lg)'
                }}>
                    <Subscribe />
                </div>
            </div>
        </section>
    );
}
