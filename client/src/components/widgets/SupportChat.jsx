import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SupportChat.css';

const STORAGE_KEY = 'nota_support_chat_v1';
const API_URL = import.meta.env.VITE_API_URL || '/api';

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function SupportChat() {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const listRef = useRef(null);

  const initialMessages = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'm0',
        from: 'support',
        text: 'Привет! Я поддержка Nota Studio. Чем помочь: запись, оплата, биты?',
        time: nowTime()
      }
    ];
  }, []);

  const [messages, setMessages] = useState(initialMessages);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    // скролл вниз при открытии
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    setSyncEnabled(Boolean(user && token));
  }, [user, token]);

  const normalizeFromServer = (rows) =>
    rows.map((m) => ({
      id: `srv-${m.id}`,
      from: m.sender_role === 'user' ? 'user' : 'support',
      text: m.body,
      time: new Date(m.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    }));

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_URL}/chat/conversations/me/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) return;
      const data = await r.json();
      const normalized = normalizeFromServer(data);
      setMessages(normalized.length ? normalized : initialMessages);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!open || !syncEnabled) return;

    (async () => {
      try {
        await fetch(`${API_URL}/chat/conversations/me`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore
      }
      await fetchMessages();
    })();

    pollRef.current = setInterval(fetchMessages, 2500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, syncEnabled]);

  const pushMessage = (msg) => {
    setMessages((prev) => [...prev, msg]);
    if (!open && msg.from === 'support') setUnread((n) => n + 1);
  };

  const send = async () => {
    const value = text.trim();
    if (!value) return;

    if (!user) {
      pushMessage({
        id: `s-${Date.now()}`,
        from: 'support',
        text: 'Чтобы написать в поддержку — пожалуйста, войдите в аккаунт.',
        time: nowTime()
      });
      setText('');
      return;
    }

    pushMessage({
      id: `u-${Date.now()}`,
      from: 'user',
      text: value,
      time: nowTime()
    });
    setText('');

    if (syncEnabled) {
      try {
        await fetch(`${API_URL}/chat/conversations/me/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ body: value })
        });
        await fetchMessages();
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="support-chat">
      <button
        className={`chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть чат' : 'Открыть чат поддержки'}
      >
        <span className="fab-icon">{open ? '✕' : '💬'}</span>
        {unread > 0 && <span className="fab-badge">{unread}</span>}
      </button>

      {open && (
        <div className="chat-panel" role="dialog" aria-label="Чат поддержки">
          <div className="chat-header">
            <div className="chat-title">
              <div className="chat-avatar">N</div>
              <div>
                <div className="chat-name">Поддержка Nota</div>
                <div className="chat-status">
                  <span className="dot-online" />
                  {syncEnabled ? 'Онлайн • отвечает быстро' : 'Войдите, чтобы написать'}
                </div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Закрыть">
              ✕
            </button>
          </div>

          <div className="chat-body" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`msg-row ${m.from === 'user' ? 'me' : 'them'}`}>
                <div className="msg-bubble">
                  <div className="msg-text">{m.text}</div>
                  <div className="msg-meta">{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-footer">
            <input
              className="chat-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') send();
              }}
              placeholder="Напишите сообщение…"
            />
            <button className="chat-send" onClick={send} disabled={!text.trim()}>
              Отправить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportChat;
