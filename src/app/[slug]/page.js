import Link from 'next/link';
import { getPostData, getSortedPostsData } from '@/lib/posts';

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  if (!posts) return [];
  return posts.map((post) => ({
    slug: post.id || '',
  })).filter(p => p.slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  if (!postData) return { title: 'Post Not Found' };

  return {
    title: postData.title,
    description: postData.summary || `Read about ${postData.title} on AI Intelligence.`,
    openGraph: {
      title: postData.title,
      description: postData.summary,
      type: 'article',
      publishedTime: postData.date,
      authors: ['AI Intelligence'],
      images: postData.image ? [{ url: postData.image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: postData.title,
      description: postData.summary,
      images: postData.image ? [postData.image] : [],
    },
  };
}

export default async function Post({ params }) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  return (
    <article className="post-container">
      {/* Hero Section */}
      <header className="post-header">
        <div className="post-meta">
          <span className="post-tag">{postData.tag || 'Trend'}</span>
          <time className="post-date">{postData.date}</time>
        </div>
        <h1 className="post-title">{postData.title}</h1>
        {postData.image && (
          <div className="post-cover-image">
            <img src={postData.image} alt={postData.title} />
          </div>
        )}
      </header>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": postData.title,
            "description": postData.summary,
            "image": postData.image,
            "datePublished": postData.date,
            "author": {
              "@type": "Organization",
              "name": "AI Intelligence"
            }
          })
        }}
      />

      {/* Content Section */}
      <div
        className="post-content"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />

      {/* Navigation / Footer */}
      <div className="post-footer">
        <Link href="/" className="back-link">
          ← Back to Intelligence
        </Link>
      </div>

      {/* Styles localized for this page/template */}
      <style>{`
        .post-container {
          max-width: 720px;
          margin: 0 auto;
          padding: 60px 20px 120px;
          color: #ffffff; /* Force white text */
        }

        .post-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .post-meta {
          display: flex;
          justify-content: center;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          font-family: var(--font-inter);
          font-size: 14px;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .post-tag {
          color: var(--color-secondary);
          font-weight: 700;
        }

        .post-title {
          font-family: var(--font-outfit);
          font-size: 3.5rem;
          line-height: 1.1;
          font-weight: 800;
          margin-bottom: 30px;
          letter-spacing: -0.02em;
          letter-spacing: -0.02em;
          color: var(--color-text-main);
        }

        .post-cover-image {
          margin-top: 40px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .post-cover-image img {
          width: 100%;
          display: block;
        }

        /* --- Content Typography (The "Trendy" Part) --- */
        .post-content {
          font-family: var(--font-inter);
          font-size: 1.125rem; /* 18px */
          line-height: 1.8;
          font-family: var(--font-inter);
          font-size: 1.125rem; /* 18px */
          line-height: 1.8;
          color: var(--color-text-main); /* Use global text color (white in dark mode) */
          font-weight: 450;
        }
        
        .post-content p {
          margin-bottom: 1.5em;
        }

        .post-content h2 {
          font-family: var(--font-outfit);
          font-size: 2rem;
          margin-top: 2.5em;
          margin-bottom: 0.8em;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.3em;
        }

        .post-content h3 {
          font-family: var(--font-outfit);
          font-size: 1.5rem;
          margin-top: 2em;
          margin-bottom: 0.5em;
        }

        .post-content ul, .post-content ol {
          margin-bottom: 1.5em;
          padding-left: 1.5em;
        }
        
        .post-content li {
          margin-bottom: 0.5em;
        }

        .post-content blockquote {
          font-family: var(--font-outfit);
          font-size: 1.4rem;
          font-style: italic;
          border-left: 4px solid var(--color-secondary);
          padding-left: 20px;
          margin: 2em 0;
          color: var(--color-text-muted);
        }

        .post-content img {
          max-width: 100%;
          border-radius: 8px;
          margin: 2em 0;
        }
        
        .post-content a {
          color: var(--color-secondary);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        .post-content a:hover {
          border-bottom-color: var(--color-secondary);
        }

        .post-footer {
          margin-top: 80px;
          padding-top: 40px;
          border-top: 1px solid var(--color-border);
        }
        
        .back-link {
          color: var(--color-text-muted);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s;
        }
        .back-link:hover {
          color: #fff;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .post-title { font-size: 2.5rem; }
          .post-content { font-size: 1rem; }
        }
      `}</style>
    </article>
  );
}
