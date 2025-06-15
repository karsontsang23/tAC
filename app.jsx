import React from 'react';
import { createRoot } from 'react-dom/client';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import ChatMessage from './components/ChatMessage.jsx';
import MessageInput from './components/MessageInput.jsx';
import EmptyState from './components/EmptyState.jsx';
import AuthModal from './components/AuthModal.jsx';
import { chatAPI, supabase } from './lib/supabase.js';
import { aiService } from './utils/aiService.js';

function App() {
    const [user, setUser] = React.useState(null);
    const [authLoading, setAuthLoading] = React.useState(true);
    const [showAuthModal, setShowAuthModal] = React.useState(false);
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

    // Initialize auth state
    React.useEffect(() => {
        const initAuth = async () => {
            try {
                const { user } = await chatAPI.getCurrentUser();
                setUser(user);
                if (user) {
                    await loadConversations();
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                setAuthLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            setUser(session?.user || null);
            if (session?.user) {
                await loadConversations();
            } else {
                setConversations([]);
                setMessages([]);
                setCurrentConversationId(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadConversations = async () => {
        try {
            const { data, error } = await chatAPI.getConversations();
            if (error) throw error;
            
            setConversations(data || []);
            
            // Auto-select first conversation if none selected
            if (data && data.length > 0 && !currentConversationId) {
                await selectConversation(data[0].id);
            }
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    const createNewConversation = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            const { data, error } = await chatAPI.createConversation();
            if (error) throw error;

            setConversations(prev => [data, ...prev]);
            setCurrentConversationId(data.id);
            setMessages([]);
            setSidebarOpen(false);
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
    };

    const selectConversation = async (conversationId) => {
        try {
            setCurrentConversationId(conversationId);
            
            const { data, error } = await chatAPI.getMessages(conversationId);
            if (error) throw error;
            
            setMessages(data || []);
            setSidebarOpen(false);
        } catch (error) {
            console.error('Error loading messages:', error);
            setMessages([]);
        }
    };

    const updateConversationTitle = async (conversationId, firstMessage) => {
        const title = firstMessage.length > 40 
            ? firstMessage.substring(0, 40) + '...' 
            : firstMessage;
        
        try {
            await chatAPI.updateConversation(conversationId, { title });
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === conversationId 
                        ? { ...conv, title } 
                        : conv
                )
            );
        } catch (error) {
            console.error('Error updating conversation title:', error);
        }
    };

    const sendMessage = async (messageContent) => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (!currentConversationId) {
            await createNewConversation();
            return;
        }

        try {
            // Add user message to database
            const { data: userMessage, error: userError } = await chatAPI.createMessage(
                currentConversationId, 
                'user', 
                messageContent
            );
            if (userError) throw userError;

            // Update local state
            const newMessages = [...messages, userMessage];
            setMessages(newMessages);
            setIsLoading(true);

            // Update conversation title if this is the first message
            if (messages.length === 0) {
                await updateConversationTitle(currentConversationId, messageContent);
            }

            // Get AI response
            const response = await aiService.generateResponse(messageContent, messages);
            
            // Add AI response to database
            const { data: assistantMessage, error: assistantError } = await chatAPI.createMessage(
                currentConversationId, 
                'assistant', 
                response
            );
            if (assistantError) throw assistantError;

            // Update local state with AI response
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error('Send message error:', error);
            
            // Add error message to database and local state
            try {
                const { data: errorMessage } = await chatAPI.createMessage(
                    currentConversationId, 
                    'assistant', 
                    'I apologize, but I encountered an error while processing your request. Please try again.',
                    true
                );
                if (errorMessage) {
                    setMessages(prev => [...prev, errorMessage]);
                }
            } catch (dbError) {
                console.error('Error saving error message:', dbError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const deleteConversation = async (conversationId) => {
        try {
            const { error } = await chatAPI.deleteConversation(conversationId);
            if (error) throw error;

            setConversations(prev => prev.filter(conv => conv.id !== conversationId));
            
            if (currentConversationId === conversationId) {
                const remainingConversations = conversations.filter(conv => conv.id !== conversationId);
                if (remainingConversations.length > 0) {
                    await selectConversation(remainingConversations[0].id);
                } else {
                    setCurrentConversationId(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Error deleting conversation:', error);
        }
    };

    const handleSignOut = async () => {
        try {
            await chatAPI.signOut();
            setUser(null);
            setConversations([]);
            setMessages([]);
            setCurrentConversationId(null);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };

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
                setShowAuthModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (authLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner">
                    <div className="loading-dots">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                    </div>
                </div>
                <p>Loading...</p>
            </div>
        );
    }

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
                user={user}
                onSignOut={handleSignOut}
                onSignIn={() => setShowAuthModal(true)}
            />
            
            <main className="main-chat">
                <Header 
                    onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    currentConversation={conversations.find(c => c.id === currentConversationId)}
                    user={user}
                    onSignIn={() => setShowAuthModal(true)}
                    onSignOut={handleSignOut}
                />
                
                <div className="messages-container">
                    <div className="messages-wrapper">
                        {messages.length === 0 ? (
                            <EmptyState 
                                onStartChat={createNewConversation} 
                                user={user}
                                onSignIn={() => setShowAuthModal(true)}
                            />
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <ChatMessage 
                                        key={message.id || `${message.timestamp}-${index}`} 
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
                    disabled={!user || !currentConversationId}
                    user={user}
                />
            </main>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onAuthSuccess={(user) => {
                    setUser(user);
                    loadConversations();
                }}
            />
        </div>
    );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);