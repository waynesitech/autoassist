import twilio from 'twilio';

/**
 * Sends an automatic WhatsApp to the admin when a quotation is created via Twilio WhatsApp API.
 *
 * Required env vars:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (example: whatsapp:+14155238886 for sandbox)
 * - WHATSAPP_NOTIFY_PHONE — one or more receivers, comma-separated (e.g. +60162369283,+60122846084)
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

const DEFAULT_NOTIFY_PHONES = ['60162369283', '60122846084'];

function getNotifyPhones(): string[] {
  const raw = process.env.WHATSAPP_NOTIFY_PHONE?.trim();
  if (!raw) {
    return [...DEFAULT_NOTIFY_PHONES];
  }
  const phones = raw.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  return phones.length > 0 ? phones : [...DEFAULT_NOTIFY_PHONES];
}
const MAX_MESSAGE_LEN = 4000;
const DEFAULT_TWILIO_QUOTATION_TEMPLATE_SID = 'HXc2295b8a670f0f5bc01227b932db52ef';

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

const SANDBOX_JOIN_HINT =
  'Recipient must join the Twilio WhatsApp sandbox: WhatsApp +1 415 523 8886 with "join <code>" (code in Twilio Console → Messaging → WhatsApp sandbox). Membership expires after 3 days.';

async function waitForWhatsAppDelivery(messageSid: string, maxAttempts = 12): Promise<boolean> {
  const { accountSid, authToken } = getTwilioConfig();
  const client = twilio(accountSid, authToken);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const message = await client.messages(messageSid).fetch();
    if (message.status === 'delivered' || message.status === 'read') {
      return true;
    }
    if (message.status === 'failed' || message.status === 'undelivered') {
      const code = message.errorCode;
      const hint = code === 63015 || code === 63016 ? ` ${SANDBOX_JOIN_HINT}` : '';
      throw new Error(
        `WhatsApp delivery failed (Twilio ${code ?? message.status}).${hint}`
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return false;
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

export async function sendTwilioWhatsAppTemplateMessage(
  to: string,
  contentSid: string,
  contentVariables?: Record<string, string>
): Promise<string> {
  const { accountSid, authToken, from } = getTwilioConfig();
  const client = twilio(accountSid, authToken);
  const message = await client.messages.create({
    from,
    to: formatWhatsAppTo(to),
    contentSid,
    ...(contentVariables ? { contentVariables: JSON.stringify(contentVariables) } : {}),
  });
  return message.sid;
}

async function notifyOneRecipient(
  toPhone: string,
  payload: QuotationWhatsAppPayload,
  templateSid: string
): Promise<boolean> {
  const sendAndConfirm = async (messageSid: string): Promise<boolean> => {
    const delivered = await waitForWhatsAppDelivery(messageSid);
    if (!delivered) {
      console.warn('[whatsapp] Message queued but not confirmed delivered within timeout:', messageSid);
    }
    return delivered;
  };

  if (templateSid) {
    try {
      const contentVariables: Record<string, string> = {
        '1': payload.transactionId,
        '2': `${payload.year} ${payload.model}`,
        '3': payload.workshopName ?? '-',
        '4': `${payload.type} / ${payload.quoteType}`,
        '5': `RM ${payload.amount}`,
      };
      const sid = await sendTwilioWhatsAppTemplateMessage(toPhone, templateSid, contentVariables);
      return await sendAndConfirm(sid);
    } catch (templateError) {
      console.warn(`[whatsapp] Template send failed for ${toPhone}, falling back to plain text:`, templateError);
    }
  }

  const text = buildMessage(payload);
  const sid = await sendTwilioWhatsAppMessage(toPhone, text);
  return await sendAndConfirm(sid);
}

export type WhatsAppNotifyResult = {
  phone: string;
  delivered: boolean;
  error?: string;
};

/** Sends quotation WhatsApp to all configured receivers. */
export async function notifyQuotationSubmitted(
  payload: QuotationWhatsAppPayload
): Promise<{ notified: boolean; results: WhatsAppNotifyResult[] }> {
  const phones = getNotifyPhones();
  const templateSid = process.env.TWILIO_QUOTATION_TEMPLATE_SID?.trim() || DEFAULT_TWILIO_QUOTATION_TEMPLATE_SID;

  const results: WhatsAppNotifyResult[] = [];

  for (const phone of phones) {
    const normalized = normalizeE164(phone);
    try {
      const delivered = await notifyOneRecipient(phone, payload, templateSid);
      results.push({ phone: normalized, delivered });
      if (delivered) {
        console.log('[whatsapp] Quotation notification delivered to', normalized);
      } else {
        console.warn('[whatsapp] Quotation notification not confirmed for', normalized);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({ phone: normalized, delivered: false, error: message });
      console.warn(`[whatsapp] Failed to notify ${normalized}:`, message);
    }
  }

  return {
    notified: results.some((r) => r.delivered),
    results,
  };
}
