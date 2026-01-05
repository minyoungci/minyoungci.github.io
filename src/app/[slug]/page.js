import Link from 'next/link';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import RelatedPosts from '@/components/RelatedPosts';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import EditButton from '@/components/EditButton';
import ReadingProgress from '@/components/ReadingProgress';
import CodeBlockEnhancer from '@/components/CodeBlockEnhancer';
import TableOfContents from '@/components/TableOfContents';
import TextHighlightShare from '@/components/TextHighlightShare';

export async function generateStaticParams() {
  const posts = await getSortedPostsData();
  if (!posts) return [];
  return posts.map((post) => ({
    slug: post.id || '',
  })).filter(p => p.slug);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const postData = await getPostData(decodedSlug);

  if (!postData) return { title: 'Post Not Found' };

  return {
    title: postData.title,
    description: postData.summary || `Read about ${postData.title} on The Gradient.`,
    openGraph: {
      title: postData.title,
      description: postData.summary,
      type: 'article',
      publishedTime: postData.date,
      authors: ['The Gradient'],
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

// Calculate reading time
function calculateReadingTime(content) {
  if (!content) return 5;
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export default async function Post({ params }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const postData = await getPostData(decodedSlug);
  const allPosts = await getSortedPostsData();

  if (!postData) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <h1>Post not found</h1>
        <p style={{ marginTop: '16px', color: 'var(--color-text-muted)' }}>
          The article you're looking for doesn't exist.
        </p>
        <Link href="/" style={{ marginTop: '24px', display: 'inline-block', color: 'var(--color-primary)' }}>
          ← Back to Home
        </Link>
      </div>
    );
  }

  const readingTime = calculateReadingTime(postData.content);

  // Get related posts (same tag, excluding current post)
  const relatedPosts = allPosts
    .filter(p => p.id !== decodedSlug && p.tag === postData.tag)
    .slice(0, 2);

  return (
    <>
      <ReadingProgress />
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
              "author": { "@type": "Person", "name": "Minyoungci" }
            })
          }}
        />

        {/* Article Header */}
        <header className="article-header">
          <span className="article-tag">{postData.tag || 'Article'}</span>
          <h1 className="article-title">{postData.title}</h1>
          <div className="article-meta">
            <span>{formatDate(postData.date)}</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>{readingTime} min read</span>
          </div>
        </header>

        {/* Cover Image */}
        {postData.image && (
          <div style={{
            margin: '0 0 48px',
            borderRadius: 'var(--border-radius)',
            overflow: 'hidden'
          }}>
            <img
              src={postData.image}
              alt={postData.title}
              style={{ width: '100%', display: 'block' }}
            />
          </div>
        )}

        {/* Table of Contents */}
        <TableOfContents contentHtml={postData.contentHtml} />

        {/* Article Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />

        {/* Text Highlight Share */}
        <TextHighlightShare />

        {/* Author Box */}
        <div className="author-box">
          <div
            className="author-box-avatar"
            style={{
              background: 'linear-gradient(135deg, #1a8917 0%, #2ecc71 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: '700',
              color: 'white'
            }}
          >
            M
          </div>
          <div className="author-box-content">
            <h4 className="author-box-name">Minyoungci</h4>
            <p className="author-box-bio">
              Exploring technology, research, and life. Writing about trends,
              deep technical insights, and personal experiences.
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div style={{
          marginTop: '60px',
          paddingTop: '32px',
          borderTop: '1px solid var(--color-border)'
        }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-sans)',
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--color-text-muted)',
              transition: 'color 0.2s ease'
            }}
          >
            ← Back to Articles
          </Link>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <RelatedPosts posts={relatedPosts} />
        )}
      </article>

      <FloatingSubscribe />
      <EditButton postId={decodedSlug} />
      <CodeBlockEnhancer />
    </>
  );
}
