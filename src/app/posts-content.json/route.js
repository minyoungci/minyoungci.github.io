import { getLocalPostsMeta, getLocalPostFull } from '@/lib/posts';

export const dynamic = 'force-static';

// Build-time JSON of all local markdown posts including raw content,
// so PostClient can render them without Supabase.
export async function GET() {
    const posts = getLocalPostsMeta()
        .map((post) => getLocalPostFull(post.id))
        .filter(Boolean);
    return Response.json(posts);
}
