// src/detect/detector.js

const IGNORED_EVENT_TYPES = new Set(['payment_success']);

const ACTIONABLE_EVENT_TYPES = new Set([
  'checkout_dropoff',
  'payment_failed',
  'mandate_failed'
]);

/**
 * Filters raw events down to ones worth diagnosing, keeping only the LATEST
 * attempt per session_id (earlier attempts live in prior_attempts already).
 */
function detectFailedEvents(events) {
  if (!Array.isArray(events)) {
    throw new TypeError('detectFailedEvents expects an array of events');
  }

  const actionable = events.filter((e) => {
    if (!e || typeof e !== 'object') return false;
    if (IGNORED_EVENT_TYPES.has(e.event_type)) return false;
    if (!ACTIONABLE_EVENT_TYPES.has(e.event_type)) return false;
    if (!e.session_id || !e.customer_id) return false;
    return true;
  });

  const latestBySession = new Map();

  for (const event of actionable) {
    const existing = latestBySession.get(event.session_id);
    if (!existing) {
      latestBySession.set(event.session_id, event);
      continue;
    }

    const isNewer =
      (event.attempt_number ?? 0) > (existing.attempt_number ?? 0) ||
      ((event.attempt_number ?? 0) === (existing.attempt_number ?? 0) &&
        new Date(event.timestamp) > new Date(existing.timestamp));

    if (isNewer) {
      latestBySession.set(event.session_id, event);
    }
  }

  return Array.from(latestBySession.values()).sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
}

module.exports = { detectFailedEvents, ACTIONABLE_EVENT_TYPES };