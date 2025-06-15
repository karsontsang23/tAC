import React from 'react';

export default function LoadingDots() {
    return (
        <div className="loading-dots" aria-label="AI is thinking">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
        </div>
    );
}