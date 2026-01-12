'use client';

export const dynamic = 'force-static';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { remark } from 'remark';
import html from 'remark-html';

function AdminContent() {
    const searchParams = useSearchParams();
    const editPostId = searchParams.get('edit');

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    // Editor State
    const [previewHtml, setPreviewHtml] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);

    // Image Manager State
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Post Manager State
    const [activeTab, setActiveTab] = useState('posts');
    const [postsList, setPostsList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Two-step Delete State
    const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    const categoryOptions = ['Trend', 'Research', 'Series', 'Life'];

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    // Fetch Posts
    const fetchPostsList = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, date, tag, summary')
                .order('date', { ascending: false });
            if (error) throw error;
            setPostsList(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

    // Load post for editing
    const handleEditPost = async (postId) => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

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
            setMessage('');
            setStatus('idle');
        } catch (error) {
            console.error('Error loading post:', error);
            alert('Failed to load post: ' + error.message);
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
            console.error('Error deleting post:', error);
            alert('Failed: ' + error.message);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchPostsList();
            fetchImages();
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
        } else {
            alert('Incorrect password');
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
            console.error('Error fetching images:', error);
        }
    };

    const handleImageUpload = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;

            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            await fetchImages();
            setMessage('Image uploaded!');

            const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(fileName);
            if (!formData.image) {
                setFormData(prev => ({ ...prev, image: publicUrl }));
            }

        } catch (error) {
            console.error('Upload Error:', error);
            setMessage('Error uploading: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
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
            console.error('Delete Error:', error);
            alert('Failed: ' + error.message);
        }
    };

    // Toolbar & Editor Logic
    const insertMarkdown = (prefix, suffix) => {
        const textarea = document.getElementById('content-editor');
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.content;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newContent = before + prefix + selection + suffix + after;
        setFormData(prev => ({ ...prev, content: newContent }));

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
    };

    const insertImageToContent = (url) => {
        const markdown = `\n![Image](${url})\n`;
        setFormData(prev => ({
            ...prev,
            content: prev.content + markdown
        }));
    };

    const setAsCover = (url) => {
        setFormData(prev => ({ ...prev, image: url }));
    };

    // Editor Logic
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'title' && !isEditMode && !formData.slug) {
            const generatedSlug = value.toLowerCase()
                .replace(/[^a-z0-9가-힣]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, title: value, slug: generatedSlug }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!formData.content) {
                setPreviewHtml('');
                return;
            }
            try {
                const processedContent = await remark()
                    .use(html)
                    .process(formData.content);
                const contentHtml = processedContent.toString();
                setPreviewHtml(contentHtml);
            } catch (error) {
                console.error('Preview error', error);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [formData.content]);

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

                setFormData({
                    title: '',
                    slug: '',
                    tag: 'Trend',
                    summary: '',
                    content: '',
                    image: ''
                });
            }
        } catch (error) {
            console.error('Error:', error);
            setStatus('error');
            setMessage(`Error: ${error.message}`);
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
                    textAlign: 'center',
                    padding: '48px',
                    background: 'var(--color-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <h1 style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '24px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        color: 'var(--color-text-main)'
                    }}>
                        Admin Panel
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
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            marginBottom: '16px',
                            background: 'var(--color-background)',
                            color: 'var(--color-text-main)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '16px'
                        }}
                    />
                    <button type="submit" style={{
                        width: '100%',
                        padding: '14px',
                        background: 'var(--color-primary)',
                        color: 'var(--color-background)',
                        border: 'none',
                        borderRadius: '8px',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}>
                        Login
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 70px)', overflow: 'hidden' }}>

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
                </div>

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
                                    borderRadius: '6px',
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
                                    borderRadius: '6px',
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
                                                borderRadius: '6px',
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
                                                        background: deleteConfirm === post.id ? '#dc3545' : 'transparent',
                                                        color: deleteConfirm === post.id ? '#fff' : '#dc3545',
                                                        border: deleteConfirm === post.id ? 'none' : '1px solid #dc3545',
                                                        borderRadius: '3px',
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
                    <>
                        <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="sidebar-upload"
                            />
                            <label htmlFor="sidebar-upload" style={{
                                display: 'block',
                                textAlign: 'center',
                                padding: '10px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-background)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '600',
                                fontSize: '13px'
                            }}>
                                {uploading ? 'Uploading...' : '+ Upload Image'}
                            </label>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {images.map((img) => (
                                    <div key={img.name} style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        background: 'var(--color-background)'
                                    }}>
                                        <div style={{ height: '70px', overflow: 'hidden', cursor: 'pointer' }}
                                            onClick={() => insertImageToContent(img.url)}>
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
                                                    background: deleteConfirm === img.name ? '#dc3545' : 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '10px',
                                                    color: deleteConfirm === img.name ? '#fff' : 'var(--color-text-muted)'
                                                }}
                                            >
                                                {deleteConfirm === img.name ? 'Confirm' : 'Del'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {images.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px', marginTop: '30px' }}>
                                    No images yet
                                </p>
                            )}
                        </div>
                    </>
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
                                borderRadius: '4px',
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
                                borderRadius: '4px'
                            }}>
                                /{editingPostId}/
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {message && (
                            <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '13px',
                                color: status === 'error' ? '#dc3545' : '#28a745'
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
                                    borderRadius: '4px',
                                    fontFamily: 'var(--font-sans)',
                                    fontSize: '13px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
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
                                borderRadius: '4px',
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
                                    borderRadius: '4px',
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
                                    borderRadius: '4px',
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
                                    borderRadius: '4px',
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
                                    borderRadius: '4px',
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
                                        borderRadius: '4px',
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
                                            borderRadius: '4px',
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
                    background: 'var(--color-surface)'
                }}>
                    {[
                        { label: 'B', action: () => insertMarkdown('**', '**'), title: 'Bold', style: { fontWeight: 'bold' } },
                        { label: 'I', action: () => insertMarkdown('_', '_'), title: 'Italic', style: { fontStyle: 'italic' } },
                        { label: 'H1', action: () => insertMarkdown('# ', ''), title: 'Heading 1' },
                        { label: 'H2', action: () => insertMarkdown('## ', ''), title: 'Heading 2' },
                        { label: 'H3', action: () => insertMarkdown('### ', ''), title: 'Heading 3' },
                        { label: '"', action: () => insertMarkdown('> ', ''), title: 'Quote' },
                        { label: '•', action: () => insertMarkdown('- ', ''), title: 'List' },
                        { label: '<>', action: () => insertMarkdown('```\n', '\n```'), title: 'Code' },
                        { label: '🔗', action: () => insertMarkdown('[', '](url)'), title: 'Link' },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.action}
                            title={btn.title}
                            style={{
                                padding: '5px 10px',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '3px',
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
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        Template
                    </button>
                </div>

                {/* Editor */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
                        <textarea
                            id="content-editor"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Write your content in Markdown..."
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
