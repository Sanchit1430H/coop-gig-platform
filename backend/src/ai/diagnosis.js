// ---------------------------------------------------------------------------
// AI PRE-DIAGNOSIS — currently a keyword-matching stub, NOT a real
// multimodal LLM call. This is honest labeling, same pattern as the FAQ
// chatbot and demand forecast elsewhere in this backend.
//
// TO UPGRADE TO REAL GEMINI/OPENAI VISION:
// Replace the body of `diagnoseIssue()` below with a call to your chosen
// provider's API (Gemini's generateContent with an image part, or
// OpenAI's chat completions with an image_url content block). Keep the
// same input shape ({ description, photoBase64 }) and output shape
// ({ predicted_issue, confidence_note, method }) and the route calling
// this function (routes/diagnosis.js) needs no changes.
//
// You'll need: an API key stored as an environment variable (never
// hardcoded), and — since this repo's dev sandbox can't reach external
// APIs — you'll be the one testing the real call once this is deployed
// somewhere with normal internet access (e.g. Render).
// ---------------------------------------------------------------------------

const KEYWORD_RULES = [
  {
    keywords: ['leak', 'leaking', 'dripping', 'drip', 'water coming'],
    predicted_issue: 'Likely a pipe joint, valve, or seal leak — plumber should bring basic seal/gasket replacement parts.',
  },
  {
    keywords: ['spark', 'sparking', 'shock', 'burning smell', 'smoke', 'tripping', 'trips'],
    predicted_issue: 'Possible electrical short or overloaded circuit — flagged as higher priority. Advise customer to avoid using the affected switch/socket until the worker arrives.',
  },
  {
    keywords: ['not cooling', 'not cold', 'warm', 'ac not working', 'fridge not working'],
    predicted_issue: 'Likely a refrigerant, compressor, or thermostat issue on a cooling appliance — technician should bring a gauge set.',
  },
  {
    keywords: ['clog', 'clogged', 'blocked', 'not draining', 'backed up'],
    predicted_issue: 'Likely a blockage in the drain/pipe — plumber should bring a drain snake or plunger as first approach.',
  },
  {
    keywords: ['crack', 'cracked', 'broken', 'hole in wall', 'peeling'],
    predicted_issue: 'Structural/surface repair — carpenter or painter should assess extent before quoting materials.',
  },
  {
    keywords: ['no power', 'not turning on', 'dead', "won't start"],
    predicted_issue: 'Possible power supply or internal component failure — technician should bring a multimeter for diagnosis on arrival.',
  },
];

function diagnoseIssue({ description, photoBase64 }) {
  const text = (description || '').toLowerCase();
  const match = KEYWORD_RULES.find((rule) => rule.keywords.some((kw) => text.includes(kw)));

  const textResult = match
    ? match.predicted_issue
    : 'No specific pattern matched from the description — worker will assess on arrival.';

  if (photoBase64) {
    return {
      predicted_issue: textResult,
      photo_note:
        'A photo was attached and stored for the worker to view directly. Automated visual analysis is not active yet — it requires a vision-capable AI API key (Gemini or OpenAI), which has not been configured. The worker will review the photo manually before the job.',
      method: 'keyword_stub_with_photo_passthrough',
    };
  }

  return {
    predicted_issue: textResult,
    photo_note: null,
    method: 'keyword_stub',
  };
}

module.exports = { diagnoseIssue };
