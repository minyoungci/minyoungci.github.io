'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import RelatedPosts from '@/components/RelatedPosts';
import FloatingSubscribe from '@/components/FloatingSubscribe';
import EditButton from '@/components/EditButton';
import ReadingProgress from '@/components/ReadingProgress';
import CodeBlockEnhancer from '@/components/CodeBlockEnhancer';
import TableOfContents from '@/components/TableOfContents';
import TextHighlightShare from '@/components/TextHighlightShare';
import ShareButtons from '@/components/ShareButtons';
import ImageLightbox from '@/components/ImageLightbox';
import ViewCount from '@/components/ViewCount';

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

export default function PostClient({ slug }) {
  const [postData, setPostData] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      try {
        // Fetch post data
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', slug)
          .single();

        if (postError || !post) {
          setError(true);
          setLoading(false);
          return;
        }

        // Process markdown to HTML (with raw HTML support for videos etc.)
        const processedContent = await unified()
          .use(remarkParse)
          .use(remarkRehype, { allowDangerousHtml: true })
          .use(rehypeRaw)
          .use(rehypeStringify, { allowDangerousHtml: true })
          .process(post.content || '');
        const contentHtml = processedContent.toString();

        setPostData({
          ...post,
          contentHtml
        });

        // Fetch related posts
        const { data: allPosts } = await supabase
          .from('posts')
          .select('id, title, tag, summary, image, date')
          .neq('id', slug)
          .eq('tag', post.tag)
          .limit(2);

        setRelatedPosts(allPosts || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError(true);
        setLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div className="loading-state">Loading article...</div>
      </div>
    );
  }

  if (error || !postData) {
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

  return (
    <>
      <ReadingProgress />
      <div className="article-layout">
      <article className="article animate-fade-in">
        {/* SEO Structured Data - BlogPosting */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              "headline": postData.title,
              "description": postData.summary,
              "image": postData.image,
              "datePublished": postData.date ? `${postData.date}T00:00:00+09:00` : null,
              "dateModified": postData.date ? `${postData.date}T00:00:00+09:00` : null,
              "wordCount": postData.content ? postData.content.split(/\s+/).length : 0,
              "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": `https://minyoungci.github.io/${slug}/`
              },
              "author": {
                "@type": "Person",
                "@id": "https://minyoungci.github.io/#author",
                "name": "Minyoungci",
                "url": "https://minyoungci.github.io",
                "description": "Exploring technology, research, and life. Writing about trends, deep technical insights, and personal experiences.",
                "sameAs": []
              },
              "publisher": {
                "@type": "Organization",
                "@id": "https://minyoungci.github.io/#organization",
                "name": "Minyoungci",
                "url": "https://minyoungci.github.io",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://minyoungci.github.io/icon.svg"
                }
              }
            })
          }}
        />
        {/* SEO Structured Data - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://minyoungci.github.io"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": postData.tag || "Article",
                  "item": `https://minyoungci.github.io/section/${postData.tag || 'Trend'}/`
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": postData.title
                }
              ]
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
            <span style={{ opacity: 0.5 }}>•</span>
            <ViewCount postId={slug} />
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
              loading="eager"
              decoding="async"
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Article Content */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />

        {/* Text Highlight Share */}
        <TextHighlightShare />

        {/* Social Share Buttons */}
        <ShareButtons title={postData.title} summary={postData.summary} />

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

      {/* Sidebar with TOC */}
      <aside className="article-sidebar">
        <TableOfContents contentHtml={postData.contentHtml} />
      </aside>
      </div>

      <FloatingSubscribe />
      <EditButton postId={slug} />
      <CodeBlockEnhancer />
      <ImageLightbox />
    </>
  );
}
