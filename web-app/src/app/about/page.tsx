import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="page-container" style={{ background: 'var(--bg-base)' }}>
      <nav className="landing-nav">
        <div className="brand-logo">GestureAI</div>
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
      </nav>
      
      <main className="content-wrapper">
        <h1 className="page-title">About GestureAI</h1>
        <div className="prose">
          <p>GestureAI is a foundational infrastructure company focused on the transition to Spatial Computing. We believe the future of human-computer interaction lies not in hardware peripherals, but in intuitive, kinesthetic motion.</p>
          
          <h2>Our Core Technology</h2>
          <p>By leveraging raw WebGL and TensorFlow Lite on the client edge, we have built a neural mapping layer capable of parsing ASL, ISL, and custom developer gestures at 120 frames per second—without ever transmitting video data to a server.</p>
          
          <h2>The Edge Advantage</h2>
          <p>Processing on the edge means zero latency, absolute privacy, and infinite scalability. GestureAI runs entirely within your browser's sandboxed environment, turning any standard webcam into a high-fidelity spatial sensor.</p>
        </div>
      </main>
    </div>
  );
}
