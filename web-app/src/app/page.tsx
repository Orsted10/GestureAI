"use client";

import ASLDetector from "@/components/ASLDetector";
import { HandMetal, Sparkles, Zap, Shield, Cpu, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black selection:bg-indigo-500/30">
      {/* Animated Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />
      <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <HandMetal className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">GestureAI</span>
          </motion.div>
          
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400"
          >
            <a href="#detector" className="hover:text-white transition-colors">Translator</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
          </motion.nav>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              <span>Star on GitHub</span>
            </a>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start pt-20 pb-24 px-6 relative z-10 w-full max-w-7xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center max-w-4xl mb-20 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-sm font-medium backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Next-Gen Edge AI Model</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Communicate freely with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400">
              Sign Language AI
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Experience zero-latency American Sign Language translation directly in your browser. Powered by MediaPipe and advanced Random Forest classifiers.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <a 
              href="#detector"
              className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
              Start Translating
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>

        {/* Feature Highlights */}
        <motion.div 
          id="features"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 w-full"
        >
          {[
            { icon: Zap, title: "Zero Latency", desc: "Runs entirely on your device's GPU/CPU. No server roundtrips, meaning translations happen in real-time." },
            { icon: Shield, title: "100% Private", desc: "Your camera feed never leaves your device. Total privacy guaranteed by client-side processing." },
            { icon: Cpu, title: "Edge AI", desc: "Utilizes MediaPipe for 21-point 3D hand tracking and a custom Random Forest model for high accuracy." }
          ].map((feature, idx) => (
            <div key={idx} className="bg-white/[0.02] border border-white/[0.05] p-6 rounded-3xl hover:bg-white/[0.04] transition-colors">
              <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Detector Component */}
        <div id="detector" className="w-full scroll-mt-24 mb-32">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Live Translation</h2>
            <p className="text-gray-400">Allow camera access to begin translating ASL to text instantly.</p>
          </div>
          <ASLDetector />
        </div>

        {/* How It Works / Gesture Guide */}
        <motion.div 
          id="how-it-works"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl mx-auto scroll-mt-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Functional Gestures</h2>
            <p className="text-gray-400">Besides the standard A-Z alphabet, use these special gestures to control text.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { gesture: "✌️", name: "Backspace", desc: "Show two fingers (peace sign) to delete the last character.", color: "text-red-400", bg: "bg-red-500/10" },
              { gesture: "✋", name: "Clear All", desc: "Show an open palm to clear the entire sentence.", color: "text-yellow-400", bg: "bg-yellow-500/10" },
              { gesture: "👌", name: "Space", desc: "Show the 'OK' sign to insert a space between words.", color: "text-green-400", bg: "bg-green-500/10" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/[0.02] border border-white/[0.05] p-8 rounded-3xl text-center">
                <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-6 ${item.bg}`}>
                  {item.gesture}
                </div>
                <h3 className={`text-xl font-bold mb-2 ${item.color}`}>{item.name}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            * Note: Hold a gesture steadily for ~1 second (30 frames) for it to register.
          </div>
        </motion.div>
        
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 mt-20 relative z-10 bg-black/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <HandMetal className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-lg text-white">GestureAI</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Built with Next.js, Tailwind, and MediaPipe.
          </p>
        </div>
      </footer>
    </div>
  );
}
