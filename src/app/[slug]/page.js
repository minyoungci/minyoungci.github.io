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
            font-family: var(--font-serif);
            color: #2c2c2c;
            font-size: 19px;
            line-height: 1.8;
        }
        .prose h2 { 
            font-family: var(--font-sans);
            font-size: 30px; 
            font-weight: 700;
            margin-top: 56px; 
            margin-bottom: 24px;
            letterSpacing: '-0.5px';
            color: #111;
        }
        .prose h3 { 
            font-family: var(--font-sans);
            font-size: 24px; 
            font-weight: 600;
            margin-top: 40px; 
            margin-bottom: 16px; 
            color: #111;
        }
        .prose p { 
            margin-bottom: 28px; 
        }
        .prose a { 
            color: var(--color-secondary); 
            text-decoration: underline; 
            text-underline-offset: 4px;
        }
        .prose ul, .prose ol { 
            padding-left: 20px; 
            margin-bottom: 28px; 
        }
        .prose li { 
            margin-bottom: 10px; 
            padding-left: 8px;
        }
        /* Stylish Blockquote */
        .prose blockquote {
            border-left: 4px solid var(--color-secondary);
            padding-left: 24px;
            margin: 40px 0;
            font-style: italic;
            color: #444;
            background: #fafafa;
            padding: 24px 24px 24px 32px;
            border-radius: 0 12px 12px 0;
        }
        /* Image Styling */
        .prose img { 
            max-width: 100%; 
            border-radius: 12px; 
            margin: 40px 0; 
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        /* Code Block Styling */
        .prose pre { 
            background: #1e1e1e; 
            color: #e0e0e0;
            padding: 24px; 
            border-radius: 12px; 
            overflow-x: auto; 
            margin: 32px 0; 
            font-size: 14px;
            border: 1px solid #333;
        }
        .prose code { 
            font-family: monospace; 
            background: rgba(0,0,0,0.05); 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 0.85em;
        }
        .prose pre code { 
            background: transparent; 
            padding: 0; 
            font-size: inherit;
        }
        
        @media (prefers-color-scheme: dark) {
          .prose { color: #e0e0e0; }
          .prose h2, .prose h3 { color: #ffffff; }
          .prose blockquote { 
            background: #222; 
            color: #ccc; 
          }
          .prose code { background: rgba(255,255,255,0.1); }
          header div[style*="background: #fff0f0"] {
            background: rgba(229, 57, 53, 0.2) !important;
            color: #ff8a80 !important;
          }
        }
      `}</style>
        </article>
    );
}
