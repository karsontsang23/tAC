import React from 'react';

export default function EmptyState({ onStartChat, user, onSignIn }) {
    const suggestions = [
        {
            icon: 'lightbulb',
            title: 'Creative Writing',
            description: 'Help me write a story or poem',
            prompt: 'Help me write a creative short story about space exploration'
        },
        {
            icon: 'code',
            title: 'Code Assistant',
            description: 'Debug code or explain programming concepts',
            prompt: 'Explain how React hooks work with examples'
        },
        {
            icon: 'school',
            title: 'Learning Helper',
            description: 'Explain complex topics in simple terms',
            prompt: 'Explain quantum physics in simple terms'
        },
        {
            icon: 'business',
            title: 'Business Ideas',
            description: 'Brainstorm and develop business concepts',
            prompt: 'Help me brainstorm innovative startup ideas for 2024'
        }
    ];

    const handleSuggestionClick = (suggestion) => {
        if (user) {
            // Create a mock message event to send the suggestion
            const mockEvent = {
                preventDefault: () => {},
                target: { value: suggestion.prompt }
            };
            onStartChat(suggestion.prompt);
        } else {
            onSignIn();
        }
    };

    return (
        <div className="empty-state">
            <div className="empty-state-icon">
                <span className="material-icons-round">psychology</span>
            </div>
            
            <h1 className="empty-state-title">
                How can I help you today?
            </h1>
            
            <p className="empty-state-subtitle">
                I'm here to assist you with questions, creative tasks, problem-solving, and much more. 
                {user ? 'Start a conversation below or try one of these suggestions.' : 'Sign in to save your conversations and try these suggestions.'}
            </p>

            {!user && (
                <div className="auth-cta">
                    <button 
                        onClick={onSignIn}
                        className="btn btn-primary auth-cta-button"
                    >
                        <span className="material-icons-round">login</span>
                        Sign In to Get Started
                    </button>
                </div>
            )}
            
            <div className="suggestions-grid">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        className="suggestion-card"
                        onClick={() => handleSuggestionClick(suggestion)}
                        aria-label={`Try suggestion: ${suggestion.title}`}
                    >
                        <div className="suggestion-icon">
                            <span className="material-icons-round">{suggestion.icon}</span>
                        </div>
                        <div className="suggestion-content">
                            <h3 className="suggestion-title">{suggestion.title}</h3>
                            <p className="suggestion-description">{suggestion.description}</p>
                        </div>
                        {!user && (
                            <div className="suggestion-lock">
                                <span className="material-icons-round">lock</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}