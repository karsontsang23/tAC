import React from 'react';
import { supabase } from '../lib/supabase.js';
import ApiKeyManagement from './ApiKeyManagement.jsx';

export default function UserManagement({ user, onClose }) {
    const [activeTab, setActiveTab] = React.useState('profile');
    const [showApiKeyManagement, setShowApiKeyManagement] = React.useState(false);
    const [profile, setProfile] = React.useState({
        display_name: user?.user_metadata?.display_name || user?.email?.split('@')[0] || '',
        email: user?.email || '',
        avatar_url: user?.user_metadata?.avatar_url || ''
    });
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState('');

    React.useEffect(() => {
        if (user) {
            loadUserProfile();
        }
    }, [user]);

    const loadUserProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                setProfile({
                    display_name: data[0].display_name || user.email.split('@')[0],
                    email: data[0].email,
                    avatar_url: data[0].avatar_url || ''
                });
            } else {
                setProfile({
                    display_name: user.user_metadata?.display_name || user.email.split('@')[0],
                    email: user.email,
                    avatar_url: user.user_metadata?.avatar_url || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            setProfile({
                display_name: user.user_metadata?.display_name || user.email.split('@')[0],
                email: user.email,
                avatar_url: user.user_metadata?.avatar_url || ''
            });
        }
    };

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const { error: dbError } = await supabase
                .from('users')
                .upsert({
                    id: user.id,
                    email: user.email,
                    display_name: profile.display_name,
                    avatar_url: profile.avatar_url,
                    updated_at: new Date().toISOString()
                });

            if (dbError) throw dbError;

            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    display_name: profile.display_name,
                    avatar_url: profile.avatar_url
                }
            });

            if (authError) throw authError;

            setMessage('個人資料更新成功！');
        } catch (error) {
            console.error('Error updating profile:', error);
            setMessage('更新失敗，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            setMessage('密碼確認不匹配');
            return;
        }

        if (newPassword.length < 6) {
            setMessage('密碼至少需要6個字符');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            setMessage('密碼更新成功！');
            e.target.reset();
        } catch (error) {
            console.error('Error updating password:', error);
            setMessage('密碼更新失敗，請稍後再試。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="user-management-overlay" onClick={onClose}>
                <div className="user-management-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="user-management-header">
                        <h2>用戶管理</h2>
                        <button 
                            onClick={onClose}
                            className="btn btn-ghost btn-icon"
                            aria-label="關閉"
                        >
                            <span className="material-icons-round">close</span>
                        </button>
                    </div>

                    <div className="user-management-tabs">
                        <button
                            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <span className="material-icons-round">person</span>
                            個人資料
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <span className="material-icons-round">security</span>
                            安全設定
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'api-keys' ? 'active' : ''}`}
                            onClick={() => setActiveTab('api-keys')}
                        >
                            <span className="material-icons-round">key</span>
                            API密鑰
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <span className="material-icons-round">settings</span>
                            偏好設定
                        </button>
                    </div>

                    <div className="user-management-content">
                        {message && (
                            <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
                                {message}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <form onSubmit={updateProfile} className="profile-form">
                                <h3>個人資料</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="displayName">顯示名稱</label>
                                    <input
                                        type="text"
                                        id="displayName"
                                        value={profile.display_name}
                                        onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                                        className="form-input"
                                        placeholder="輸入您的顯示名稱"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">電子郵件</label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={profile.email}
                                        className="form-input"
                                        disabled
                                    />
                                    <small>電子郵件無法修改</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="avatarUrl">頭像網址</label>
                                    <input
                                        type="url"
                                        id="avatarUrl"
                                        value={profile.avatar_url}
                                        onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                                        className="form-input"
                                        placeholder="輸入頭像圖片網址"
                                    />
                                </div>

                                {profile.avatar_url && (
                                    <div className="avatar-preview">
                                        <img src={profile.avatar_url} alt="頭像預覽" />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? '更新中...' : '更新資料'}
                                </button>
                            </form>
                        )}

                        {activeTab === 'security' && (
                            <form onSubmit={changePassword} className="security-form">
                                <h3>安全設定</h3>
                                
                                <div className="form-group">
                                    <label htmlFor="newPassword">新密碼</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        name="newPassword"
                                        className="form-input"
                                        placeholder="輸入新密碼"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="confirmPassword">確認密碼</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="再次輸入新密碼"
                                        minLength={6}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary"
                                >
                                    {loading ? '更新中...' : '更新密碼'}
                                </button>

                                <div className="security-info">
                                    <h4>安全提示</h4>
                                    <ul>
                                        <li>密碼至少需要6個字符</li>
                                        <li>建議使用包含大小寫字母、數字和特殊字符的強密碼</li>
                                        <li>定期更換密碼以保護帳戶安全</li>
                                    </ul>
                                </div>
                            </form>
                        )}

                        {activeTab === 'api-keys' && (
                            <div className="api-keys-section">
                                <h3>API密鑰管理</h3>
                                <p>設定您自己的AI服務API密鑰以獲得更好的服務體驗。</p>
                                
                                <button
                                    onClick={() => setShowApiKeyManagement(true)}
                                    className="btn btn-primary"
                                >
                                    <span className="material-icons-round">key</span>
                                    管理API密鑰
                                </button>

                                <div className="api-keys-info">
                                    <h4>支援的AI服務</h4>
                                    <ul>
                                        <li><strong>OpenAI</strong> - GPT-3.5, GPT-4 等模型</li>
                                        <li><strong>Google AI Studio</strong> - Gemini Pro 等模型</li>
                                        <li><strong>OpenRouter</strong> - 多種開源模型</li>
                                        <li><strong>Anthropic</strong> - Claude 系列模型</li>
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="preferences-form">
                                <h3>偏好設定</h3>
                                
                                <div className="preference-group">
                                    <h4>通知設定</h4>
                                    <label className="checkbox-label">
                                        <input type="checkbox" defaultChecked />
                                        <span className="checkbox-text">群組邀請通知</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" defaultChecked />
                                        <span className="checkbox-text">新消息通知</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" />
                                        <span className="checkbox-text">系統更新通知</span>
                                    </label>
                                </div>

                                <div className="preference-group">
                                    <h4>隱私設定</h4>
                                    <label className="checkbox-label">
                                        <input type="checkbox" defaultChecked />
                                        <span className="checkbox-text">允許其他用戶搜索到我</span>
                                    </label>
                                    <label className="checkbox-label">
                                        <input type="checkbox" defaultChecked />
                                        <span className="checkbox-text">顯示在線狀態</span>
                                    </label>
                                </div>

                                <div className="preference-group">
                                    <h4>介面設定</h4>
                                    <div className="form-group">
                                        <label htmlFor="theme">主題</label>
                                        <select id="theme" className="form-input">
                                            <option value="light">淺色主題</option>
                                            <option value="dark">深色主題</option>
                                            <option value="auto">跟隨系統</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="language">語言</label>
                                        <select id="language" className="form-input">
                                            <option value="zh-TW">繁體中文</option>
                                            <option value="zh-CN">簡體中文</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>

                                <button className="btn btn-primary">
                                    保存設定
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showApiKeyManagement && (
                <ApiKeyManagement
                    user={user}
                    onClose={() => setShowApiKeyManagement(false)}
                />
            )}
        </>
    );
}