import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="page-container" style={{ background: 'var(--bg-base)' }}>
      <nav className="landing-nav">
        <div className="brand-logo">GestureAI</div>
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
      </nav>
      
      <main className="content-wrapper">
        <h1 className="page-title">Terms of Service</h1>
        <div className="prose">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing the GestureAI platform, you agree to be bound by these industrial terms of service. This system is provided "as is" and intended for experimental and accessibility use cases.</p>
          
          <h2>2. Permitted Capabilities</h2>
          <p>You are granted a non-exclusive license to utilize the spatial inference engine. You agree not to reverse engineer the proprietary neural mapping models, decompile the WebGL rendering layer, or utilize the tool for malicious data scraping.</p>
          
          <h2>3. Service Modifications</h2>
          <p>We maintain the right to push over-the-air updates to the neural weights, modify heuristics, or deprecate older fallback layers without prior notice to ensure the system remains performant and secure.</p>
        </div>
      </main>
    </div>
  );
}
