function App() {
    try {
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
                messages: []
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
            const title = firstMessage.length > 30 
                ? firstMessage.substring(0, 30) + '...' 
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

            const userMessage = { role: 'user', content: messageContent };
            const newMessages = [...messages, userMessage];
            setMessages(newMessages);
            setIsLoading(true);

            if (messages.length === 0) {
                updateConversationTitle(currentConversationId, messageContent);
            }

            try {
                const response = await chatAgent(messageContent, messages);
                const assistantMessage = { role: 'assistant', content: response };
                const finalMessages = [...newMessages, assistantMessage];
                
                setMessages(finalMessages);
                
                setConversations(prev => 
                    prev.map(conv => 
                        conv.id === currentConversationId 
                            ? { ...conv, messages: finalMessages }
                            : conv
                    )
                );
            } catch (error) {
                console.error('Send message error:', error);
                const errorMessage = { 
                    role: 'assistant', 
                    content: 'Sorry, I encountered an error. Please try again.' 
                };
                setMessages([...newMessages, errorMessage]);
            } finally {
                setIsLoading(false);
            }
        };

        React.useEffect(() => {
            if (conversations.length === 0) {
                createNewConversation();
            }
        }, []);

        return (
            <div className="chat-container" data-name="app" data-file="app.js">
                <Sidebar
                    conversations={conversations}
                    currentConversationId={currentConversationId}
                    onNewChat={createNewConversation}
                    onSelectConversation={selectConversation}
                    isOpen={sidebarOpen}
                />
                
                <main className="main-chat">
                    <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                    
                    <div className="messages-container">
                        {messages.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6">
                                <div className="text-center">
                                    <span className="material-icons text-yellow-500 text-6xl mb-4">hub</span>
                                    <h1 className="text-2xl font-semibold text-gray-800">How can I help you today?</h1>
                                </div>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => (
                                    <ChatMessage key={index} message={message} />
                                ))}
                                {isLoading && (
                                    <ChatMessage 
                                        message={{ role: 'assistant', content: '' }} 
                                        isLoading={true} 
                                    />
                                )}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>
                    
                    <MessageInput onSendMessage={sendMessage} isLoading={isLoading} />
                </main>
            </div>
        );
    } catch (error) {
        console.error('App component error:', error);
        reportError(error);
        return <div className="p-4 text-red-500">Error loading application</div>;
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
