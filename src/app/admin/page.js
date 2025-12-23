'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
    const router = useRouter();

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
    const [activeTab, setActiveTab] = useState('media'); // 'media' or 'posts'
    const [postsList, setPostsList] = useState([]);

    // Two-step Delete State
    const [deleteConfirm, setDeleteConfirm] = useState(null); // stores ID or Name of item to delete

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
        // Step 1: Request Confirmation
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000); // Reset after 3s
            return;
        }

        // Step 2: Actual Delete
        try {
            console.log("Deleting post:", id);
            const { error } = await supabase.from('posts').delete().eq('id', id);

            if (error) throw error;

            setDeleteConfirm(null);
            fetchPostsList();
            alert('Post Deleted Successfully');
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed: ' + error.message);
        }
    };


    // Auto load posts if tab is "posts"
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
        image: '' // Cover image
    });

    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    // --- Authentication ---
    const handleLogin = (e) => {
        e.preventDefault();
        if (password === '1234') {
            setIsAuthenticated(true);
            fetchImages(); // Load images on login
        } else {
            alert('Incorrect password');
        }
    };

    // --- Image Management ---
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

            await fetchImages(); // Refresh list
            setMessage('Image uploaded!');

            // Auto-set cover if empty
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
        // Step 1: Request Confirmation
        if (deleteConfirm !== imageName) {
            setDeleteConfirm(imageName);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        // Step 2: Actual Delete
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
            // Fetch all IDs first
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

    // --- Toolbar & Editor Logic ---
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

        // Restore cursor/selection approx
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const insertTemplate = () => {
        if (formData.content && !confirm('Overwrite current content with template?')) return;

        const template = `# Post Title Here

> A clear, one-line summary or hook for the post.

## Introduction
Start with a compelling intro. Why does this matter? What will the reader learn?

## Key Points
1. **Point One**: Explain the detail.
2. **Point Two**: Explain the detail.
3. **Point Three**: Explain the detail.

## Code Example
\`\`\`javascript
console.log("Hello AI");
\`\`\`

## Conclusion
Wrap up with final thoughts and a call to action.
`;
        setFormData(prev => ({ ...prev, content: template }));
    };

    const toolbarBtnStyle = {
        background: '#222',
        border: '1px solid #333',
        color: '#ccc',
        borderRadius: '4px',
        padding: '4px 8px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '24px'
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

    // --- Editor Logic ---
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
                const response = await fetch('/api/preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: formData.content })
                });
                const data = await response.json();
                setPreviewHtml(data.html);
            } catch (error) {
                console.error('Preview error', error);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [formData.content]);

    // --- Publishing ---
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
            setMessage('🎉 Published Successfully!');

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
            <div className="flex-center" style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>
                <form onSubmit={handleLogin} style={{ textAlign: 'center', padding: '40px', background: '#111', borderRadius: '16px', border: '1px solid #333' }}>
                    <h1 style={{ marginBottom: '20px' }}>Admin Access</h1>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="PIN Code"
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', marginBottom: '20px', background: '#000', color: '#fff', width: '200px', display: 'block', margin: '0 auto 20px' }}
                    />
                    <button className="btn-primary" style={{ width: '100%' }}>Unlock</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#000', color: '#fff' }}>

            {/* --- LEFT SIDEBAR: Navigation & Image Manager --- */}
            <div style={{
                width: isSidebarOpen ? '320px' : '0',
                background: '#111',
                borderRight: '1px solid #333',
                transition: 'width 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
            }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                    <button
                        onClick={() => setActiveTab('media')}
                        style={{ flex: 1, padding: '15px', background: activeTab === 'media' ? '#111' : '#000', color: activeTab === 'media' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Media
                    </button>
                    <button
                        onClick={() => setActiveTab('posts')}
                        style={{ flex: 1, padding: '15px', background: activeTab === 'posts' ? '#111' : '#000', color: activeTab === 'posts' ? '#fff' : '#888', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderLeft: '1px solid #333' }}
                    >
                        Posts
                    </button>
                </div>

                {/* Tab Content: Media (Existing) */}
                {activeTab === 'media' && (
                    <>
                        <div style={{ padding: '20px', borderBottom: '1px solid #333' }}>
                            <h3 style={{ marginBottom: '15px', color: '#fff', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Upload Image</h3>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                style={{ display: 'none' }}
                                id="sidebar-upload"
                            />
                            <label htmlFor="sidebar-upload" className="btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '10px' }}>
                                {uploading ? 'Uploading...' : '+ Upload New Image'}
                            </label>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {images.map((img) => (
                                    <div key={img.name} className="img-card" onClick={() => insertImageToContent(img.url)}>
                                        <div style={{ height: '100px', overflow: 'hidden', borderRadius: '6px' }}>
                                            <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div className="img-actions">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setAsCover(img.url); }} title="Set as Cover" className="action-btn">★</button>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); insertImageToContent(img.url); }} title="Insert to Post" className="action-btn">＋</button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.name); }}
                                                title="Delete"
                                                className="action-btn delete"
                                                style={{ color: deleteConfirm === img.name ? 'red' : '' }}
                                            >
                                                {deleteConfirm === img.name ? 'CONFIRM?' : '🗑'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Tab Content: Posts (New) */}
                {activeTab === 'posts' && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <button onClick={fetchPostsList} style={{ width: '100%', background: '#222', border: '1px solid #333', color: '#ccc', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>
                                ↻ Refresh List
                            </button>
                        </div>
                        {postsList.length === 0 ? (
                            <p style={{ color: '#666', textAlign: 'center', fontSize: '13px' }}>No posts found.</p>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {postsList.map(post => (
                                    <li key={post.id} style={{ marginBottom: '10px', background: '#0a0a0a', border: '1px solid #333', borderRadius: '6px', padding: '10px' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.title}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                                            <span>{new Date(post.date).toLocaleDateString()}</span>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleDeletePost(post.id);
                                                }}
                                                style={{
                                                    background: deleteConfirm === post.id ? '#d34035' : 'transparent',
                                                    color: deleteConfirm === post.id ? '#fff' : '#d34035',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold',
                                                    padding: deleteConfirm === post.id ? '4px 8px' : '0',
                                                    borderRadius: '4px'
                                                }}
                                            >
                                                {deleteConfirm === post.id ? 'REALLY DELETE?' : 'DELETE'}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* --- MAIN AREA --- */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Header / Toolbar */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{ background: 'none', border: '1px solid #333', color: '#ccc', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px' }}>
                            {isSidebarOpen ? '◀' : '▶'}
                        </button>
                        <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '600' }}>Write Post</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {activeTab === 'posts' && postsList.length > 0 && (
                            <button
                                onClick={handleDeleteAllPosts}
                                style={{ background: '#330000', color: '#ff6b6b', border: '1px solid #660000', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                            >
                                ⚠ Delete All Posts
                            </button>
                        )}
                        {message && <span style={{ color: status === 'error' ? '#ff6b6b' : '#69db7c', fontSize: '14px', fontWeight: 'bold' }}>{message}</span>}
                        <button className="btn-primary" onClick={handleSubmit} disabled={status === 'loading'}>
                            {status === 'loading' ? 'Publishing...' : 'Publish Post'}
                        </button>
                    </div>
                </div>

                {/* Form Inputs Area - High Contrast */}
                <div style={{ padding: '20px', background: '#050505', borderBottom: '1px solid #333' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label className="input-label">Title</label>
                            <input name="title" value={formData.title} onChange={handleChange} placeholder="Enter Title..." className="input-field" autoFocus />
                        </div>
                        <div>
                            <label className="input-label">Slug</label>
                            <input name="slug" value={formData.slug} onChange={handleChange} placeholder="url-slug" className="input-field" />
                        </div>
                        <div>
                            <label className="input-label">Tag</label>
                            <select name="tag" value={formData.tag} onChange={handleChange} className="input-field">
                                <option>Trend</option><option>Classic</option><option>Guide</option><option>News</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 2 }}>
                            <label className="input-label">Summary</label>
                            <input name="summary" value={formData.summary} onChange={handleChange} placeholder="Short summary for the home page..." className="input-field" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="input-label">Cover Image URL</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input name="image" value={formData.image} onChange={handleChange} placeholder="Cover Image URL" className="input-field" style={{ flex: 1 }} />
                                {formData.image && <img src={formData.image} alt="cover" style={{ width: '38px', height: '38px', borderRadius: '4px', border: '1px solid #333' }} />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Markdown Toolbar */}
                <div style={{ padding: '8px 20px', background: '#111', borderBottom: '1px solid #333', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#666', fontSize: '12px', fontWeight: 'bold', marginRight: '8px', textTransform: 'uppercase' }}>Toolbar</span>
                    <button type="button" onClick={() => insertMarkdown('**', '**')} style={toolbarBtnStyle} title="Bold">B</button>
                    <button type="button" onClick={() => insertMarkdown('_', '_')} style={{ ...toolbarBtnStyle, fontStyle: 'italic' }} title="Italic">I</button>
                    <button type="button" onClick={() => insertMarkdown('# ', '')} style={toolbarBtnStyle} title="H1">H1</button>
                    <button type="button" onClick={() => insertMarkdown('## ', '')} style={toolbarBtnStyle} title="H2">H2</button>
                    <button type="button" onClick={() => insertMarkdown('> ', '')} style={toolbarBtnStyle} title="Quote">❞</button>
                    <button type="button" onClick={() => insertMarkdown('```\n', '\n```')} style={toolbarBtnStyle} title="Code">{ }</button>
                    <button type="button" onClick={() => insertMarkdown('[', '](url)')} style={toolbarBtnStyle} title="Link">🔗</button>
                    <div style={{ width: '1px', height: '20px', background: '#333', margin: '0 8px' }}></div>
                    <button type="button" onClick={insertTemplate} style={{ ...toolbarBtnStyle, width: 'auto', padding: '4px 12px' }}>📄 Load Template</button>
                </div>

                {/* Split View Editor */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Editor - Left */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #333' }}>
                        <textarea
                            id="content-editor"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="# Start writing here..."
                            style={{
                                flex: 1,
                                padding: '20px',
                                background: '#000',
                                color: '#eee',
                                border: 'none',
                                resize: 'none',
                                fontFamily: '"Fira Code", monospace',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Preview - Right */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
                        <div style={{ padding: '8px 20px', background: '#111', borderBottom: '1px solid #333', color: '#888', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Live Preview
                        </div>
                        <div
                            className="prose-preview"
                            style={{
                                flex: 1,
                                padding: '40px',
                                overflowY: 'auto'
                            }}
                            dangerouslySetInnerHTML={{ __html: previewHtml || '<p style="color:#444; font-style:italic;">Preview will appear here...</p>' }}
                        />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .btn-primary {
                    background: #fff;
                    color: #000;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-primary:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
                .btn-primary:disabled { opacity: 0.5; cursor: wait; }

                .input-label {
                    display: block;
                    font-size: 11px;
                    color: #888;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .input-field {
                    background: #1a1a1a;
                    border: 1px solid #333;
                    color: #fff;
                    padding: 10px 12px;
                    border-radius: 6px;
                    width: 100%;
                    font-size: 14px;
                    transition: border-color 0.2s;
                }
                .input-field:focus {
                    border-color: #888;
                    outline: none; 
                }

                .img-card {
                    position: relative;
                    border: 1px solid #333;
                    border-radius: 6px;
                    background: #000;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .img-card:hover {
                    border-color: #666;
                    transform: translateY(-2px);
                }
                .img-actions {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    border-top: 1px solid #333;
                }
                .action-btn {
                    background: #111;
                    border: none;
                    border-right: 1px solid #333;
                    color: #ccc;
                    padding: 8px 0;
                    cursor: pointer;
                    font-size: 12px;
                }
                .action-btn:last-child { border-right: none; }
                .action-btn:hover { background: #222; color: #fff; }
                .action-btn.delete:hover { background: #330000; color: #ff6b6b; }

                /* Preview Styles */
                .prose-preview { color: #e0e0e0; line-height: 1.7; max-width: 800px; margin: 0 auto; }
                .prose-preview h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; color: #fff; letter-spacing: -0.02em; }
                .prose-preview h2 { font-size: 1.8rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #fff; border-bottom: 1px solid #333; padding-bottom: 0.5rem; }
                .prose-preview h3 { font-size: 1.4rem; font-weight: 600; margin-top: 1.5rem; color: #f0f0f0; }
                .prose-preview p { margin-bottom: 1.2rem; font-size: 1.05rem; color: #ccc; }
                .prose-preview ul, .prose-preview ol { padding-left: 1.5rem; margin-bottom: 1.5rem; color: #ccc; }
                .prose-preview li { margin-bottom: 0.5rem; }
                .prose-preview blockquote { border-left: 4px solid #444; padding-left: 1rem; margin: 1.5rem 0; font-style: italic; color: #888; }
                .prose-preview img { max-width: 100%; border-radius: 8px; margin: 1.5rem 0; border: 1px solid #333; }
                .prose-preview code { background: #222; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #f0f0f0; }
                .prose-preview pre { background: #111; padding: 1.5rem; border-radius: 8px; overflow-x: auto; margin: 1.5rem 0; border: 1px solid #333; }
                .prose-preview pre code { background: transparent; padding: 0; color: #ddd; }
                .prose-preview a { color: #5c7cfa; text-decoration: none; border-bottom: 1px dotted #5c7cfa; }
                .prose-preview a:hover { border-bottom-style: solid; }
            `}</style>
        </div>
    );
}
