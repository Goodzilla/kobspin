import { useState } from 'react';

export default function Faq({ onBack }) {
  const faqData = [
    {
      id: 'storage',
      question: 'Where is my custom wheel configuration data stored?',
      answer: 'All your custom spinner configurations, segment weights, and option lives are saved directly in your browser\'s local storage (`localStorage`). This means your wheels never leave your device: they are fully stored on your machine, completely private, and only accessible by you. No cloud database, no tracking, just pure local persistence.'
    },
    {
      id: 'made',
      question: 'How was this website built?',
      answer: 'KobSpin was built from the ground up utilizing the power of the Gemini 3.5 Flash model, coded collaboratively via the Antigravity AI coding agent, and is hosted on Netlify.'
    },
    {
      id: 'privacy',
      question: 'What is the privacy and tracking policy?',
      answer: 'To put it bluntly: we do NOT care about collecting your personal data. There is absolutely no background telemetry, zero advertising trackers, no cookies, and no tracking BS. What you spin and configure remains entirely your own business.'
    },
    {
      id: 'author',
      question: 'Who created KobSpin?',
      answer: 'KobSpin was created by Heikob! You can find me over at Twitch: twitch.tv/Heikob.'
    },
    {
      id: 'nesting',
      question: 'Can I nest multiple wheels together?',
      answer: 'Yes! KobSpin supports deep multi-layer nesting. You can configure an option on your parent wheel to load a linked sub-wheel (e.g. 5 Gifted -> 10 Gifted). Symmetrical flame transitions will play automatically, and the final nested winner will be displayed in a vertical timeline rundown when returning to the parent wheel.'
    },
    {
      id: 'stream',
      question: 'Is KobSpin free to use on stream?',
      answer: 'Yes! KobSpin is 100% free and open. The UI features responsive layout structures and high-performance HTML5 Canvas rendering, making it ideal for streamers to capture in OBS (via Window Capture) for giveaways, subathons, and interactive viewer punishments.'
    }
  ];

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (id) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  return (
    <div className="faq-page animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', position: 'relative' }}>
      
      {/* Background glow spotlight */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '600px',
        height: '350px',
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.02) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: -1
      }} />

      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '32px' }}>
        <button onClick={onBack} className="btn btn-secondary">
          Back to Home
        </button>
      </div>

      <header style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #ffffff 40%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          Frequently Asked Questions
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '1.05rem' }}>
          Have questions about KobSpin? Find answers below.
        </p>
      </header>

      {/* Accordion Questions Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {faqData.map((faq) => {
          const isOpen = activeFaq === faq.id;
          return (
            <div 
              key={faq.id}
              className="glass-panel"
              onClick={() => toggleFaq(faq.id)}
              style={{
                padding: '24px 28px',
                cursor: 'pointer',
                borderLeft: isOpen ? '4px solid var(--color-accent)' : '1px solid var(--border-glass)',
                backgroundColor: isOpen ? 'rgba(255, 255, 255, 0.04)' : 'var(--bg-glass)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: 650,
                  color: isOpen ? '#fff' : 'var(--color-text-primary)',
                  margin: 0,
                  transition: 'color 0.2s'
                }}>
                  {faq.question}
                </h3>
                <span style={{
                  fontSize: '1.2rem',
                  color: isOpen ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  transform: isOpen ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.3s, color 0.2s'
                }}>
                  ＋
                </span>
              </div>

              {isOpen && (
                <div className="animate-fade-in" style={{ 
                  marginTop: '16px', 
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                  fontSize: '0.98rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  paddingTop: '16px'
                }}>
                  {faq.id === 'author' ? (
                    <span>
                      KobSpin was created by Heikob! You can find me over at Twitch: <a href="https://twitch.tv/Heikob" target="_blank" rel="noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 600 }}>twitch.tv/Heikob</a>.
                    </span>
                  ) : faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
