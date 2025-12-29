'use client';

export const dynamic = 'force-static';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { remark } from 'remark';
import html from 'remark-html';

export default function AdminPage() {
    // Hydration Fix: Ensure component only renders on client
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');

    // Editor State
    const [previewHtml, setPreviewHtml] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Image Manager State
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Post Manager State
    const [activeTab, setActiveTab] = useState('media');
    const [postsList, setPostsList] = useState([]);

    // Two-step Delete State
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const fetchPostsList = async () => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('id, title, date')
                .order('date', { ascending: false });
            if (error) throw error;
            setPostsList(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    };

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
            alert('Post deleted successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed: ' + error.message);
        }
    };

    useEffect(() => {
        if (activeTab === 'posts') {
            fetchPostsList();
        }
    }, [activeTab]);

    // Form States
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        tag: 'Trend',
        summary: '',
        content: '',
        image: ''
    });

    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('');

    // Authentication
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') {
            setIsAuthenticated(true);
            fetchImages();
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

    const handleDeleteAllPosts = async () => {
        if (!confirm('WARNING: This will delete ALL posts. This cannot be undone. Are you sure?')) return;

        try {
            const { data: posts, error: fetchError } = await supabase.from('posts').select('id');
            if (fetchError) throw fetchError;

            if (posts.length === 0) {
                alert('No posts to delete.');
                return;
            }

            const ids = posts.map(p => p.id);
            const { error: deleteError } = await supabase.from('posts').delete().in('id', ids);
            if (deleteError) throw deleteError;

            setPostsList([]);
            setMessage('All posts deleted.');
        } catch (error) {
            console.error('Delete All Error:', error);
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

### Third Point

Present the third insight and its implications.

## Analysis

Provide deeper analysis, connecting the insights together.

## Conclusion

Summarize key takeaways and suggest next steps or further reading.

---

*What are your thoughts on this topic? Share in the comments below.*
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

        if (name === 'title' && !formData.slug) {
            const generatedSlug = value.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
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
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.content]);

    // Publishing
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const { error } = await supabase
                .from('posts')
                .insert([{
                    id: formData.slug,
                    title: formData.title,
                    tag: formData.tag,
                    summary: formData.summary,
                    content: formData.content,
                    image: formData.image || null,
                    date: new Date().toISOString()
                }]);

            if (error) throw error;

            setStatus('success');
            setMessage('Published Successfully!');

            setFormData({
                title: '',
                slug: '',
                tag: 'Trend',
                summary: '',
                content: '',
                image: ''
            });

        } catch (error) {
            console.error('Error publishing:', error);
            setStatus('error');
            setMessage(`Error: ${error.message}`);
        }
    };

    // Hydration check
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
                        Write a Post
                    </h1>
                    <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '14px',
                        color: 'var(--color-text-muted)',
                        marginBottom: '32px'
                    }}>
                        Enter your access code to continue
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
                        Access Editor
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

            {/* LEFT SIDEBAR */}
            <div style={{
                width: isSidebarOpen ? '320px' : '0',
                background: 'var(--color-surface)',
                borderRight: '1px solid var(--color-border)',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden'
            }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => setActiveTab('media')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'media' ? 'var(--color-background)' : 'transparent',
                            color: activeTab === 'media' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: '600',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Media
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        style={{
                            flex: 1,
                            padding: '16px',
                            background: activeTab === 'posts' ? 'var(--color-background)' : 'transparent',
                            color: activeTab === 'posts' ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                            border: 'none',
                            borderLeft: '1px solid var(--color-border)',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: '600',
                            fontSize: '13px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Posts
                    </button>
                </div>

                {/* Media Tab */}
                {activeTab === 'media' && (
                    <>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
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
                                padding: '12px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-background)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}>
                                {uploading ? 'Uploading...' : '+ Upload Image'}
                            </label>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {images.map((img) => (
                                    <div key={img.name} style={{
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        background: 'var(--color-background)'
                                    }}>
                                        <div style={{ height: '80px', overflow: 'hidden', cursor: 'pointer' }}
                                            onClick={() => insertImageToContent(img.url)}>
                                            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)' }}>
                                            <button
                                                onClick={() => setAsCover(img.url)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    borderRight: '1px solid var(--color-border)',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    color: 'var(--color-text-muted)'
                                                }}
                                                title="Set as cover"
                                            >
                                                Cover
                                            </button>
                                            <button
                                                onClick={() => handleDeleteImage(img.name)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    background: deleteConfirm === img.name ? '#dc3545' : 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    color: deleteConfirm === img.name ? '#fff' : 'var(--color-text-muted)'
                                                }}
                                            >
                                                {deleteConfirm === img.name ? 'Confirm?' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {images.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '14px', marginTop: '40px' }}>
                                    No images uploaded yet
                                </p>
                            )}
                        </div>
                    </>
                )}

                {/* Posts Tab */}
                {activeTab === 'posts' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                        <button onClick={fetchPostsList} style={{
                            width: '100%',
                            marginBottom: '16px',
                            padding: '10px',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            fontSize: '13px',
                            color: 'var(--color-text-muted)'
                        }}>
                            Refresh List
                        </button>

                        {postsList.length === 0 ? (
                            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', fontSize: '14px' }}>
                                No posts found.
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {postsList.map(post => (
                                    <div key={post.id} style={{
                                        padding: '12px',
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px'
                                    }}>
                                        <div style={{
                                            fontFamily: 'var(--font-sans)',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            marginBottom: '8px',
                                            color: 'var(--color-text-main)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {post.title}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                {new Date(post.date).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleDeletePost(post.id)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: deleteConfirm === post.id ? '#dc3545' : 'transparent',
                                                    color: deleteConfirm === post.id ? '#fff' : '#dc3545',
                                                    border: deleteConfirm === post.id ? 'none' : '1px solid #dc3545',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}
                                            >
                                                {deleteConfirm === post.id ? 'Confirm?' : 'Delete'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {postsList.length > 0 && (
                            <button
                                onClick={handleDeleteAllPosts}
                                style={{
                                    width: '100%',
                                    marginTop: '24px',
                                    padding: '12px',
                                    background: 'transparent',
                                    border: '1px solid #dc3545',
                                    color: '#dc3545',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-sans)',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}
                            >
                                Delete All Posts
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* MAIN AREA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--color-background)' }}>

                {/* Header / Toolbar */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: 'var(--color-text-main)'
                            }}
                        >
                            {isSidebarOpen ? '◀' : '▶'}
                        </button>
                        <h2 style={{
                            fontFamily: 'var(--font-sans)',
                            fontSize: '18px',
                            fontWeight: '700',
                            margin: 0,
                            color: 'var(--color-text-main)'
                        }}>
                            New Article
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {message && (
                            <span style={{
                                fontFamily: 'var(--font-sans)',
                                fontSize: '14px',
                                color: status === 'error' ? '#dc3545' : '#28a745'
                            }}>
                                {message}
                            </span>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={status === 'loading'}
                            style={{
                                padding: '10px 24px',
                                background: 'var(--color-primary)',
                                color: 'var(--color-background)',
                                border: 'none',
                                borderRadius: '6px',
                                fontFamily: 'var(--font-sans)',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: status === 'loading' ? 'wait' : 'pointer',
                                opacity: status === 'loading' ? 0.7 : 1
                            }}
                        >
                            {status === 'loading' ? 'Publishing...' : 'Publish'}
                        </button>
                    </div>
                </div>

                {/* Form Inputs */}
                <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Title
                            </label>
                            <input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Article title..."
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '16px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Slug
                            </label>
                            <input
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                placeholder="url-slug"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Category
                            </label>
                            <select
                                name="tag"
                                value={formData.tag}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            >
                                <option>Trend</option>
                                <option>Classic</option>
                                <option>Guide</option>
                                <option>News</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Summary
                            </label>
                            <input
                                name="summary"
                                value={formData.summary}
                                onChange={handleChange}
                                placeholder="Brief description for the article card..."
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontFamily: 'var(--font-sans)',
                                    background: 'var(--color-background)',
                                    color: 'var(--color-text-main)'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Cover Image
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    name="image"
                                    value={formData.image}
                                    onChange={handleChange}
                                    placeholder="Image URL or upload from sidebar"
                                    style={{
                                        flex: 1,
                                        padding: '12px 16px',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '6px',
                                        fontSize: '14px',
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
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '6px',
                                            objectFit: 'cover',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Markdown Toolbar */}
                <div style={{
                    padding: '12px 24px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    background: 'var(--color-surface)'
                }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '8px' }}>
                        Format
                    </span>
                    {[
                        { label: 'B', action: () => insertMarkdown('**', '**'), title: 'Bold' },
                        { label: 'I', action: () => insertMarkdown('_', '_'), title: 'Italic', style: { fontStyle: 'italic' } },
                        { label: 'H1', action: () => insertMarkdown('# ', ''), title: 'Heading 1' },
                        { label: 'H2', action: () => insertMarkdown('## ', ''), title: 'Heading 2' },
                        { label: '"', action: () => insertMarkdown('> ', ''), title: 'Quote' },
                        { label: '{ }', action: () => insertMarkdown('```\n', '\n```'), title: 'Code block' },
                        { label: 'Link', action: () => insertMarkdown('[', '](url)'), title: 'Link' },
                    ].map((btn, i) => (
                        <button
                            key={i}
                            onClick={btn.action}
                            title={btn.title}
                            style={{
                                padding: '6px 12px',
                                background: 'var(--color-background)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                color: 'var(--color-text-main)',
                                ...btn.style
                            }}
                        >
                            {btn.label}
                        </button>
                    ))}
                    <div style={{ width: '1px', height: '20px', background: 'var(--color-border)', margin: '0 8px' }} />
                    <button
                        onClick={insertTemplate}
                        style={{
                            padding: '6px 16px',
                            background: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: 'var(--color-text-main)'
                        }}
                    >
                        Load Template
                    </button>
                </div>

                {/* Split View Editor */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Editor */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--color-border)' }}>
                        <textarea
                            id="content-editor"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Start writing in Markdown..."
                            style={{
                                flex: 1,
                                padding: '24px',
                                background: 'var(--color-background)',
                                color: 'var(--color-text-main)',
                                border: 'none',
                                resize: 'none',
                                fontFamily: '"Fira Code", "SF Mono", Monaco, monospace',
                                fontSize: '15px',
                                lineHeight: '1.7',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Preview */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-surface)' }}>
                        <div style={{
                            padding: '12px 24px',
                            borderBottom: '1px solid var(--color-border)',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}>
                            Preview
                        </div>
                        <div
                            className="article-content"
                            style={{
                                flex: 1,
                                padding: '40px',
                                overflowY: 'auto',
                                background: 'var(--color-background)'
                            }}
                            dangerouslySetInnerHTML={{
                                __html: previewHtml || '<p style="color: var(--color-text-muted); font-style: italic;">Preview will appear here as you type...</p>'
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
