'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, BrainCircuit, Activity, Code, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className="page-container" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="brand-logo">GestureAI</div>
        <div className="nav-links">
          <Link href="/motives">Motives</Link>
          <Link href="/team">Team</Link>
          <Link href="/about">About</Link>
          <button className="ghost-btn">Sign In</button>
          <button 
            onClick={() => router.push('/live')} 
            style={{ 
              background: 'var(--text-primary)', 
              color: 'var(--bg-base)', 
              border: 'none', 
              padding: '0.6rem 1.5rem', 
              borderRadius: '99px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Launch Engine <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="content-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '80vh', padding: '0 2rem' }}>
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          <motion.div variants={itemVariants} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '99px', 
            background: 'var(--accent-soft)', 
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: '0.85rem',
            marginBottom: '2rem'
          }}>
            <Zap size={14} /> Core V15 Active
          </motion.div>
          
          <motion.h1 variants={itemVariants} style={{ fontSize: '4.5rem', fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.1, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
            The Future of <br />
            <span style={{ background: 'var(--grad-accent)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Spatial Computing</span>
          </motion.h1>
          
          <motion.p variants={itemVariants} style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
            A frictionless, browser-native intelligence that decodes human kinetic motion into semantic language and spatial code at 120 FPS. No hardware required.
          </motion.p>
          
          <motion.div variants={itemVariants}>
            <button 
              onClick={() => router.push('/live')}
              style={{
                background: 'var(--text-primary)',
                color: 'var(--bg-base)',
                padding: '1rem 2.5rem',
                borderRadius: '99px',
                fontSize: '1.1rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Enter Live Engine <ArrowRight size={20} />
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* USP Grid */}
      <section style={{ padding: '6rem 2rem', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: '1rem' }}>Industrial Infrastructure</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Next-generation capabilities powered by client-side WebGL acceleration.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {/* Cards */}
            <div className="team-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '2rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem', color: 'var(--accent)' }}>
                <BrainCircuit size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Neural Translation</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Instantaneous decoding of ASL and ISL using advanced heuristic fallback mapping.</p>
            </div>

            <div className="team-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '2rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem', color: 'var(--accent)' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>120FPS Tracking</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>Hyper-optimized WebGL rendering pipeline ensures zero latency on standard devices.</p>
            </div>

            <div className="team-card" style={{ alignItems: 'flex-start', textAlign: 'left', padding: '2rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1rem', color: 'var(--accent)' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Absolute Privacy</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>All inference runs strictly on the client. No video data ever leaves your device.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <h2>Ready to experience the future?</h2>
          <button 
            onClick={() => router.push('/live')} 
            style={{ 
              background: 'var(--accent)', 
              color: '#fff', 
              border: 'none', 
              padding: '0.8rem 2rem', 
              borderRadius: '99px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem'
            }}
          >
            Enter Live Engine <ArrowRight size={16} />
          </button>
        </div>
        
        <div className="footer-links">
          <Link href="/about">About</Link>
          <Link href="/team">Team</Link>
          <Link href="/motives">Motives</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} GestureAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
