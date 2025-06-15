import React from 'react';

export default function MessageInput({ onSendMessage, isLoading, disabled, user }) {
    const [message, setMessage] = React.useState('');
    const textareaRef = React.useRef(null);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading && !disabled) {
            onSendMessage(message.trim());
            setMessage('');
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    const handleTextareaChange = (e) => {
        setMessage(e.target.value);
        
        // Auto-resize textarea
        const textarea = e.target;
        textarea.style.height = '44px';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    };

    const canSend = message.trim() && !isLoading && !disabled && user;
    
    const getPlaceholder = () => {
        if (!user) return "Sign in to start chatting...";
        if (disabled) return "Start a new conversation to begin chatting...";
        return "Type your message here...";
    };
    
    return (
        <div className="message-input-container">
            <div className="message-input-wrapper">
                <form onSubmit={handleSubmit} className="message-input-form">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        className="message-textarea"
                        disabled={!user || disabled}
                        rows="1"
                        aria-label="Message input"
                    />
                    
                    <button
                        type="submit"
                        disabled={!canSend}
                        className="send-button"
                        aria-label="Send message"
                    >
                        {isLoading ? (
                            <span className="material-icons-round">hourglass_empty</span>
                        ) : (
                            <span className="material-icons-round">send</span>
                        )}
                    </button>
                </form>
                
                {!user && (
                    <div className="input-auth-hint">
                        <span className="material-icons-round">info</span>
                        Sign in to save your conversations and chat history
                    </div>
                )}
            </div>
        </div>
    );
}