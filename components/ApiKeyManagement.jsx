import React from 'react';
import { apiKeysAPI } from '../lib/apiKeysAPI.js';

export default function ApiKeyManagement({ user, onClose }) {
    const [apiKeys, setApiKeys] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [testing, setTesting] = React.useState({});
    const [message, setMessage] = React.useState('');
    const [showKeys, setShowKeys] = React.useState({});

    const providers = [
        {
            id: 'openai',
            name: 'OpenAI',
            description: 'GPT-3.5, GPT-4 等模型',
            placeholder: 'sk-...',
            website: 'https://platform.openai.com/api-keys'
        },
        {
            id: 'google_ai',
            name: 'Google AI Studio',
            description: 'Gemini Pro 等模型',
            placeholder: 'AI...',
            website: 'https://makersuite.google.com/app/apikey'
        },
        {
            id: 'openrouter',
            name: 'OpenRouter',
            description: '多種開源模型',
            placeholder: 'sk-or-...',
            website: 'https://openrouter.ai/keys'
        },
        {
            id: 'anthropic',
            name: 'Anthropic',
            description: 'Claude 系列模型',
            placeholder: 'sk-ant-...',
            website: 'https://console.anthropic.com/account/keys'
        }
    ];

    React.useEffect(() => {
        if (user) {
            loadApiKeys();
        }
    }, [user]);

    const loadApiKeys = async () => {
        try {
            const { data, error } = await apiKeysAPI.getUserApiKeys();
            if (error) throw error;
            
            const keysMap = {};
            data?.forEach(item => {
                keysMap[item.provider] = item.api_key;
            });
            setApiKeys(keysMap);
        } catch (error) {
            console.error('載入API密鑰失敗:', error);
            setMessage('載入API密鑰失敗');
        }
    };

    const handleSaveKey = async (provider, apiKey) => {
        if (!apiKey.trim()) {
            await handleDeleteKey(provider);
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const { error } = await apiKeysAPI.saveApiKey(provider, apiKey);
            if (error) throw error;

            setApiKeys(prev => ({ ...prev, [provider]: apiKey }));
            setMessage('API密鑰保存成功！');
        } catch (error) {
            console.error('保存API密鑰失敗:', error);
            setMessage('保存失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteKey = async (provider) => {
        setLoading(true);
        try {
            const { error } = await apiKeysAPI.deleteApiKey(provider);
            if (error) throw error;

            setApiKeys(prev => {
                const newKeys = { ...prev };
                delete newKeys[provider];
                return newKeys;
            });
            setMessage('API密鑰已刪除');
        } catch (error) {
            console.error('刪除API密鑰失敗:', error);
            setMessage('刪除失敗，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    const handleTestKey = async (provider, apiKey) => {
        if (!apiKey.trim()) {
            setMessage('請先輸入API密鑰');
            return;
        }

        setTesting(prev => ({ ...prev, [provider]: true }));
        setMessage('');

        try {
            const result = await apiKeysAPI.testApiKey(provider, apiKey);
            if (result.valid) {
                setMessage(`${providers.find(p => p.id === provider)?.name} API密鑰測試成功！`);
            } else {
                setMessage(`測試失敗: ${result.error}`);
            }
        } catch (error) {
            console.error('測試API密鑰失敗:', error);
            setMessage('測試失敗，請檢查網路連接');
        } finally {
            setTesting(prev => ({ ...prev, [provider]: false }));
        }
    };

    const toggleShowKey = (provider) => {
        setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal api-key-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>API密鑰管理</h3>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <div className="modal-content">
                    {message && (
                        <div className={`message ${message.includes('成功') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    <div className="api-key-info">
                        <h4>關於API密鑰</h4>
                        <p>設定您自己的API密鑰以使用不同的AI服務。您的密鑰將安全地加密存儲，只有您可以訪問。</p>
                    </div>

                    <div className="api-keys-list">
                        {providers.map(provider => (
                            <ApiKeyItem
                                key={provider.id}
                                provider={provider}
                                apiKey={apiKeys[provider.id] || ''}
                                showKey={showKeys[provider.id]}
                                testing={testing[provider.id]}
                                loading={loading}
                                onSave={handleSaveKey}
                                onTest={handleTestKey}
                                onDelete={handleDeleteKey}
                                onToggleShow={toggleShowKey}
                            />
                        ))}
                    </div>

                    <div className="api-key-security">
                        <h4>安全提示</h4>
                        <ul>
                            <li>您的API密鑰將加密存儲在資料庫中</li>
                            <li>請勿與他人分享您的API密鑰</li>
                            <li>定期檢查API使用情況和費用</li>
                            <li>如果懷疑密鑰洩露，請立即重新生成</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ApiKeyItem({ 
    provider, 
    apiKey, 
    showKey, 
    testing, 
    loading, 
    onSave, 
    onTest, 
    onDelete, 
    onToggleShow 
}) {
    const [inputValue, setInputValue] = React.useState(apiKey);
    const [hasChanges, setHasChanges] = React.useState(false);

    React.useEffect(() => {
        setInputValue(apiKey);
        setHasChanges(false);
    }, [apiKey]);

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
        setHasChanges(e.target.value !== apiKey);
    };

    const handleSave = () => {
        onSave(provider.id, inputValue);
        setHasChanges(false);
    };

    const handleTest = () => {
        onTest(provider.id, inputValue);
    };

    const handleDelete = () => {
        if (window.confirm(`確定要刪除 ${provider.name} 的API密鑰嗎？`)) {
            onDelete(provider.id);
            setInputValue('');
            setHasChanges(false);
        }
    };

    return (
        <div className="api-key-item">
            <div className="api-key-header">
                <div className="provider-info">
                    <h4>{provider.name}</h4>
                    <p>{provider.description}</p>
                    <a 
                        href={provider.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="provider-link"
                    >
                        獲取API密鑰 <span className="material-icons-round">open_in_new</span>
                    </a>
                </div>
                <div className="api-key-status">
                    {apiKey ? (
                        <span className="status-badge active">已設定</span>
                    ) : (
                        <span className="status-badge inactive">未設定</span>
                    )}
                </div>
            </div>

            <div className="api-key-input-group">
                <div className="input-wrapper">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={provider.placeholder}
                        className="form-input api-key-input"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={() => onToggleShow(provider.id)}
                        className="btn btn-ghost btn-icon show-key-btn"
                        title={showKey ? '隱藏密鑰' : '顯示密鑰'}
                    >
                        <span className="material-icons-round">
                            {showKey ? 'visibility_off' : 'visibility'}
                        </span>
                    </button>
                </div>

                <div className="api-key-actions">
                    <button
                        onClick={handleTest}
                        disabled={!inputValue.trim() || testing || loading}
                        className="btn btn-secondary btn-sm"
                    >
                        {testing ? (
                            <>
                                <span className="material-icons-round">hourglass_empty</span>
                                測試中...
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round">check_circle</span>
                                測試
                            </>
                        )}
                    </button>

                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="btn btn-primary btn-sm"
                        >
                            <span className="material-icons-round">save</span>
                            保存
                        </button>
                    )}

                    {apiKey && (
                        <button
                            onClick={handleDelete}
                            disabled={loading}
                            className="btn btn-ghost btn-sm delete-btn"
                        >
                            <span className="material-icons-round">delete</span>
                            刪除
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}