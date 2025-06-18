import React from 'react';
import { groupsAPI } from '../lib/groupsAPI.js';

export default function Sidebar({ 
    conversations, 
    currentConversationId, 
    onNewChat, 
    onSelectConversation, 
    onDeleteConversation,
    onSelectGroupChat,
    isOpen, 
    onClose,
    user,
    onSignOut,
    onSignIn,
    onOpenGroupManagement,
    onOpenUserManagement
}) {
    const [activeTab, setActiveTab] = React.useState('chats');
    const [myGroups, setMyGroups] = React.useState([]);
    const [invitations, setInvitations] = React.useState([]);

    React.useEffect(() => {
        if (user && activeTab === 'groups') {
            loadGroups();
        }
        if (user) {
            loadInvitations();
        }
    }, [user, activeTab]);

    const loadGroups = async () => {
        try {
            const { data } = await groupsAPI.getMyGroups();
            setMyGroups(data || []);
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    };

    const loadInvitations = async () => {
        try {
            const { data } = await groupsAPI.getMyInvitations();
            setInvitations(data || []);
        } catch (error) {
            console.error('Error loading invitations:', error);
        }
    };

    const handleConversationClick = (conversationId) => {
        onSelectConversation(conversationId);
    };

    const handleDeleteClick = (e, conversationId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDeleteConversation(conversationId);
        }
    };

    const handleGroupClick = (group) => {
        onSelectGroupChat(group);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <span className="material-icons-round">psychology</span>
                        </div>
                        <span>AI Chat</span>
                    </div>
                    
                    <button 
                        onClick={onNewChat}
                        className="new-chat-button"
                        aria-label="Start new conversation"
                        disabled={!user}
                    >
                        <span className="material-icons-round">add</span>
                        New Chat
                    </button>
                </div>

                {user && (
                    <div className="sidebar-tabs">
                        <button
                            className={`sidebar-tab ${activeTab === 'chats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('chats')}
                        >
                            <span className="material-icons-round">chat</span>
                            對話
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'groups' ? 'active' : ''}`}
                            onClick={() => setActiveTab('groups')}
                        >
                            <span className="material-icons-round">groups</span>
                            群組
                            {invitations.length > 0 && (
                                <span className="notification-badge">{invitations.length}</span>
                            )}
                        </button>
                    </div>
                )}
                
                <div className="sidebar-content">
                    {user ? (
                        activeTab === 'chats' ? (
                            <div className="conversation-list">
                                {conversations.length > 0 ? (
                                    conversations.map(conversation => (
                                        <div
                                            key={conversation.id}
                                            className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
                                            onClick={() => handleConversationClick(conversation.id)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    handleConversationClick(conversation.id);
                                                }
                                            }}
                                            aria-label={`Select conversation: ${conversation.title}`}
                                        >
                                            <div className="conversation-icon">
                                                <span className="material-icons-round">chat_bubble</span>
                                            </div>
                                            <div className="conversation-content">
                                                <div className="conversation-title">
                                                    {conversation.title}
                                                </div>
                                                <div className="conversation-date">
                                                    {formatDate(conversation.updated_at)}
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-ghost btn-icon conversation-delete"
                                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                                                aria-label="Delete conversation"
                                            >
                                                <span className="material-icons-round">delete</span>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-conversations">
                                        <div className="empty-conversations-icon">
                                            <span className="material-icons-round">chat_bubble_outline</span>
                                        </div>
                                        <p>No conversations yet</p>
                                        <p className="empty-conversations-subtitle">Start a new chat to begin</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="groups-section">
                                <div className="groups-header">
                                    <h3>我的群組</h3>
                                    <button 
                                        onClick={onOpenGroupManagement}
                                        className="btn btn-ghost btn-icon"
                                        aria-label="群組管理"
                                    >
                                        <span className="material-icons-round">settings</span>
                                    </button>
                                </div>
                                
                                <div className="groups-list">
                                    {myGroups.length > 0 ? (
                                        myGroups.map(group => (
                                            <div
                                                key={group.id}
                                                className="group-item"
                                                onClick={() => handleGroupClick(group)}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                <div className="group-avatar">
                                                    {group.avatar_url ? (
                                                        <img src={group.avatar_url} alt={group.name} />
                                                    ) : (
                                                        <span className="material-icons-round">groups</span>
                                                    )}
                                                </div>
                                                <div className="group-info">
                                                    <div className="group-name">{group.name}</div>
                                                    <div className="group-meta">
                                                        <span className="member-count">
                                                            {group.member_count?.[0]?.count || 0} 成員
                                                        </span>
                                                        {group.is_private && (
                                                            <span className="material-icons-round private-icon">lock</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-groups">
                                            <div className="empty-groups-icon">
                                                <span className="material-icons-round">groups</span>
                                            </div>
                                            <p>還沒有群組</p>
                                            <button 
                                                onClick={onOpenGroupManagement}
                                                className="btn btn-primary btn-sm"
                                            >
                                                創建群組
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {invitations.length > 0 && (
                                    <div className="invitations-section">
                                        <h4>群組邀請</h4>
                                        <div className="invitations-list">
                                            {invitations.slice(0, 3).map(invitation => (
                                                <div key={invitation.id} className="invitation-item">
                                                    <span className="invitation-text">
                                                        {invitation.group.name}
                                                    </span>
                                                    <button 
                                                        onClick={onOpenGroupManagement}
                                                        className="btn btn-primary btn-xs"
                                                    >
                                                        查看
                                                    </button>
                                                </div>
                                            ))}
                                            {invitations.length > 3 && (
                                                <button 
                                                    onClick={onOpenGroupManagement}
                                                    className="view-all-invitations"
                                                >
                                                    查看全部 {invitations.length} 個邀請
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="auth-prompt">
                            <div className="auth-prompt-icon">
                                <span className="material-icons-round">person</span>
                            </div>
                            <h3>Sign in to save your chats</h3>
                            <p>Create an account to keep your conversation history</p>
                            <button 
                                onClick={onSignIn}
                                className="btn btn-primary"
                            >
                                <span className="material-icons-round">login</span>
                                Sign In
                            </button>
                        </div>
                    )}
                </div>

                {user && (
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar">
                                <span className="material-icons-round">person</span>
                            </div>
                            <div className="user-details">
                                <div className="user-email">{user.email}</div>
                                <div className="user-status">Online</div>
                            </div>
                            <div className="user-actions">
                                <button
                                    onClick={onOpenUserManagement}
                                    className="btn btn-ghost btn-icon"
                                    aria-label="用戶設定"
                                    title="用戶設定"
                                >
                                    <span className="material-icons-round">settings</span>
                                </button>
                                <button
                                    onClick={onSignOut}
                                    className="btn btn-ghost btn-icon"
                                    aria-label="Sign out"
                                    title="登出"
                                >
                                    <span className="material-icons-round">logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}