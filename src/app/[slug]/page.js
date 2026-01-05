import { getPostData, getSortedPostsData } from '@/lib/posts';
import PostClient from '@/components/PostClient';

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
    description: postData.summary || `${postData.title}에 대해 읽어보세요.`,
    alternates: {
      canonical: `https://minyoungci.github.io/${decodedSlug}/`
    },
    openGraph: {
      title: postData.title,
      description: postData.summary,
      type: 'article',
      publishedTime: postData.date,
      authors: ['Minyoungci'],
      url: `https://minyoungci.github.io/${decodedSlug}/`,
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
  const decodedSlug = decodeURIComponent(slug);

  return <PostClient slug={decodedSlug} />;
}
