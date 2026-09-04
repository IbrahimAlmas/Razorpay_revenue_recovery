const { diagnoseEvent } = require('../src/diagnose/diagnose');

const sampleEvent = {
  session_id: 'chk_101',
  event_type: 'checkout_dropoff',
  customer_id: 'cust_42',
  amount: 4599,
  currency: 'INR',
  payment_method: 'card',
  stage_reached: 'otp_pending',
  timestamp: new Date().toISOString(),
  attempt_number: 1,
  prior_attempts: [],
  failure_code: 'otp_expired',
  customer_history: { total_past_orders: 3, past_failed_payments: 1 }
};

diagnoseEvent(sampleEvent).then(result => {
  console.log(JSON.stringify(result, null, 2));
});