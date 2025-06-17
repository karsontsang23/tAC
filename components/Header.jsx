import React from 'react';

export default function Header({ onToggleSidebar, currentConversation, user, onSignIn, onSignOut }) {
    const [showProviderStatus, setShowProviderStatus] = React.useState(false);
    const [providerStatus, setProviderStatus] = React.useState([]);

    React.useEffect(() => {
        // Import aiService dynamically to avoid circular dependencies
        import('../utils/aiService.js').then(({ aiService }) => {
            setProviderStatus(aiService.getProviderStatus());
        });
    }, []);

    return (
        <header className="chat-header">
            <div className="header-left">
                <button 
                    onClick={onToggleSidebar}
                    className="btn btn-ghost btn-icon md:hidden"
                    aria-label="Toggle sidebar"
                >
                    <span className="material-icons-round">menu</span>
                </button>
                <h1 className="header-title">
                    {currentConversation?.title || 'AI Chat'}
                </h1>
            </div>
            
            <div className="header-actions">
                {user ? (
                    <>
                        <div className="header-user-info">
                            <span className="user-email-header">{user.email}</span>
                        </div>
                        <button 
                            onClick={onSignOut}
                            className="btn btn-ghost btn-icon"
                            aria-label="Sign out"
                        >
                            <span className="material-icons-round">logout</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onSignIn}
                        className="btn btn-primary"
                        aria-label="Sign in"
                    >
                        <span className="material-icons-round">login</span>
                        Sign In
                    </button>
                )}
                
                <div className="provider-status-container">
                    <button 
                        className="btn btn-ghost btn-icon"
                        aria-label="AI Provider Status"
                        onClick={() => setShowProviderStatus(!showProviderStatus)}
                    >
                        <span className="material-icons-round">psychology</span>
                    </button>
                    
                    {showProviderStatus && (
                        <div className="provider-status-dropdown">
                            <div className="provider-status-header">
                                <h3>AI Providers</h3>
                            </div>
                            <div className="provider-status-list">
                                {providerStatus.map((provider, index) => (
                                    <div key={index} className="provider-status-item">
                                        <div className="provider-info">
                                            <span className="provider-name">{provider.name}</span>
                                            <span className="provider-model">{provider.model}</span>
                                        </div>
                                        <div className={`provider-indicator ${provider.available ? 'available' : 'unavailable'}`}>
                                            <span className="material-icons-round">
                                                {provider.available ? 'check_circle' : 'cancel'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="provider-status-footer">
                                <small>Priority order: {providerStatus.filter(p => p.available).length} of {providerStatus.length} available</small>
                            </div>
                        </div>
                    )}
                </div>
                
                <button 
                    className="btn btn-ghost btn-icon"
                    aria-label="Settings"
                >
                    <span className="material-icons-round">settings</span>
                </button>
            </div>
        </header>
    );
}