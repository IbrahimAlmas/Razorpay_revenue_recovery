// src/act/guardrails.js

const { getRecentActionsForSession } = require('../log/audit_logger');

const MAX_ATTEMPTS = 3;
const NUDGE_MAX_AMOUNT = 10000; // INR — mirrors the rule in prompt.js

/**
 * Second, code-level enforcement layer on top of the rules already given to
 * the LLM — the model can be wrong or the prompt can drift, so this doesn't
 * trust it blindly.
 */
function evaluateGuardrails(event, diagnosis) {
  const attemptNumber = event.attempt_number ?? 1;

  if (attemptNumber >= MAX_ATTEMPTS) {
    const alreadyCorrect = ['escalate_to_human', 'no_action'].includes(diagnosis.recommended_action);
    return {
      allowed: alreadyCorrect,
      reason: alreadyCorrect
        ? 'At retry cap; model correctly recommended escalate/no_action.'
        : `Attempt ${attemptNumber} >= ${MAX_ATTEMPTS} cap but model recommended "${diagnosis.recommended_action}" — overriding.`,
      overrideAction: alreadyCorrect ? undefined : 'escalate_to_human'
    };
  }

  if (diagnosis.confidence < 0.5 && diagnosis.recommended_action !== 'escalate_to_human') {
    return {
      allowed: false,
      reason: `Confidence ${diagnosis.confidence} below 0.5 threshold — overriding to escalate_to_human.`,
      overrideAction: 'escalate_to_human'
    };
  }

  if (diagnosis.recommended_action === 'send_reminder_nudge' && (event.amount ?? 0) >= NUDGE_MAX_AMOUNT) {
    return {
      allowed: false,
      reason: `Amount ₹${event.amount} >= ₹${NUDGE_MAX_AMOUNT} nudge ceiling — overriding to escalate_to_human.`,
      overrideAction: 'escalate_to_human'
    };
  }

  const recent = getRecentActionsForSession(event.session_id, { limit: 5 });
  const duplicate = recent.find(
    (r) =>
      r.action_taken === diagnosis.recommended_action &&
      r.action_status === 'success' &&
      diagnosis.recommended_action !== 'no_action'
  );
  if (duplicate) {
    return {
      allowed: false,
      reason: `Action "${diagnosis.recommended_action}" already taken successfully for session ${event.session_id} — skipping duplicate.`,
      overrideAction: 'no_action'
    };
  }

  return { allowed: true, reason: 'Passed all guardrail checks.' };
}

module.exports = { evaluateGuardrails, MAX_ATTEMPTS, NUDGE_MAX_AMOUNT };