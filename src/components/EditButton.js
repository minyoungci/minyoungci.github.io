'use client';

import { useRouter } from 'next/navigation';

export default function EditButton({ postId }) {
    const router = useRouter();

    const handleEdit = () => {
        // Navigate to admin page with post ID in query
        router.push(`/admin?edit=${encodeURIComponent(postId)}`);
    };

    return (
        <button
            onClick={handleEdit}
            className="edit-post-button"
            title="Edit this post"
            style={{
                position: 'fixed',
                bottom: '100px',
                right: '24px',
                padding: '10px 18px',
                borderRadius: 0,
                background: 'var(--color-background)',
                color: 'var(--color-text-main)',
                border: '1px solid var(--color-text-main)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 400,
                transition: 'all 0.15s ease',
                zIndex: 99
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-text-main)';
                e.currentTarget.style.color = 'var(--color-background)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-background)';
                e.currentTarget.style.color = 'var(--color-text-main)';
            }}
        >
            ✎ Edit
        </button>
    );
}
