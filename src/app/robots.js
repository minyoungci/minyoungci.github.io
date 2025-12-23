export const dynamic = 'force-static';

export default function robots() {
    const baseUrl = 'https://minyoungci.github.io';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/private/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
