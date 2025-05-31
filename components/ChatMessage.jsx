import React from 'react';
import LoadingDots from './LoadingDots.jsx';

export default function ChatMessage({ message, isLoading }) {
    return (
        <div className={`message ${message.role}`}>
            <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-100">
                    <span className="material-icons text-amber-600">
                        {message.role === 'assistant' ? 'smart_toy' : 'person'}
                    </span>
                </div>
                <div className="flex-1">
                    {isLoading ? (
                        <LoadingDots />
                    ) : (
                        <div className="prose max-w-none">
                            {message.content}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}