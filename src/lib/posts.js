import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { supabase } from '@/lib/supabase';

const postsDirectory = path.join(process.cwd(), 'posts');

// Helper to get local posts
function getLocalPosts() {
    if (!fs.existsSync(postsDirectory)) return [];

    const fileNames = fs.readdirSync(postsDirectory);
    return fileNames
        .filter(fileName => !fileName.startsWith('_') && fileName.endsWith('.md'))
        .map(fileName => {
            const id = fileName.replace(/\.md$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const matterResult = matter(fileContents);
            return {
                id,
                ...matterResult.data,
            };
        });
}

export async function getSortedPostsData() {
    let posts = [];

    // 1. Fetch Local Posts
    try {
        const localPosts = getLocalPosts();
        posts = [...localPosts];
    } catch (e) {
        console.error("Local posts error:", e);
    }

    // 2. Fetch Supabase Posts
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, date, title, tag, summary, image');

            if (data && !error) {
                // Merge strategies: IDs must be unique. DB overrides Local? 
                // For now, just concat. Or simpler: filter out duplicates if needed.
                // Assuming distinct IDs for now or letting DB win.
                // Let's just push them.
                posts = [...posts, ...data];
            }
        } catch (e) {
            console.error("Supabase posts error:", e);
        }
    }

    // Sort by date
    return posts.sort((a, b) => {
        if (a.date < b.date) return 1;
        else return -1;
    });
}

export async function getAllPostIds() {
    let ids = [];

    // Local
    if (fs.existsSync(postsDirectory)) {
        const fileNames = fs.readdirSync(postsDirectory);
        ids = fileNames
            .filter(fileName => !fileName.startsWith('_') && fileName.endsWith('.md'))
            .map(fileName => ({
                slug: fileName.replace(/\.md$/, '')
            }));
    }

    // Supabase
    if (supabase) {
        const { data } = await supabase.from('posts').select('id');
        if (data) {
            const dbIds = data.map(post => ({ slug: post.id }));
            ids = [...ids, ...dbIds];
        }
    }

    return ids;
}

export async function getPostData(id) {
    // Try Supabase first
    if (supabase) {
        const { data, error } = await supabase
            .from('posts')
            .select('*')
            .eq('id', id)
            .single();

        if (data && !error) {
            // Convert markdown content to HTML if needed
            // Assuming data.content stores Markdown
            const processedContent = await remark()
                .use(html)
                .process(data.content || '');
            const contentHtml = processedContent.toString();

            return {
                id,
                contentHtml,
                title: data.title,
                date: data.date,
                tag: data.tag,
                summary: data.summary,
                image: data.image
            };
        }
    }

    // Fallback to Local
    const fullPath = path.join(postsDirectory, `${id}.md`);
    if (fs.existsSync(fullPath)) {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const matterResult = matter(fileContents);
        const processedContent = await remark()
            .use(html)
            .process(matterResult.content);
        const contentHtml = processedContent.toString();

        return {
            id,
            contentHtml,
            ...matterResult.data,
        };
    }

    throw new Error(`Post not found: ${id}`);
}
