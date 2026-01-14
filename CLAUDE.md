# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"The Gradient" - An AI/ML focused blog built with Next.js 16, deployed as a static site to GitHub Pages. The blog supports both local markdown files and Supabase-hosted content.

## Commands

```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build static export to ./out directory
npm run lint     # Run ESLint
```

## Architecture

### Data Flow
Posts come from two sources merged in `src/lib/posts.js`:
1. **Local markdown files** in `/posts/*.md` (files starting with `_` are ignored)
2. **Supabase database** (`posts` table) - takes priority over local files with same ID

Markdown content is processed with `gray-matter` (frontmatter) and `remark`/`remark-html` (rendering).

### Routing Structure
- `/` - Homepage with all posts grid (client-side, fetches from Supabase)
- `/[slug]/` - Individual post pages (statically generated)
- `/section/[category]/` - Category pages (Classic, Trend, Guide, News)
- `/admin/` - CMS with markdown editor, image uploads, and post management

### Key Files
- `src/lib/posts.js` - Post fetching logic with Supabase/local file merging
- `src/lib/supabase.js` - Supabase client initialization
- `src/app/[slug]/page.js` - Post detail with SEO, related posts, reading time
- `src/app/admin/page.js` - Full CMS with sidebar, media manager, live preview

### Static Export Configuration
`next.config.mjs` exports as static site with:
- `output: 'export'` - Static HTML export
- `trailingSlash: true` - URLs end with `/`
- `images: { unoptimized: true }` - Required for static export

### Post Frontmatter Schema
```yaml
title: "Post Title"
date: "YYYY-MM-DD"
tag: "Classic" | "Trend" | "Guide" | "News"
summary: "Brief description"
image: "/images/cover.jpg"  # optional
```

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages. The site is served at `https://minyoungci.github.io`.

## Supabase Schema

The `posts` table expects: `id` (slug), `title`, `date`, `tag`, `summary`, `content`, `image`

Images are stored in Supabase Storage bucket named `images`.

---

## Code Style Guide

### Formatting
- **들여쓰기**: 4 spaces
- **세미콜론**: 필수 (모든 문장 끝에)
- **따옴표**: 작은따옴표 `'` 우선

### Naming Conventions
| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `PostClient.js`, `TableOfContents.js` |
| 유틸리티 파일 | camelCase | `posts.js`, `supabase.js` |
| 함수/변수 | camelCase | `handleClick`, `isLoading` |
| CSS 클래스 | kebab-case | `.article-layout`, `.card-featured` |
| CSS 변수 | kebab-case with `--` | `--color-primary`, `--font-sans` |

### Function Style
```javascript
// 컴포넌트, export 함수: function 선언
export default function ComponentName({ props }) { }
export async function getPostData(slug) { }

// 핸들러, 콜백: arrow function
const handleClick = (e) => { };
const filteredPosts = posts.filter((post) => post.tag === tag);
```

### Import Order
```javascript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. 외부 라이브러리
import { remark } from 'remark';

// 3. 내부 컴포넌트
import RelatedPosts from '@/components/RelatedPosts';

// 4. 내부 유틸리티
import { supabase } from '@/lib/supabase';
```

---

## Component Writing Rules

### 'use client' 사용 조건
다음 중 하나라도 해당하면 파일 최상단에 `'use client';` 추가:
- `useState`, `useEffect`, `useRef` 등 React hooks 사용
- `onClick`, `onChange` 등 이벤트 핸들러 사용
- `window`, `document`, `navigator` 등 브라우저 API 사용
- `useRouter` from `next/navigation` 사용

### Component Structure
```javascript
'use client';

import { useState, useEffect } from 'react';
// ... imports

export default function ComponentName({ prop1, prop2 }) {
    // 1. State 선언
    const [loading, setLoading] = useState(true);

    // 2. Helper 함수
    const formatDate = (date) => { /* ... */ };

    // 3. Effects
    useEffect(() => {
        // side effects
    }, []);

    // 4. Event Handlers
    const handleClick = () => { /* ... */ };

    // 5. 조건부 렌더링 (로딩, 에러)
    if (loading) return <div>Loading...</div>;

    // 6. Main JSX
    return (
        <div>...</div>
    );
}
```

### CSS Styling 방식
- **globals.css**: 공통 클래스, CSS 변수, 타이포그래피
- **inline style**: 컴포넌트별 동적 스타일
- **하이브리드**: className + style 조합 사용
```jsx
<div className="card-featured" style={{ marginTop: '20px' }}>
```

---

## Don'ts (하지 말 것)

### 기존 기능 보존 필수
다음 기능들은 절대 제거하거나 동작을 변경하지 말 것:
- Reading Progress Bar (스크롤 진행률)
- Table of Contents (목차 사이드바)
- 코드 블록 복사 버튼
- 텍스트 선택 공유
- Related Posts 섹션
- Admin CMS 전체 기능
- SEO 메타데이터 및 구조화 데이터

### 금지 사항
- ❌ `globals.css`의 CSS 변수 (`--color-*`, `--font-*`) 임의 변경
- ❌ Supabase 테이블 스키마 변경 (확인 없이)
- ❌ `next.config.mjs` 설정 변경 (static export 깨짐 위험)
- ❌ 새 npm 패키지 설치 (확인 없이)
- ❌ 기존 컴포넌트 삭제 또는 병합
- ❌ Server Component에 불필요한 `'use client'` 추가
- ❌ `@/` alias 대신 상대 경로 사용

---

## Confirmation Required (확인 필요)

다음 작업은 반드시 사용자에게 먼저 확인받을 것:

| 작업 | 이유 |
|------|------|
| npm 패키지 추가/삭제 | 번들 사이즈, 호환성 영향 |
| 라우팅 구조 변경 | SEO, 기존 링크 영향 |
| Supabase 스키마 변경 | 데이터 마이그레이션 필요 |
| 기존 컴포넌트 삭제/병합 | 기능 손실 위험 |
| SEO 메타데이터 구조 변경 | 검색 노출 영향 |
| CSS 변수 값 변경 | 전체 디자인 영향 |
| GitHub Actions 워크플로우 수정 | 배포 프로세스 영향 |

---

## Verification Checklist (검증)

### 모든 변경 후 필수 확인
```bash
npm run build   # 빌드 성공 확인
npm run dev     # 로컬 테스트
```

### 기능 체크리스트
변경 작업 후 다음 기능들이 정상 동작하는지 확인:

**홈페이지** (`/`)
- [ ] Featured 포스트 (히어로 스타일) 표시
- [ ] 카테고리별 포스트 그룹핑
- [ ] Floating Subscribe 버튼

**포스트 상세** (`/[slug]/`)
- [ ] Reading Progress Bar (상단)
- [ ] Table of Contents 사이드바
- [ ] TOC 현재 섹션 하이라이트
- [ ] 코드 블록 복사 버튼
- [ ] Related Posts 표시
- [ ] Edit 버튼 (우하단)

**Admin CMS** (`/admin/`)
- [ ] 포스트 목록 표시
- [ ] 새 포스트 작성
- [ ] 기존 포스트 편집
- [ ] 이미지 업로드
- [ ] 마크다운 미리보기
- [ ] 슬러그 편집

**SEO**
- [ ] Open Graph 메타태그
- [ ] 구조화된 데이터 (JSON-LD)
- [ ] sitemap.xml 생성

---

## Feature Suggestions (향후 기능 제안)

새 기능 구현 시 참고할 수 있는 제안 목록:

### 디자인/UX
- 다크 모드 지원
- 포스트 검색 기능
- 무한 스크롤 또는 페이지네이션
- 이미지 라이트박스
- 애니메이션 개선

### 포스트 기능
- 시리즈/연재물 네비게이션
- 조회수 표시
- 좋아요/북마크
- 댓글 시스템 (Giscus 등)
- 예상 읽기 시간 표시 개선

### 소셜/공유
- 소셜 공유 버튼 개선
- 뉴스레터 아카이브
- RSS 피드

### 기술적 개선
- 코드 블록 언어별 하이라이팅 (Prism.js)
- 이미지 최적화 (WebP)
- 성능 모니터링
