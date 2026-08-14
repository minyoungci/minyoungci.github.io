import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { supabase } from '@/lib/supabase';
import { SAMPLE_POSTS, getSamplePostById } from '@/lib/samplePosts';

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
    let supabaseOk = false;
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, date, title, tag, summary, image');

            if (data && !error) {
                supabaseOk = data.length > 0;
                posts = [...posts, ...data];
            }
        } catch (e) {
            console.warn("Supabase unavailable, using sample posts:", e?.message || e);
        }
    }

    // 3. Fallback: sample posts keep the site populated until Supabase has real posts
    if (!supabaseOk) {
        const existingIds = new Set(posts.map((post) => post.id));
        posts = [...posts, ...SAMPLE_POSTS.filter((post) => !existingIds.has(post.id))];
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
        try {
            const { data } = await supabase.from('posts').select('id');
            if (data) {
                const dbIds = data.map(post => ({ slug: post.id }));
                ids = [...ids, ...dbIds];
            }
        } catch (e) {
            console.warn("Supabase unavailable for post ids:", e?.message || e);
        }
    }

    // Sample post ids (deduplicated)
    const existing = new Set(ids.map((entry) => entry.slug));
    ids = [...ids, ...SAMPLE_POSTS.filter((post) => !existing.has(post.id)).map((post) => ({ slug: post.id }))];

    return ids;
}

export async function getPostData(id) {
    // Try Supabase first
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', id)
                .single();

            if (data && !error) {
                const processedContent = await unified()
                    .use(remarkParse)
                    .use(remarkRehype, { allowDangerousHtml: true })
                    .use(rehypeRaw)
                    .use(rehypeStringify, { allowDangerousHtml: true })
                    .process(data.content || '');
                const contentHtml = processedContent.toString();

                return {
                    id,
                    content: data.content,
                    contentHtml,
                    title: data.title,
                    date: data.date,
                    tag: data.tag,
                    summary: data.summary,
                    image: data.image
                };
            }
        } catch (e) {
            console.warn("Supabase unavailable for post data:", e?.message || e);
        }
    }

    // Fallback to Local
    try {
        const fullPath = path.join(postsDirectory, `${id}.md`);
        if (fs.existsSync(fullPath)) {
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const matterResult = matter(fileContents);
            const processedContent = await unified()
                .use(remarkParse)
                .use(remarkRehype, { allowDangerousHtml: true })
                .use(rehypeRaw)
                .use(rehypeStringify, { allowDangerousHtml: true })
                .process(matterResult.content);
            const contentHtml = processedContent.toString();

            return {
                id,
                content: matterResult.content,
                contentHtml,
                ...matterResult.data,
            };
        }
    } catch (e) {
        console.error("Local getPostData error:", e);
    }

    // Fallback to sample posts
    const samplePost = getSamplePostById(id);
    if (samplePost) {
        const processedContent = await unified()
            .use(remarkParse)
            .use(remarkRehype, { allowDangerousHtml: true })
            .use(rehypeRaw)
            .use(rehypeStringify, { allowDangerousHtml: true })
            .process(samplePost.content || '');

        return {
            ...samplePost,
            contentHtml: processedContent.toString()
        };
    }

    return null;
}
