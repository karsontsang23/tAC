import { supabase } from './supabase.js';

export const groupsAPI = {
  // 群組管理
  async createGroup(name, description = '', isPrivate = false, maxMembers = 100) {
    const { data, error } = await supabase
      .from('groups')
      .insert([{
        name,
        description,
        is_private: isPrivate,
        max_members: maxMembers
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getMyGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(role),
        member_count:group_members(count)
      `)
      .eq('group_members.user_id', (await supabase.auth.getUser()).data.user?.id);
    
    return { data, error };
  },

  async getPublicGroups() {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        member_count:group_members(count),
        created_by_user:users!groups_created_by_fkey(display_name, email)
      `)
      .eq('is_private', false)
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async getGroupDetails(groupId) {
    const { data, error } = await supabase
      .from('groups')
      .select(`
        *,
        created_by_user:users!groups_created_by_fkey(display_name, email),
        members:group_members(
          id,
          role,
          joined_at,
          user:users(id, display_name, email, avatar_url)
        )
      `)
      .eq('id', groupId)
      .single();
    
    return { data, error };
  },

  async updateGroup(groupId, updates) {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();
    
    return { data, error };
  },

  async deleteGroup(groupId) {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);
    
    return { error };
  },

  // 成員管理
  async getGroupMembers(groupId) {
    const { data, error } = await supabase
      .from('group_members')
      .select(`
        *,
        user:users(id, display_name, email, avatar_url),
        invited_by_user:users!group_members_invited_by_fkey(display_name, email)
      `)
      .eq('group_id', groupId)
      .order('joined_at', { ascending: true });
    
    return { data, error };
  },

  async addMemberToGroup(groupId, userId, role = 'member') {
    const { data, error } = await supabase
      .from('group_members')
      .insert([{
        group_id: groupId,
        user_id: userId,
        role
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async updateMemberRole(groupId, userId, role) {
    const { data, error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .select()
      .single();
    
    return { data, error };
  },

  async removeMemberFromGroup(groupId, userId) {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    
    return { error };
  },

  async leaveGroup(groupId) {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return { error: { message: 'Not authenticated' } };

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);
    
    return { error };
  },

  // 邀請管理
  async inviteUserToGroup(groupId, userEmail) {
    // 首先查找用戶
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (userError) {
      return { error: { message: '找不到該用戶' } };
    }

    const { data, error } = await supabase
      .from('group_invitations')
      .insert([{
        group_id: groupId,
        invited_user_id: userData.id
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getMyInvitations() {
    const { data, error } = await supabase
      .from('group_invitations')
      .select(`
        *,
        group:groups(name, description, avatar_url),
        invited_by_user:users!group_invitations_invited_by_fkey(display_name, email)
      `)
      .eq('invited_user_id', (await supabase.auth.getUser()).data.user?.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    return { data, error };
  },

  async respondToInvitation(invitationId, status) {
    const { data, error } = await supabase
      .from('group_invitations')
      .update({ status })
      .eq('id', invitationId)
      .select()
      .single();
    
    return { data, error };
  },

  // 群組聊天
  async createGroupConversation(groupId, title = '群組聊天') {
    const { data, error } = await supabase
      .from('conversations')
      .insert([{
        title,
        group_id: groupId,
        is_group_chat: true
      }])
      .select()
      .single();
    
    return { data, error };
  },

  async getGroupConversations(groupId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('group_id', groupId)
      .order('updated_at', { ascending: false });
    
    return { data, error };
  },

  // 用戶搜索
  async searchUsers(query) {
    const { data, error } = await supabase
      .from('users')
      .select('id, display_name, email, avatar_url')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    
    return { data, error };
  }
};