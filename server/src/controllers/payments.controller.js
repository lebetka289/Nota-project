const { query, queryOne } = require('../../config/database');
const { createRedirectPayment } = require('../../payments/yookassa');

const recordingPriceRub = (recordingType) => {
  switch (recordingType) {
    case 'buy-music':
      return 3000;
    case 'home-recording':
      return 3500;
    case 'video-clip':
      return 15000;
    case 'with-music':
      return 7000;
    case 'own-music':
    default:
      return 5000;
  }
};

// Получить скидку пользователя на основе количества оплаченных записей
const getUserDiscount = async (userId) => {
  const paidCount = await queryOne(
    "SELECT COUNT(*) as count FROM user_recordings WHERE user_id = ? AND status IN ('paid', 'in-progress', 'completed')",
    [userId]
  );
  const count = paidCount?.count || 0;
  // Скидка 50% при 3+ оплаченных записях
  return count >= 3 ? 50 : 0;
};

// Получить информацию о скидке пользователя
exports.getUserDiscountInfo = async (req, res) => {
  try {
    const paidCount = await queryOne(
      "SELECT COUNT(*) as count FROM user_recordings WHERE user_id = ? AND status IN ('paid', 'in-progress', 'completed')",
      [req.user.id]
    );
    const count = paidCount?.count || 0;
    const discountPercent = count >= 3 ? 50 : 0;
    const recordsNeeded = Math.max(0, 3 - count);
    
    res.json({
      discount_percent: discountPercent,
      paid_recordings_count: count,
      records_needed_for_discount: recordsNeeded,
      has_discount: discountPercent > 0
    });
  } catch (error) {
    console.error('Ошибка получения информации о скидке:', error);
    res.status(500).json({ error: 'Ошибка получения информации о скидке' });
  }
};

// Создать платеж для записи
exports.createRecordingPayment = async (req, res) => {
  const { recording_id, recording_type, music_style, purchased_beat_id } = req.body;

  try {
    let recording = null;

    if (recording_id) {
      recording = await queryOne(
        "SELECT * FROM user_recordings WHERE id = ? AND user_id = ?",
        [recording_id, req.user.id]
      );
    }

    if (!recording) {
      if (!recording_type || !music_style) {
        return res.status(400).json({ error: 'recording_type и music_style обязательны' });
      }

      // Проверяем, что purchased_beat_id принадлежит пользователю
      if (purchased_beat_id) {
        const purchase = await queryOne(
          "SELECT beat_id FROM beat_purchases WHERE user_id = ? AND beat_id = ? AND status = 'paid'",
          [req.user.id, purchased_beat_id]
        );
        if (!purchase) {
          return res.status(400).json({ error: 'Выбранный бит не куплен или не найден' });
        }
      }

      // Получаем скидку пользователя
      const discountPercent = await getUserDiscount(req.user.id);
      const basePrice = recordingPriceRub(recording_type);
      const discountAmount = (basePrice * discountPercent) / 100;
      const finalPrice = basePrice - discountAmount;

      const r = await query(
        "INSERT INTO user_recordings (user_id, recording_type, music_style, price, status, purchased_beat_id, discount_percent) VALUES (?, ?, ?, ?, 'pending', ?, ?)",
        [req.user.id, recording_type, music_style, finalPrice, purchased_beat_id || null, discountPercent]
      );
      recording = await queryOne(
        "SELECT * FROM user_recordings WHERE id = ? AND user_id = ?",
        [r.insertId, req.user.id]
      );
    }

    const amountRub = Number(recording.price || recordingPriceRub(recording.recording_type));
    const returnUrl = process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/';

    if (process.env.PAYMENT_SKIP_CONFIRMATION === 'true') {
      const mockPaymentId = `mock_${Date.now()}`;
      await query(
        "UPDATE user_recordings SET payment_provider = ?, payment_id = ?, payment_status = ?, status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
        ['mock', mockPaymentId, 'succeeded', recording.id, req.user.id]
      );
      return res.json({
        confirmation_url: null,
        payment_id: mockPaymentId,
        recording_id: recording.id,
        mock: true
      });
    }

    const payment = await createRedirectPayment({
      amountRub,
      description: `Nota Studio: ${recording.recording_type} / ${recording.music_style}`,
      returnUrl,
      metadata: {
        recording_id: String(recording.id),
        user_id: String(req.user.id)
      }
    });

    await query(
      "UPDATE user_recordings SET payment_provider = ?, payment_id = ?, payment_status = ?, status = ? WHERE id = ? AND user_id = ?",
      ['yookassa', payment.id, payment.status, 'pending', recording.id, req.user.id]
    );

    res.json({
      confirmation_url: payment.confirmation?.confirmation_url,
      payment_id: payment.id,
      recording_id: recording.id
    });
  } catch (error) {
    console.error('Ошибка создания платежа YooKassa:', error);
    res.status(500).json({ error: error.message || 'Ошибка создания платежа' });
  }
};

// Оплата корзины битов
exports.createCartPayment = async (req, res) => {
  try {
    const items = await query(
      `SELECT bc.beat_id, b.title, b.price
       FROM beat_cart bc
       JOIN beats b ON bc.beat_id = b.id
       WHERE bc.user_id = ?`,
      [req.user.id]
    );
    if (!items.length) return res.status(400).json({ error: 'Корзина пуста' });

    const already = await query(
      "SELECT beat_id FROM beat_purchases WHERE user_id = ? AND status = 'paid'",
      [req.user.id]
    );
    const alreadySet = new Set(already.map((x) => x.beat_id));
    const toPay = items.filter((x) => !alreadySet.has(x.beat_id));
    if (!toPay.length) return res.status(400).json({ error: 'Все биты из корзины уже куплены' });

    const total = toPay.reduce((sum, x) => sum + Number(x.price || 0), 0);
    if (total <= 0) {
      for (const it of toPay) {
        await query(
          "INSERT IGNORE INTO beat_purchases (user_id, beat_id, payment_provider, payment_id, payment_status, status, paid_at) VALUES (?, ?, 'free', NULL, 'succeeded', 'paid', CURRENT_TIMESTAMP)",
          [req.user.id, it.beat_id]
        );
      }
      await query("DELETE FROM beat_cart WHERE user_id = ?", [req.user.id]);
      return res.json({ ok: true, free: true });
    }

    const returnUrl = process.env.PAYMENT_RETURN_URL || 'http://localhost:5173/';

    if (process.env.PAYMENT_SKIP_CONFIRMATION === 'true') {
      for (const it of toPay) {
        await query(
          "INSERT INTO beat_purchases (user_id, beat_id, payment_provider, payment_id, payment_status, status, paid_at) VALUES (?, ?, 'mock', ?, 'succeeded', 'paid', CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE payment_provider='mock', payment_id=VALUES(payment_id), payment_status='succeeded', status='paid', paid_at=CURRENT_TIMESTAMP",
          [req.user.id, it.beat_id, `mock_${Date.now()}_${it.beat_id}`]
        );
      }
      await query("DELETE FROM beat_cart WHERE user_id = ?", [req.user.id]);
      return res.json({ ok: true, mock: true });
    }

    const payment = await createRedirectPayment({
      amountRub: total,
      description: `Nota Studio: покупка битов (${toPay.length})`,
      returnUrl,
      metadata: {
        type: 'beat_cart',
        user_id: String(req.user.id)
      }
    });

    for (const it of toPay) {
      await query(
        `INSERT INTO beat_purchases (user_id, beat_id, payment_provider, payment_id, payment_status, status)
         VALUES (?, ?, 'yookassa', ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE payment_provider='yookassa', payment_id=VALUES(payment_id), payment_status=VALUES(payment_status), status='pending'`,
        [req.user.id, it.beat_id, payment.id, payment.status]
      );
    }

    res.json({
      confirmation_url: payment.confirmation?.confirmation_url,
      payment_id: payment.id,
      total_rub: total
    });
  } catch (e) {
    console.error('Ошибка оплаты корзины:', e);
    res.status(500).json({ error: e.message || 'Ошибка оплаты корзины' });
  }
};

// Webhook YooKassa
exports.yookassaWebhook = async (req, res) => {
  try {
    const event = req.body;
    const payment = event?.object;
    if (!payment?.id) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const paymentId = payment.id;
    const status = payment.status;

    await query(
      "UPDATE user_recordings SET payment_status = ?, status = CASE WHEN ? = 'succeeded' THEN 'paid' ELSE status END, paid_at = CASE WHEN ? = 'succeeded' THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE payment_id = ?",
      [status, status, status, paymentId]
    );

    await query(
      "UPDATE beat_purchases SET payment_status = ?, status = CASE WHEN ? = 'succeeded' THEN 'paid' ELSE status END, paid_at = CASE WHEN ? = 'succeeded' THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE payment_id = ?",
      [status, status, status, paymentId]
    );

    if (status === 'succeeded') {
      const metaUserId = payment?.metadata?.user_id ? Number(payment.metadata.user_id) : null;
      const metaType = payment?.metadata?.type;
      if (metaUserId && metaType === 'beat_cart') {
        await query("DELETE FROM beat_cart WHERE user_id = ?", [metaUserId]);
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Ошибка webhook YooKassa:', error);
    res.status(500).json({ error: 'Webhook error' });
  }
};
