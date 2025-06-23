import { supabase } from './supabase.js';

// 簡單的客戶端加密/解密（實際應用中應使用更強的加密）
const ENCRYPTION_KEY = 'ai-chat-encryption-key-2024';

function simpleEncrypt(text) {
  // 這是一個簡單的加密實現，實際應用中應使用更安全的方法
  return btoa(text + ENCRYPTION_KEY);
}

function simpleDecrypt(encryptedText) {
  try {
    const decoded = atob(encryptedText);
    return decoded.replace(ENCRYPTION_KEY, '');
  } catch (error) {
    console.error('解密失敗:', error);
    return '';
  }
}

export const apiKeysAPI = {
  // 獲取用戶的API密鑰
  async getUserApiKeys() {
    const { data, error } = await supabase
      .from('user_api_keys')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) return { data: null, error };
    
    // 解密API密鑰
    const decryptedData = data?.map(item => ({
      ...item,
      api_key: simpleDecrypt(item.api_key)
    }));
    
    return { data: decryptedData, error: null };
  },

  // 保存或更新API密鑰
  async saveApiKey(provider, apiKey) {
    const encryptedKey = simpleEncrypt(apiKey);
    
    const { data, error } = await supabase
      .from('user_api_keys')
      .upsert({
        provider,
        api_key: encryptedKey,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,provider'
      })
      .select()
      .single();
    
    return { data, error };
  },

  // 刪除API密鑰
  async deleteApiKey(provider) {
    const { error } = await supabase
      .from('user_api_keys')
      .delete()
      .eq('provider', provider);
    
    return { error };
  },

  // 停用API密鑰
  async deactivateApiKey(provider) {
    const { data, error } = await supabase
      .from('user_api_keys')
      .update({ is_active: false })
      .eq('provider', provider)
      .select()
      .single();
    
    return { data, error };
  },

  // 測試API密鑰是否有效
  async testApiKey(provider, apiKey) {
    try {
      switch (provider) {
        case 'openai':
          return await this.testOpenAI(apiKey);
        case 'google_ai':
          return await this.testGoogleAI(apiKey);
        case 'openrouter':
          return await this.testOpenRouter(apiKey);
        case 'anthropic':
          return await this.testAnthropic(apiKey);
        default:
          return { valid: false, error: '不支援的服務提供商' };
      }
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },

  async testOpenAI(apiKey) {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      return { valid: true };
    } else {
      const error = await response.json();
      return { valid: false, error: error.error?.message || '無效的API密鑰' };
    }
  },

  async testGoogleAI(apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    
    if (response.ok) {
      return { valid: true };
    } else {
      const error = await response.json();
      return { valid: false, error: error.error?.message || '無效的API密鑰' };
    }
  },

  async testOpenRouter(apiKey) {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      return { valid: true };
    } else {
      const error = await response.json();
      return { valid: false, error: error.error?.message || '無效的API密鑰' };
    }
  },

  async testAnthropic(apiKey) {
    // Anthropic沒有公開的模型列表端點，所以我們發送一個簡單的測試請求
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    
    if (response.ok || response.status === 400) {
      // 400錯誤通常表示請求格式問題，但API密鑰是有效的
      return { valid: true };
    } else {
      const error = await response.json();
      return { valid: false, error: error.error?.message || '無效的API密鑰' };
    }
  }
};