import Link from 'next/link';
import { ArrowLeft, Layers, Camera, Cpu, Code } from 'lucide-react';

export default function TeamPage() {
  const team = [
    { 
      name: "Ankan Bhattacharjee", 
      role: "Lead Systems Architect & Technical Lead", 
      icon: <Layers size={32} />,
      desc: "Architects the core systems and drives the technical vision end-to-end.",
      tags: ["System Architecture", "Scalability", "AI/Edge Systems", "Performance"]
    },
    { 
      name: "Unnati Mishra", 
      role: "Computer Vision & AI/ML Engineer", 
      icon: <Camera size={32} />,
      desc: "Builds intelligent models that understand gestures and interpret them in real-time.",
      tags: ["Computer Vision", "AI/ML", "Deep Learning", "Model Optimization"]
    },
    { 
      name: "Shivam Kumar Tiwari", 
      role: "Embedded Systems & Hardware Integration Engineer", 
      icon: <Cpu size={32} />,
      desc: "Designs and integrates embedded hardware for seamless on-device performance.",
      tags: ["Embedded Systems", "IoT", "Hardware Design", "Prototyping"]
    },
    { 
      name: "Rishi Kumar Singh", 
      role: "Full-Stack Application & Backend Engineer", 
      icon: <Code size={32} />,
      desc: "Builds robust applications and scalable backends that power the platform.",
      tags: ["Full-Stack", "Backend", "APIs", "DevOps"]
    }
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
              <div className="team-avatar">{member.icon}</div>
              <h3>{member.name}</h3>
              <p className="team-role">{member.role}</p>
              <p className="team-desc">{member.desc}</p>
              <div className="team-tags">
                {member.tags.map(tag => (
                  <span key={tag} className="team-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
