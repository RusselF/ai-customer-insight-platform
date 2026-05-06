"use client";

import { useState, useEffect } from "react";

// --- Types ---
interface SentimentDist {
  positive: number;
  negative: number;
  neutral: number;
}

interface Topic {
  name: string;
  keywords: string[];
  score: number;
  dominant_sentiment: string;
}

interface Prediction {
  impact: string;
  engagement_trend: string;
  churn_risk: string;
  confidence: number;
}

interface TrendDay {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

interface KeywordInsightResult {
  keyword: string;
  total_analyzed: number;
  sentiment: SentimentDist;
  topics: Topic[];
  prediction: Prediction;
  combined_insight: string;
  trend: TrendDay[];
}

// --- Icons & UI Helpers ---
const TOPIC_ICONS: Record<string, string> = {
  "Login & Akses Aplikasi": "🔐",
  "Transfer & Transaksi": "💸",
  "Customer Service": "🎧",
  "Fitur Mobile Banking": "📱",
  "Produk & Bunga": "🏦",
};

// --- Sub-Components ---

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', borderRadius: 16, flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function TrendChart({ data }: { data: TrendDay[] }) {
  // Simple CSS-based area chart simulation using SVG
  const points = data.map((d, i) => `${i * 100},${100 - d.positive * 100}`).join(' ');
  return (
    <div style={{ width: '100%', height: 60, marginTop: 10 }}>
      <svg viewBox="0 0 600 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke="var(--accent-positive)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

export default function InsightDashboard() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordInsightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (kw?: string) => {
    const searchKw = kw || keyword;
    if (!searchKw.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ml/analyze-keyword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchKw.trim() }),
      });
      if (!res.ok) throw new Error("Gagal mengambil data insight.");
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const quickKeywords = ["BCA", "Gojek", "Tokopedia", "Shopee", "Grab"];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.02)', 
        borderBottom: '1px solid var(--border)', 
        padding: '2rem 1.5rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
          AI-Powered <span className="text-gradient">Customer Insight</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Real-time Sentiment, Topic Modeling, and Business Impact Prediction
        </p>

        {/* Search Box */}
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
          <input 
            type="text" 
            placeholder="Search Keyword (e.g. BCA, Gojek...)"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              flex: 1, padding: '1rem 1.5rem', borderRadius: 12, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', outline: 'none'
            }}
          />
          <button 
            onClick={() => handleSearch()}
            disabled={loading}
            style={{
              padding: '0 2rem', borderRadius: 12, border: 'none', 
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
              color: 'white', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
            }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {/* Quick Suggestions */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          {quickKeywords.map(kw => (
            <button 
              key={kw}
              onClick={() => { setKeyword(kw); handleSearch(kw); }}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: 20, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer'
              }}
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      <main style={{ maxWidth: 1100, margin: '2rem auto', padding: '0 1.5rem' }}>
        {error && (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
            ⚠️ {error}
          </div>
        )}

        {!result && !loading && (
          <div style={{ textAlign: 'center', padding: '5rem 0', opacity: 0.5 }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
            <h3>Enter a brand or keyword to start analysis</h3>
            <p>Get comprehensive business insights in seconds.</p>
          </div>
        )}

        {result && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Row 1: Summary Stats */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <StatCard label="Positive" value={`${Math.round(result.sentiment.positive * 100)}%`} color="var(--accent-positive)" icon="😊" />
              <StatCard label="Negative" value={`${Math.round(result.sentiment.negative * 100)}%`} color="var(--accent-negative)" icon="😠" />
              <StatCard label="Neutral" value={`${Math.round(result.sentiment.neutral * 100)}%`} color="var(--accent-neutral)" icon="😐" />
              <StatCard label="Total Mentions" value={result.total_analyzed.toString()} color="var(--accent-blue)" icon="📊" />
            </div>

            {/* Row 2: Prediction & Trend */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              
              {/* Prediction Panel */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 20 }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>🚀 Business Prediction</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                   <div style={{ 
                     width: 60, height: 60, borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                   }}>
                     {result.prediction.engagement_trend === 'up' ? '📈' : '📉'}
                   </div>
                   <div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Engagement Trend</div>
                     <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                       Expected {result.prediction.engagement_trend.toUpperCase()}
                     </div>
                   </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Churn Risk</span>
                    <span style={{ fontWeight: 700, color: result.prediction.churn_risk === 'high' ? '#ef4444' : '#10b981' }}>
                      {result.prediction.churn_risk.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Confidence Score</span>
                    <span style={{ fontWeight: 700 }}>{Math.round(result.prediction.confidence * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Trend Panel */}
              <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 20 }}>
                <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>📅 7-Day Sentiment Trend</h3>
                <TrendChart data={result.trend} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>{result.trend[0].date}</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            {/* Row 3: Trending Topics */}
            <div className="glass-card" style={{ padding: '1.5rem', borderRadius: 20 }}>
              <h3 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '1rem' }}>🔥 Trending Topics Analysis</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem' }}>Topic</th>
                      <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem' }}>Keywords</th>
                      <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem' }}>Dominant Sentiment</th>
                      <th style={{ padding: '1rem 0.5rem', fontSize: '0.8rem' }}>Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.topics.map((topic, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                          {TOPIC_ICONS[topic.name] || '💬'} {topic.name}
                        </td>
                        <td style={{ padding: '1rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {topic.keywords.join(', ')}
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                          <span style={{ 
                            padding: '0.2rem 0.6rem', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
                            background: topic.dominant_sentiment === 'positive' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: topic.dominant_sentiment === 'positive' ? '#10b981' : '#ef4444'
                          }}>
                            {topic.dominant_sentiment.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 0.5rem' }}>
                           <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                             <div style={{ width: `${topic.score * 100}%`, height: '100%', background: 'var(--accent-blue)', borderRadius: 2 }}></div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Combined AI Insight Box */}
            <div style={{ 
              padding: '2rem', borderRadius: 20, 
              background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))',
              border: '1px solid rgba(168,85,247,0.2)', position: 'relative', overflow: 'hidden'
            }}>
               <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '8rem', opacity: 0.05 }}>🧠</div>
               <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <span>💡</span> Combined Strategic Insight
               </h3>
               <p style={{ fontSize: '1.15rem', lineHeight: 1.6, fontWeight: 500, fontStyle: 'italic', color: '#d8b4fe' }}>
                 "{result.combined_insight}"
               </p>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
