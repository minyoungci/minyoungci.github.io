import Subscribe from './Subscribe';

export default function Hero() {
    return (
        <section className="hero">
            <div className="container animate-fade-in">
                <h1>What Matters in AI Right Now</h1>
                <p className="hero-subtitle">
                    A curated digest for engineers and leaders.
                    Stay ahead of the curve with deep insights from AI experts.
                </p>
                <div style={{ marginTop: '40px' }}>
                    <Subscribe />
                </div>
            </div>
        </section>
    );
}
