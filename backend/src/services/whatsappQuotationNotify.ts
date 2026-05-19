import twilio from 'twilio';

/**
 * Sends an automatic WhatsApp to the admin when a quotation is created via Twilio WhatsApp API.
 *
 * Required env vars:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (example: whatsapp:+14155238886 for sandbox)
 * - WHATSAPP_NOTIFY_PHONE — one or more receivers, comma-separated (e.g. +60162369283,+60122846084)
 *
 * Sends full quotation details as plain text (buildMessage). Set TWILIO_QUOTATION_TEMPLATE_SID
 * only if plain text is rejected outside the 24h window; the template must define {{1}}–{{8}} in its body.
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

/** Twilio error codes / phrases when plain text is rejected (use approved template instead). */
const TEMPLATE_REQUIRED_PATTERNS = [
  /63016/,
  /63007/,
  /63015/,
  /outside the allowed window/i,
  /requires a template/i,
  /template/i,
  /session/i,
];

function getQuotationTemplateSid(): string {
  return (
    process.env.TWILIO_QUOTATION_TEMPLATE_SID?.trim() ||
    process.env.TWILIO_WHATSAPP_TEMPLATE_SID?.trim() ||
    ''
  );
}

function isTemplateRequiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TEMPLATE_REQUIRED_PATTERNS.some((re) => re.test(message));
}

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

/** Variables for Twilio Content templates — keys must match {{1}}, {{2}}, … in the approved template body. */
function buildTemplateVariables(p: QuotationWhatsAppPayload): Record<string, string> {
  return {
    '1': p.transactionId,
    '2': `${p.year} ${p.model}`.trim(),
    '3': p.workshopName ?? '—',
    '4': `${p.type} / ${p.quoteType}`,
    '5': `RM ${p.amount}`,
    '6': p.engine,
    '7': p.chassis,
    ...(p.description?.trim() ? { '8': p.description.trim().slice(0, 400) } : {}),
  };
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
  templateSid: string,
  waitForDelivery: boolean
): Promise<boolean> {
  const confirmSend = async (messageSid: string): Promise<boolean> => {
    if (!waitForDelivery) {
      return true;
    }
    const delivered = await waitForWhatsAppDelivery(messageSid);
    if (!delivered) {
      console.warn('[whatsapp] Message queued but not confirmed delivered within timeout:', messageSid);
    }
    return delivered;
  };

  const text = buildMessage(payload);

  // Prefer full plain-text body (buildMessage). Templates only when configured and plain text is rejected.
  try {
    const sid = await sendTwilioWhatsAppMessage(toPhone, text);
    console.log('[whatsapp] Sent plain-text quotation notify to', normalizeE164(toPhone));
    return await confirmSend(sid);
  } catch (plainError) {
    if (!templateSid || !isTemplateRequiredError(plainError)) {
      throw plainError;
    }
    console.warn(
      `[whatsapp] Plain text rejected for ${toPhone}, retrying with template ${templateSid}:`,
      plainError instanceof Error ? plainError.message : plainError
    );
  }

  const sid = await sendTwilioWhatsAppTemplateMessage(
    toPhone,
    templateSid,
    buildTemplateVariables(payload)
  );
  console.log('[whatsapp] Sent template quotation notify to', normalizeE164(toPhone));
  return await confirmSend(sid);
}

export type WhatsAppNotifyResult = {
  phone: string;
  delivered: boolean;
  error?: string;
};

export type NotifyQuotationOptions = {
  /** When false (default for API requests), return after Twilio accepts the message. */
  waitForDelivery?: boolean;
};

/** Sends quotation WhatsApp to all configured receivers. */
export async function notifyQuotationSubmitted(
  payload: QuotationWhatsAppPayload,
  options: NotifyQuotationOptions = {}
): Promise<{ notified: boolean; results: WhatsAppNotifyResult[] }> {
  const waitForDelivery = options.waitForDelivery ?? false;
  const phones = getNotifyPhones();
  const templateSid = getQuotationTemplateSid();

  const results: WhatsAppNotifyResult[] = [];

  for (const phone of phones) {
    const normalized = normalizeE164(phone);
    try {
      const delivered = await notifyOneRecipient(phone, payload, templateSid, waitForDelivery);
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
