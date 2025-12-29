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

  if (!postData) {
    return <div className="container" style={{ padding: '100px', textAlign: 'center' }}>Post not found</div>;
  }

  return (
    <article className="article animate-fade-in">
      {/* SEO Structured Data */}
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
            "author": { "@type": "Organization", "name": "AI Intelligence" }
          })
        }}
      />

      <header className="article-header">
        <span className="article-tag">{postData.tag || 'Intelligence'}</span>
        <h1 className="article-title">{postData.title}</h1>
        <div className="card-meta" style={{ justifyContent: 'center' }}>
          <span>{postData.date}</span>
          <span>●</span>
          <span>AI Editorial Team</span>
        </div>
      </header>

      {postData.image && (
        <div style={{ margin: '0 0 60px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
          <img src={postData.image} alt={postData.title} style={{ width: '100%', display: 'block' }} />
        </div>
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />

      <div style={{ marginTop: '80px', paddingTop: '40px', borderTop: '1px solid var(--color-border)' }}>
        <Link href="/" style={{ color: 'var(--color-primary)', fontWeight: '700', fontSize: '14px' }}>
          ← Back to Intelligence Hub
        </Link>
      </div>
    </article>
  );
}
