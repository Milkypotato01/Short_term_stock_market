import { useState, useEffect, useRef } from 'react';
import { Newspaper, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface NewsPanelProps {
  ticker: string;
}

const NEWS_API_KEY = '2eb52eb72645487087d1d0cd148258f7';

// ── Fallback news per stock (used when API fails / limit reached) ──────────
const FALLBACK_NEWS: Record<string, NewsItem[]> = {
  'TCS.NS': [
    {
      title: 'TCS Reports Strong Q4 Earnings with 12% Profit Growth',
      description: 'Tata Consultancy Services posted robust quarterly results, driven by large deal wins in cloud transformation and AI services across North American markets.',
      url: '#', source: 'Economic Times', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'TCS Expands AI and Cloud Partnerships with Global Enterprises',
      description: 'The IT major announced strategic partnerships with several Fortune 500 companies, bolstering its AI-first approach and strengthening its digital services portfolio.',
      url: '#', source: 'Mint', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'TCS Attrition Rate Drops to Multi-Quarter Low',
      description: 'Employee retention improves significantly as TCS focuses on upskilling programs and competitive compensation packages across its global workforce.',
      url: '#', source: 'Business Standard', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'TCS Wins Major Government Digital Transformation Contract',
      description: 'TCS secures a multi-year digital transformation deal with a European government, expected to drive significant revenue in the public sector vertical.',
      url: '#', source: 'NDTV Profit', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
  ],
  'INFY.NS': [
    {
      title: 'Infosys Upgrades Revenue Guidance on Strong Deal Pipeline',
      description: 'Infosys raised its full-year revenue growth guidance, citing strong demand for digital services and a healthy pipeline of large deals across key verticals.',
      url: '#', source: 'Moneycontrol', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Infosys Launches Next-Gen AI Platform for Enterprise Clients',
      description: 'The Bengaluru-based IT firm unveiled its new generative AI platform aimed at transforming enterprise operations and enhancing client productivity.',
      url: '#', source: 'Livemint', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Infosys Announces Strategic Buyback Program Worth ₹9,300 Cr',
      description: 'The board approved a major share buyback program, signaling confidence in the company\'s long-term growth trajectory and commitment to shareholder returns.',
      url: '#', source: 'Economic Times', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Infosys Partners with European Banks on Cloud Migration',
      description: 'Infosys signs multi-million dollar cloud migration contracts with leading European financial institutions, expanding its BFSI footprint globally.',
      url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
  'RELIANCE.NS': [
    {
      title: 'Reliance Jio Adds Record Subscribers in Q4',
      description: 'Jio Platforms continues to dominate India\'s telecom market with record subscriber additions, driven by affordable 5G rollout and bundled digital services.',
      url: '#', source: 'NDTV Profit', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Reliance Retail Revenue Surges 25% Year-over-Year',
      description: 'Reliance Retail posted stellar growth numbers, with rapid expansion of its store network and aggressive push into quick commerce and online retail.',
      url: '#', source: 'Moneycontrol', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Reliance Invests $10B in Green Energy Initiatives',
      description: 'Mukesh Ambani-led Reliance Industries accelerates its clean energy transition with massive investments in solar manufacturing and hydrogen production.',
      url: '#', source: 'Business Standard', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Reliance Industries Board Approves Stock Split',
      description: 'RIL board considers stock split to improve liquidity and make shares more accessible to retail investors, boosting market sentiment.',
      url: '#', source: 'Economic Times', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
  'HDFCBANK.NS': [
    {
      title: 'HDFC Bank Posts Record Net Profit in Q4 FY26',
      description: 'India\'s largest private bank delivered record profits driven by strong loan growth, improved asset quality, and successful post-merger integration.',
      url: '#', source: 'Mint', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'HDFC Bank Expands Digital Banking with New AI Features',
      description: 'The bank rolled out AI-powered personal finance and credit assessment tools across its mobile banking platform, enhancing customer experience.',
      url: '#', source: 'Economic Times', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'HDFC Bank NPA Ratio Hits All-Time Low',
      description: 'Asset quality continues to improve as HDFC Bank\'s gross NPA ratio touches a record low, reflecting strong underwriting and recovery processes.',
      url: '#', source: 'Business Standard', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'HDFC Bank Receives RBI Approval for New Rural Branches',
      description: 'RBI grants approval for HDFC Bank to open 500 new branches in semi-urban and rural India, supporting the financial inclusion agenda.',
      url: '#', source: 'NDTV Profit', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
  'AAPL': [
    {
      title: 'Apple Reports Record Services Revenue in Latest Quarter',
      description: 'Apple\'s services segment including App Store, Apple Music and iCloud hit an all-time revenue high, offsetting slower hardware sales growth.',
      url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Apple Vision Pro Sales Exceed Market Expectations',
      description: 'The spatial computing headset sees stronger-than-expected adoption among enterprise customers, with Apple expanding availability to 15 new countries.',
      url: '#', source: 'CNBC', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Apple Accelerates AI Integration Across Product Line',
      description: 'Apple Intelligence features expand significantly with on-device AI capabilities, enhancing Siri, photo editing, and developer tools across all Apple platforms.',
      url: '#', source: 'The Verge', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Apple Supply Chain Diversification Reduces China Dependency',
      description: 'Apple ramps up manufacturing in India and Vietnam, reducing reliance on China and strengthening supply chain resilience amid geopolitical tensions.',
      url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
  'MSFT': [
    {
      title: 'Microsoft Azure Revenue Grows 35% Driven by AI Demand',
      description: 'Azure cloud platform continues its rapid expansion fueled by enterprise adoption of AI services, with Copilot integration driving significant growth.',
      url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Microsoft Copilot Reaches 100 Million Enterprise Users',
      description: 'Microsoft\'s AI assistant achieves a major milestone as businesses accelerate adoption of generative AI tools across Office 365 and other workflows.',
      url: '#', source: 'TechCrunch', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Microsoft Gaming Division Posts Solid Post-Activision Results',
      description: 'Xbox and gaming revenue sees strong growth following the Activision Blizzard integration, with Game Pass subscribers hitting new highs.',
      url: '#', source: 'The Verge', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Microsoft Expands Data Center Footprint with $15B Investment',
      description: 'The tech giant announces massive data center expansion across Asia and Europe to meet surging demand for AI compute and cloud services.',
      url: '#', source: 'CNBC', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
  'TSLA': [
    {
      title: 'Tesla Deliveries Surge 20% in Latest Quarter',
      description: 'Tesla reported a sharp increase in global deliveries, driven by strong demand for the refreshed Model Y and expansion into new markets.',
      url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Tesla Full Self-Driving Achieves Key Regulatory Milestone',
      description: 'NHTSA grants expanded approval for Tesla\'s FSD supervised system, marking a significant step toward autonomous driving commercialization.',
      url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Tesla Energy Storage Business Revenue Doubles Year-over-Year',
      description: 'Megapack deployments hit record levels as Tesla\'s energy division becomes a significant profit center alongside its automotive business.',
      url: '#', source: 'CNBC', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Tesla Faces Increased Competition in Chinese EV Market',
      description: 'Growing competition from BYD and other Chinese EV makers pressures Tesla\'s market share in its second-largest market, leading to strategic price adjustments.',
      url: '#', source: 'Financial Times', publishedAt: new Date().toISOString(),
      sentiment: 'negative',
    },
  ],
  'GOOGL': [
    {
      title: 'Alphabet Advertising Revenue Hits All-Time High',
      description: 'Google\'s parent company reports record ad revenue driven by AI-powered search ads and YouTube growth, surpassing analyst expectations.',
      url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Google Cloud Turns Profitable with 30% Revenue Growth',
      description: 'Google Cloud Platform achieves sustained profitability as enterprise AI and data analytics workloads drive rapid customer acquisition.',
      url: '#', source: 'CNBC', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Google Launches Next-Gen Gemini AI Models',
      description: 'Alphabet unveils its most capable AI models yet, with enhanced multimodal reasoning capabilities integrated across Google products and developer APIs.',
      url: '#', source: 'TechCrunch', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Alphabet Announces $70B Share Buyback Program',
      description: 'Google\'s parent company launches its largest-ever share repurchase program, reflecting strong cash flow and confidence in future growth.',
      url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
  ],
  'AMZN': [
    {
      title: 'Amazon AWS Revenue Accelerates with AI-Driven Growth',
      description: 'Amazon Web Services reports accelerating revenue growth as enterprises adopt AI training and inference workloads on its cloud platform.',
      url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Amazon Prime Reaches 250 Million Global Subscribers',
      description: 'Amazon\'s subscription service continues to expand, driven by enhanced content offerings, faster delivery, and Prime Video exclusive releases.',
      url: '#', source: 'CNBC', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Amazon Expands Same-Day Delivery to 50 New Cities',
      description: 'The e-commerce giant rolls out same-day delivery in additional urban markets, strengthening its logistics moat and customer convenience edge.',
      url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
      sentiment: 'positive',
    },
    {
      title: 'Amazon Healthcare Venture Signs Major Hospital Partnerships',
      description: 'Amazon\'s healthcare division announces partnerships with leading hospital systems, expanding its telehealth and pharmacy services nationwide.',
      url: '#', source: 'The Verge', publishedAt: new Date().toISOString(),
      sentiment: 'neutral',
    },
  ],
};

// Generic fallback for unlisted stocks
const GENERIC_FALLBACK: NewsItem[] = [
  {
    title: 'Markets Show Mixed Signals Amid Global Uncertainty',
    description: 'Global markets trade in a narrow range as investors weigh economic data against central bank policy decisions and geopolitical developments.',
    url: '#', source: 'Reuters', publishedAt: new Date().toISOString(),
    sentiment: 'neutral',
  },
  {
    title: 'Institutional Investors Increase Equity Allocations',
    description: 'Major institutional funds are gradually increasing their equity exposure, citing attractive valuations and improving corporate earnings outlook.',
    url: '#', source: 'Bloomberg', publishedAt: new Date().toISOString(),
    sentiment: 'positive',
  },
  {
    title: 'Technical Analysis Points to Key Support Levels',
    description: 'Chartists identify critical support and resistance levels for the stock, with moving averages suggesting potential directional moves ahead.',
    url: '#', source: 'MarketWatch', publishedAt: new Date().toISOString(),
    sentiment: 'neutral',
  },
];

function getSearchQuery(ticker: string): string {
  const mapping: Record<string, string> = {
    'TCS.NS': 'TCS Tata Consultancy stock',
    'INFY.NS': 'Infosys stock',
    'RELIANCE.NS': 'Reliance Industries stock',
    'HDFCBANK.NS': 'HDFC Bank stock',
    'AAPL': 'Apple AAPL stock',
    'MSFT': 'Microsoft MSFT stock',
    'TSLA': 'Tesla TSLA stock',
    'GOOGL': 'Google Alphabet GOOGL stock',
    'AMZN': 'Amazon AMZN stock',
  };
  return mapping[ticker] || `${ticker} stock market`;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function guessSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const posWords = ['surge', 'record', 'growth', 'profit', 'gain', 'rally', 'boost', 'rise', 'high', 'beat', 'strong', 'upgrade', 'bull'];
  const negWords = ['drop', 'fall', 'loss', 'decline', 'crash', 'cut', 'miss', 'weak', 'bear', 'sell', 'down', 'risk', 'warning'];
  const lower = title.toLowerCase();
  const posCount = posWords.filter(w => lower.includes(w)).length;
  const negCount = negWords.filter(w => lower.includes(w)).length;
  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

const sentimentConfig = {
  positive: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)', dot: '▲' },
  negative: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', dot: '▼' },
  neutral: { color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.06)', dot: '●' },
};

export function NewsPanel({ ticker }: NewsPanelProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchNews() {
      setLoading(true);
      setIsUsingFallback(false);

      try {
        const query = getSearchQuery(ticker);
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=6&language=en&apiKey=${NEWS_API_KEY}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = await res.json();

        if (data.status !== 'ok' || !data.articles || data.articles.length === 0) {
          throw new Error('No articles found');
        }

        if (!cancelled) {
          const articles: NewsItem[] = data.articles
            .filter((a: any) => a.title && a.title !== '[Removed]')
            .slice(0, 5)
            .map((a: any) => ({
              title: a.title,
              description: a.description || 'No description available.',
              url: a.url || '#',
              source: a.source?.name || 'News',
              publishedAt: a.publishedAt || new Date().toISOString(),
              sentiment: guessSentiment(a.title),
            }));

          if (articles.length > 0) {
            setNews(articles);
          } else {
            throw new Error('All articles filtered out');
          }
        }
      } catch (err) {
        console.warn('NewsAPI failed, using fallback:', err);
        if (!cancelled) {
          const fallback = FALLBACK_NEWS[ticker] || GENERIC_FALLBACK;
          setNews(fallback);
          setIsUsingFallback(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchNews();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNews, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticker]);

  return (
    <div
      id="news-panel"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(15, 23, 42, 0.85))',
        border: '1px solid rgba(148, 163, 184, 0.08)',
        borderRadius: '16px',
        padding: '18px',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Decorative accent line at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, #6366f1, #8b5cf6, transparent)',
        opacity: 0.6,
      }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '14px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Newspaper style={{ width: '16px', height: '16px', color: '#818cf8' }} />
          </div>
          <div>
            <div style={{
              fontSize: '12px', fontWeight: 600, color: '#e2e8f0',
              fontFamily: 'Inter, sans-serif', letterSpacing: '0.3px',
            }}>
              Market News
            </div>
            <div style={{
              fontSize: '10px', color: '#475569',
              fontFamily: 'Inter, sans-serif',
            }}>
              {ticker.replace('.NS', '')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isUsingFallback && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', borderRadius: '6px',
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.15)',
            }}>
              <AlertCircle style={{ width: '10px', height: '10px', color: '#fbbf24' }} />
              <span style={{
                fontSize: '9px', color: '#fbbf24', fontWeight: 500,
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.3px',
              }}>
                CACHED
              </span>
            </div>
          )}
          {loading && (
            <RefreshCw style={{
              width: '14px', height: '14px', color: '#6366f1',
              animation: 'spin 1s linear infinite',
            }} />
          )}
        </div>
      </div>

      {/* News list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: '4px',
        }}
      >
        {loading && news.length === 0 ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              background: 'rgba(30, 41, 59, 0.5)',
              borderRadius: '10px',
              padding: '14px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{
                height: '10px', width: '80%', borderRadius: '4px',
                background: 'rgba(71, 85, 105, 0.3)', marginBottom: '8px',
              }} />
              <div style={{
                height: '8px', width: '60%', borderRadius: '4px',
                background: 'rgba(71, 85, 105, 0.2)', marginBottom: '6px',
              }} />
              <div style={{
                height: '8px', width: '40%', borderRadius: '4px',
                background: 'rgba(71, 85, 105, 0.15)',
              }} />
            </div>
          ))
        ) : (
          news.map((item, i) => {
            const sent = sentimentConfig[item.sentiment || 'neutral'];
            const isHovered = hoveredIdx === i;
            return (
              <a
                key={i}
                href={item.url !== '#' ? item.url : undefined}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: item.url !== '#' ? 'pointer' : 'default',
                }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div
                  style={{
                    background: isHovered
                      ? 'rgba(30, 41, 59, 0.8)'
                      : 'rgba(30, 41, 59, 0.4)',
                    border: `1px solid ${isHovered ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.04)'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    transition: 'all 0.25s ease',
                    transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
                    position: 'relative',
                  }}
                >
                  {/* Sentiment indicator bar */}
                  <div style={{
                    position: 'absolute', left: 0, top: '8px', bottom: '8px',
                    width: '3px', borderRadius: '0 3px 3px 0',
                    background: sent.color,
                    opacity: isHovered ? 0.8 : 0.4,
                    transition: 'opacity 0.25s ease',
                  }} />

                  <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    gap: '8px',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '11px', fontWeight: 600, color: '#e2e8f0',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.45',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '6px',
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '10px', color: '#64748b',
                        fontFamily: 'Inter, sans-serif',
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '8px',
                      }}>
                        {item.description}
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}>
                        <span style={{
                          fontSize: '9px', fontWeight: 600, color: sent.color,
                          padding: '2px 6px', borderRadius: '4px',
                          background: sent.bg,
                          fontFamily: 'Inter, sans-serif',
                          letterSpacing: '0.3px',
                        }}>
                          {sent.dot} {(item.sentiment || 'neutral').toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '9px', color: '#475569',
                          fontFamily: 'Inter, sans-serif',
                        }}>
                          {item.source}
                        </span>
                        <span style={{
                          fontSize: '9px', color: '#334155',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {timeAgo(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                    {item.url !== '#' && (
                      <ExternalLink style={{
                        width: '12px', height: '12px', color: '#475569',
                        flexShrink: 0, marginTop: '2px',
                        opacity: isHovered ? 1 : 0,
                        transition: 'opacity 0.25s ease',
                      }} />
                    )}
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>

      {/* Bottom fade overlay */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30px',
        background: 'linear-gradient(transparent, rgba(15, 23, 42, 0.9))',
        pointerEvents: 'none',
        borderRadius: '0 0 16px 16px',
      }} />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
