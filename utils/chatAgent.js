export async function chatAgent(message, previousMessages) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock response
    return "This is a mock response. In a real implementation, this would connect to an AI service API.";
}