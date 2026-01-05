import { getSortedPostsData } from '@/lib/posts';
import SectionClient from '@/components/SectionClient';

const categoryDescriptions = {
    'Trend': '최신 기술 트렌드와 AI 동향을 다룹니다.',
    'Research': '학술 연구와 기술 분석을 심층적으로 탐구합니다.',
    'Series': '주제별 시리즈 콘텐츠 모음입니다.',
    'Life': '일상의 경험과 생각을 공유합니다.'
};

export async function generateMetadata({ params }) {
    const { category } = await params;
    const description = categoryDescriptions[category] || `${category} 관련 글 모음`;

    return {
        title: `${category} | Minyoungci`,
        description: description,
        alternates: {
            canonical: `https://minyoungci.github.io/section/${category}/`
        },
        openGraph: {
            title: `${category} - Minyoungci`,
            description: description,
            type: 'website',
            url: `https://minyoungci.github.io/section/${category}/`
        },
        twitter: {
            card: 'summary',
            title: `${category} - Minyoungci`,
            description: description
        }
    };
}

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
