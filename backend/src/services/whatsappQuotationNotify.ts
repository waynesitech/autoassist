/**
 * Sends an automatic WhatsApp to the admin when a quotation is created.
 *
 * Priority:
 * 1) Meta WhatsApp Cloud API — WHATSAPP_CLOUD_ACCESS_TOKEN + WHATSAPP_CLOUD_PHONE_NUMBER_ID
 * 2) WHATSAPP_NOTIFY_WEBHOOK_URL — POST JSON { text, phone, ...payload }
 * 3) CallMeBot — CALLMEBOT_API_KEY
 *
 * Meta: Phone Number ID is under WhatsApp → API Setup (not the same as your business phone number).
 * Recipient: WHATSAPP_NOTIFY_PHONE (E.164 digits, no +), default 60122846084
 */

export type QuotationWhatsAppPayload = {
  transactionId: string;
  type: string;
  model: string;
  year: string;
  engine: string;
  chassis: string;
  description: string | null;
  quoteType: string;
  workshopName: string | null;
  amount: number;
};

const DEFAULT_NOTIFY_PHONE = '60122846084';
const MAX_MESSAGE_LEN = 4000;

function buildMessage(p: QuotationWhatsAppPayload): string {
  const lines = [
    '*AutoAssist* — New quotation (Submit & Pay)',
    `Ref: ${p.transactionId}`,
    `${p.year} ${p.model}`,
    `Workshop: ${p.workshopName ?? '—'}`,
    `${p.type} / ${p.quoteType}`,
    `RM ${p.amount}`,
    `Engine: ${p.engine}`,
    `Chassis: ${p.chassis}`,
  ];
  if (p.description?.trim()) {
    lines.push(`Notes: ${p.description.trim().slice(0, 400)}`);
  }
  let text = lines.join('\n');
  if (text.length > MAX_MESSAGE_LEN) {
    text = `${text.slice(0, MAX_MESSAGE_LEN - 24)}\n…(truncated)`;
  }
  return text;
}

async function sendViaMetaWhatsAppCloudApi(toDigits: string, bodyText: string): Promise<void> {
  const token = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();
  const version = process.env.WHATSAPP_CLOUD_API_VERSION?.trim() || 'v21.0';
  if (!token || !phoneNumberId) {
    return;
  }

  const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toDigits,
      type: 'text',
      text: { preview_url: false, body: bodyText },
    }),
  });

  const raw = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(`WhatsApp Cloud API failed: ${res.status} ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  }
}

export async function notifyQuotationSubmitted(payload: QuotationWhatsAppPayload): Promise<void> {
  const text = buildMessage(payload);
  const phone = (process.env.WHATSAPP_NOTIFY_PHONE || DEFAULT_NOTIFY_PHONE).replace(/^\+/, '');

  const cloudToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN?.trim();
  const cloudPhoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim();

  if (cloudToken && cloudPhoneNumberId) {
    await sendViaMetaWhatsAppCloudApi(phone, text);
    return;
  }

  const webhookUrl = process.env.WHATSAPP_NOTIFY_WEBHOOK_URL?.trim();

  if (webhookUrl) {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, phone, ...payload }),
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`WHATSAPP_NOTIFY_WEBHOOK_URL failed: ${res.status} ${errBody}`);
    }
    return;
  }

  const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (!apiKey) {
    console.warn(
      '[whatsapp] Set WHATSAPP_CLOUD_ACCESS_TOKEN + WHATSAPP_CLOUD_PHONE_NUMBER_ID (Meta), or CALLMEBOT_API_KEY, or WHATSAPP_NOTIFY_WEBHOOK_URL.'
    );
    return;
  }

  const url = new URL('https://api.callmebot.com/whatsapp.php');
  url.searchParams.set('phone', phone);
  url.searchParams.set('apikey', apiKey);
  url.searchParams.set('text', text);

  const res = await fetch(url.toString());
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`CallMeBot failed: ${res.status} ${body}`);
  }
}
