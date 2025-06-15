export async function chatAgent(message, previousMessages) {
    // Simulate realistic API delay
    const delay = Math.random() * 2000 + 1000; // 1-3 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Enhanced mock responses based on message content
    const responses = [
        "I understand your question. Let me provide you with a comprehensive answer that addresses your specific needs.",
        "That's an interesting point you've raised. Here's my perspective on this topic, along with some additional insights.",
        "I'd be happy to help you with that. Based on what you've shared, here are some suggestions and considerations.",
        "Thank you for your question. This is a complex topic, so let me break it down into manageable parts for you.",
        "I appreciate you bringing this up. Let me share some thoughts and provide you with actionable information.",
        "That's a great question that many people wonder about. Here's what I think would be most helpful for your situation.",
        "I can definitely assist you with this. Let me provide you with a detailed response that covers the key aspects.",
        "This is an area I'm quite familiar with. Here's my analysis and some recommendations for moving forward."
    ];
    
    // Simple keyword-based response selection
    const lowerMessage = message.toLowerCase();
    let response;
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        response = "Hello! It's great to meet you. I'm here to help with any questions or tasks you might have. What would you like to explore today?";
    } else if (lowerMessage.includes('help')) {
        response = "I'm here to help! I can assist you with a wide variety of tasks including answering questions, creative writing, problem-solving, coding, analysis, and much more. What specific area would you like assistance with?";
    } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
        response = "I'd be happy to help with coding! I can assist with debugging, explaining concepts, writing code snippets, reviewing code, or discussing best practices. What programming challenge are you working on?";
    } else if (lowerMessage.includes('write') || lowerMessage.includes('story')) {
        response = "Creative writing is one of my favorite areas to help with! I can assist with stories, essays, poems, scripts, or any other form of writing. What kind of writing project are you working on?";
    } else {
        response = responses[Math.floor(Math.random() * responses.length)];
    }
    
    return response;
}