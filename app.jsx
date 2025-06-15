import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import ChatMessage from './components/ChatMessage.jsx';
import MessageInput from './components/MessageInput.jsx';
import EmptyState from './components/EmptyState.jsx';
import { chatAgent } from './utils/chatAgent.js';

function App() {
    const [conversations, setConversations] = React.useState([]);
    const [currentConversationId, setCurrentConversationId] = React.useState(null);
    const [messages, setMessages] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const messagesEndRef = React.useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const createNewConversation = () => {
        const newConversation = {
            id: Date.now().toString(),
            title: 'New conversation',
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversation.id);
        setMessages([]);
        setSidebarOpen(false);
    };

    const selectConversation = (conversationId) => {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            setCurrentConversationId(conversationId);
            setMessages(conversation.messages);
            setSidebarOpen(false);
        }
    };

    const updateConversationTitle = (conversationId, firstMessage) => {
        const title = firstMessage.length > 40 
            ? firstMessage.substring(0, 40) + '...' 
            : firstMessage;
        
        setConversations(prev => 
            prev.map(conv => 
                conv.id === conversationId 
                    ? { ...conv, title } 
                    : conv
            )
        );
    };

    const sendMessage = async (messageContent) => {
        if (!currentConversationId) {
            createNewConversation();
            return;
        }

        const userMessage = { 
            role: 'user', 
            content: messageContent,
            timestamp: new Date().toISOString()
        };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setIsLoading(true);

        if (messages.length === 0) {
            updateConversationTitle(currentConversationId, messageContent);
        }

        try {
            const response = await chatAgent(messageContent, messages);
            const assistantMessage = { 
                role: 'assistant', 
                content: response,
                timestamp: new Date().toISOString()
            };
            const finalMessages = [...newMessages, assistantMessage];
            
            setMessages(finalMessages);
            
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === currentConversationId 
                        ? { ...conv, messages: finalMessages, updatedAt: new Date().toISOString() }
                        : conv
                )
            );
        } catch (error) {
            console.error('Send message error:', error);
            const errorMessage = { 
                role: 'assistant', 
                content: 'I apologize, but I encountered an error while processing your request. Please try again.',
                timestamp: new Date().toISOString(),
                isError: true
            };
            setMessages([...newMessages, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteConversation = (conversationId) => {
        setConversations(prev => prev.filter(conv => conv.id !== conversationId));
        if (currentConversationId === conversationId) {
            const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
            if (remainingConversations.length > 0) {
                selectConversation(remainingConversations[0].id);
            } else {
                setCurrentConversationId(null);
                setMessages([]);
            }
        }
    };

    React.useEffect(() => {
        if (conversations.length === 0) {
            createNewConversation();
        }
    }, []);

    // Handle keyboard shortcuts
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        createNewConversation();
                        break;
                    case 'b':
                        e.preventDefault();
                        setSidebarOpen(prev => !prev);
                        break;
                }
            }
            if (e.key === 'Escape') {
                setSidebarOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="chat-container">
            <Sidebar
                conversations={conversations}
                currentConversationId={currentConversationId}
                onNewChat={createNewConversation}
                onSelectConversation={selectConversation}
                onDeleteConversation={deleteConversation}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            
            <main className="main-chat">
                <Header 
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    currentConversation={conversations.find(c => c.id === currentConversationId)}
                />
                
                <div className="messages-container">
                    <div className="messages-wrapper">
                        {messages.length === 0 ? (
                            <EmptyState onStartChat={createNewConversation} />
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <ChatMessage 
                                        key={`${message.timestamp}-${index}`} 
                                        message={message} 
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
                    disabled={!currentConversationId}
                />
            </main>
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);