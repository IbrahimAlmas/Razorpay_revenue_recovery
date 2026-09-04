# Payment Event Schema

Canonical shape for a single payment event flowing through
`Event Source → Detect → Diagnose → Act → Log`.

```json
{
  "session_id": "chk_101",
  "event_type": "checkout_dropoff",
  "customer_id": "cust_42",
  "amount": 4599,
  "currency": "INR",
  "payment_method": "card",
  "stage_reached": "otp_pending",
  "timestamp": "2026-09-04T10:15:00.000Z",
  "attempt_number": 1,
  "prior_attempts": [],
  "failure_code": "otp_expired",
  "customer_history": {
    "total_past_orders": 3,
    "past_failed_payments": 1
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `session_id` | string | Unique per checkout session. Primary dedup key downstream. |
| `event_type` | string | `checkout_dropoff`, `payment_failed`, `mandate_failed`, `payment_success` (filtered out by detector). |
| `customer_id` | string | Used for guardrail lookups. |
| `amount` | number | Rupees, not paise — `4599` = ₹4,599. |
| `currency` | string | `"INR"`. |
| `payment_method` | string | `card`, `upi`, `netbanking`, `wallet`, `emi`, `mandate`. |
| `stage_reached` | string | `cart`, `payment_details`, `otp_pending`, `bank_redirect`, `mandate_setup`. |
| `timestamp` | string (ISO 8601) | Event time. |
| `attempt_number` | number | 1-indexed. Diagnosis prompt caps automated retries at 3. |
| `prior_attempts` | array | Past attempts, oldest first. |
| `failure_code` | string \| null | e.g. `otp_expired`, `card_declined`. |
| `customer_history.total_past_orders` | number | Lifetime completed orders. |
| `customer_history.past_failed_payments` | number | Lifetime failed attempts. |