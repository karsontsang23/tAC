function Sidebar({ conversations, currentConversationId, onNewChat, onSelectConversation, isOpen }) {
    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`}>
            <div className="p-4">
                <button 
                    onClick={onNewChat}
                    className="new-chat-button w-full flex items-center justify-center gap-2"
                >
                    <span className="material-icons">add</span>
                    New Chat
                </button>
            </div>
            
            <div className="conversation-list">
                {conversations.map(conversation => (
                    <div
                        key={conversation.id}
                        className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
                        onClick={() => onSelectConversation(conversation.id)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="material-icons">chat</span>
                            <span className="truncate">{conversation.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}