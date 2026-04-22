import twilio from 'twilio';

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

function formatWhatsAppTo(raw: string): string {
  if (raw.startsWith('whatsapp:')) {
    return raw;
  }
  return `whatsapp:${normalizeE164(raw)}`;
}

function getTwilioConfig(): { accountSid: string; authToken: string; from: string } {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim() || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.');
  }
  return { accountSid, authToken, from };
}

export async function sendTwilioWhatsAppMessage(to: string, body: string): Promise<string> {
  const { accountSid, authToken, from } = getTwilioConfig();
  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    from,
    to: formatWhatsAppTo(to),
    body,
  });
  return message.sid;
}

export async function notifyQuotationSubmitted(payload: QuotationWhatsAppPayload): Promise<void> {
  const text = buildMessage(payload);
  const toPhone = process.env.WHATSAPP_NOTIFY_PHONE || DEFAULT_NOTIFY_PHONE;
  await sendTwilioWhatsAppMessage(toPhone, text);
}
