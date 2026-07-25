import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TeamPage() {
  const team = [
    { name: "Unnati Mishra", role: "Core Architecture", init: "UM" },
    { name: "Ankan Bhattacharjee", role: "Kinematic Logic", init: "AB" },
    { name: "Shivam Kumar Tiwari", role: "Systems Engineer", init: "SK" },
    { name: "Rishi Kumar Singh", role: "Machine Learning", init: "RS" }
  ];

  return (
    <div className="page-container" style={{ background: 'var(--bg-base)' }}>
      <nav className="landing-nav">
        <div className="brand-logo">GestureAI</div>
        <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
      </nav>
      
      <main className="content-wrapper">
        <h1 className="page-title">The Architects</h1>
        <p className="page-subtitle">The core team behind the GestureAI spatial engine.</p>
        
        <div className="team-grid mt-12">
          {team.map(member => (
            <div key={member.name} className="team-card">
              <div className="team-avatar">{member.init}</div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
