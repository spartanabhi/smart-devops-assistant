import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, GitPullRequest, ArrowRight } from 'lucide-react';

export default function RecruiterJourneyStepper() {
  const steps = [
    { icon: Activity, title: 'Log Ingestion', desc: 'Real-time telemetry streams into FastAPI.' },
    { icon: ShieldAlert, title: 'Anomaly Detection', desc: 'Threshold breaches trigger incident creation.' },
    { icon: GitPullRequest, title: 'LangGraph RCA', desc: 'Agent identifies failing nodes & cascades.' },
    { icon: ArrowRight, title: 'AI Hypotheses', desc: 'Gemini evaluates diagnostic reasoning.' },
    { icon: ArrowRight, title: 'RAG Retrieval', desc: 'Vector search finds historical matches.' },
    { icon: ArrowRight, title: 'Runbook Generation', desc: 'Markdown action plans constructed.' },
    { icon: ArrowRight, title: 'GitHub Publish', desc: 'Persistent runbooks committed to repo.' },
    { icon: ArrowRight, title: 'Slack Approval', desc: 'Interactive Block Kit gates execution.' },
  ];

  return (
    <div className="glass-panel p-8 mb-8 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-2">AI Incident Resolution Journey</h2>
        <p className="text-gray-400">The autonomous pipeline converting raw logs into human-approved remediations.</p>
      </div>

      <div className="relative">
        {/* Connecting Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-dark-border hidden md:block" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 relative z-10">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-full bg-dark-surface border-2 border-primary/50 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <step.icon className="w-5 h-5 text-primary" />
              </div>
              <h4 className="text-sm font-semibold text-gray-200 mb-1">{step.title}</h4>
              <p className="text-[10px] text-gray-500 leading-tight">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
