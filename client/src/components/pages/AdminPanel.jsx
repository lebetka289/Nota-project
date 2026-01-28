import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import './AdminPanel.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ROLE_NAMES = { user: 'Покупатель', admin: 'Админ', support: 'Поддержка', beatmaker: 'Битмейкер' };

function AdminPanel() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [modal, setModal] = useState(null); // 'chat' | 'beats' | 'recordings' | 'password' | 'block' | 'role'
  const [selectedUser, setSelectedUser] = useState(null);

  const [chatConvos, setChatConvos] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatConvoId, setChatConvoId] = useState(null);
  const [chatReply, setChatReply] = useState('');
  const [beatsPurchases, setBeatsPurchases] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [newPassword, setNewPassword] = useState('');
  const [roleSelect, setRoleSelect] = useState('');
  const chatBodyRef = useRef(null);

  const fetchUsers = async () => {
    try {
      const r = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) throw new Error('Ошибка загрузки пользователей');
      const data = await r.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка подключения к серверу', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const openModal = (kind, user) => {
    setSelectedUser(user);
    setModal(kind);
    if (kind === 'role') setRoleSelect(user?.role || 'user');
    if (kind === 'password') setNewPassword('');
    if (kind === 'chat') setChatReply('');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
    setChatConvos([]);
    setChatMessages([]);
    setChatConvoId(null);
    setBeatsPurchases([]);
    setRecordings([]);
  };

  useEffect(() => {
    if (!modal || !selectedUser) return;
    if (modal === 'chat') {
      (async () => {
        try {
          const r = await fetch(`${API_URL}/chat/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (!r.ok) return;
          const list = await r.json();
          setChatConvos(Array.isArray(list) ? list : []);
          const conv = (list || []).find((c) => Number(c.user_id) === Number(selectedUser.id));
          if (conv) {
            setChatConvoId(conv.id);
            const mr = await fetch(`${API_URL}/chat/conversations/${conv.id}/messages`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (mr.ok) {
              const msgs = await mr.json();
              setChatMessages(Array.isArray(msgs) ? msgs : []);
            }
          } else {
            setChatConvoId(null);
            setChatMessages([]);
          }
        } catch (e) {
          setAlert({ message: 'Ошибка загрузки чата', type: 'error' });
        }
      })();
    }
    if (modal === 'beats') {
      fetch(`${API_URL}/users/${selectedUser.id}/purchases`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => setBeatsPurchases(Array.isArray(d) ? d : []))
        .catch(() => setBeatsPurchases([]));
    }
    if (modal === 'recordings') {
      fetch(`${API_URL}/users/${selectedUser.id}/recordings`)
        .then((r) => r.ok ? r.json() : [])
        .then((d) => setRecordings(Array.isArray(d) ? d : []))
        .catch(() => setRecordings([]));
    }
  }, [modal, selectedUser?.id, token]);

  useEffect(() => {
    if (chatBodyRef.current) chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
  }, [chatMessages]);

  const sendChatReply = async () => {
    const text = chatReply.trim();
    if (!text || !chatConvoId || !token) return;
    try {
      const r = await fetch(`${API_URL}/chat/conversations/${chatConvoId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ body: text })
      });
      if (!r.ok) throw new Error('Ошибка отправки');
      setChatReply('');
      const mr = await fetch(`${API_URL}/chat/conversations/${chatConvoId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mr.ok) {
        const msgs = await mr.json();
        setChatMessages(Array.isArray(msgs) ? msgs : []);
      }
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка отправки сообщения', type: 'error' });
    }
  };

  const savePassword = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      setAlert({ message: 'Пароль не менее 6 символов', type: 'warning' });
      return;
    }
    try {
      const r = await fetch(`${API_URL}/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Ошибка смены пароля');
      setAlert({ message: 'Пароль обновлен', type: 'success' });
      closeModal();
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка смены пароля', type: 'error' });
    }
  };

  const toggleBlock = async () => {
    if (!selectedUser) return;
    const next = !selectedUser.blocked;
    try {
      const r = await fetch(`${API_URL}/admin/users/${selectedUser.id}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ blocked: next })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Ошибка блокировки');
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, blocked: next } : u)));
      setAlert({ message: next ? 'Пользователь заблокирован' : 'Пользователь разблокирован', type: 'success' });
      closeModal();
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка', type: 'error' });
    }
  };

  const saveRole = async () => {
    if (!selectedUser || !roleSelect) return;
    try {
      const r = await fetch(`${API_URL}/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: roleSelect })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Ошибка смены роли');
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, role: roleSelect } : u)));
      setAlert({ message: 'Роль обновлена', type: 'success' });
      closeModal();
    } catch (e) {
      setAlert({ message: e.message || 'Ошибка смены роли', type: 'error' });
    }
  };

  if (loading) {
    return <div className="admin-panel loading">Загрузка...</div>;
  }

  return (
    <div className="admin-panel">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="admin-header">
        <h2>Пользователи</h2>
      </div>

      <div className="admin-users-wrap">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.name || '—'}</td>
                <td><span className="admin-role-badge">{ROLE_NAMES[u.role] || u.role}</span></td>
                <td>
                  {u.blocked ? (
                    <span className="admin-status blocked">Заблокирован</span>
                  ) : (
                    <span className="admin-status ok">Активен</span>
                  )}
                </td>
                <td>{new Date(u.created_at).toLocaleDateString('ru-RU')}</td>
                <td>
                  <div className="admin-user-actions">
                    <button type="button" className="admin-btn small" onClick={() => openModal('chat', u)} title="Чат">Чат</button>
                    <button type="button" className="admin-btn small" onClick={() => openModal('beats', u)} title="Покупки битов">Биты</button>
                    <button type="button" className="admin-btn small" onClick={() => openModal('recordings', u)} title="Покупки записей">Записи</button>
                    <button type="button" className="admin-btn small" onClick={() => openModal('password', u)}>Пароль</button>
                    <button type="button" className={`admin-btn small ${u.blocked ? 'secondary' : 'warn'}`} onClick={() => openModal('block', u)}>
                      {u.blocked ? 'Разблок' : 'Блок'}
                    </button>
                    <button type="button" className="admin-btn small" onClick={() => openModal('role', u)}>Роль</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <div className="admin-empty">Пользователей пока нет</div>}
      </div>

      {modal && selectedUser && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h3>
                {modal === 'chat' && 'История чата'}
                {modal === 'beats' && 'Покупки битов'}
                {modal === 'recordings' && 'Покупки записей'}
                {modal === 'password' && 'Сменить пароль'}
                {modal === 'block' && (selectedUser.blocked ? 'Разблокировать' : 'Заблокировать')}
                {modal === 'role' && 'Назначить роль'}
              </h3>
              <span className="admin-modal-user">{selectedUser.name || selectedUser.email} ({selectedUser.email})</span>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Закрыть">×</button>
            </div>

            {modal === 'chat' && (
              <div className="admin-modal-chat">
                <div className="admin-chat-list" ref={chatBodyRef}>
                  {chatMessages.length === 0 && !chatConvoId && <div className="admin-chat-empty">Нет диалога с этим пользователем</div>}
                  {chatMessages.length === 0 && chatConvoId && <div className="admin-chat-empty">Нет сообщений</div>}
                  {chatMessages.map((m) => (
                    <div key={m.id} className={`admin-chat-msg ${m.sender_role === 'user' ? 'user' : 'support'}`}>
                      <span className="admin-chat-role">{m.sender_role === 'user' ? 'USER' : (m.sender_role || 'SUPPORT').toUpperCase()}</span>
                      <span className="admin-chat-body">{m.body}</span>
                      <span className="admin-chat-time">{new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
                {chatConvoId && (
                  <div className="admin-chat-reply">
                    <input
                      type="text"
                      value={chatReply}
                      onChange={(e) => setChatReply(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendChatReply()}
                      placeholder="Ответить..."
                    />
                    <button type="button" className="admin-btn" onClick={sendChatReply} disabled={!chatReply.trim()}>Отправить</button>
                  </div>
                )}
              </div>
            )}

            {modal === 'beats' && (
              <div className="admin-modal-list">
                {beatsPurchases.length === 0 && <div className="admin-list-empty">Нет покупок битов</div>}
                {beatsPurchases.map((p) => (
                  <div key={p.purchase_id || p.id} className="admin-list-item">
                    <span className="admin-list-title">{p.title}</span>
                    <span className="admin-list-meta">{p.genre} • BPM {p.bpm} • {Number(p.price).toLocaleString('ru-RU')} ₽</span>
                    <span className="admin-list-date">{p.paid_at ? new Date(p.paid_at).toLocaleDateString('ru-RU') : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {modal === 'recordings' && (
              <div className="admin-modal-list">
                {recordings.length === 0 && <div className="admin-list-empty">Нет покупок записей</div>}
                {recordings.map((r) => (
                  <div key={r.id} className="admin-list-item">
                    <span className="admin-list-title">{r.recording_type} • {r.music_style}</span>
                    <span className="admin-list-meta">{r.status} {r.price != null ? `• ${Number(r.price).toLocaleString('ru-RU')} ₽` : ''}</span>
                    <span className="admin-list-date">{new Date(r.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            )}

            {modal === 'password' && (
              <div className="admin-modal-form">
                <div className="form-group">
                  <label>Новый пароль (не менее 6 символов)</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" minLength={6} />
                </div>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn" onClick={savePassword} disabled={newPassword.length < 6}>Сохранить</button>
                  <button type="button" className="admin-btn secondary" onClick={closeModal}>Отмена</button>
                </div>
              </div>
            )}

            {modal === 'block' && (
              <div className="admin-modal-form">
                <p>
                  {selectedUser.blocked ? 'Разблокировать пользователя?' : 'Заблокировать пользователя? Он не сможет входить в аккаунт.'}
                </p>
                <div className="admin-modal-actions">
                  <button type="button" className={`admin-btn ${selectedUser.blocked ? '' : 'warn'}`} onClick={toggleBlock}>
                    {selectedUser.blocked ? 'Разблокировать' : 'Заблокировать'}
                  </button>
                  <button type="button" className="admin-btn secondary" onClick={closeModal}>Отмена</button>
                </div>
              </div>
            )}

            {modal === 'role' && (
              <div className="admin-modal-form">
                <div className="form-group">
                  <label>Роль</label>
                  <select value={roleSelect} onChange={(e) => setRoleSelect(e.target.value)}>
                    {['user', 'support', 'beatmaker', 'admin'].map((r) => (
                      <option key={r} value={r}>{ROLE_NAMES[r] || r}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-actions">
                  <button type="button" className="admin-btn" onClick={saveRole}>Сохранить</button>
                  <button type="button" className="admin-btn secondary" onClick={closeModal}>Отмена</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
