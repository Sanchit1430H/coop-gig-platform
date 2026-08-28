// ---------------------------------------------------------------------------
// FAQ CHATBOT — keyword-matched canned answers, NOT a real AI/LLM integration.
// This is honestly a rules engine, not artificial intelligence — labeled as
// such in the UI on purpose (see ChatWidget.jsx's "FAQ Assistant" heading).
//
// TO UPGRADE TO A REAL LLM LATER:
// Replace the body of `getAnswer()` below with a fetch() call to your
// backend, which in turn calls an LLM API (Anthropic/OpenAI) with a server-
// held API key. Keep the same function signature (string in, string out)
// and every call site in ChatWidget.jsx keeps working unchanged.
// ---------------------------------------------------------------------------

const FAQ = [
  {
    keywords: ['price', 'cost', 'commission', 'fee', 'expensive', 'cheap'],
    answer:
      "We use Zero-Middleman pricing. The worker's quoted rate is never reduced — our 5% cooperative fee and 2.5% social-security contribution are added on top for the customer, not deducted from the worker's pay. This typically works out 15-20% cheaper than private platforms, which take 25-30% commission out of the worker's earnings.",
  },
  {
    keywords: ['verify', 'verification', 'trust', 'background', 'safe', 'safety'],
    answer:
      'Every worker is verified by their local cooperative society before they can accept bookings — this includes ID checks and skill certification review. You can see each worker\'s verification status, rating, and experience before booking.',
  },
  {
    keywords: ['dispute', 'complaint', 'unfair', 'ban', 'deactivate', 'fire'],
    answer:
      'Workers are never instantly banned over a single bad review. A low rating triggers a "show cause" review — the worker submits their side, and three random verified peer workers vote to uphold or dismiss the complaint. This Peer Tribunal system gives workers real due process, inspired by fair-deactivation laws like Australia\'s 2025 Digital Labour Platform Deactivation Code.',
  },
  {
    keywords: ['wallet', 'insurance', 'benefit', 'sick', 'emergency fund', 'welfare'],
    answer:
      "Every completed, paid job automatically credits a small percentage into the worker's Micro-Benefits Wallet — a running emergency/sick-leave fund they can withdraw from anytime. It's real money tracked in a real ledger, not a future promise.",
  },
  {
    keywords: ['book', 'booking', 'how', 'work', 'schedule', 'appointment'],
    answer:
      'Open the app, pick a service category, choose "emergency" for right-now help or "schedule" for later, and we match you with the nearest verified worker automatically. You can track their status in real time until the job is done.',
  },
  {
    keywords: ['worker', 'join', 'sign up', 'register', 'become'],
    answer:
      'Workers register through their local labour cooperative society, submit their skill profile and certification, and get verified by the federation before appearing in the marketplace. Reach out to your local cooperative society to get started.',
  },
  {
    keywords: ['cooperative', 'ownership', 'why', 'different', 'better'],
    answer:
      "Unlike private gig platforms, this marketplace is owned by the labour cooperative federations themselves — the workers, not outside investors. That means fairer commission, worker-run dispute resolution, and welfare built into every transaction, not bolted on as an afterthought.",
  },
];

const FALLBACK =
  "I don't have a specific answer for that yet — try asking about pricing, worker verification, how booking works, or our dispute resolution process. For anything else, please contact your local cooperative society.";

export function getAnswer(question) {
  const q = question.toLowerCase();
  const match = FAQ.find((entry) => entry.keywords.some((kw) => q.includes(kw)));
  return match ? match.answer : FALLBACK;
}

export const SUGGESTED_QUESTIONS = [
  'How does pricing work?',
  'How are workers verified?',
  'What if I have a dispute?',
  'How do I book a service?',
];
