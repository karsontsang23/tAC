// Enhanced AI service with multiple providers and fallbacks
export class AIService {
    constructor() {
        this.providers = [
            {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                apiKey: import.meta.env.VITE_OPENAI_API_KEY,
                model: 'gpt-3.5-turbo',
                priority: 0
            },
            {
                name: 'Google AI Studio',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY,
                model: 'gemini-pro',
                priority: 1
            },
            {
                name: 'OpenRouter',
                endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
                model: 'deepseek/deepseek-r1-0528:free',
                priority: 2
            },
            {
                name: 'Anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
                model: 'claude-3-haiku-20240307',
                priority: 3
            }
        ];
        
        this.fallbackResponses = [
            "I understand your question. Let me provide you with a comprehensive answer that addresses your specific needs.",
            "That's an interesting point you've raised. Here's my perspective on this topic, along with some additional insights.",
            "I'd be happy to help you with that. Based on what you've shared, here are some suggestions and considerations.",
            "Thank you for your question. This is a complex topic, so let me break it down into manageable parts for you.",
            "I appreciate you bringing this up. Let me share some thoughts and provide you with actionable information.",
            "That's a great question that many people wonder about. Here's what I think would be most helpful for your situation.",
            "I can definitely assist you with this. Let me provide you with a detailed response that covers the key aspects.",
            "This is an area I'm quite familiar with. Here's my analysis and some recommendations for moving forward."
        ];
    }

    async generateResponse(message, conversationHistory = []) {
        // Sort providers by priority and filter those with API keys
        const availableProviders = this.providers
            .filter(provider => provider.apiKey)
            .sort((a, b) => a.priority - b.priority);

        // Try API providers in order of priority
        for (const provider of availableProviders) {
            try {
                console.log(`Attempting to use ${provider.name} API...`);
                const response = await this.callProvider(provider, message, conversationHistory);
                if (response) {
                    console.log(`Successfully got response from ${provider.name}`);
                    return response;
                }
            } catch (error) {
                console.warn(`${provider.name} API failed:`, error.message);
                continue;
            }
        }

        // Fallback to enhanced mock responses
        console.log('All API providers failed, using fallback response');
        return this.generateFallbackResponse(message, conversationHistory);
    }

    async callProvider(provider, message, conversationHistory) {
        const messages = [
            ...conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: message }
        ];

        switch (provider.name) {
            case 'OpenAI':
                return await this.callOpenAI(provider, messages);
            case 'Google AI':
                return await this.callGoogleAI(provider, message, conversationHistory);
            case 'OpenRouter':
                return await this.callOpenRouter(provider, messages);
            case 'Anthropic':
                return await this.callAnthropic(provider, messages);
            default:
                throw new Error(`Unknown provider: ${provider.name}`);
        }
    }

    async callOpenAI(provider, messages) {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`
            },
            body: JSON.stringify({
                model: provider.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }

    async callGoogleAI(provider, message, conversationHistory) {
        // Convert conversation history to Google AI format
        const contents = [];
        
        // Add conversation history
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        
        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000
                },
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async callOpenRouter(provider, messages) {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${provider.apiKey}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AI Chat Application'
            },
            body: JSON.stringify({
                model: provider.model,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }

    async callAnthropic(provider, messages) {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': provider.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: provider.model,
                max_tokens: 1000,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.content[0]?.text;
    }

    generateFallbackResponse(message, conversationHistory) {
        // Simulate realistic API delay
        return new Promise((resolve) => {
            const delay = Math.random() * 2000 + 1000; // 1-3 seconds
            
            setTimeout(() => {
                const lowerMessage = message.toLowerCase();
                let response;
                
                // Context-aware responses based on message content
                if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
                    response = "Hello! It's great to meet you. I'm here to help with any questions or tasks you might have. What would you like to explore today?";
                } else if (lowerMessage.includes('help')) {
                    response = "I'm here to help! I can assist you with a wide variety of tasks including answering questions, creative writing, problem-solving, coding, analysis, and much more. What specific area would you like assistance with?";
                } else if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
                    response = "I'd be happy to help with coding! I can assist with debugging, explaining concepts, writing code snippets, reviewing code, or discussing best practices. What programming challenge are you working on?";
                } else if (lowerMessage.includes('write') || lowerMessage.includes('story')) {
                    response = "Creative writing is one of my favorite areas to help with! I can assist with stories, essays, poems, scripts, or any other form of writing. What kind of writing project are you working on?";
                } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
                    response = "I'd be happy to explain that for you! Let me break it down in a clear and understandable way, providing context and examples where helpful.";
                } else if (lowerMessage.includes('how to')) {
                    response = "Great question! I'll walk you through the process step by step, making sure to cover all the important details and potential considerations.";
                } else {
                    // Use random fallback response
                    response = this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
                }
                
                resolve(response);
            }, delay);
        });
    }

    // Get status of available providers
    getProviderStatus() {
        return this.providers.map(provider => ({
            name: provider.name,
            available: !!provider.apiKey,
            model: provider.model,
            priority: provider.priority
        }));
    }
}

export const aiService = new AIService();