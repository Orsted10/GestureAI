import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function MotivesPage() {
  return (
    <div className="page-container" style={{ background: 'var(--bg-base)' }}>
      <nav className="landing-nav">
        <div className="brand-logo">GestureAI</div>
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
      </nav>
      
      <main className="content-wrapper">
        <h1 className="page-title">Our Motives</h1>
        <div className="prose">
          <h2>Accessibility Without Compromise</h2>
          <p>We built GestureAI to fundamentally alter how we interact with technology. For millions of people worldwide who rely on sign languages, standard technological interfaces are inadequate. By providing a zero-latency, device-agnostic translation layer, we are democratizing access to digital communication.</p>
          
          <h2>The Death of the Keyboard</h2>
          <p>Hardware peripherals are an artificial bottleneck. Our motive is to push the industry towards true Spatial Computing. By interpreting physical kinematics in real-time, we envision a future where your environment is your operating system, and your hands are the ultimate universal controller.</p>
        </div>
      </main>
    </div>
  );
}
