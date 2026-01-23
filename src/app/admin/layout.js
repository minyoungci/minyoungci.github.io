export const metadata = {
    title: 'Admin Panel',
    robots: {
        index: false,
        follow: false,
        googleBot: {
            index: false,
            follow: false,
        },
    },
};

export default function AdminLayout({ children }) {
    return children;
}
