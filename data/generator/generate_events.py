"""
Synthetic payment event generator for the Revenue Recovery Agent.
Writes a batch of realistic Indian checkout dropoff / failure events to
data/raw/events_batch_01.json.

Usage:
    python data/generator/generate_events.py --count 50
    python data/generator/generate_events.py --count 200 --out data/raw/events_batch_02.json
"""

import argparse
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

PAYMENT_METHODS = ["card", "upi", "netbanking", "wallet", "emi"]
EVENT_TYPES = ["checkout_dropoff", "payment_failed", "mandate_failed"]

STAGE_BY_EVENT = {
    "checkout_dropoff": ["cart", "payment_details", "otp_pending", "bank_redirect"],
    "payment_failed": ["otp_pending", "bank_redirect", "payment_details"],
    "mandate_failed": ["mandate_setup"],
}

FAILURE_CODES = {
    "checkout_dropoff": [None, None, "session_timeout"],
    "payment_failed": [
        "otp_expired", "card_declined", "insufficient_funds",
        "bank_timeout", "gateway_error",
    ],
    "mandate_failed": ["mandate_bank_rejected", "mandate_insufficient_funds"],
}

AMOUNT_BANDS = [
    (99, 999),
    (1000, 9999),
    (10000, 50000),
    (50000, 250000),
]


def random_timestamp(days_back: int = 14) -> str:
    delta = timedelta(
        days=random.randint(0, days_back),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )
    ts = datetime.now(timezone.utc) - delta
    return ts.isoformat().replace("+00:00", "Z")


def make_prior_attempts(n: int, base_ts: str):
    attempts = []
    for i in range(n):
        attempts.append({
            "attempt_number": i + 1,
            "timestamp": base_ts,
            "failure_code": random.choice(["otp_expired", "bank_timeout", "card_declined"]),
        })
    return attempts


def make_event(customer_pool):
    event_type = random.choices(EVENT_TYPES, weights=[0.5, 0.4, 0.1], k=1)[0]

    amount_lo, amount_hi = random.choice(AMOUNT_BANDS)
    amount = round(random.uniform(amount_lo, amount_hi), -1)

    attempt_number = random.choices([1, 2, 3, 4], weights=[0.6, 0.25, 0.1, 0.05], k=1)[0]
    ts = random_timestamp()
    prior_attempts = make_prior_attempts(attempt_number - 1, ts)
    customer_id = random.choice(customer_pool)

    return {
        "session_id": f"chk_{uuid.uuid4().hex[:10]}",
        "event_type": event_type,
        "customer_id": customer_id,
        "amount": amount,
        "currency": "INR",
        "payment_method": random.choice(PAYMENT_METHODS) if event_type != "mandate_failed" else "mandate",
        "stage_reached": random.choice(STAGE_BY_EVENT[event_type]),
        "timestamp": ts,
        "attempt_number": attempt_number,
        "prior_attempts": prior_attempts,
        "failure_code": random.choice(FAILURE_CODES[event_type]),
        "customer_history": {
            "total_past_orders": random.randint(0, 40),
            "past_failed_payments": random.randint(0, 5),
        },
    }


def generate_batch(count: int):
    pool_size = max(1, int(count * 0.3))
    customer_pool = [f"cust_{i}" for i in range(1, pool_size + 1)]
    return [make_event(customer_pool) for _ in range(count)]


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic payment events.")
    parser.add_argument("--count", type=int, default=50)
    parser.add_argument("--out", type=str, default=None)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()

    if args.seed is not None:
        random.seed(args.seed)

    events = generate_batch(args.count)

    out_path = Path(args.out) if args.out else Path(__file__).resolve().parents[1] / "raw" / "events_batch_01.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with open(out_path, "w") as f:
        json.dump(events, f, indent=2)

    print(f"Wrote {len(events)} synthetic events to {out_path}")


if __name__ == "__main__":
    main()