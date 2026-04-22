/**
 * Sends an automatic WhatsApp to the admin when a quotation is created via Twilio WhatsApp API.
 *
 * Required env vars:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (example: whatsapp:+14155238886 for sandbox)
 * - WHATSAPP_NOTIFY_PHONE (example: +60122846084)
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

function normalizeE164(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return `+${digits}`;
}

export async function notifyQuotationSubmitted(payload: QuotationWhatsAppPayload): Promise<void> {
  const text = buildMessage(payload);
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim() || 'whatsapp:+14155238886';
  const toPhone = normalizeE164(process.env.WHATSAPP_NOTIFY_PHONE || DEFAULT_NOTIFY_PHONE);

  if (!accountSid || !authToken) {
    console.warn('[whatsapp] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.');
    return;
  }

  const params = new URLSearchParams({
    From: from,
    To: `whatsapp:${toPhone}`,
    Body: text,
  });
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Twilio WhatsApp send failed: ${response.status} ${errorBody}`);
  }
}
