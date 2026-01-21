const { query, queryOne } = require('../../config/database');

// Создать или получить активный диалог пользователя
exports.getOrCreateMyConversation = async (req, res) => {
  try {
    let convo = await queryOne(
      "SELECT * FROM chat_conversations WHERE user_id = ? AND status = 'open'",
      [req.user.id]
    );

    if (!convo) {
      const r = await query(
        "INSERT INTO chat_conversations (user_id, status, last_message_at) VALUES (?, 'open', NULL)",
        [req.user.id]
      );
      convo = await queryOne("SELECT * FROM chat_conversations WHERE id = ?", [r.insertId]);
    }

    res.json(convo);
  } catch (error) {
    console.error('Ошибка создания диалога:', error);
    res.status(500).json({ error: 'Ошибка создания диалога' });
  }
};

// Получить мои сообщения
exports.getMyMessages = async (req, res) => {
  try {
    const convo = await queryOne(
      "SELECT * FROM chat_conversations WHERE user_id = ? AND status = 'open'",
      [req.user.id]
    );
    if (!convo) return res.json([]);

    const messages = await query(
      "SELECT id, sender_role, body, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
      [convo.id]
    );

    await query(
      "UPDATE chat_messages SET read_by_user = 1 WHERE conversation_id = ? AND sender_role IN ('support','admin')",
      [convo.id]
    );

    res.json(messages);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
};

// Отправить сообщение от пользователя
exports.sendMyMessage = async (req, res) => {
  const { body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'Текст сообщения обязателен' });
  }

  try {
    let convo = await queryOne(
      "SELECT * FROM chat_conversations WHERE user_id = ? AND status = 'open'",
      [req.user.id]
    );
    if (!convo) {
      const r = await query(
        "INSERT INTO chat_conversations (user_id, status, last_message_at) VALUES (?, 'open', NULL)",
        [req.user.id]
      );
      convo = await queryOne("SELECT * FROM chat_conversations WHERE id = ?", [r.insertId]);
    }

    const rMsg = await query(
      "INSERT INTO chat_messages (conversation_id, sender_user_id, sender_role, body, read_by_user, read_by_support) VALUES (?, ?, 'user', ?, 1, 0)",
      [convo.id, req.user.id, String(body).trim()]
    );

    await query(
      "UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
      [convo.id]
    );

    const msg = await queryOne(
      "SELECT id, sender_role, body, created_at FROM chat_messages WHERE id = ?",
      [rMsg.insertId]
    );
    res.json(msg);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
};

// Список диалогов для поддержки/админа
exports.getAllConversations = async (_req, res) => {
  try {
    const convos = await query(
      `SELECT c.id, c.user_id, c.status, c.last_message_at, c.created_at,
              u.name as user_name, u.email as user_email
       FROM chat_conversations c
       JOIN users u ON u.id = c.user_id
       ORDER BY (c.last_message_at IS NULL), c.last_message_at DESC, c.created_at DESC`
    );
    res.json(convos);
  } catch (error) {
    console.error('Ошибка получения диалогов:', error);
    res.status(500).json({ error: 'Ошибка получения диалогов' });
  }
};

// Получить сообщения диалога (support/admin)
exports.getConversationMessages = async (req, res) => {
  try {
    const convo = await queryOne("SELECT * FROM chat_conversations WHERE id = ?", [req.params.id]);
    if (!convo) return res.status(404).json({ error: 'Диалог не найден' });

    const messages = await query(
      "SELECT id, sender_role, body, created_at FROM chat_messages WHERE conversation_id = ? ORDER BY created_at ASC, id ASC",
      [convo.id]
    );

    await query(
      "UPDATE chat_messages SET read_by_support = 1 WHERE conversation_id = ? AND sender_role = 'user'",
      [convo.id]
    );

    res.json(messages);
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
};

// Отправить сообщение в диалог (support/admin)
exports.sendMessageToConversation = async (req, res) => {
  const { body } = req.body;
  if (!body || !String(body).trim()) {
    return res.status(400).json({ error: 'Текст сообщения обязателен' });
  }

  try {
    const convo = await queryOne("SELECT * FROM chat_conversations WHERE id = ?", [req.params.id]);
    if (!convo) return res.status(404).json({ error: 'Диалог не найден' });

    const senderRole = req.user.role === 'admin' ? 'admin' : 'support';
    const rMsg = await query(
      "INSERT INTO chat_messages (conversation_id, sender_user_id, sender_role, body, read_by_user, read_by_support) VALUES (?, ?, ?, ?, 0, 1)",
      [convo.id, req.user.id, senderRole, String(body).trim()]
    );

    await query(
      "UPDATE chat_conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?",
      [convo.id]
    );

    const msg = await queryOne(
      "SELECT id, sender_role, body, created_at FROM chat_messages WHERE id = ?",
      [rMsg.insertId]
    );
    res.json(msg);
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
};
