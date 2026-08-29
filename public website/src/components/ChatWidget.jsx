import React, { useState, useRef, useEffect } from 'react';
import { getAnswer, SUGGESTED_QUESTIONS } from '../api/faqBot';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hi! I'm the Kushal-Setu FAQ Assistant. Ask me about pricing, worker verification, disputes, or how booking works." },
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  function send(text) {
    const question = text.trim();
    if (!question) return;
    const answer = getAnswer(question);
    setMessages((m) => [...m, { from: 'user', text: question }, { from: 'bot', text: answer }]);
    setInput('');
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Open chat">
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className="chat-window">
          <div className="chat-header">
            <div>
              <strong>FAQ Assistant</strong>
              <span className="chat-header-sub">Rule-based, not a live AI — for real support contact your cooperative society</span>
            </div>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from}`}>{m.text}</div>
            ))}
          </div>

          {messages.length < 3 && (
            <div className="chat-suggestions">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} className="suggestion-chip" onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          )}

          <form
            className="chat-input-row"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </>
  );
}
