import React from 'react';

export default function EmptyState({ onStartChat }) {
    const suggestions = [
        {
            icon: 'lightbulb',
            title: 'Creative Writing',
            description: 'Help me write a story or poem'
        },
        {
            icon: 'code',
            title: 'Code Assistant',
            description: 'Debug code or explain programming concepts'
        },
        {
            icon: 'school',
            title: 'Learning Helper',
            description: 'Explain complex topics in simple terms'
        },
        {
            icon: 'business',
            title: 'Business Ideas',
            description: 'Brainstorm and develop business concepts'
        }
    ];

    const handleSuggestionClick = (suggestion) => {
        // This would typically send a predefined message
        console.log('Suggestion clicked:', suggestion);
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
                Start a conversation below or try one of these suggestions.
            </p>
            
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
                    </button>
                ))}
            </div>
        </div>
    );
}