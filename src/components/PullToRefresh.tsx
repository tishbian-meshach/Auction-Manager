import React, { useState, useRef } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    refreshing: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    refreshing
}) => {
    const [pullDistance, setPullDistance] = useState(0);
    const [isPulling, setIsPulling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);

    const REFRESH_THRESHOLD = 80;
    const MAX_PULL_DISTANCE = 120;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Find the actual scroll position by checking both the container and the window
        const scrollTop = containerRef.current?.scrollTop || window.scrollY || document.documentElement.scrollTop || 0;
        
        // Only allow pull to refresh if we are at the top
        if (scrollTop <= 0) {
            startY.current = e.touches[0].pageY;
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPulling || refreshing) return;

        const currentY = e.touches[0].pageY;
        const diff = currentY - startY.current;

        if (diff > 0) {
            // Apply resistance
            const distance = Math.min(diff * 0.4, MAX_PULL_DISTANCE);
            setPullDistance(distance);

            // Prevent default scrolling when pulling
            if (distance > 10) {
                if (e.cancelable) e.preventDefault();
            }
        } else {
            setIsPulling(false);
            setPullDistance(0);
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling || refreshing) return;

        if (pullDistance > REFRESH_THRESHOLD) {
            await onRefresh();
        }

        setIsPulling(false);
        setPullDistance(0);
    };

    return (
        <div
            ref={containerRef}
            className={`pull-to-refresh-container ${isPulling ? 'pulling' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="pull-to-refresh-indicator"
                style={{
                    transform: `translateY(${refreshing ? REFRESH_THRESHOLD / 2 : pullDistance}px)`,
                    opacity: pullDistance > 10 || refreshing ? 1 : 0
                }}
            >
                <div className="spinner"></div>
            </div>

            <div
                className="pull-to-refresh-content"
                style={{
                    transform: `translateY(${refreshing ? REFRESH_THRESHOLD / 2 : pullDistance}px)`
                }}
            >
                {children}
            </div>
        </div>
    );
};
