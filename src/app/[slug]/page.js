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
        <article className="container" style={{ padding: '80px 20px', maxWidth: 'var(--content-width)' }}>
            <header style={{ marginBottom: '60px', textAlign: 'left' }}>
                <div style={{
                    display: 'inline-block',
                    padding: '6px 14px',
                    borderRadius: '50px',
                    background: '#fff0f0',
                    color: '#e53935',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '24px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    {postData.tag}
                </div>
                <h1 style={{
                    fontSize: '48px',
                    fontWeight: '800',
                    lineHeight: '1.2',
                    marginBottom: '24px',
                    letterSpacing: '-1px'
                }}>
                    {postData.title}
                </h1>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--color-text-muted)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-sans)',
                    borderTop: '1px solid #eee',
                    paddingTop: '24px'
                }}>
                    <span>{postData.date}</span>
                    <span style={{ fontSize: '10px' }}>●</span>
                    <span>By Minyoungci</span>
                </div>
            </header>

            {/* Blog Content */}
            <div
                className="prose"
                dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
            />

            <style>{`
        .prose {
            font-family: var(--font-sans);
            color: #333d4b;
            font-size: 17px;
            line-height: 1.6;
            letter-spacing: -0.2px;
        }
        .prose h2 { 
            font-size: 28px; 
            font-weight: 700;
            margin-top: 50px; 
            margin-bottom: 16px;
            color: #191f28;
            letter-spacing: -0.5px;
        }
        .prose h3 { 
            font-size: 22px; 
            font-weight: 600;
            margin-top: 32px; 
            margin-bottom: 12px; 
            color: #191f28;
        }
        .prose p { 
            margin-bottom: 24px; 
        }
        .prose a { 
            color: var(--color-secondary); 
            text-decoration: none; 
            border-bottom: 1px solid rgba(255, 75, 75, 0.3);
            transition: border-color 0.2s;
        }
        .prose a:hover {
            border-bottom-color: var(--color-secondary);
        }
        .prose ul, .prose ol { 
            padding-left: 0; 
            margin-bottom: 24px; 
        }
        .prose li { 
            list-style: none;
            margin-bottom: 12px; 
            padding-left: 24px;
            position: relative;
        }
        .prose li::before {
            content: "•";
            color: var(--color-secondary);
            font-weight: bold;
            position: absolute;
            left: 6px;
        }
        /* Modern Callout */
        .prose blockquote {
            border-left: none;
            background: #f9f9f9;
            padding: 24px;
            margin: 32px 0;
            border-radius: 16px;
            color: #4e5968;
            font-style: normal;
            font-weight: 500;
        }
        /* Image Styling */
        .prose img { 
            max-width: 100%; 
            border-radius: 16px; 
            margin: 32px 0; 
            border: 1px solid rgba(0,0,0,0.05);
        }
        /* Code Block Styling */
        .prose pre { 
            background: #f2f4f6; 
            color: #333;
            padding: 20px; 
            border-radius: 12px; 
            overflow-x: auto; 
            margin: 32px 0; 
            font-size: 14px;
            font-family: 'Menlo', monospace;
        }
        .prose code { 
            font-family: 'Menlo', monospace; 
            background: #f2f4f6; 
            padding: 3px 6px; 
            border-radius: 6px; 
            font-size: 0.9em;
            color: #e53935;
        }
        .prose pre code { 
            background: transparent; 
            padding: 0; 
            color: inherit;
        }
        
        @media (prefers-color-scheme: dark) {
          .prose { color: #e0e0e0; }
          .prose h2, .prose h3 { color: #ffffff; }
          .prose blockquote { 
            background: #222; 
            color: #ccc; 
          }
           .prose pre, .prose code { background: #222; color: #eee; }
           .prose img { border-color: #333; }
        }
      `}</style>
        </article>
    );
}
