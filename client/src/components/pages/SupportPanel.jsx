import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SupportPanel.css';
import Alert from '../widgets/Alert';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function SupportPanel() {
  const { user, token, isSupport } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId]
  );

  const loadConversations = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const data = await r.json();
      setConversations(data);
      if (!selectedId && data[0]?.id) setSelectedId(data[0].id);
    } finally {
      setLoading(false);
    }
  };

  const chatBodyRef = useRef(null);

  const loadMessages = async (id) => {
    if (!token || !id) return;
    const r = await fetch(`${API_URL}/chat/conversations/${id}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return;
    const data = await r.json();
    setMessages(data);
    
    // Автоскролл вниз после загрузки сообщений
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    if (user && token && isSupport) loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token, isSupport]);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const t = setInterval(() => loadMessages(selectedId), 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const send = async () => {
    const value = text.trim();
    if (!value || !token || !selectedId) return;
    
    // Оптимистичное обновление UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_role: 'support',
      body: value,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText('');
    
    // Автоскролл
    setTimeout(() => {
      if (chatBodyRef.current) {
        chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
      }
    }, 100);

    try {
      const response = await fetch(`${API_URL}/chat/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ body: value })
      });
      
      if (response.ok) {
        await loadMessages(selectedId);
        await loadConversations();
      } else {
        // Удаляем временное сообщение при ошибке
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        setAlert({ message: 'Не удалось отправить сообщение. Попробуйте еще раз.', type: 'error' });
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
      setAlert({ message: 'Не удалось отправить сообщение. Проверьте подключение к интернету.', type: 'error' });
    }
  };

  if (!user) {
    return (
      <div className="support-panel page">
        <div className="sp-card">Войдите, чтобы открыть панель поддержки.</div>
      </div>
    );
  }

  if (!isSupport) {
    return (
      <div className="support-panel page">
        <div className="sp-card">Доступ только для роли support/admin.</div>
      </div>
    );
  }

  return (
    <div className="support-panel page">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="sp-header">
        <h1>Панель поддержки</h1>
        <button className="sp-refresh" onClick={loadConversations}>
          Обновить
        </button>
      </div>

      <div className="sp-layout">
        <aside className="sp-sidebar">
          <div className="sp-sidebar-title">Диалоги</div>
          {loading ? (
            <div className="sp-muted">Загрузка…</div>
          ) : conversations.length === 0 ? (
            <div className="sp-muted">Пока нет обращений.</div>
          ) : (
            <div className="sp-list">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  className={`sp-item ${c.id === selectedId ? 'active' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div className="sp-item-top">
                    <div className="sp-item-name">{c.user_name}</div>
                    <div className="sp-item-right">
                      {c.unread_count > 0 && (
                        <span className="sp-unread-badge">{c.unread_count}</span>
                      )}
                      <div className="sp-item-id">#{c.id}</div>
                    </div>
                  </div>
                  <div className="sp-item-sub">{c.user_email}</div>
                  {c.last_message_at && (
                    <div className="sp-item-time">
                      {new Date(c.last_message_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="sp-chat">
          <div className="sp-chat-head">
            {selected ? (
              <>
                <div className="sp-chat-title">
                  <div className="sp-chip">ПОЛЬЗОВАТЕЛЬ</div>
                  <div>
                    <div className="sp-chat-name">{selected.user_name}</div>
                    <div className="sp-chat-sub">{selected.user_email}</div>
                  </div>
                </div>
                <div className="sp-chat-meta">Диалог #{selected.id}</div>
              </>
            ) : (
              <div className="sp-muted">Выберите диалог слева</div>
            )}
          </div>

          <div className="sp-chat-body" ref={chatBodyRef}>
            {messages.length === 0 ? (
              <div className="sp-empty-chat">
                <div className="sp-empty-icon">Чат</div>
                <div className="sp-empty-text">Начните диалог с пользователем</div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`sp-msg ${m.sender_role === 'user' ? 'user' : 'support'}`}
                >
                  <div className="sp-bubble">
                    <div className="sp-bubble-top">
                      <span className="sp-role">
                        {m.sender_role === 'user' ? 'ПОЛЬЗОВАТЕЛЬ' : (m.sender_role === 'support' ? 'ПОДДЕРЖКА' : m.sender_role)}
                      </span>
                      <span className="sp-time">
                        {new Date(m.created_at).toLocaleTimeString('ru-RU', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="sp-text">{m.body}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="sp-chat-foot">
            <input
              className="sp-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Ответить пользователю…"
            />
            <button className="sp-send" onClick={send} disabled={!text.trim() || !selectedId}>
              Ответить
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SupportPanel;
