import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PLAN = [
  { week: 1, title: "Fundamentals & Data Modeling", topics: [
    "Objects, fields, relationships (lookup/master-detail/many-to-many)",
    "Schema builder",
    "Data import/export, Data Loader",
    "Deduplication & validation rules",
  ]},
  { week: 2, title: "Apex Fundamentals", topics: [
    "Apex syntax, data types, collections (List/Set/Map)",
    "SOQL & SOSL basics",
    "Classes & triggers, trigger context variables",
    "Trigger order of execution",
    "Governor limits (key numbers)",
  ]},
  { week: 3, title: "Async Apex & Bulkification", topics: [
    "Bulkification patterns (no SOQL/DML in loops)",
    "@future methods",
    "Batch Apex incl. Database.Stateful",
    "Queueable Apex",
    "Scheduled Apex",
  ]},
  { week: 4, title: "Process Automation & UI", topics: [
    "Flow (record-triggered, screen flows)",
    "Flow vs Apex trigger, order of execution",
    "Visualforce basics (controllers, extensions)",
    "LWC basics (@api, @track, @wire, component comms)",
  ]},
  { week: 5, title: "Testing & Debugging", topics: [
    "Test classes, @isTest, Test.startTest/stopTest",
    "Test data factories & assertions",
    "Debug logs & Checkpoints",
    "Common exceptions",
    "Full practice exam #1",
  ]},
  { week: 6, title: "Targeted Review & Mocks", topics: [
    "Review wrong answers from exam #1",
    "Full practice exam #2",
    "Review exam #2 mistakes",
    "Final review: governor limits, order of execution, async use-cases",
  ]},
];

const STATUS_CYCLE = ["not started", "shaky", "solid"];
const STATUS_COLOR = {
  "not started": "#3a3a3a",
  "shaky": "#c9882c",
  "solid": "#3f8f5e",
};
const STATUS_LABEL = {
  "not started": "Not started",
  "shaky": "Shaky",
  "solid": "Solid",
};

function topicKey(week, idx) {
  return `topic:${week}:${idx}`;
}

function StudyBuddy({ week, theme }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(`pd1-chat-week${week.week}`);
    return saved ? JSON.parse(saved) : [
      { role: "assistant", content: `Ask me anything about **${week.title}** — concepts, gotchas, exam tips, or practice questions.` }
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(`pd1-chat-week${week.week}`, JSON.stringify(messages));
  }, [messages, week.week]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 800,
          system: `You are a Salesforce PD1 certification tutor. The student is currently studying Week ${week.week}: ${week.title}.
Topics this week: ${week.topics.join(", ")}.
Be concise and exam-focused. Use examples when helpful. Keep responses short.`,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.find((b) => b.type === "text")?.text || "Sorry, couldn't respond.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Connection error. Is the server running?" }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 12, border: `1px solid ${theme.border}`, background: theme.card }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "10px 16px", borderBottom: open ? `1px solid ${theme.border}` : "none", fontSize: 11, color: theme.muted, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>✦ Study Buddy — WK{String(week.week).padStart(2, "0")} {week.title}</span>
        <span>{open ? "−" : "+"}</span>
      </div>
      {open && (
      <>
      <div style={{ height: 260, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%",
              padding: "8px 12px",
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: "pre-wrap",
              background: m.role === "user" ? "#3f8f5e22" : theme.bg,
              border: `1px solid ${m.role === "user" ? "#3f8f5e55" : theme.border}`,
              color: theme.text,
            }}>
              {m.role === 'assistant'
                ? <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({node, inline, className, children, ...props}) {
                        return inline ? (
                          <code style={{background: theme.border, padding:'2px 6px', borderRadius:4, fontSize:12, fontFamily:'monospace'}}>
                            {children}
                          </code>
                        ) : (
                          <pre style={{background: theme.bg, border:`1px solid ${theme.border}`, borderRadius:4, padding:'10px 14px', overflowX:'auto'}}>
                            <code style={{fontFamily:'monospace', fontSize:12, color:theme.text, lineHeight:1.6}}>{children}</code>
                          </pre>
                        );
                      },
                      table({children}) {
                        return <table style={{borderCollapse:'collapse', width:'100%', margin:'8px 0'}}>{children}</table>;
                      },
                      th({children}) {
                        return <th style={{border:`1px solid ${theme.border}`, padding:'6px 10px', background:theme.bg, textAlign:'left', fontSize:12}}>{children}</th>;
                      },
                      td({children}) {
                        return <td style={{border:`1px solid ${theme.border}`, padding:'6px 10px', fontSize:12}}>{children}</td>;
                      },
                      h1({children}) { return <h1 style={{margin: '4px 0', fontSize: 16}}>{children}</h1>; },
                      h2({children}) { return <h2 style={{margin: '4px 0', fontSize: 15}}>{children}</h2>; },
                      h3({children}) { return <h3 style={{margin: '4px 0', fontSize: 14}}>{children}</h3>; },
                      ul({children}) { return <ul style={{margin: '4px 0', paddingLeft: 20}}>{children}</ul>; },
                      ol({children}) { return <ol style={{margin: '4px 0', paddingLeft: 20}}>{children}</ol>; },
                      li({children}) { return <li style={{margin: '2px 0'}}>{children}</li>; },
                      p({children})  { return <p style={{margin: '4px 0', lineHeight: 1.5}}>{children}</p>; },
                    }}
                  >{m.content}</ReactMarkdown>
                : m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: theme.muted, fontSize: 12 }}>thinking...</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${theme.border}`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Ask about ${week.title}...`}
          style={{
            flex: 1, background: theme.bg, border: `1px solid ${theme.border}`,
            color: theme.text, padding: "8px 10px", fontSize: 13, fontFamily: "inherit", outline: "none",
          }}
        />
        <button
          onClick={send}
          disabled={loading}
          style={{
            background: "#3f8f5e", border: "none", color: "#fff",
            padding: "8px 16px", fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1, fontFamily: "inherit",
          }}
        >
          ↑
        </button>
      </div>
      </>
      )}
    </div>
  );
}

export default function Tracker() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pd1-darkmode');
      return saved !== null ? JSON.parse(saved) : true;
  });

  const theme = darkMode ? {
    bg: "#1c1b1a",
    card: "#211f1d",
    border: "#33312e",
    text: "#e8e4dc",
    muted: "#8a8580",
    subtle: "#b5afa6",
    hover: "#2a2926",
    footer: "#6b6660",
  } : {
    bg: "#f5f0e6",
    card: "#ffffff",
    border: "#e0d9ce",
    text: "#2a2520",
    muted: "#8a7f70",
    subtle: "#6b5f50",
    hover: "#ede8de",
    footer: "#a09080",
  };

  const [statuses, setStatuses] = useState({});
  const [scores, setScores] = useState({ exam1: "", exam2: "" });
  const [loading, setLoading] = useState(true);
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const saved = localStorage.getItem('pd1-progress');
        if (saved) { const data = JSON.parse(saved);
          setStatuses(data.statuses || {});
          setScores(data.scores || { exam1: "", exam2: "" });
        }
      } catch (e) {
        // no data yet
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('pd1-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  async function persist(nextStatuses, nextScores) {
    try {
      localStorage.setItem('pd1-progress', JSON.stringify({
        statuses: nextStatuses,
        scores: nextScores,
      }));
    } catch (e) {
      console.error('save failed', e);
    }
  }

  function cycleStatus(week, idx) {
    const key = topicKey(week, idx);
    const current = statuses[key] || "not started";
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length];
    const nextStatuses = { ...statuses, [key]: next };
    setStatuses(nextStatuses);
    persist(nextStatuses, scores);
  }

  function updateScore(field, value) {
    const nextScores = { ...scores, [field]: value };
    setScores(nextScores);
    persist(statuses, nextScores);
  }

  function weekProgress(week, topics) {
    let solid = 0;
    topics.forEach((_, idx) => {
      if (statuses[topicKey(week, idx)] === "solid") solid++;
    });
    return { solid, total: topics.length };
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: theme.bg, color: theme.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono', monospace" }}>
        Loading...
      </div>
    );
  }

  const totalTopics = PLAN.reduce((sum, w) => sum + w.topics.length, 0);
  const solidTopics = Object.values(statuses).filter(s => s === "solid").length;
  const overallPct = Math.round((solidTopics / totalTopics) * 100);

  return (
    <div style={{
      minHeight: "100vh",
      background: theme.bg,
      color: theme.text,
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      padding: "24px 16px 60px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap');
        * { box-sizing: border-box; }
        .ledger-title { font-family: 'Space Grotesk', sans-serif; }
        button { font-family: inherit; }
        .topic-row:hover { background: ${theme.hover} !important; }
      `}</style>

      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.15em", color: theme.muted, textTransform: "uppercase", marginBottom: 6 }}>
            PD1 Certification — 6 Week Ledger
          </div>
          <h1 className="ledger-title" style={{ fontSize: 32, fontWeight: 700, margin: 0, color: theme.text }}>
            Progress Ledger
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                background: "transparent",
                border: `1px solid ${theme.border}`,
                color: theme.muted,
                padding: "4px 12px",
                cursor: "pointer",
                fontSize: 12,
                fontFamily: "inherit",
                marginTop: 8,
              }}
            >
              {darkMode ? "☀ Light" : "☾ Dark"}
            </button>
          </h1>
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: theme.border, borderRadius: 0, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${overallPct}%`, background: "#3f8f5e", transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 13, color: theme.subtle, whiteSpace: "nowrap" }}>
              {solidTopics}/{totalTopics} solid · {overallPct}%
            </div>
          </div>
        </div>

        {PLAN.map((w) => {
          const prog = weekProgress(w.week, w.topics);
          const isActive = activeWeek === w.week;
          return (
            <div key={w.week} style={{ marginBottom: 12, border: `1px solid ${theme.border}`, background: theme.card }}>
              <button
                onClick={() => setActiveWeek(isActive ? 0 : w.week)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: theme.text,
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: theme.muted, letterSpacing: "0.1em" }}>WK{String(w.week).padStart(2,'0')}</span>
                  <span style={{ fontSize: 15, fontWeight: 500 }}>{w.title}</span>
                </span>
                <span style={{ fontSize: 12, color: theme.muted }}>
                  {prog.solid}/{prog.total} {isActive ? "−" : "+"}
                </span>
              </button>
              {isActive && (
                <div style={{ borderTop: `1px solid ${theme.border}` }}>
                  {w.topics.map((topic, idx) => {

                    const key = topicKey(w.week, idx);
                    const status = statuses[key] || "not started";
                    return (
                      <div
                        key={idx}
                        className="topic-row"
                        onClick={() => cycleStatus(w.week, idx)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px 16px",
                          cursor: "pointer",
                          borderTop: idx > 0 ? `1px solid ${theme.hover}` : "none",
                          fontSize: 14,
                        }}
                      >
                        <span style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: STATUS_COLOR[status], flexShrink: 0,
                          border: "1px solid #444",
                        }} />
                        <span style={{ flex: 1, color: status === "solid" ? theme.muted : theme.text, textDecoration: status === "solid" ? "line-through" : "none" }}>
                          {topic}
                        </span>
                        <span style={{ fontSize: 11, color: theme.muted, whiteSpace: "nowrap" }}>
                          {STATUS_LABEL[status]}
                        </span>
                      </div>
                    );
                  })}
                  <StudyBuddy week={w} theme={theme} />
                </div>
              )}
            </div>
          );
        })}

        <div style={{ marginTop: 24, border: `1px solid ${theme.border}`, background: theme.card, padding: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: "0.1em", color: theme.muted, textTransform: "uppercase", marginBottom: 12 }}>
            Practice Exam Scores
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <label style={{ flex: 1, fontSize: 13 }}>
              <div style={{ marginBottom: 6, color: theme.subtle }}>Exam 1 (Week 5)</div>
              <input
                type="text"
                value={scores.exam1}
                onChange={(e) => updateScore("exam1", e.target.value)}
                placeholder="e.g. 38/60"
                style={{
                  width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
                  color: theme.text, padding: "8px 10px", fontSize: 14, fontFamily: "inherit",
                }}
              />
            </label>
            <label style={{ flex: 1, fontSize: 13 }}>
              <div style={{ marginBottom: 6, color: theme.subtle }}>Exam 2 (Week 6)</div>
              <input
                type="text"
                value={scores.exam2}
                onChange={(e) => updateScore("exam2", e.target.value)}
                placeholder="e.g. 47/60"
                style={{
                  width: "100%", background: theme.bg, border: `1px solid ${theme.border}`,
                  color: theme.text, padding: "8px 10px", fontSize: 14, fontFamily: "inherit",
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: theme.footer, textAlign: "center" }}>
          Tap a topic to cycle: not started → shaky → solid. Progress saves automatically.
        </div>
      </div>
    </div>
  );
}
