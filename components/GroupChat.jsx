import React from 'react';
import { groupsAPI } from '../lib/groupsAPI.js';
import { chatAPI } from '../lib/supabase.js';
import ChatMessage from './ChatMessage.jsx';
import MessageInput from './MessageInput.jsx';
import { aiService } from '../utils/aiService.js';

export default function GroupChat({ group, user, onBack }) {
    const [conversations, setConversations] = React.useState([]);
    const [currentConversation, setCurrentConversation] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [members, setMembers] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [showMembers, setShowMembers] = React.useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    React.useEffect(() => {
        if (group) {
            loadGroupData();
        }
    }, [group]);

    const loadGroupData = async () => {
        try {
            // 載入群組對話
            const { data: conversationsData } = await groupsAPI.getGroupConversations(group.id);
            setConversations(conversationsData || []);

            // 載入群組成員
            const { data: membersData } = await groupsAPI.getGroupMembers(group.id);
            setMembers(membersData || []);

            // 如果沒有對話，創建一個
            if (!conversationsData || conversationsData.length === 0) {
                const { data: newConversation } = await groupsAPI.createGroupConversation(group.id);
                if (newConversation) {
                    setConversations([newConversation]);
                    setCurrentConversation(newConversation);
                }
            } else {
                setCurrentConversation(conversationsData[0]);
                loadMessages(conversationsData[0].id);
            }
        } catch (error) {
            console.error('Error loading group data:', error);
        }
    };

    const loadMessages = async (conversationId) => {
        try {
            const { data, error } = await chatAPI.getMessages(conversationId);
            if (error) throw error;
            setMessages(data || []);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const sendMessage = async (messageContent) => {
        if (!currentConversation) return;

        try {
            // 添加用戶消息
            const { data: userMessage, error: userError } = await chatAPI.createMessage(
                currentConversation.id,
                'user',
                messageContent
            );
            if (userError) throw userError;

            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);

            // 在群組聊天中，可以選擇是否要AI回應
            // 這裡我們添加一個簡單的觸發機制：當消息以@AI開頭時才回應
            if (messageContent.startsWith('@AI ')) {
                const aiPrompt = messageContent.substring(4); // 移除@AI前綴
                const response = await aiService.generateResponse(aiPrompt, messages);
                
                const { data: assistantMessage, error: assistantError } = await chatAPI.createMessage(
                    currentConversation.id,
                    'assistant',
                    response
                );
                if (assistantError) throw assistantError;

                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error) {
            console.error('Send message error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getMemberById = (userId) => {
        return members.find(member => member.user.id === userId);
    };

    return (
        <div className="group-chat-container">
            <div className="group-chat-header">
                <button 
                    onClick={onBack}
                    className="btn btn-ghost btn-icon"
                    aria-label="返回"
                >
                    <span className="material-icons-round">arrow_back</span>
                </button>
                
                <div className="group-info">
                    <div className="group-avatar">
                        {group.avatar_url ? (
                            <img src={group.avatar_url} alt={group.name} />
                        ) : (
                            <span className="material-icons-round">groups</span>
                        )}
                    </div>
                    <div className="group-details">
                        <h2 className="group-name">{group.name}</h2>
                        <span className="member-count">{members.length} 成員</span>
                    </div>
                </div>

                <div className="group-actions">
                    <button 
                        onClick={() => setShowMembers(!showMembers)}
                        className="btn btn-ghost btn-icon"
                        aria-label="成員列表"
                    >
                        <span className="material-icons-round">people</span>
                    </button>
                    <button 
                        className="btn btn-ghost btn-icon"
                        aria-label="群組設定"
                    >
                        <span className="material-icons-round">settings</span>
                    </button>
                </div>
            </div>

            <div className="group-chat-content">
                <div className="messages-section">
                    <div className="messages-container">
                        <div className="messages-wrapper">
                            {messages.length === 0 ? (
                                <div className="empty-chat-state">
                                    <div className="empty-chat-icon">
                                        <span className="material-icons-round">chat</span>
                                    </div>
                                    <h3>開始群組對話</h3>
                                    <p>歡迎來到 {group.name}！發送第一條消息開始對話吧。</p>
                                    <div className="ai-tip">
                                        <span className="material-icons-round">lightbulb</span>
                                        <small>提示：在消息前加上 @AI 可以讓AI助手參與對話</small>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {messages.map((message, index) => (
                                        <GroupChatMessage 
                                            key={message.id || `${message.timestamp}-${index}`}
                                            message={message}
                                            member={getMemberById(message.user_id)}
                                            isOwn={message.user_id === user?.id}
                                        />
                                    ))}
                                    {isLoading && (
                                        <ChatMessage 
                                            message={{ 
                                                role: 'assistant', 
                                                content: '',
                                                timestamp: new Date().toISOString()
                                            }} 
                                            isLoading={true} 
                                        />
                                    )}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>
                    </div>

                    <MessageInput 
                        onSendMessage={sendMessage}
                        isLoading={isLoading}
                        disabled={false}
                        user={user}
                        placeholder="輸入消息... (使用 @AI 讓AI參與對話)"
                    />
                </div>

                {showMembers && (
                    <div className="members-sidebar">
                        <div className="members-header">
                            <h3>成員 ({members.length})</h3>
                            <button 
                                onClick={() => setShowMembers(false)}
                                className="btn btn-ghost btn-icon"
                            >
                                <span className="material-icons-round">close</span>
                            </button>
                        </div>
                        
                        <div className="members-list">
                            {members.map(member => (
                                <MemberItem key={member.id} member={member} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function GroupChatMessage({ message, member, isOwn }) {
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`group-message ${isOwn ? 'own' : ''} ${message.role}`}>
            {!isOwn && (
                <div className="message-avatar">
                    {member?.user?.avatar_url ? (
                        <img src={member.user.avatar_url} alt={member.user.display_name} />
                    ) : (
                        <span className="material-icons-round">
                            {message.role === 'assistant' ? 'psychology' : 'person'}
                        </span>
                    )}
                </div>
            )}
            
            <div className="message-content">
                {!isOwn && (
                    <div className="message-sender">
                        {message.role === 'assistant' ? 'AI助手' : 
                         member?.user?.display_name || member?.user?.email || '未知用戶'}
                        {member?.role === 'owner' && <span className="role-badge">擁有者</span>}
                        {member?.role === 'admin' && <span className="role-badge">管理員</span>}
                    </div>
                )}
                
                <div className={`message-bubble ${message.is_error ? 'error' : ''}`}>
                    <div className="message-text">{message.content}</div>
                </div>
                
                {message.timestamp && (
                    <div className="message-time">
                        {formatTime(message.timestamp)}
                    </div>
                )}
            </div>
        </div>
    );
}

function MemberItem({ member }) {
    const getRoleIcon = (role) => {
        switch (role) {
            case 'owner': return 'crown';
            case 'admin': return 'admin_panel_settings';
            default: return 'person';
        }
    };

    const getRoleText = (role) => {
        switch (role) {
            case 'owner': return '擁有者';
            case 'admin': return '管理員';
            default: return '成員';
        }
    };

    return (
        <div className="member-item">
            <div className="member-avatar">
                {member.user.avatar_url ? (
                    <img src={member.user.avatar_url} alt={member.user.display_name} />
                ) : (
                    <span className="material-icons-round">person</span>
                )}
            </div>
            
            <div className="member-info">
                <div className="member-name">
                    {member.user.display_name || member.user.email}
                </div>
                <div className="member-role">
                    <span className="material-icons-round">{getRoleIcon(member.role)}</span>
                    {getRoleText(member.role)}
                </div>
            </div>
        </div>
    );
}