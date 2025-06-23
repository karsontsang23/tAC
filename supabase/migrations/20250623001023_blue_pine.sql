/*
  # 用戶API密鑰管理

  1. 新增表格
    - `user_api_keys` - 用戶API密鑰
      - `id` (uuid, 主鍵)
      - `user_id` (uuid, 用戶ID)
      - `provider` (text, 服務提供商)
      - `api_key` (text, 加密的API密鑰)
      - `is_active` (boolean, 是否啟用)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. 安全性
    - 啟用RLS
    - 用戶只能管理自己的API密鑰
    - API密鑰將在客戶端加密存儲

  3. 索引
    - 為高效查詢添加索引
*/

-- 創建用戶API密鑰表
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  provider text NOT NULL CHECK (provider IN ('openai', 'google_ai', 'openrouter', 'anthropic')),
  api_key text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- 啟用行級安全性
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- 創建策略
CREATE POLICY "Users can manage own API keys"
  ON user_api_keys
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_active ON user_api_keys(is_active);