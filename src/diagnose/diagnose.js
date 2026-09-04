
require('dotenv').config();
const { DIAGNOSIS_SYSTEM_PROMPT } = require('./prompt');

async function diagnoseEvent(eventData) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-4-latest', // check xAI docs for the current model name you have access to
      messages: [
        { role: 'system', content: DIAGNOSIS_SYSTEM_PROMPT },
        { role: 'user', content: JSON.stringify(eventData) }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Grok API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const rawText = data.choices?.[0]?.message?.content || '';

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse Grok response as JSON:', rawText);
    return {
      diagnosis: 'unknown',
      recommended_action: 'escalate_to_human',
      confidence: 0,
      reasoning: 'Failed to parse model response.'
    };
  }
}

module.exports = { diagnoseEvent };