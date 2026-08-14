import { getLocalPostsMeta } from '@/lib/posts';

export const dynamic = 'force-static';

// Build-time index of local markdown posts so the client-side
// gallery can list them without Supabase.
export async function GET() {
    return Response.json(getLocalPostsMeta());
}
