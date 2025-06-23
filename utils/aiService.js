// Enhanced AI service with user-specific API keys
import { apiKeysAPI } from '../lib/apiKeysAPI.js';

export class AIService {
    constructor() {
        this.userApiKeys = {};
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

    async loadUserApiKeys() {
        try {
            const { data, error } = await apiKeysAPI.getUserApiKeys();
            if (error) throw error;
            
            this.userApiKeys = {};
            data?.forEach(item => {
                this.userApiKeys[item.provider] = item.api_key;
            });
        } catch (error) {
            console.error('載入用戶API密鑰失敗:', error);
            this.userApiKeys = {};
        }
    }

    getProviders() {
        return [
            {
                name: 'OpenAI',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-3.5-turbo',
                priority: 0,
                provider: 'openai'
            },
            {
                name: 'Google AI Studio',
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                model: 'gemini-pro',
                priority: 1,
                provider: 'google_ai'
            },
            {
                name: 'OpenRouter',
                endpoint: 'https://openrouter.ai/api/v1/chat/completions',
                model: 'deepseek/deepseek-r1-0528',
                priority: 2,
                provider: 'openrouter'
            },
            {
                name: 'Anthropic',
                endpoint: 'https://api.anthropic.com/v1/messages',
                model: 'claude-3-haiku-20240307',
                priority: 3,
                provider: 'anthropic'
            }
        ];
    }

    async generateResponse(message, conversationHistory = []) {
        // 載入用戶的API密鑰
        await this.loadUserApiKeys();

        // 獲取可用的提供商（有API密鑰的）
        const providers = this.getProviders();
        const availableProviders = providers
            .filter(provider => this.userApiKeys[provider.provider])
            .sort((a, b) => a.priority - b.priority);

        // 如果沒有可用的API密鑰，使用fallback
        if (availableProviders.length === 0) {
            console.log('沒有可用的API密鑰，使用fallback回應');
            return this.generateFallbackResponse(message, conversationHistory);
        }

        // 嘗試使用可用的提供商
        for (const provider of availableProviders) {
            try {
                console.log(`嘗試使用 ${provider.name} API...`);
                const response = await this.callProvider(provider, message, conversationHistory);
                if (response) {
                    console.log(`成功從 ${provider.name} 獲得回應`);
                    return response;
                }
            } catch (error) {
                console.warn(`${provider.name} API 失敗:`, error.message);
                continue;
            }
        }

        // 所有API都失敗，使用fallback
        console.log('所有API提供商都失敗，使用fallback回應');
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

        const apiKey = this.userApiKeys[provider.provider];
        if (!apiKey) {
            throw new Error(`沒有 ${provider.name} 的API密鑰`);
        }

        switch (provider.provider) {
            case 'openai':
                return await this.callOpenAI(provider, messages, apiKey);
            case 'google_ai':
                return await this.callGoogleAI(provider, message, conversationHistory, apiKey);
            case 'openrouter':
                return await this.callOpenRouter(provider, messages, apiKey);
            case 'anthropic':
                return await this.callAnthropic(provider, messages, apiKey);
            default:
                throw new Error(`未知的提供商: ${provider.provider}`);
        }
    }

    async callOpenAI(provider, messages, apiKey) {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
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

    async callGoogleAI(provider, message, conversationHistory, apiKey) {
        const contents = [];
        
        conversationHistory.forEach(msg => {
            contents.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        });
        
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch(`${provider.endpoint}?key=${apiKey}`, {
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
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Google AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    async callOpenRouter(provider, messages, apiKey) {
        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            model: provider.model,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
            presence_penalty: 0.1,
            provider: {
                allow_fallbacks: true,
                sort: 'latency',
                data_collection: 'allow',
                quantizations: [
                    'fp8',
                    'int4',
                    'bf16'
                ]
            }
        };

        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    }

    async callAnthropic(provider, messages, apiKey) {
        const response = await fetch(provider.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
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
        return new Promise((resolve) => {
            const delay = Math.random() * 2000 + 1000;
            
            setTimeout(() => {
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
                } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
                    response = "I'd be happy to explain that for you! Let me break it down in a clear and understandable way, providing context and examples where helpful.";
                } else if (lowerMessage.includes('how to')) {
                    response = "Great question! I'll walk you through the process step by step, making sure to cover all the important details and potential considerations.";
                } else {
                    response = this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)];
                }
                
                resolve(response);
            }, delay);
        });
    }

    // 獲取提供商狀態
    async getProviderStatus() {
        await this.loadUserApiKeys();
        
        return this.getProviders().map(provider => ({
            name: provider.name,
            available: !!this.userApiKeys[provider.provider],
            model: provider.model,
            priority: provider.priority
        }));
    }
}

export const aiService = new AIService();