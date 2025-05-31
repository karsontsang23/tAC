import React from 'react';

export default function MessageInput({ onSendMessage, isLoading }) {
    const [message, setMessage] = React.useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message);
            setMessage('');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="border-t border-amber-200 p-4 bg-white">
            <div className="flex items-end gap-4">
                <div className="flex-1">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        rows="1"
                        className="w-full p-3 rounded-lg border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                        style={{ minHeight: '44px' }}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    className="p-3 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="material-icons">send</span>
                </button>
            </div>
        </form>
    );
}