import { getSortedPostsData } from '@/lib/posts';

export const dynamic = 'force-static';

// Match next.config.mjs trailingSlash: true so <loc> equals the canonical URL.
function withTrailingSlash(url) {
    return url.endsWith('/') ? url : `${url}/`;
}

export default async function sitemap() {
    const posts = await getSortedPostsData();
    const baseUrl = 'https://minyoungci.github.io'; // Update this with your actual domain if it changes

    const postsUrls = posts.map((post) => ({
        url: withTrailingSlash(`${baseUrl}/${post.id}`),
        lastModified: new Date(post.date),
        changeFrequency: 'weekly',
        priority: 0.7,
    }));

    const categories = ['Science', 'Medical', 'AI', 'Finance'];
    const sectionUrls = categories.map((cat) => ({
        url: withTrailingSlash(`${baseUrl}/section/${cat}`),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    return [
        {
            url: withTrailingSlash(baseUrl),
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        ...sectionUrls,
        ...postsUrls,
    ];
}
