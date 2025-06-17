import React from 'react';
import { groupsAPI } from '../lib/groupsAPI.js';

export default function GroupManagement({ user, onClose }) {
    const [activeTab, setActiveTab] = React.useState('my-groups');
    const [myGroups, setMyGroups] = React.useState([]);
    const [publicGroups, setPublicGroups] = React.useState([]);
    const [invitations, setInvitations] = React.useState([]);
    const [loading, setLoading] = React.useState(false);
    const [showCreateGroup, setShowCreateGroup] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'my-groups':
                    const { data: myGroupsData } = await groupsAPI.getMyGroups();
                    setMyGroups(myGroupsData || []);
                    break;
                case 'public-groups':
                    const { data: publicGroupsData } = await groupsAPI.getPublicGroups();
                    setPublicGroups(publicGroupsData || []);
                    break;
                case 'invitations':
                    const { data: invitationsData } = await groupsAPI.getMyInvitations();
                    setInvitations(invitationsData || []);
                    break;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (groupData) => {
        try {
            const { data, error } = await groupsAPI.createGroup(
                groupData.name,
                groupData.description,
                groupData.isPrivate,
                groupData.maxMembers
            );
            
            if (error) throw error;
            
            setShowCreateGroup(false);
            loadData();
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleInvitationResponse = async (invitationId, status) => {
        try {
            const { error } = await groupsAPI.respondToInvitation(invitationId, status);
            if (error) throw error;
            
            loadData();
        } catch (error) {
            console.error('Error responding to invitation:', error);
        }
    };

    return (
        <div className="group-management-overlay" onClick={onClose}>
            <div className="group-management-modal" onClick={(e) => e.stopPropagation()}>
                <div className="group-management-header">
                    <h2>群組管理</h2>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                        aria-label="關閉"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="group-management-tabs">
                    <button
                        className={`tab-button ${activeTab === 'my-groups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my-groups')}
                    >
                        <span className="material-icons-round">groups</span>
                        我的群組
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'public-groups' ? 'active' : ''}`}
                        onClick={() => setActiveTab('public-groups')}
                    >
                        <span className="material-icons-round">public</span>
                        公開群組
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'invitations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('invitations')}
                    >
                        <span className="material-icons-round">mail</span>
                        邀請
                        {invitations.length > 0 && (
                            <span className="notification-badge">{invitations.length}</span>
                        )}
                    </button>
                </div>

                <div className="group-management-content">
                    {activeTab === 'my-groups' && (
                        <MyGroupsTab 
                            groups={myGroups}
                            loading={loading}
                            onCreateGroup={() => setShowCreateGroup(true)}
                            onRefresh={loadData}
                        />
                    )}
                    
                    {activeTab === 'public-groups' && (
                        <PublicGroupsTab 
                            groups={publicGroups}
                            loading={loading}
                            onRefresh={loadData}
                        />
                    )}
                    
                    {activeTab === 'invitations' && (
                        <InvitationsTab 
                            invitations={invitations}
                            loading={loading}
                            onRespond={handleInvitationResponse}
                        />
                    )}
                </div>

                {showCreateGroup && (
                    <CreateGroupModal
                        onClose={() => setShowCreateGroup(false)}
                        onCreate={handleCreateGroup}
                    />
                )}
            </div>
        </div>
    );
}

function MyGroupsTab({ groups, loading, onCreateGroup, onRefresh }) {
    if (loading) {
        return <div className="loading-state">載入中...</div>;
    }

    return (
        <div className="groups-tab">
            <div className="tab-header">
                <h3>我的群組</h3>
                <button 
                    className="btn btn-primary"
                    onClick={onCreateGroup}
                >
                    <span className="material-icons-round">add</span>
                    創建群組
                </button>
            </div>
            
            {groups.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons-round">groups</span>
                    <p>您還沒有加入任何群組</p>
                    <button className="btn btn-primary" onClick={onCreateGroup}>
                        創建第一個群組
                    </button>
                </div>
            ) : (
                <div className="groups-list">
                    {groups.map(group => (
                        <GroupCard key={group.id} group={group} showRole={true} />
                    ))}
                </div>
            )}
        </div>
    );
}

function PublicGroupsTab({ groups, loading, onRefresh }) {
    if (loading) {
        return <div className="loading-state">載入中...</div>;
    }

    return (
        <div className="groups-tab">
            <div className="tab-header">
                <h3>公開群組</h3>
                <button 
                    className="btn btn-ghost btn-icon"
                    onClick={onRefresh}
                    aria-label="刷新"
                >
                    <span className="material-icons-round">refresh</span>
                </button>
            </div>
            
            {groups.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons-round">public</span>
                    <p>沒有找到公開群組</p>
                </div>
            ) : (
                <div className="groups-list">
                    {groups.map(group => (
                        <GroupCard key={group.id} group={group} showJoinButton={true} />
                    ))}
                </div>
            )}
        </div>
    );
}

function InvitationsTab({ invitations, loading, onRespond }) {
    if (loading) {
        return <div className="loading-state">載入中...</div>;
    }

    return (
        <div className="invitations-tab">
            <div className="tab-header">
                <h3>群組邀請</h3>
            </div>
            
            {invitations.length === 0 ? (
                <div className="empty-state">
                    <span className="material-icons-round">mail</span>
                    <p>沒有待處理的邀請</p>
                </div>
            ) : (
                <div className="invitations-list">
                    {invitations.map(invitation => (
                        <InvitationCard 
                            key={invitation.id} 
                            invitation={invitation}
                            onRespond={onRespond}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function GroupCard({ group, showRole, showJoinButton }) {
    const handleJoinGroup = async () => {
        try {
            // 這裡可以實現加入群組的邏輯
            console.log('Joining group:', group.id);
        } catch (error) {
            console.error('Error joining group:', error);
        }
    };

    return (
        <div className="group-card">
            <div className="group-avatar">
                {group.avatar_url ? (
                    <img src={group.avatar_url} alt={group.name} />
                ) : (
                    <span className="material-icons-round">groups</span>
                )}
            </div>
            
            <div className="group-info">
                <h4 className="group-name">{group.name}</h4>
                <p className="group-description">{group.description}</p>
                <div className="group-meta">
                    <span className="member-count">
                        <span className="material-icons-round">person</span>
                        {group.member_count?.[0]?.count || 0} 成員
                    </span>
                    {group.is_private && (
                        <span className="private-badge">
                            <span className="material-icons-round">lock</span>
                            私有
                        </span>
                    )}
                </div>
            </div>
            
            <div className="group-actions">
                {showRole && (
                    <span className="role-badge">
                        {group.group_members[0]?.role === 'owner' ? '擁有者' : 
                         group.group_members[0]?.role === 'admin' ? '管理員' : '成員'}
                    </span>
                )}
                {showJoinButton && (
                    <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleJoinGroup}
                    >
                        加入
                    </button>
                )}
                <button className="btn btn-ghost btn-icon">
                    <span className="material-icons-round">more_vert</span>
                </button>
            </div>
        </div>
    );
}

function InvitationCard({ invitation, onRespond }) {
    return (
        <div className="invitation-card">
            <div className="invitation-info">
                <h4>{invitation.group.name}</h4>
                <p>{invitation.group.description}</p>
                <small>
                    由 {invitation.invited_by_user.display_name || invitation.invited_by_user.email} 邀請
                </small>
            </div>
            
            <div className="invitation-actions">
                <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => onRespond(invitation.id, 'accepted')}
                >
                    接受
                </button>
                <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => onRespond(invitation.id, 'rejected')}
                >
                    拒絕
                </button>
            </div>
        </div>
    );
}

function CreateGroupModal({ onClose, onCreate }) {
    const [formData, setFormData] = React.useState({
        name: '',
        description: '',
        isPrivate: false,
        maxMembers: 100
    });
    const [loading, setLoading] = React.useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setLoading(true);
        try {
            await onCreate(formData);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>創建新群組</h3>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label htmlFor="groupName">群組名稱 *</label>
                        <input
                            type="text"
                            id="groupName"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="form-input"
                            placeholder="輸入群組名稱"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="groupDescription">群組描述</label>
                        <textarea
                            id="groupDescription"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="form-textarea"
                            placeholder="描述這個群組的用途..."
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="maxMembers">最大成員數</label>
                        <input
                            type="number"
                            id="maxMembers"
                            value={formData.maxMembers}
                            onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                            className="form-input"
                            min="2"
                            max="1000"
                        />
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                            />
                            <span className="checkbox-text">私有群組（僅邀請制）</span>
                        </label>
                    </div>

                    <div className="modal-actions">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            取消
                        </button>
                        <button 
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="btn btn-primary"
                        >
                            {loading ? '創建中...' : '創建群組'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}