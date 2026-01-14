'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ViewCount({ postId }) {
    const [views, setViews] = useState(null);

    useEffect(() => {
        if (!postId) return;

        const incrementViews = async () => {
            try {
                // Check if already viewed in this session
                const viewedKey = `viewed_${postId}`;
                const hasViewed = sessionStorage.getItem(viewedKey);

                // Fetch current views
                const { data, error } = await supabase
                    .from('posts')
                    .select('views')
                    .eq('id', postId)
                    .single();

                if (error) {
                    console.error('Error fetching views:', error);
                    return;
                }

                const currentViews = data?.views || 0;
                setViews(currentViews);

                // Increment if not viewed in this session
                if (!hasViewed) {
                    const { error: updateError } = await supabase
                        .from('posts')
                        .update({ views: currentViews + 1 })
                        .eq('id', postId);

                    if (!updateError) {
                        setViews(currentViews + 1);
                        sessionStorage.setItem(viewedKey, 'true');
                    }
                }
            } catch (err) {
                console.error('Error updating views:', err);
            }
        };

        incrementViews();
    }, [postId]);

    const formatViews = (count) => {
        if (count === null) return '...';
        if (count >= 1000000) {
            return `${(count / 1000000).toFixed(1)}M`;
        }
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}K`;
        }
        return count.toString();
    };

    return (
        <span className="view-count" title={`${views || 0} views`}>
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ verticalAlign: 'middle', marginRight: '4px' }}
            >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
            {formatViews(views)}
        </span>
    );
}
