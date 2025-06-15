import React from 'react';
import LoadingDots from './LoadingDots.jsx';

export default function ChatMessage({ message, isLoading }) {
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`message ${message.role}`}>
            <div className="message-avatar">
                {message.role === 'assistant' ? (
                    <span className="material-icons-round">psychology</span>
                ) : (
                    <span className="material-icons-round">person</span>
                )}
            </div>
            
            <div className="message-content">
                <div className={`message-bubble ${message.isError ? 'error' : ''}`}>
                    {isLoading ? (
                        <LoadingDots />
                    ) : (
                        <div className="message-text">
                            {message.content}
                        </div>
                    )}
                </div>
                
                {!isLoading && message.timestamp && (
                    <div className="message-time">
                        {formatTime(message.timestamp)}
                    </div>
                )}
            </div>
        </div>
    );
}