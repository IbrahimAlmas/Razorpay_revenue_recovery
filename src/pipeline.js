// src/pipeline.js

const { detectFailedEvents } = require('./detect/detector');
const { diagnoseEvent } = require('./diagnose/diagnose');
const { evaluateGuardrails } = require('./act/guardrails');
const { executeAction } = require('./act/actions');
const { logRecord } = require('./log/audit_logger');

/**
 * detect -> diagnose (Grok) -> guardrails -> act -> audit log
 */
async function runPipeline(rawEvents, opts = {}) {
  const { dryRun = false } = opts;

  const actionableEvents = detectFailedEvents(rawEvents);
  console.log(`[pipeline] ${rawEvents.length} raw events -> ${actionableEvents.length} actionable`);

  const results = [];

  for (const event of actionableEvents) {
    let diagnosis;
    try {
      diagnosis = await diagnoseEvent(event);
    } catch (err) {
      console.error(`[pipeline] Diagnosis failed for session ${event.session_id}:`, err.message);
      diagnosis = {
        diagnosis: 'unknown',
        recommended_action: 'escalate_to_human',
        confidence: 0,
        reasoning: `Diagnosis call threw: ${err.message}`
      };
    }

    const guardrailCheck = evaluateGuardrails(event, diagnosis);
    const finalAction = guardrailCheck.allowed
      ? diagnosis.recommended_action
      : guardrailCheck.overrideAction ?? 'escalate_to_human';

    if (!guardrailCheck.allowed) {
      console.log(`[pipeline] Guardrail override for ${event.session_id}: ${guardrailCheck.reason}`);
    }

    let actionResult = { action: finalAction, status: 'skipped', detail: 'dry run' };
    if (!dryRun) {
      actionResult = await executeAction(finalAction, event, diagnosis);
      logRecord({ event, diagnosis, actionResult });
    }

    results.push({
      session_id: event.session_id,
      customer_id: event.customer_id,
      diagnosis,
      guardrail: guardrailCheck,
      actionResult
    });
  }

  return results;
}

module.exports = { runPipeline };