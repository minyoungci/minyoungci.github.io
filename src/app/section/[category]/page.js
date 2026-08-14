import { getSortedPostsData } from '@/lib/posts';
import SectionClient from '@/components/SectionClient';

const categoryDescriptions = {
    'Science': '과학적 발견과 연구 방법, 그 뒤의 질문들을 다룹니다.',
    'Medical': '의료 AI, 임상 연구, 헬스케어 기술을 다룹니다.',
    'AI': 'AI 연구 논문과 모델 아키텍처, 머신 인텔리전스의 최전선을 다룹니다.',
    'Finance': '시장과 거시경제, 기술 산업의 경제학을 다룹니다.'
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
        tags.add('Science');
        tags.add('Medical');
        tags.add('AI');
        tags.add('Finance');

        return Array.from(tags).map(tag => ({
            category: tag,
        })).filter(p => p.category);
    } catch (error) {
        console.error("Error generating section params:", error);
        return [
            { category: 'Science' },
            { category: 'Medical' },
            { category: 'AI' },
            { category: 'Finance' }
        ];
    }
}

export default async function Section({ params }) {
    const { category } = await params;
    return <SectionClient category={category} />;
}
