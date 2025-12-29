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
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'var(--color-primary)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.2s ease',
        zIndex: 999,
        fontSize: '20px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      }}
    >
      ✏️
    </button>
  );
}
