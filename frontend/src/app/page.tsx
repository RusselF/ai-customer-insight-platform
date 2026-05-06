"use client";

import { useState } from "react";

// --- Type Definitions ---
interface SentimentData {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
}

interface TopicData {
  dominant_topic: string;
  topic_index: number;
  topic_distribution: Record<string, number>;
}

interface BusinessImpactData {
  impact: string;
  impact_class: number;
  confidence: number;
  probabilities: Record<string, number>;
}

interface AnalyzeAllResult {
  sentiment: SentimentData;
  topic: TopicData;
  business_impact: BusinessImpactData;
}

// --- Helper Functions ---
const getSentimentConfig = (prediction: string) => {
  const p = prediction?.toLowerCase();
  if (p === "positive" || p === "positif")
    return {
      label: "Positive",
      emoji: "😊",
      color: "var(--accent-positive)",
      bgColor: "rgba(16, 185, 129, 0.1)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      barColor: "#10b981",
    };
  if (p === "negative" || p === "negatif")
    return {
      label: "Negative",
      emoji: "😠",
      color: "var(--accent-negative)",
      bgColor: "rgba(239, 68, 68, 0.1)",
      borderColor: "rgba(239, 68, 68, 0.3)",
      barColor: "#ef4444",
    };
  return {
    label: "Neutral",
    emoji: "😐",
    color: "var(--accent-neutral)",
    bgColor: "rgba(245, 158, 11, 0.1)",
    borderColor: "rgba(245, 158, 11, 0.3)",
    barColor: "#f59e0b",
  };
};

const getBusinessImpactConfig = (impact: string) => {
  if (impact === "High Impact")
    return {
      emoji: "🔥",
      color: "#f97316",
      bgColor: "rgba(249, 115, 22, 0.1)",
      borderColor: "rgba(249, 115, 22, 0.3)",
      description: "This feedback may significantly affect business performance.",
    };
  return {
    emoji: "📉",
    color: "#6366f1",
    bgColor: "rgba(99, 102, 241, 0.1)",
    borderColor: "rgba(99, 102, 241, 0.3)",
    description: "This feedback has low expected impact on business metrics.",
  };
};

const TOPIC_ICONS: Record<string, string> = {
  "Login & Akses Aplikasi": "🔐",
  "Transfer & Transaksi": "💸",
  "Customer Service": "🎧",
  "Fitur Mobile Banking": "📱",
  "Produk & Bunga": "🏦",
};

const formatProbLabel = (key: string) => {
  const map: Record<string, string> = {
    positive: "Positive", positif: "Positive",
    negative: "Negative", negatif: "Negative",
    neutral: "Neutral", netral: "Neutral",
  };
  return map[key.toLowerCase()] ?? key;
};

const getProbColor = (key: string) => {
  const k = key.toLowerCase();
  if (k === "positive" || k === "positif") return "#10b981";
  if (k === "negative" || k === "negatif") return "#ef4444";
  return "#f59e0b";
};

// --- Sub Components ---
function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "1.25rem 2rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(255,255,255,0.02)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: 36, height: 36,
          background: "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18,
        }}
      >
        🧠
      </div>
      <div>
        <h1 style={{ fontSize: "1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
          Customer Insight AI
        </h1>
        <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: 1 }}>
          Sentiment · Topic · Business Impact
        </p>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 7, height: 7, background: "#10b981",
            borderRadius: "50%", display: "inline-block",
            animation: "pulse-ring 2s ease-out infinite",
          }}
        />
        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>ML Service Active</span>
      </div>
    </header>
  );
}

function LoadingSpinner() {
  return (
    <svg className="loading-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function ConfidenceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "0.78rem", color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div
          className="score-bar"
          style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${color}aa, ${color})`, "--target-width": `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

// --- Card: Sentiment ---
function SentimentCard({ data }: { data: SentimentData }) {
  const config = getSentimentConfig(data.prediction);
  const pct = Math.round(data.confidence * 100);

  return (
    <div className="animate-fade-in-up" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Badge */}
      <div
        className="glass-card animate-fade-in-up animate-delay-100"
        style={{
          borderRadius: 16, padding: "1.5rem",
          background: config.bgColor, borderColor: config.borderColor,
          display: "flex", alignItems: "center", gap: "1.25rem",
        }}
      >
        <div style={{ width: 60, height: 60, borderRadius: 14, background: config.bgColor, border: `2px solid ${config.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
          {config.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Sentiment Detected
          </p>
          <p style={{ fontSize: "1.6rem", fontWeight: 800, color: config.color, lineHeight: 1.2, marginTop: 4 }}>
            {config.label}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
            Confidence
          </p>
          <p style={{ fontSize: "2rem", fontWeight: 800, color: config.color, lineHeight: 1.2, marginTop: 4 }}>
            {pct}%
          </p>
        </div>
      </div>

      {/* Probability Breakdown */}
      <div className="glass-card animate-fade-in-up animate-delay-200" style={{ borderRadius: 16, padding: "1.25rem" }}>
        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "1rem" }}>
          Probability Breakdown
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {Object.entries(data.probabilities)
            .sort(([, a], [, b]) => b - a)
            .map(([key, val]) => (
              <ConfidenceBar key={key} label={formatProbLabel(key)} value={val} color={getProbColor(key)} />
            ))}
        </div>
      </div>
    </div>
  );
}

// --- Card: Topic Modeling ---
function TopicCard({ data }: { data: TopicData }) {
  const icon = TOPIC_ICONS[data.dominant_topic] ?? "💬";
  const entries = Object.entries(data.topic_distribution).sort(([, a], [, b]) => b - a);

  return (
    <div className="glass-card animate-fade-in-up animate-delay-300" style={{ borderRadius: 16, padding: "1.5rem" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "1rem" }}>
        🗂️ Topic Analysis
      </p>

      {/* Dominant Topic Badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.875rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 12, marginBottom: "1rem" }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <div>
          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Dominant Topic</p>
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#a5b4fc", marginTop: 2 }}>{data.dominant_topic}</p>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Score</p>
          <p style={{ fontSize: "1.2rem", fontWeight: 800, color: "#6366f1" }}>
            {Math.round(data.topic_distribution[data.dominant_topic] * 100)}%
          </p>
        </div>
      </div>

      {/* Topic Distribution */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {entries.map(([topic, score]) => (
          <ConfidenceBar key={topic} label={`${TOPIC_ICONS[topic] ?? "💬"} ${topic}`} value={score} color="#6366f1" />
        ))}
      </div>
    </div>
  );
}

// --- Card: Business Impact ---
function BusinessImpactCard({ data }: { data: BusinessImpactData }) {
  const config = getBusinessImpactConfig(data.impact);
  const pct = Math.round(data.confidence * 100);

  return (
    <div className="glass-card animate-fade-in-up animate-delay-400" style={{ borderRadius: 16, padding: "1.5rem" }}>
      <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: "1rem" }}>
        📈 Business Impact Prediction
      </p>

      {/* Impact Badge */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem",
        background: config.bgColor, border: `1px solid ${config.borderColor}`, borderRadius: 12, marginBottom: "1rem"
      }}>
        <span style={{ fontSize: 32 }}>{config.emoji}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Predicted Impact</p>
          <p style={{ fontSize: "1.3rem", fontWeight: 800, color: config.color, marginTop: 2 }}>{data.impact}</p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 4 }}>{config.description}</p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase" }}>Confidence</p>
          <p style={{ fontSize: "1.5rem", fontWeight: 800, color: config.color }}>{pct}%</p>
        </div>
      </div>

      {/* Impact probability bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {Object.entries(data.probabilities)
          .sort(([, a], [, b]) => b - a)
          .map(([label, prob]) => (
            <ConfidenceBar key={label} label={label} value={prob} color={label === "High Impact" ? "#f97316" : "#6366f1"} />
          ))}
      </div>
    </div>
  );
}

// --- Main Page ---
export default function DashboardPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeAllResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/ml/analyze-all`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: text.trim() }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message ?? `Server error: ${res.status}`);
      }

      const data: AnalyzeAllResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError(null);
  };

  const charCount = text.length;
  const maxChars = 500;

  return (
    <>
      <Header />

      <main
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "2.5rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Page Title */}
        <div className="animate-fade-in-up">
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}>
            Customer Insight Dashboard
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: 4 }}>
            Analyze customer reviews to get Sentiment, Topic, and Business Impact insights — powered by ML.
          </p>
        </div>

        {/* Input Card */}
        <div
          className="glass-card animate-fade-in-up animate-delay-100"
          style={{ borderRadius: 18, padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          <label
            htmlFor="review-input"
            style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            Customer Review / Feedback
          </label>
          <textarea
            id="review-input"
            value={text}
            onChange={(e) => {
              if (e.target.value.length <= maxChars) setText(e.target.value);
            }}
            placeholder="e.g. Pelayanan sangat ramah dan responsif, tapi antrian kasirnya terlalu panjang..."
            rows={5}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "0.875rem 1rem",
              color: "var(--text-primary)",
              fontSize: "0.9rem",
              resize: "vertical",
              outline: "none",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.6,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
          />

          {/* Char count + buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.72rem", color: charCount > maxChars * 0.9 ? "var(--accent-negative)" : "var(--text-secondary)" }}>
              {charCount} / {maxChars}
            </span>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {(text || result) && (
                <button
                  id="clear-btn"
                  onClick={handleClear}
                  style={{
                    padding: "0.6rem 1.2rem", borderRadius: 10,
                    border: "1px solid var(--border)", background: "transparent",
                    color: "var(--text-secondary)", fontSize: "0.82rem", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "Inter, sans-serif",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                  Clear
                </button>
              )}
              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                style={{
                  padding: "0.6rem 1.5rem", borderRadius: 10, border: "none",
                  background: loading || !text.trim() ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, var(--accent-blue), var(--accent-purple))",
                  color: loading || !text.trim() ? "rgba(255,255,255,0.4)" : "#fff",
                  fontSize: "0.82rem", fontWeight: 600,
                  cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.2s",
                  boxShadow: loading || !text.trim() ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {loading ? <LoadingSpinner /> : <span>⚡</span>}
                {loading ? "Analyzing..." : "Analyze All Insights"}
              </button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            className="glass-card animate-fade-in-up"
            style={{
              borderRadius: 14, padding: "1rem 1.25rem",
              background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.25)",
              display: "flex", alignItems: "flex-start", gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "#ef4444" }}>Analysis Failed</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 2 }}>{error}</p>
            </div>
          </div>
        )}

        {/* Results — Three insight cards */}
        {result && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <SentimentCard data={result.sentiment} />
            <TopicCard data={result.topic} />
            <BusinessImpactCard data={result.business_impact} />
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div
            className="glass-card animate-fade-in-up animate-delay-200"
            style={{
              borderRadius: 18, padding: "3rem 1.5rem",
              textAlign: "center", display: "flex",
              flexDirection: "column", alignItems: "center", gap: "0.75rem",
            }}
          >
            <div style={{ fontSize: 48, opacity: 0.4 }}>🧠</div>
            <p style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Full Insight Results will appear here
            </p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", opacity: 0.6 }}>
              Sentiment · Topic · Business Impact — all in one analysis
            </p>
          </div>
        )}
      </main>
    </>
  );
}
