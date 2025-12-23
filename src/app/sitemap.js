import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

export default function sitemap() {
    const posts = getSortedPostsData();
    const baseUrl = 'https://minyoungci.github.io'; // Update this with your actual domain if it changes

    const postsUrls = posts.map((post) => ({
        url: `${baseUrl}/${post.id}`,
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...postsUrls,
    ];
}
