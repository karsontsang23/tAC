/*
  # 用戶群管理系統數據庫架構

  1. 新增表格
    - `groups` - 群組基本信息
      - `id` (uuid, 主鍵)
      - `name` (text, 群組名稱)
      - `description` (text, 群組描述)
      - `avatar_url` (text, 群組頭像)
      - `created_by` (uuid, 創建者ID)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_private` (boolean, 是否私有群組)
      - `max_members` (integer, 最大成員數)
    
    - `group_members` - 群組成員關係
      - `id` (uuid, 主鍵)
      - `group_id` (uuid, 群組ID)
      - `user_id` (uuid, 用戶ID)
      - `role` (text, 角色: owner, admin, member)
      - `joined_at` (timestamp)
      - `invited_by` (uuid, 邀請者ID)
    
    - `group_invitations` - 群組邀請
      - `id` (uuid, 主鍵)
      - `group_id` (uuid, 群組ID)
      - `invited_user_id` (uuid, 被邀請用戶ID)
      - `invited_by` (uuid, 邀請者ID)
      - `status` (text, 狀態: pending, accepted, rejected)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)

  2. 安全性
    - 啟用所有表格的RLS
    - 添加適當的權限策略
    - 用戶只能管理自己有權限的群組

  3. 索引
    - 為高效查詢添加索引
    - 優化群組列表和成員查詢
*/

-- 創建用戶資料表（如果不存在）
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 創建群組表
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  avatar_url text,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_private boolean DEFAULT false,
  max_members integer DEFAULT 100
);

-- 創建群組成員表
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES users(id),
  UNIQUE(group_id, user_id)
);

-- 創建群組邀請表
CREATE TABLE IF NOT EXISTS group_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  invited_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  invited_by uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(group_id, invited_user_id, status)
);

-- 修改conversations表以支持群組聊天
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'group_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN group_id uuid REFERENCES groups(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'is_group_chat'
  ) THEN
    ALTER TABLE conversations ADD COLUMN is_group_chat boolean DEFAULT false;
  END IF;
END $$;

-- 啟用行級安全性
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- 用戶表策略
CREATE POLICY "Users can view all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 群組表策略
CREATE POLICY "Users can view groups they are members of"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    ) OR NOT is_private
  );

CREATE POLICY "Users can create groups"
  ON groups
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group owners and admins can update groups"
  ON groups
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Group owners can delete groups"
  ON groups
  FOR DELETE
  TO authenticated
  USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 群組成員表策略
CREATE POLICY "Users can view group members of their groups"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners and admins can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 群組邀請表策略
CREATE POLICY "Users can view their own invitations"
  ON group_invitations
  FOR SELECT
  TO authenticated
  USING (
    invited_user_id = auth.uid() OR
    invited_by = auth.uid() OR
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Group members can create invitations"
  ON group_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own invitations"
  ON group_invitations
  FOR UPDATE
  TO authenticated
  USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_is_private ON groups(is_private);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_invitations_invited_user ON group_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON group_invitations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_group_id ON conversations(group_id);

-- 創建函數：自動添加群組創建者為所有者
CREATE OR REPLACE FUNCTION add_group_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role, invited_by)
  VALUES (NEW.id, NEW.created_by, 'owner', NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
CREATE TRIGGER add_group_owner_trigger
  AFTER INSERT ON groups
  FOR EACH ROW
  EXECUTE FUNCTION add_group_owner();

-- 創建函數：處理邀請接受
CREATE OR REPLACE FUNCTION accept_group_invitation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO group_members (group_id, user_id, role, invited_by)
    VALUES (NEW.group_id, NEW.invited_user_id, 'member', NEW.invited_by)
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
CREATE TRIGGER accept_group_invitation_trigger
  AFTER UPDATE ON group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION accept_group_invitation();