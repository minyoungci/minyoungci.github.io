import { remark } from 'remark';
import html from 'remark-html';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { content } = await request.json();

        if (!content) {
            return NextResponse.json({ html: '' });
        }

        const processedContent = await remark()
            .use(html)
            .process(content);
        const contentHtml = processedContent.toString();

        return NextResponse.json({ html: contentHtml });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to process markdown' }, { status: 500 });
    }
}
