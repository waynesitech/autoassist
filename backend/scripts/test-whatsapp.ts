/**
 * Direct WhatsApp API test — run from backend folder:
 *   npx tsx scripts/test-whatsapp.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import twilio from 'twilio';
import { notifyQuotationSubmitted } from '../src/services/whatsappQuotationNotify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const receivers = (process.env.WHATSAPP_NOTIFY_PHONE || '+60162369283,+60122846084')
  .split(/[,;]/)
  .map((p) => p.trim())
  .filter(Boolean);

async function printRecentStatuses() {
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  for (const receiver of receivers) {
    const to = receiver.startsWith('whatsapp:') ? receiver : `whatsapp:${receiver.startsWith('+') ? receiver : '+' + receiver.replace(/\D/g, '')}`;
    const messages = await client.messages.list({ to, limit: 2 });
    console.log(`\nRecent messages to ${receiver}:`);
    for (const m of messages) {
      console.log(`  ${m.sid} | ${m.status} | error=${m.errorCode ?? 'none'}`);
    }
  }
}

async function main() {
  console.log('=== WhatsApp API Direct Test ===');
  console.log('Receivers:', receivers.join(', '));
  console.log('From:', process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886 (sandbox)');

  console.log('\n[1/2] Plain text (quotation notify includes delivery check)...');
  console.log('Skipping isolated plain-text ping — covered by step 2.\n');

  console.log('[2/2] Quotation notification...');
  const { notified: ok, results } = await notifyQuotationSubmitted(
    {
    transactionId: `TX-TEST-${Date.now().toString().slice(-4)}`,
    type: 'Brief',
    model: 'Honda Civic RS',
    year: '2020',
    engine: 'ENG-TEST-001',
    chassis: 'CHS-TEST-001',
    description: 'Direct API test from backend/scripts/test-whatsapp.ts',
    quoteType: 'brief',
    workshopName: 'Test Workshop',
    amount: 5,
  },
    { waitForDelivery: true }
  );
  console.log('whatsappNotified:', ok);
  console.log('Per recipient:', JSON.stringify(results, null, 2));

  await printRecentStatuses();

  if (!ok) {
    console.log('\n⚠ Delivery not confirmed. If using Twilio Sandbox (+14155238886):');
    console.log('  1. On WhatsApp, message +1 415 523 8886');
    console.log('  2. Send: join <your-sandbox-code>  (code is in Twilio Console → Messaging → WhatsApp sandbox)');
    console.log('  3. Re-run: npx tsx scripts/test-whatsapp.ts');
    console.log('  Sandbox membership expires after 3 days — re-join if needed.');
    process.exit(1);
  }

  console.log('\n✓ Delivery confirmed — check WhatsApp on the receiver phone.');
}

main().catch((err) => {
  console.error('\nTest failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
