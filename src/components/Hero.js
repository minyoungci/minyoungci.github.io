export default function Hero() {
    return (
        <section style={{ padding: '80px 0', textAlign: 'center' }}>
            <div className="container">
                <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '20px', letterSpacing: '-1px' }}>
                    What Matters in <span className="text-gradient">AI</span> Right Now
                </h1>
                <p style={{ fontSize: '20px', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    A weekly digest of the most important updates in Artificial Intelligence, curated for engineers and leaders.
                </p>
            </div>
        </section>
    );
}
