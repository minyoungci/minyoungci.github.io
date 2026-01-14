import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('Missing Supabase credentials - skipping RSS generation');
    console.warn('RSS feed will be generated on CI/CD with proper environment variables');
    process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateRSS() {
    const siteUrl = 'https://minyoungci.github.io';
    const siteName = 'Minyoungci';
    const siteDescription = '기술 트렌드, 연구, 일상을 탐구하는 개인 블로그';

    console.log('Fetching posts from Supabase...');

    const { data: posts, error } = await supabase
        .from('posts')
        .select('id, title, summary, date, tag')
        .order('date', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Error fetching posts:', error);
        process.exit(1);
    }

    console.log(`Found ${posts?.length || 0} posts`);

    const escapeXml = (str) => {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    };

    const formatDate = (dateString) => {
        if (!dateString) return new Date().toUTCString();
        return new Date(dateString).toUTCString();
    };

    const items = (posts || []).map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/${post.id}/</link>
      <guid isPermaLink="true">${siteUrl}/${post.id}/</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.tag)}</category>
      <pubDate>${formatDate(post.date)}</pubDate>
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;

    // Write to public folder
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'feed.xml'), rss, 'utf-8');
    console.log('RSS feed generated: public/feed.xml');
}

generateRSS().catch(console.error);
