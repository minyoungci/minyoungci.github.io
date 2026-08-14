'use client';

export const dynamic = 'force-static';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SAMPLE_POSTS, getSamplePostById } from '@/lib/samplePosts';
import { remark } from 'remark';
import html from 'remark-html';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import { unified } from 'unified';
import remarkParse from 'remark-parse';

function AdminContent() {
    const searchParams = useSearchParams();
    const editPostId = searchParams.get('edit');

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [supabaseDown, setSupabaseDown] = useState(false);

    // Editor State
    const [previewHtml, setPreviewHtml] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const textareaRef = useRef(null);

    // Image Manager State
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    // Video Manager State
    const [videos, setVideos] = useState([]);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [videoUploadProgress, setVideoUploadProgress] = useState({ current: 0, total: 0 });
    const videoFileInputRef = useRef(null);

    // Post Manager State
    const [activeTab, setActiveTab] = useState('posts');
    const [postsList, setPostsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Two-step Delete State
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Auto-save State
    const [lastSaved, setLastSaved] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        tag: 'Trend',
        summary: '',
        content: '',
        image: ''
    });

    // Category options
    const categoryOptions = ['Trend', 'Research', 'Life'];

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    // ========== DailyAIR Import ==========
    const GH_TOKEN_KEY = 'gh_import_token';
    const IMPORT_REPO = 'minyoungci/DailyAIR';
    const BLOG_REPO = 'minyoungci/minyoungci.github.io';
    const IMPORT_DIRS = ['ai-papers', 'economy', 'medical'];
    const IMPORT_TAG_MAP = { 'ai-papers': 'Research', 'economy': 'Trend', 'medical': 'Research' };

    const [ghToken, setGhToken] = useState('');
    const [importDir, setImportDir] = useState('ai-papers');
    const [importFiles, setImportFiles] = useState([]);
    const [importLoading, setImportLoading] = useState(false);
    const [importError, setImportError] = useState('');
    const [publishingToRepo, setPublishingToRepo] = useState(false);

    // Token lives only in this browser's localStorage — never committed
    useEffect(() => {
        if (mounted) setGhToken(localStorage.getItem(GH_TOKEN_KEY) || '');
    }, [mounted]);

    const saveGhToken = (value) => {
        setGhToken(value);
        localStorage.setItem(GH_TOKEN_KEY, value);
    };

    const ghFetch = (apiPath, options = {}) => fetch(`https://api.github.com${apiPath}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Accept': 'application/vnd.github+json',
            ...(options.headers || {})
        }
    });

    const decodeBase64Utf8 = (b64) => {
        const bytes = Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0));
        return new TextDecoder('utf-8').decode(bytes);
    };

    const encodeUtf8Base64 = (text) => {
        const bytes = new TextEncoder().encode(text);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        return btoa(binary);
    };

    const loadImportFiles = async (dir) => {
        setImportDir(dir);
        setImportError('');
        setImportLoading(true);
        try {
            const res = await ghFetch(`/repos/${IMPORT_REPO}/contents/${dir}`);
            if (!res.ok) {
                throw new Error(res.status === 401 || res.status === 403
                    ? '토큰이 유효하지 않거나 권한이 없습니다'
                    : `GitHub API ${res.status}`);
            }
            const files = await res.json();
            setImportFiles(
                files
                    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
                    .sort((a, b) => (a.name < b.name ? 1 : -1))
            );
        } catch (err) {
            setImportError(err.message);
            setImportFiles([]);
        }
        setImportLoading(false);
    };

    // Convert a DailyAIR markdown file into blog post form data
    const handleImportFile = async (fileName) => {
        setImportError('');
        setImportLoading(true);
        try {
            const res = await ghFetch(`/repos/${IMPORT_REPO}/contents/${importDir}/${encodeURIComponent(fileName)}`);
            if (!res.ok) throw new Error(`GitHub API ${res.status}`);
            const file = await res.json();
            const raw = decodeBase64Utf8(file.content);

            const slug = fileName.replace(/\.md$/, '');
            const lines = raw.split('\n');
            let title = slug;
            let titleFound = false;
            let dateLineSkipped = false;
            const bodyLines = [];

            for (const line of lines) {
                if (!titleFound && /^#\s+/.test(line)) {
                    title = line.replace(/^#\s+/, '').trim();
                    titleFound = true;
                    continue;
                }
                if (titleFound && !dateLineSkipped
                    && /^\*\*.+\*\*\s*$/.test(line.trim())
                    && bodyLines.every((l) => !l.trim())) {
                    dateLineSkipped = true;
                    continue;
                }
                bodyLines.push(line);
            }

            const content = bodyLines.join('\n').replace(/^(\s|-{3,})+/, '').trim();
            const imageMatch = content.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/);
            const summarySource = content
                .split(/\n\s*\n/)
                .find((block) => {
                    const t = block.trim();
                    return t && !t.startsWith('#') && !t.startsWith('![')
                        && !t.startsWith('---') && !t.startsWith('*출처') && !t.startsWith('|');
                }) || '';
            const summary = summarySource
                .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
                .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
                .replace(/[*_`#>]/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 150);

            setFormData({
                title,
                slug,
                tag: IMPORT_TAG_MAP[importDir] || 'Research',
                summary,
                content,
                image: imageMatch ? imageMatch[1] : ''
            });
            setIsEditMode(false);
            setEditingPostId(null);
            setStatus('idle');
            setMessage('가져오기 완료 — 편집 후 발행하세요');
            setHasUnsavedChanges(true);
        } catch (err) {
            setImportError(err.message);
        }
        setImportLoading(false);
    };

    // Publish the current form as a markdown file committed to the blog repo.
    // Pushing to main triggers the Pages deploy, so the post goes live in ~1 min.
    const handlePublishToRepo = async () => {
        if (!formData.slug?.trim() || !formData.title?.trim()) {
            setStatus('error');
            setMessage('Title과 Slug가 필요합니다');
            return;
        }

        setPublishingToRepo(true);
        setStatus('loading');
        try {
            const slug = formData.slug.trim();
            const filePath = `posts/${slug}.md`;
            const slugDate = slug.match(/^(\d{4}-\d{2}-\d{2})/);
            const postDate = slugDate ? slugDate[1] : new Date().toISOString().slice(0, 10);
            const escapeQuotes = (s) => (s || '').replace(/"/g, '\\"');
            const markdown = [
                '---',
                `title: "${escapeQuotes(formData.title.trim())}"`,
                `date: "${postDate}"`,
                `tag: "${formData.tag}"`,
                `summary: "${escapeQuotes(formData.summary?.trim() || '')}"`,
                ...(formData.image ? [`image: "${formData.image}"`] : []),
                '---',
                '',
                formData.content || ''
            ].join('\n');

            let sha;
            const existing = await ghFetch(`/repos/${BLOG_REPO}/contents/${filePath}`);
            if (existing.ok) sha = (await existing.json()).sha;

            const res = await ghFetch(`/repos/${BLOG_REPO}/contents/${filePath}`, {
                method: 'PUT',
                body: JSON.stringify({
                    message: `post: ${formData.title.trim()}`,
                    content: encodeUtf8Base64(markdown),
                    ...(sha ? { sha } : {})
                })
            });
            if (!res.ok) {
                const detail = await res.json().catch(() => ({}));
                throw new Error(detail.message || `GitHub API ${res.status}`);
            }

            setStatus('success');
            setMessage('저장소에 커밋 완료 — 1~2분 후 배포에 반영됩니다');
            clearAutosave();
            setHasUnsavedChanges(false);
        } catch (err) {
            setStatus('error');
            setMessage(`발행 실패: ${err.message}`);
        }
        setPublishingToRepo(false);
    };

    // Word count
    const wordCount = formData.content.trim() ? formData.content.trim().split(/\s+/).length : 0;
    const charCount = formData.content.length;

    // ========== Auto-save to localStorage ==========
    const AUTOSAVE_KEY = 'admin_autosave';

    // Load from localStorage on mount
    useEffect(() => {
        if (mounted && isAuthenticated && !isEditMode) {
            const saved = localStorage.getItem(AUTOSAVE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.content || parsed.title) {
                        const shouldRestore = confirm('작성 중이던 글이 있습니다. 복구할까요?');
                        if (shouldRestore) {
                            setFormData(parsed);
                        } else {
                            localStorage.removeItem(AUTOSAVE_KEY);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse autosave:', e);
                }
            }
        }
    }, [mounted, isAuthenticated, isEditMode]);

    // Auto-save every 5 seconds when there are changes
    useEffect(() => {
        if (!isAuthenticated || isEditMode) return;

        const timer = setTimeout(() => {
            if (formData.title || formData.content) {
                localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(formData));
                setLastSaved(new Date());
                setHasUnsavedChanges(false);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [formData, isAuthenticated, isEditMode]);

    // Clear autosave when published
    const clearAutosave = () => {
        localStorage.removeItem(AUTOSAVE_KEY);
        setLastSaved(null);
    };

    // Fetch Posts — falls back to sample posts when Supabase is unavailable
    const fetchPostsList = async () => {
        const sampleList = SAMPLE_POSTS.map(({ id, title, date, tag, summary }) => ({ id, title, date, tag, summary }));

        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, date, tag, summary')
                .order('date', { ascending: false });
            if (error) throw error;

            if (!data || data.length === 0) {
                setPostsList(sampleList);
                setSupabaseDown(true);
            } else {
                setPostsList(data);
                setSupabaseDown(false);
            }
        } catch (error) {
            console.warn('Supabase unavailable, showing sample posts:', error?.message || error);
            setPostsList(sampleList);
            setSupabaseDown(true);
        }
    };

    // Load post for editing — sample posts open locally when Supabase is unavailable
    const handleEditPost = async (postId) => {
        const loadIntoForm = (data) => {
            setFormData({
                title: data.title || '',
                slug: data.id || '',
                tag: data.tag || 'Trend',
                summary: data.summary || '',
                content: data.content || '',
                image: data.image || ''
            });
            setIsEditMode(true);
            setEditingPostId(postId);
            setStatus('idle');
        };

        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

            loadIntoForm(data);
            setMessage('');
        } catch (error) {
            const samplePost = getSamplePostById(postId);
            if (samplePost) {
                loadIntoForm(samplePost);
                setMessage('샘플 글 — 저장하려면 Supabase 연결이 필요합니다');
                return;
            }
            console.warn('Error loading post:', error?.message || error);
            setStatus('error');
            setMessage('Failed to load post: ' + error.message);
        }
    };

    // Cancel edit mode
    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditingPostId(null);
        setFormData({
            title: '',
            slug: '',
            tag: 'Trend',
            summary: '',
            content: '',
            image: ''
        });
        setMessage('');
        setStatus('idle');
    };

    // Delete post
    const handleDeletePost = async (id) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            const { error } = await supabase.from('posts').delete().eq('id', id);
            if (error) throw error;
            setDeleteConfirm(null);
            fetchPostsList();
            if (editingPostId === id) {
                handleCancelEdit();
            }
            setMessage('Post deleted');
        } catch (error) {
            console.warn('Error deleting post:', error?.message || error);
            setDeleteConfirm(null);
            setStatus('error');
            setMessage(supabaseDown ? '샘플 글은 삭제할 수 없습니다 — Supabase 연결이 필요합니다' : 'Failed: ' + error.message);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchPostsList();
            fetchImages();
            fetchVideos();
        }
    }, [isAuthenticated]);

    // Auto-load post if edit query param is present
    useEffect(() => {
        if (isAuthenticated && editPostId && postsList.length > 0) {
            const decodedId = decodeURIComponent(editPostId);
            const postExists = postsList.some(p => p.id === decodedId);
            if (postExists && editingPostId !== decodedId) {
                handleEditPost(decodedId);
            }
        }
    }, [isAuthenticated, editPostId, postsList]);

    // Authentication
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === 'rlaalsdud12') {
            setIsAuthenticated(true);
            setLoginError('');
        } else {
            setLoginError('Incorrect password');
        }
    };

    // Image Management
    const fetchImages = async () => {
        try {
            const { data, error } = await supabase.storage
                .from('images')
                .list('', { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

            if (error) throw error;

            const loadedImages = data.map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(file.name);
                return { name: file.name, url: publicUrl };
            });

            setImages(loadedImages);
        } catch (error) {
            console.warn('Supabase storage unavailable (images):', error?.message || error);
        }
    };

    // Multi-image upload
    const handleImageUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadProgress({ current: 0, total: files.length });
        const uploadedUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                setUploadProgress({ current: i + 1, total: files.length });

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
                uploadedUrls.push(publicUrl);
            }

            await fetchImages();
            setMessage(`${files.length}개 이미지 업로드 완료!`);

            // Set first image as cover if no cover set
            if (!formData.image && uploadedUrls.length > 0) {
                setFormData(prev => ({ ...prev, image: uploadedUrls[0] }));
            }

            return uploadedUrls;
        } catch (error) {
            console.error('Upload Error:', error);
            setMessage('Error uploading: ' + error.message);
            return [];
        } finally {
            setUploading(false);
            setUploadProgress({ current: 0, total: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        handleImageUpload(files);
    };

    // Drag and Drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const allFiles = Array.from(e.dataTransfer.files);
        const imageFiles = allFiles.filter(f => f.type.startsWith('image/'));
        const videoFiles = allFiles.filter(f => f.type.startsWith('video/'));

        // Handle images
        if (imageFiles.length > 0) {
            const urls = await handleImageUpload(imageFiles);
            if (urls.length > 0) {
                const markdown = urls.map(url => `![Image](${url})`).join('\n');
                insertAtCursor(markdown);
            }
        }

        // Handle videos
        if (videoFiles.length > 0) {
            const urls = await handleVideoUpload(videoFiles);
            if (urls.length > 0) {
                const videoTags = urls.map(url => `<video controls width="100%" style="max-width: 800px;">
  <source src="${url}" type="video/mp4">
</video>`).join('\n\n');
                insertAtCursor(videoTags);
            }
        }
    };

    // Clipboard paste handler for images
    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) imageFiles.push(file);
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault();
            const urls = await handleImageUpload(imageFiles);
            if (urls.length > 0) {
                const markdown = urls.map(url => `![Image](${url})`).join('\n');
                insertAtCursor(markdown);
            }
        }
    };

    const handleDeleteImage = async (imageName) => {
        if (deleteConfirm !== imageName) {
            setDeleteConfirm(imageName);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            const { error } = await supabase.storage
                .from('images')
                .remove([imageName]);

            if (error) throw error;

            await fetchImages();
            setDeleteConfirm(null);
            setMessage('Image deleted.');
        } catch (error) {
            console.warn('Delete Error:', error?.message || error);
            setDeleteConfirm(null);
            setStatus('error');
            setMessage('Failed to delete image: ' + error.message);
        }
    };

    // Video Management
    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase.storage
                .from('images')
                .list('videos', { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });

            if (error) throw error;

            const loadedVideos = (data || []).filter(file => file.name !== '.emptyFolderPlaceholder').map(file => {
                const { data: { publicUrl } } = supabase.storage
                    .from('images')
                    .getPublicUrl(`videos/${file.name}`);
                return { name: file.name, url: publicUrl };
            });

            setVideos(loadedVideos);
        } catch (error) {
            console.warn('Supabase storage unavailable (videos):', error?.message || error);
        }
    };

    const handleVideoUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploadingVideo(true);
        setVideoUploadProgress({ current: 0, total: files.length });
        const uploadedUrls = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

                setVideoUploadProgress({ current: i + 1, total: files.length });

                const { error: uploadError } = await supabase.storage
                    .from('images')
                    .upload(`videos/${fileName}`, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(`videos/${fileName}`);
                uploadedUrls.push(publicUrl);
            }

            await fetchVideos();
            setMessage(`${files.length}개 영상 업로드 완료!`);

            return uploadedUrls;
        } catch (error) {
            console.error('Video Upload Error:', error);
            setMessage('Error uploading video: ' + error.message);
            return [];
        } finally {
            setUploadingVideo(false);
            setVideoUploadProgress({ current: 0, total: 0 });
            if (videoFileInputRef.current) videoFileInputRef.current.value = '';
        }
    };

    const handleVideoFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        handleVideoUpload(files);
    };

    const handleDeleteVideo = async (videoName) => {
        if (deleteConfirm !== `video_${videoName}`) {
            setDeleteConfirm(`video_${videoName}`);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            const { error } = await supabase.storage
                .from('images')
                .remove([`videos/${videoName}`]);

            if (error) throw error;

            await fetchVideos();
            setDeleteConfirm(null);
            setMessage('Video deleted.');
        } catch (error) {
            console.warn('Delete Error:', error?.message || error);
            setDeleteConfirm(null);
            setStatus('error');
            setMessage('Failed to delete video: ' + error.message);
        }
    };

    const insertVideoToContent = (url) => {
        const videoTag = `<video controls width="100%" style="max-width: 800px;">
  <source src="${url}" type="video/mp4">
  Your browser does not support the video tag.
</video>`;
        insertAtCursor(videoTag);
    };

    // Insert at cursor position
    const insertAtCursor = useCallback((text) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const content = formData.content;
        const before = content.substring(0, start);
        const after = content.substring(end);

        // Add newlines if needed
        const needNewlineBefore = before.length > 0 && !before.endsWith('\n');
        const needNewlineAfter = after.length > 0 && !after.startsWith('\n');

        const insertText = (needNewlineBefore ? '\n' : '') + text + (needNewlineAfter ? '\n' : '');
        const newContent = before + insertText + after;

        setFormData(prev => ({ ...prev, content: newContent }));
        setHasUnsavedChanges(true);

        // Set cursor position after inserted text
        setTimeout(() => {
            const newPos = start + insertText.length;
            textarea.focus();
            textarea.setSelectionRange(newPos, newPos);
        }, 0);
    }, [formData.content]);

    // Toolbar & Editor Logic
    const insertMarkdown = (prefix, suffix) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newContent = before + prefix + selection + suffix + after;
        setFormData(prev => ({ ...prev, content: newContent }));
        setHasUnsavedChanges(true);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const insertTemplate = () => {
        if (formData.content && !confirm('Overwrite current content with template?')) return;

        const template = `# Article Title

> A compelling hook or summary that captures the essence of this article.

## Introduction

Start with context. Why does this topic matter? What will readers learn?

## Key Insights

### First Point

Explain the first major insight with supporting details.

### Second Point

Develop the second insight with examples or data.

## Conclusion

Summarize key takeaways and suggest next steps or further reading.
`;
        setFormData(prev => ({ ...prev, content: template }));
        setHasUnsavedChanges(true);
    };

    const insertImageToContent = (url) => {
        insertAtCursor(`![Image](${url})`);
    };

    const setAsCover = (url) => {
        setFormData(prev => ({ ...prev, image: url }));
        setHasUnsavedChanges(true);
    };

    // Keyboard shortcuts
    const handleKeyDown = (e) => {
        if (!e.ctrlKey && !e.metaKey) return;

        const shortcuts = {
            'b': () => insertMarkdown('**', '**'),      // Bold
            'i': () => insertMarkdown('_', '_'),         // Italic
            'k': () => insertMarkdown('[', '](url)'),    // Link
            'h': () => insertMarkdown('## ', ''),        // Heading
            '/': () => insertMarkdown('```\n', '\n```'), // Code block
            's': (e) => {                                 // Save
                e.preventDefault();
                handleSubmit(e);
            }
        };

        const key = e.key.toLowerCase();
        if (shortcuts[key]) {
            e.preventDefault();
            shortcuts[key](e);
        }
    };

    // Editor Logic
    const handleChange = (e) => {
        const { name, value } = e.target;
        setHasUnsavedChanges(true);

        if (name === 'title' && !isEditMode && !formData.slug) {
            const generatedSlug = value.toLowerCase()
                .replace(/[^a-z0-9가-힣]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, title: value, slug: generatedSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Preview with LaTeX and code highlighting
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!formData.content) {
                setPreviewHtml('');
                return;
            }
            try {
                const result = await unified()
                    .use(remarkParse)
                    .use(remarkMath)
                    .use(remarkRehype, { allowDangerousHtml: true })
                    .use(rehypeRaw)
                    .use(rehypeKatex)
                    .use(rehypeStringify, { allowDangerousHtml: true })
                    .process(formData.content);

                let contentHtml = result.toString();

                // Add syntax highlighting classes for code blocks
                contentHtml = contentHtml.replace(
                    /<pre><code class="language-(\w+)">/g,
                    '<pre class="language-$1"><code class="language-$1">'
                );

                setPreviewHtml(contentHtml);
            } catch (error) {
                console.error('Preview error', error);
                // Fallback to basic remark
                try {
                    const processedContent = await remark()
                        .use(html, { sanitize: false })
                        .process(formData.content);
                    setPreviewHtml(processedContent.toString());
                } catch (e) {
                    console.error('Fallback preview error', e);
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.content]);

    // Load Prism.js for syntax highlighting
    useEffect(() => {
        if (typeof window !== 'undefined' && previewHtml) {
            import('prismjs').then((Prism) => {
                // Import common languages
                import('prismjs/components/prism-python');
                import('prismjs/components/prism-javascript');
                import('prismjs/components/prism-typescript');
                import('prismjs/components/prism-jsx');
                import('prismjs/components/prism-tsx');
                import('prismjs/components/prism-css');
                import('prismjs/components/prism-bash');
                import('prismjs/components/prism-json');
                import('prismjs/components/prism-markdown');
                import('prismjs/components/prism-yaml');
                import('prismjs/components/prism-sql');

                setTimeout(() => {
                    Prism.default.highlightAll();
                }, 100);
            });
        }
    }, [previewHtml]);

    // Publishing / Updating
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.slug || !formData.slug.trim()) {
            setStatus('error');
            setMessage('Slug is required');
            return;
        }
        if (!formData.title || !formData.title.trim()) {
            setStatus('error');
            setMessage('Title is required');
            return;
        }

        setStatus('loading');

        try {
            if (isEditMode) {
                const newSlug = formData.slug.trim();
                const slugChanged = newSlug !== editingPostId;

                if (slugChanged) {
                    // Slug changed: delete old post and create new one
                    const { error: deleteError } = await supabase
                        .from('posts')
                        .delete()
                        .eq('id', editingPostId);

                    if (deleteError) throw deleteError;

                    const { error: insertError } = await supabase
                        .from('posts')
                        .insert([{
                            id: newSlug,
                            title: formData.title.trim(),
                            tag: formData.tag,
                            summary: formData.summary?.trim() || '',
                            content: formData.content || '',
                            image: formData.image || null,
                            date: new Date().toISOString()
                        }]);

                    if (insertError) throw insertError;

                    setEditingPostId(newSlug);
                } else {
                    // Same slug: just update
                    const { error } = await supabase
                        .from('posts')
                        .update({
                            title: formData.title.trim(),
                            tag: formData.tag,
                            summary: formData.summary?.trim() || '',
                            content: formData.content || '',
                            image: formData.image || null,
                        })
                        .eq('id', editingPostId);

                    if (error) throw error;
                }

                setStatus('success');
                setMessage('Updated successfully!');
                fetchPostsList();
            } else {
                // Create new post
                const { error } = await supabase
                    .from('posts')
                    .insert([{
                        id: formData.slug.trim(),
                        title: formData.title.trim(),
                        tag: formData.tag,
                        summary: formData.summary?.trim() || '',
                        content: formData.content || '',
                        image: formData.image || null,
                        date: new Date().toISOString()
                    }]);

                if (error) throw error;

                setStatus('success');
                setMessage('Published successfully!');
                fetchPostsList();
                clearAutosave();

                setFormData({
                    title: '',
                    slug: '',
                    tag: 'Trend',
                    summary: '',
                    content: '',
                    image: ''
                });
            }
            setHasUnsavedChanges(false);
        } catch (error) {
            console.warn('Error:', error?.message || error);
            setStatus('error');
            setMessage(supabaseDown
                ? '저장 실패 — Supabase 연결이 필요합니다 (src/lib/supabase.js 설정 확인)'
                : `Error: ${error.message}`);
        }
    };

    // Filter posts by search
    const filteredPosts = postsList.filter(post =>
        post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!mounted) return null;

    if (!isAuthenticated) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--color-background)',
                padding: '24px'
            }}>
                <form onSubmit={handleLogin} style={{
                    textAlign: 'left',
                    padding: '48px',
                    background: 'var(--color-background)',
                    borderRadius: '0',
                    border: '1px solid var(--color-border)',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <h1 style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '24px',
                        fontWeight: '400',
                        letterSpacing: '-0.02em',
                        marginBottom: '8px',
                        color: 'var(--color-text-main)'
                    }}>
                        ↗ Write
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '14px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '32px'
                    }}>
                        Enter your access code
                    </p>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Access Code"
                        style={{
                            width: '100%',
                            padding: '14px 18px',
                            borderRadius: '0',
                            border: '1px solid var(--color-border)',
                            marginBottom: '16px',
                            background: 'var(--color-background)',
                            color: 'var(--color-text-main)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '16px'
                        }}
                    />
                    {loginError && (
                        <p style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                            color: 'var(--color-text-muted)',
                            margin: '0 0 16px'
                        }}>
                            {loginError}
                        </p>
                    )}
                    <button type="submit" style={{
                        width: '100%',
                        padding: '14px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-background)',
                        border: '1px solid var(--color-primary)',
                        borderRadius: '0',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '16px',
                        fontWeight: '400',
                        cursor: 'pointer'
                    }}>
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div
            style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.06)',
                    border: '3px dashed var(--color-primary)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <div style={{
                        background: 'var(--color-surface)',
                        padding: '32px 48px',
                        borderRadius: '0',
                        boxShadow: 'var(--shadow-lg)',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷 🎬</div>
                        <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: 'var(--color-text-main)'
                        }}>
                            이미지 또는 영상을 놓아주세요
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '14px',
                            color: 'var(--color-text-muted)',
                            marginTop: '8px'
                        }}>
                            커서 위치에 삽입됩니다
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT SIDEBAR */}
            <div style={{
                width: isSidebarOpen ? '300px' : '0',
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                transition: 'width 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden'
            }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setActiveTab('posts')}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: activeTab === 'posts' ? 'var(--color-background)' : 'transparent',
                            color: activeTab === 'posts' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('media')}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: activeTab === 'media' ? 'var(--color-background)' : 'transparent',
                            color: activeTab === 'media' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                            border: 'none',
                            borderLeft: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Media
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: activeTab === 'import' ? 'var(--color-background)' : 'transparent',
                            color: activeTab === 'import' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                            border: 'none',
                            borderLeft: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: '600',
                            fontSize: '12px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Import
                    </button>
                </div>

                {/* Import Tab — DailyAIR */}
                {activeTab === 'import' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-hairline)' }}>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
                                GitHub Token (Fine-grained PAT)
                            </label>
                            <input
                                type="password"
                                value={ghToken}
                                onChange={(e) => saveGhToken(e.target.value)}
                                placeholder="github_pat_..."
                                autoComplete="off"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '12px',
                                    fontFamily: 'var(--font-mono)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                                이 브라우저에만 저장됩니다 (localStorage). DailyAIR 읽기 + 블로그 저장소 쓰기 권한 필요.
                            </p>
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-hairline)' }}>
                            {IMPORT_DIRS.map((dir) => (
                                <button
                                    key={dir}
                                    onClick={() => loadImportFiles(dir)}
                                    disabled={!ghToken || importLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px 4px',
                                        background: importDir === dir ? 'var(--color-text-main)' : 'transparent',
                                        color: importDir === dir ? 'var(--color-background)' : 'var(--color-text-main)',
                                        border: 'none',
                                        cursor: ghToken ? 'pointer' : 'not-allowed',
                                        fontFamily: 'var(--font-sans)',
                                        fontSize: '12px',
                                        opacity: ghToken ? 1 : 0.4
                                    }}
                                >
                                    {dir}
                                </button>
                            ))}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {!ghToken ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}>
                                    토큰을 입력한 뒤 카테고리를 선택하면 DailyAIR 글 목록을 불러옵니다.
                                </p>
                            ) : importLoading ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                                    불러오는 중...
                                </p>
                            ) : importError ? (
                                <p style={{ color: 'var(--color-text-main)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                                    {importError}
                                </p>
                            ) : importFiles.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontFamily: 'var(--font-sans)' }}>
                                    카테고리를 선택하세요.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {importFiles.map((file) => (
                                        <button
                                            key={file.name}
                                            onClick={() => handleImportFile(file.name)}
                                            style={{
                                                textAlign: 'left',
                                                padding: '10px 12px',
                                                background: 'var(--color-background)',
                                                border: '1px solid var(--color-hairline)',
                                                borderRadius: '0',
                                                cursor: 'pointer',
                                                fontFamily: 'var(--font-sans)',
                                                fontSize: '12px',
                                                color: 'var(--color-text-main)',
                                                lineHeight: 1.4,
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            ↗ {file.name.replace(/\.md$/, '')}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        {/* Search */}
                        <div style={{ padding: '12px' }}>
                            <input
                                type="text"
                                placeholder="Search posts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>

                        {/* New Post Button */}
                        <div style={{ padding: '0 12px 12px' }}>
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: isEditMode ? 'var(--color-background)' : 'var(--color-primary)',
                                    color: isEditMode ? 'var(--color-text-main)' : 'var(--color-background)',
                                    border: isEditMode ? '1px solid var(--color-border)' : 'none',
                                    borderRadius: '0',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}
                            >
                                + New Post
                            </button>
                        </div>

                        {/* Posts List */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px' }}>
                            {filteredPosts.length === 0 ? (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '13px', padding: '20px 0' }}>
                                    No posts found
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {filteredPosts.map(post => (
                                        <div
                                            key={post.id}
                                            style={{
                                                padding: '10px 12px',
                                                background: editingPostId === post.id ? 'var(--color-primary)' : 'var(--color-background)',
                                                border: '1px solid var(--color-border)',
                                                borderRadius: '0',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleEditPost(post.id)}
                                        >
                                            <div style={{
                                                fontFamily: 'var(--font-sans)',
                                                fontWeight: '500',
                                                fontSize: '13px',
                                                marginBottom: '4px',
                                                color: editingPostId === post.id ? 'var(--color-background)' : 'var(--color-text-main)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {post.title || 'Untitled'}
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    fontSize: '11px',
                                                    color: editingPostId === post.id ? 'rgba(255,255,255,0.7)' : 'var(--color-text-muted)'
                                                }}>
                                                    {post.tag} · {new Date(post.date).toLocaleDateString()}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeletePost(post.id);
                                                    }}
                                                    style={{
                                                        padding: '2px 8px',
                                                        background: deleteConfirm === post.id ? 'var(--color-text-main)' : 'transparent',
                                                        color: deleteConfirm === post.id ? 'var(--color-background)' : 'var(--color-text-muted)',
                                                        border: '1px solid var(--color-border)',
                                                        borderRadius: '0',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    {deleteConfirm === post.id ? 'Confirm' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {/* Image Upload Section */}
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '8px'
                            }}>
                                📷 이미지
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileInputChange}
                                accept="image/*"
                                multiple
                                style={{ display: 'none' }}
                                id="sidebar-upload"
                            />
                            <label htmlFor="sidebar-upload" style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '10px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-background)',
                                borderRadius: '0',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '600',
                                fontSize: '13px'
                            }}>
                                {uploading
                                    ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...`
                                    : '+ Upload Images'}
                            </label>
                        </div>

                        {/* Image Grid */}
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {images.map((img) => (
                                    <div key={img.name} style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0',
                                        overflow: 'hidden',
                                        background: 'var(--color-background)'
                                    }}>
                                        <div style={{ height: '70px', overflow: 'hidden', cursor: 'pointer' }}
                                            onClick={() => insertImageToContent(img.url)}
                                            title="클릭하면 커서 위치에 삽입">
                                            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                                            <button
                                                onClick={() => setAsCover(img.url)}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderRight: '1px solid var(--color-border)',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: 'var(--color-text-muted)'
                                                }}
                                            >
                                                Cover
                                            </button>
                                            <button
                                                onClick={() => handleDeleteImage(img.name)}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    background: deleteConfirm === img.name ? 'var(--color-text-main)' : 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: deleteConfirm === img.name ? 'var(--color-background)' : 'var(--color-text-muted)'
                                                }}
                                            >
                                                {deleteConfirm === img.name ? 'Confirm' : 'Del'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {images.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '10px' }}>
                                    No images yet
                                </p>
                            )}
                        </div>

                        {/* Video Upload Section */}
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                            <div style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                color: 'var(--color-text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: '8px'
                            }}>
                                🎬 영상
                            </div>
                            <input
                                type="file"
                                ref={videoFileInputRef}
                                onChange={handleVideoFileInputChange}
                                accept="video/*"
                                multiple
                                style={{ display: 'none' }}
                                id="video-upload"
                            />
                            <label htmlFor="video-upload" style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '10px',
                                background: 'var(--color-text-main)',
                                color: 'var(--color-background)',
                                borderRadius: '0',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '600',
                                fontSize: '13px'
                            }}>
                                {uploadingVideo
                                    ? `Uploading ${videoUploadProgress.current}/${videoUploadProgress.total}...`
                                    : '+ Upload Videos'}
                            </label>
                            <p style={{
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                textAlign: 'center',
                                marginTop: '8px',
                                fontFamily: 'var(--font-sans)'
                            }}>
                                Manim, MP4 등 영상 파일
                            </p>
                        </div>

                        {/* Video Grid */}
                        <div style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {videos.map((vid) => (
                                    <div key={vid.name} style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0',
                                        overflow: 'hidden',
                                        background: 'var(--color-background)'
                                    }}>
                                        <div
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                            onClick={() => insertVideoToContent(vid.url)}
                                            title="클릭하면 커서 위치에 삽입"
                                        >
                                            <span style={{ fontSize: '16px' }}>🎬</span>
                                            <span style={{
                                                fontSize: '12px',
                                                color: 'var(--color-text-main)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1
                                            }}>
                                                {vid.name}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                                            <button
                                                onClick={() => window.open(vid.url, '_blank')}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderRight: '1px solid var(--color-border)',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: 'var(--color-text-muted)'
                                                }}
                                            >
                                                Preview
                                            </button>
                                            <button
                                                onClick={() => handleDeleteVideo(vid.name)}
                                                style={{
                                                    flex: 1,
                                                    padding: '6px',
                                                    background: deleteConfirm === `video_${vid.name}` ? 'var(--color-text-main)' : 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: deleteConfirm === `video_${vid.name}` ? 'var(--color-background)' : 'var(--color-text-muted)'
                                                }}
                                            >
                                                {deleteConfirm === `video_${vid.name}` ? 'Confirm' : 'Del'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {videos.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '10px' }}>
                                    No videos yet
                                </p>
                            )}
                        </div>

                        {/* Help text */}
                        <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)' }}>
                            <p style={{
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                textAlign: 'center',
                                fontFamily: 'var(--font-sans)',
                                lineHeight: '1.5'
                            }}>
                                💡 드래그 앤 드롭으로도 업로드 가능<br />
                                클릭하면 커서 위치에 삽입됩니다
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>

                {/* Header */}
                <div style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            {isSidebarOpen ? '◀' : '▶'}
                        </button>
                        <h2 style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: 0,
                            color: 'var(--color-text-main)'
                        }}>
                            {isEditMode ? 'Edit Post' : 'New Post'}
                        </h2>
                        {isEditMode && (
                            <span style={{
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                                background: 'var(--color-surface)',
                                padding: '4px 8px',
                                borderRadius: '0'
                            }}>
                                /{editingPostId}/
                            </span>
                        )}
                        {supabaseDown && (
                            <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                                border: '1px solid var(--color-border)',
                                padding: '4px 10px'
                            }}>
                                Supabase 미연결 — 샘플 데이터 표시 중, 저장 불가
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {/* Auto-save indicator */}
                        {!isEditMode && lastSaved && (
                            <span style={{
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                fontFamily: 'var(--font-sans)'
                            }}>
                                자동저장: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        {message && (
                            <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '13px',
                                color: 'var(--color-text-main)'
                            }}>
                                {message}
                            </span>
                        )}
                        {isEditMode && (
                            <button
                                onClick={handleCancelEdit}
                                style={{
                                    padding: '8px 16px',
                                    background: 'transparent',
                                    color: 'var(--color-text-muted)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        {ghToken && (
                            <button
                                onClick={handlePublishToRepo}
                                disabled={publishingToRepo}
                                title="블로그 저장소 /posts에 마크다운으로 커밋 (Supabase 불필요)"
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)',
                                    border: '1px solid var(--color-text-main)',
                                    borderRadius: '0',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '13px',
                                    cursor: publishingToRepo ? 'wait' : 'pointer',
                                    opacity: publishingToRepo ? 0.7 : 1
                                }}
                            >
                                {publishingToRepo ? 'Committing...' : 'Publish → GitHub'}
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={status === 'loading'}
                            style={{
                                padding: '8px 20px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-background)',
                                border: 'none',
                                borderRadius: '0',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: status === 'loading' ? 'wait' : 'pointer',
                                opacity: status === 'loading' ? 0.7 : 1
                            }}
                        >
                            {status === 'loading' ? 'Saving...' : (isEditMode ? 'Update' : 'Publish')}
                        </button>
                    </div>
                </div>

                {/* Form Inputs */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Title *
                            </label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Article title..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Slug *
                            </label>
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="url-slug"
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category
                            </label>
                            <select
                                name="tag"
                                value={formData.tag}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            >
                                {categoryOptions.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Summary
                            </label>
                            <input
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                placeholder="Brief description..."
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '0',
                                    fontSize: '13px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Cover Image
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="Image URL"
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '0',
                                        fontSize: '13px',
                                        fontFamily: 'var(--font-sans)',
                                        background: 'var(--color-background)',
                                        color: 'var(--color-text-main)'
                                    }}
                                />
                                {formData.image && (
                                    <img
                                        src={formData.image}
                                        alt="cover"
                                        style={{
                                            width: '38px',
                                            height: '38px',
                                            borderRadius: '0',
                                            objectFit: 'cover',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    padding: '8px 20px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '6px',
                    alignItems: 'center',
                    background: 'var(--color-surface)',
                    flexWrap: 'wrap'
                }}>
                    {[
                        { label: 'B', action: () => insertMarkdown('**', '**'), title: 'Bold (Ctrl+B)', style: { fontWeight: 'bold' } },
                        { label: 'I', action: () => insertMarkdown('_', '_'), title: 'Italic (Ctrl+I)', style: { fontStyle: 'italic' } },
                        { label: 'H1', action: () => insertMarkdown('# ', ''), title: 'Heading 1' },
                        { label: 'H2', action: () => insertMarkdown('## ', ''), title: 'Heading 2 (Ctrl+H)' },
                        { label: 'H3', action: () => insertMarkdown('### ', ''), title: 'Heading 3' },
                        { label: '"', action: () => insertMarkdown('> ', ''), title: 'Quote' },
                        { label: '•', action: () => insertMarkdown('- ', ''), title: 'List' },
                        { label: '1.', action: () => insertMarkdown('1. ', ''), title: 'Numbered List' },
                        { label: '☐', action: () => insertMarkdown('- [ ] ', ''), title: 'Checkbox' },
                        { label: '—', action: () => insertMarkdown('\n---\n', ''), title: 'Horizontal Rule' },
                        { label: '<>', action: () => insertMarkdown('```\n', '\n```'), title: 'Code Block (Ctrl+/)' },
                        { label: '🔗', action: () => insertMarkdown('[', '](url)'), title: 'Link (Ctrl+K)' },
                        { label: '📷', action: () => insertMarkdown('![', '](url)'), title: 'Image' },
                        { label: '∑', action: () => insertMarkdown('$$\n', '\n$$'), title: 'LaTeX Block' },
                        { label: 'π', action: () => insertMarkdown('$', '$'), title: 'Inline LaTeX' },
                        { label: '📊', action: () => insertMarkdown('\n| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n', ''), title: 'Table' },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.action}
                            title={btn.title}
                            style={{
                                padding: '5px 10px',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '0',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: 'var(--color-text-main)',
                                ...btn.style
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '16px', background: 'var(--color-border)', margin: '0 4px' }} />
                    <button
                        onClick={insertTemplate}
                        style={{
                            padding: '5px 12px',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '0',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        Template
                    </button>

                    {/* Word count */}
                    <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-sans)' }}>
                        {wordCount} words · {charCount} chars
                    </div>
                </div>

                {/* Editor */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
                        <textarea
                            ref={textareaRef}
                            id="content-editor"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder="Write your content in Markdown...

단축키:
• Ctrl+B: 굵게
• Ctrl+I: 기울임
• Ctrl+K: 링크
• Ctrl+H: 제목
• Ctrl+/: 코드 블록
• Ctrl+S: 저장

LaTeX 수식:
• 인라인: $E = mc^2$
• 블록: $$\\sum_{i=1}^{n} x_i$$

이미지:
• 드래그 앤 드롭
• Ctrl+V로 붙여넣기"
                            style={{
                                flex: 1,
                                padding: '20px',
                                background: 'var(--color-background)',
                                color: 'var(--color-text-main)',
                                border: 'none',
                                resize: 'none',
                                fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
                        <div style={{
                            padding: '8px 20px',
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}>
                            Preview
                        </div>
                        <div
                            className="article-content"
                            style={{
                                flex: 1,
                                padding: '30px',
                                overflowY: 'auto',
                                background: 'var(--color-background)'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: previewHtml || '<p style="color: var(--color-text-muted); font-style: italic;">Preview will appear here...</p>'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* KaTeX CSS */}
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

            {/* Prism.js CSS */}
            <style>{`
                pre[class*="language-"] {
                    background: #1e1e1e;
                    padding: 16px;
                    border-radius: 8px;
                    overflow-x: auto;
                    margin: 16px 0;
                }
                code[class*="language-"] {
                    font-family: "Fira Code", "SF Mono", Monaco, monospace;
                    font-size: 14px;
                    line-height: 1.5;
                }
                .token.comment { color: #6a9955; }
                .token.string { color: #ce9178; }
                .token.number { color: #b5cea8; }
                .token.keyword { color: #569cd6; }
                .token.function { color: #dcdcaa; }
                .token.operator { color: #d4d4d4; }
                .token.class-name { color: #4ec9b0; }
                .token.punctuation { color: #d4d4d4; }
                .token.property { color: #9cdcfe; }
                .token.boolean { color: #569cd6; }
            `}</style>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'var(--color-background)'
            }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
            </div>
        }>
            <AdminContent />
        </Suspense>
    );
}
