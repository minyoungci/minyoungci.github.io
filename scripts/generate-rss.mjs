import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const SITE_URL = 'https://minyoungci.github.io';
const SITE_NAME = 'Minyoungci';
const SITE_DESCRIPTION = 'Being Medical AI Researcher — Science, Medical, AI, Finance를 기록하는 아카이브.';
const FEED_LIMIT = 50;

// Mirror src/lib/posts.js listing filters so the feed matches the public index.
const ALLOWED_TAGS = ['Science', 'Medical', 'AI', 'Finance'];
const LEGACY_IDS = ['welcome', 'first', 'example-trend', 'example-classic'];

function escapeXml(str) {
    if (!str) {
        return '';
    }
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function formatDate(dateString) {
    if (!dateString) {
        return new Date().toUTCString();
    }
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toUTCString();
    }
    return parsed.toUTCString();
}

function getLocalPosts() {
    const postsDirectory = path.join(process.cwd(), 'posts');
    if (!fs.existsSync(postsDirectory)) {
        return [];
    }

    return fs.readdirSync(postsDirectory)
        .filter((fileName) => !fileName.startsWith('_') && fileName.endsWith('.md'))
        .map((fileName) => {
            const id = fileName.replace(/\.md$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const matterResult = matter(fileContents);
            const data = matterResult.data || {};
            return {
                id,
                title: data.title || id,
                date: data.date || '',
                tag: data.tag || '',
                summary: data.summary || '',
            };
        })
        .filter((post) => !LEGACY_IDS.includes(post.id) && ALLOWED_TAGS.includes(post.tag));
}

async function getSupabasePosts() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
        return [];
    }

    try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('posts')
            .select('id, title, summary, date, tag')
            .order('date', { ascending: false })
            .limit(FEED_LIMIT);

        if (error) {
            console.warn('Supabase fetch failed; using local posts only:', error.message);
            return [];
        }

        return (data || []).filter((post) =>
            post?.id && !LEGACY_IDS.includes(post.id) && ALLOWED_TAGS.includes(post.tag)
        );
    } catch (error) {
        console.warn('Supabase unavailable; using local posts only:', error?.message || error);
        return [];
    }
}

function mergePosts(localPosts, supabasePosts) {
    // Same precedence as src/lib/posts.js: Supabase wins on duplicate IDs.
    const byId = new Map();
    for (const post of localPosts) {
        byId.set(post.id, post);
    }
    for (const post of supabasePosts) {
        byId.set(post.id, post);
    }
    return [...byId.values()]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, FEED_LIMIT);
}

function buildRss(posts) {
    const items = posts.map((post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/${post.id}/</link>
      <guid isPermaLink="true">${SITE_URL}/${post.id}/</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.tag)}</category>
      <pubDate>${formatDate(post.date)}</pubDate>
    </item>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>
`;
}

async function generateRSS() {
    const localPosts = getLocalPosts();
    const supabasePosts = await getSupabasePosts();
    const posts = mergePosts(localPosts, supabasePosts);

    if (supabasePosts.length > 0) {
        console.log(`Merged ${localPosts.length} local posts with ${supabasePosts.length} Supabase posts`);
    } else {
        console.log(`Generating RSS from ${localPosts.length} local markdown posts (Supabase optional, not required)`);
    }

    const rss = buildRss(posts);
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    const outputPath = path.join(publicDir, 'feed.xml');
    fs.writeFileSync(outputPath, rss, 'utf-8');
    console.log(`RSS feed generated: public/feed.xml (${posts.length} items)`);
}

generateRSS().catch((error) => {
    console.error('RSS generation failed:', error);
    process.exit(1);
});
