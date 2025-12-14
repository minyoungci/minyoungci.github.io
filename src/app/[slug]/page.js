import { getAllPostIds, getPostData } from '@/lib/posts';

// Generate static params so Next.js knows which pages to build at export time
export async function generateStaticParams() {
    const paths = getAllPostIds();
    return paths;
}

export default async function Post({ params }) {
    const { slug } = await params;
    const postData = await getPostData(slug);

    return (
        <article className="container" style={{ padding: '80px 20px', maxWidth: '800px' }}>
            <header style={{ marginBottom: '60px', textAlign: 'center' }}>
                <span style={{
                    color: 'var(--color-secondary)',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    display: 'block',
                    marginBottom: '20px'
                }}>
                    {postData.tag}
                </span>
                <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.2', marginBottom: '20px' }}>
                    {postData.title}
                </h1>
                <div style={{ color: 'var(--color-text-muted)' }}>
                    {postData.date}
                </div>
            </header>

            {/* Blog Content */}
            <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
            />

            <style>{`
        .prose h2 { font-size: 32px; margin-top: 48px; margin-bottom: 24px; }
        .prose h3 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; }
        .prose p { font-size: 18px; line-height: 1.8; margin-bottom: 24px; color: #333; }
        .prose a { color: var(--color-secondary); text-decoration: underline; }
        .prose ul { padding-left: 20px; margin-bottom: 24px; }
        .prose li { margin-bottom: 8px; font-size: 18px; }
        .prose img { max-width: 100%; border-radius: var(--border-radius); margin: 32px 0; }
        .prose pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; margin-bottom: 32px; }
        .prose code { font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px; }
        .prose pre code { background: transparent; padding: 0; }
        
        @media (prefers-color-scheme: dark) {
          .prose p { color: #ccc; }
          .prose pre { background: #222; }
          .prose code { background: #333; }
        }
      `}</style>
        </article>
    );
}
