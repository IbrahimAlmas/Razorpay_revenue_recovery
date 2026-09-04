// src/act/actions.js
//
// Your .env still has placeholder Razorpay keys, so these handlers are
// stubbed — they simulate the action and return a result shaped the same
// way a real call would. Swap in real Razorpay calls inside each handler
// when you're ready (marked with TODO).

async function retryPaymentLink(event) {
  // TODO: const link = await razorpay.paymentLink.create({ amount: event.amount * 100, ... });
  console.log(`[stub] Would send a fresh payment link to customer ${event.customer_id} for session ${event.session_id} (₹${event.amount})`);
  return { action: 'retry_payment_link', status: 'success', detail: `Simulated: new payment link generated for session ${event.session_id}` };
}

async function suggestAlternateMethod(event) {
  console.log(`[stub] Would suggest an alternate payment method to customer ${event.customer_id} (failed method: ${event.payment_method})`);
  return { action: 'suggest_alternate_method', status: 'success', detail: `Simulated: alternate-method prompt queued for session ${event.session_id}` };
}

async function sendReminderNudge(event) {
  console.log(`[stub] Would send a reminder nudge to customer ${event.customer_id} for ₹${event.amount} cart`);
  return { action: 'send_reminder_nudge', status: 'success', detail: `Simulated: reminder nudge queued for session ${event.session_id}` };
}

async function rescheduleMandateRetry(event) {
  console.log(`[stub] Would reschedule mandate retry for customer ${event.customer_id}, session ${event.session_id}`);
  return { action: 'reschedule_mandate_retry', status: 'success', detail: `Simulated: mandate retry rescheduled for session ${event.session_id}` };
}

async function escalateToHuman(event, diagnosis) {
  console.log(`[escalate] Session ${event.session_id} (customer ${event.customer_id}) needs human review. Reason: ${diagnosis?.reasoning ?? 'n/a'}`);
  return { action: 'escalate_to_human', status: 'success', detail: `Simulated: escalation ticket created for session ${event.session_id}` };
}

async function noAction(event) {
  return { action: 'no_action', status: 'skipped', detail: `No action taken for session ${event.session_id}` };
}

const ACTION_HANDLERS = {
  retry_payment_link: retryPaymentLink,
  suggest_alternate_method: suggestAlternateMethod,
  send_reminder_nudge: sendReminderNudge,
  reschedule_mandate_retry: rescheduleMandateRetry,
  escalate_to_human: escalateToHuman,
  no_action: noAction
};

async function executeAction(actionName, event, diagnosis) {
  const handler = ACTION_HANDLERS[actionName];
  if (!handler) {
    console.warn(`[actions] Unknown action "${actionName}" — escalating instead.`);
    return escalateToHuman(event, diagnosis);
  }
  try {
    return await handler(event, diagnosis);
  } catch (err) {
    console.error(`[actions] "${actionName}" failed:`, err.message);
    return { action: actionName, status: 'failed', detail: err.message };
  }
}

module.exports = { executeAction, ACTION_HANDLERS };