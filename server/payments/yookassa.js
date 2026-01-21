const YooKassa = require('yookassa');

function getYooKassaClient() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  if (!shopId || !secretKey) {
    throw new Error('YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY не заданы в .env');
  }

  return new YooKassa({ shopId, secretKey });
}

async function createRedirectPayment({ amountRub, description, returnUrl, metadata }) {
  const client = getYooKassaClient();

  // Idempotence-Key чтобы повторный запрос не создавал дубль платежа
  const idempotenceKey =
    (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;

  const payment = await client.createPayment(
    {
      amount: { value: Number(amountRub).toFixed(2), currency: 'RUB' },
      confirmation: { type: 'redirect', return_url: returnUrl },
      capture: true,
      description,
      metadata: metadata || {},
      payment_method_data: { type: 'bank_card' }
    },
    idempotenceKey
  );

  return payment;
}

module.exports = {
  createRedirectPayment
};

