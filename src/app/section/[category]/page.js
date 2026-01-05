import { getSortedPostsData } from '@/lib/posts';
import SectionClient from '@/components/SectionClient';

export async function generateStaticParams() {
    try {
        // Define the categories we want to generate pages for
        // We can also extract this dynamically from all posts if we want
        const posts = await getSortedPostsData();
        const tags = new Set(posts ? posts.map(post => post.tag) : []);

        // Always ensure default categories exist
        tags.add('Trend');
        tags.add('Research');
        tags.add('Series');
        tags.add('Life');

        return Array.from(tags).map(tag => ({
            category: tag,
        })).filter(p => p.category);
    } catch (error) {
        console.error("Error generating section params:", error);
        return [
            { category: 'Trend' },
            { category: 'Research' },
            { category: 'Series' },
            { category: 'Life' }
        ];
    }
}

export default async function Section({ params }) {
    const { category } = params;
    return <SectionClient category={category} />;
}
