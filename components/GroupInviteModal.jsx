import React from 'react';
import { groupsAPI } from '../lib/groupsAPI.js';

export default function GroupInviteModal({ group, onClose, onInviteSent }) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [inviting, setInviting] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const searchUsers = async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await groupsAPI.searchUsers(query);
            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching users:', error);
            setMessage('搜索用戶時發生錯誤');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const inviteUser = async (userEmail) => {
        setInviting(true);
        setMessage('');

        try {
            const { error } = await groupsAPI.inviteUserToGroup(group.id, userEmail);
            if (error) throw error;

            setMessage('邀請已發送！');
            onInviteSent?.();
            
            // 從搜索結果中移除已邀請的用戶
            setSearchResults(prev => prev.filter(user => user.email !== userEmail));
        } catch (error) {
            console.error('Error inviting user:', error);
            setMessage(error.message || '邀請發送失敗');
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal invite-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>邀請用戶加入 {group.name}</h3>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="modal-content">
                    {message && (
                        <div className={`message ${message.includes('已發送') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <div className="search-section">
                        <div className="form-group">
                            <label htmlFor="userSearch">搜索用戶</label>
                            <div className="search-input-wrapper">
                                <input
                                    type="text"
                                    id="userSearch"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="form-input"
                                    placeholder="輸入用戶名稱或電子郵件"
                                />
                                {loading && (
                                    <div className="search-loading">
                                        <span className="material-icons-round">hourglass_empty</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="search-results">
                            {searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <div key={user.id} className="user-result">
                                        <div className="user-avatar">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt={user.display_name} />
                                            ) : (
                                                <span className="material-icons-round">person</span>
                                            )}
                                        </div>
                                        <div className="user-info">
                                            <div className="user-name">
                                                {user.display_name || user.email}
                                            </div>
                                            <div className="user-email">{user.email}</div>
                                        </div>
                                        <button
                                            onClick={() => inviteUser(user.email)}
                                            disabled={inviting}
                                            className="btn btn-primary btn-sm"
                                        >
                                            {inviting ? '邀請中...' : '邀請'}
                                        </button>
                                    </div>
                                ))
                            ) : searchQuery && !loading ? (
                                <div className="no-results">
                                    <span className="material-icons-round">search_off</span>
                                    <p>沒有找到匹配的用戶</p>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="invite-info">
                        <h4>邀請說明</h4>
                        <ul>
                            <li>被邀請的用戶將收到群組邀請通知</li>
                            <li>邀請有效期為7天</li>
                            <li>用戶可以選擇接受或拒絕邀請</li>
                            <li>只有群組成員可以邀請新用戶</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}