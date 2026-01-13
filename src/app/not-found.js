'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PostClient from '@/components/PostClient';

export default function NotFound() {
  const pathname = usePathname();
  const [checkingPost, setCheckingPost] = useState(true);
  const [postExists, setPostExists] = useState(false);
  const [slug, setSlug] = useState('');

  useEffect(() => {
    // Extract slug from pathname
    const pathSlug = pathname?.replace(/^\/|\/$/g, '') || '';

    // Skip if it's a known route
    if (!pathSlug || pathSlug.startsWith('section/') || pathSlug === 'admin') {
      setCheckingPost(false);
      return;
    }

    setSlug(pathSlug);
    setPostExists(true);
    setCheckingPost(false);
  }, [pathname]);

  // If we found a potential post slug, try to render it
  if (!checkingPost && postExists && slug) {
    return <PostClient slug={slug} />;
  }

  // Show loading while checking
  if (checkingPost) {
    return (
      <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div className="loading-state">Loading...</div>
      </div>
    );
  }

  // Show 404 page
  return (
    <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '16px' }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '24px' }}>
        페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        style={{
          color: 'var(--color-primary)',
          fontWeight: '600'
        }}
      >
        ← 홈으로 돌아가기
      </Link>
    </div>
  );
}
