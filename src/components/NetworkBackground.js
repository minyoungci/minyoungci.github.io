'use client';

import { useEffect, useRef, useState } from 'react';

export default function NetworkBackground() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const nodesRef = useRef([]);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Resize handler
        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initNodes();
        };

        // Visibility change handler for performance
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        // Initialize nodes
        const initNodes = () => {
            const isMobile = width < 768;
            const nodeCount = isMobile ? 20 : 35;
            nodesRef.current = [];

            for (let i = 0; i < nodeCount; i++) {
                nodesRef.current.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 1.5 + 1,
                });
            }
        };

        // Get theme color
        const getThemeColor = () => {
            const theme = document.documentElement.getAttribute('data-theme');
            return theme === 'dark'
                ? { node: 'rgba(34, 197, 94, 0.12)', line: 'rgba(34, 197, 94, 0.04)' }
                : { node: 'rgba(26, 137, 23, 0.08)', line: 'rgba(26, 137, 23, 0.03)' };
        };

        // Animation loop
        const animate = () => {
            if (!isVisible) {
                animationRef.current = requestAnimationFrame(animate);
                return;
            }

            ctx.clearRect(0, 0, width, height);
            const colors = getThemeColor();
            const nodes = nodesRef.current;
            const connectionDistance = width < 768 ? 120 : 150;

            // Update and draw nodes
            nodes.forEach((node, i) => {
                // Update position
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > width) node.vx *= -1;
                if (node.y < 0 || node.y > height) node.vy *= -1;

                // Keep in bounds
                node.x = Math.max(0, Math.min(width, node.x));
                node.y = Math.max(0, Math.min(height, node.y));

                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = colors.node;
                ctx.fill();

                // Draw connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = (1 - distance / connectionDistance) * 0.6;
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = colors.line.replace('0.03', (0.03 * opacity).toFixed(3)).replace('0.04', (0.04 * opacity).toFixed(3));
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        // Initialize
        handleResize();
        animate();

        // Event listeners
        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isVisible]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
            }}
            aria-hidden="true"
        />
    );
}
