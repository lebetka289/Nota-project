import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './SupportChat.css';
import Alert from './Alert';

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
  const [messages, setMessages] = useState([]);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const pollRef = useRef(null);
  const lastUserIdRef = useRef(null);

  // Приветственное сообщение только для неавторизованных
  const welcomeMessage = [
    {
      id: 'm0',
      from: 'support',
      text: 'Привет! Я поддержка Nota Studio. Чем помочь: запись, оплата, биты?',
      time: nowTime()
    }
  ];

  // Очистка при смене пользователя
  useEffect(() => {
    if (user?.id !== lastUserIdRef.current) {
      // Пользователь сменился - очищаем сообщения
      if (lastUserIdRef.current !== null) {
        setMessages([]);
        setUnread(0);
      }
      lastUserIdRef.current = user?.id || null;
      setIsLoading(true);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!open) return;
    // Сбрасываем счетчик непрочитанных при открытии чата
    setUnread(0);
    // Скролл вниз при открытии
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 100);
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
    if (!token || !user) {
      // Если не авторизован, показываем только приветственное сообщение
      setMessages(welcomeMessage);
      setIsLoading(false);
      return;
    }

    try {
      const r = await fetch(`${API_URL}/chat/conversations/me/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!r.ok) {
        setIsLoading(false);
        return;
      }
      const data = await r.json();
      const normalized = normalizeFromServer(data);
      
      // Показываем сообщения только если они есть
      if (normalized.length > 0) {
        setMessages(normalized);
      } else {
        // Для авторизованных пользователей без сообщений показываем приветствие
        setMessages([
          {
            id: 'm0',
            from: 'support',
            text: 'Привет! Я поддержка Nota Studio. Напишите ваш вопрос, и я помогу вам.',
            time: nowTime()
          }
        ]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setIsLoading(false);
    }
  };

  // Загрузка сообщений при открытии чата или изменении пользователя
  useEffect(() => {
    if (!open) {
      // Останавливаем опрос при закрытии чата
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    // Если пользователь авторизован, создаем/получаем диалог и загружаем сообщения
    if (syncEnabled && token && user) {
      (async () => {
        try {
          // Создаем или получаем диалог пользователя
          const convoResponse = await fetch(`${API_URL}/chat/conversations/me`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (convoResponse.ok) {
            const convoData = await convoResponse.json();
            // Обновляем счетчик непрочитанных, если чат закрыт
            if (!open && convoData.unread_count > 0) {
              setUnread(convoData.unread_count);
            }
          }
          
          // Загружаем сообщения
          await fetchMessages();
        } catch (error) {
          console.error('Ошибка инициализации чата:', error);
          setIsLoading(false);
        }
      })();

      // Опрос новых сообщений каждые 2.5 секунды только для авторизованных
      pollRef.current = setInterval(async () => {
        // Проверяем непрочитанные, если чат закрыт
        if (!open) {
          try {
            const convoResponse = await fetch(`${API_URL}/chat/conversations/me`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            if (convoResponse.ok) {
              const convoData = await convoResponse.json();
              if (convoData.unread_count > 0) {
                setUnread(convoData.unread_count);
              }
            }
          } catch {
            // ignore
          }
        }
        await fetchMessages();
      }, 2500);
    } else {
      // Для неавторизованных показываем только приветственное сообщение
      setMessages(welcomeMessage);
      setIsLoading(false);
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, syncEnabled, user?.id, token]);

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

    // Оптимистичное обновление UI
    const tempMessage = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: value,
      time: nowTime()
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText('');

    if (syncEnabled && token) {
      try {
        const response = await fetch(`${API_URL}/chat/conversations/me/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ body: value })
        });
        
        if (response.ok) {
          // Перезагружаем сообщения с сервера для синхронизации
          await fetchMessages();
        } else {
          // Если ошибка, удаляем временное сообщение
          setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
          setAlert({ message: 'Не удалось отправить сообщение. Попробуйте еще раз.', type: 'error' });
        }
      } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        // Удаляем временное сообщение при ошибке
        setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));
        setAlert({ message: 'Не удалось отправить сообщение. Проверьте подключение к интернету.', type: 'error' });
      }
    }
  };

  return (
    <div className="support-chat">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <button
        className={`chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Закрыть чат' : 'Открыть чат поддержки'}
      >
        <span className="fab-icon">{open ? '×' : 'Чат'}</span>
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
              ×
            </button>
          </div>

          <div className="chat-body" ref={listRef}>
            {isLoading ? (
              <div className="chat-loading">Загрузка сообщений...</div>
            ) : messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">Чат</div>
                <div className="chat-empty-text">Начните диалог с поддержкой</div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`msg-row ${m.from === 'user' ? 'me' : 'them'}`}>
                  <div className="msg-bubble">
                    <div className="msg-text">{m.text}</div>
                    <div className="msg-meta">{m.time}</div>
                  </div>
                </div>
              ))
            )}
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
