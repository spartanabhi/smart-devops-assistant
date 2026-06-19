import React from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, XCircle } from 'lucide-react';

const hypotheses = [
  {
    id: 1,
    title: 'Connection Pool Exhaustion',
    desc: 'The database connection pool maximum has been reached due to lingering idle connections from the auth-service.',
    confidence: 92,
    evidence: 'pg_stat_activity reveals 95/100 connections are state=idle in transaction.',
    action: 'Restart auth-service pods & temporarily bump max_connections to 200.',
    selected: true
  },
  {
    id: 2,
    title: 'OOM Killed Database',
    desc: 'The postgres container ran out of memory and was terminated by the OOM killer.',
    confidence: 15,
    evidence: 'No dmesg OOM killer logs found. Uptime is 45 days.',
    action: 'Increase pod memory limits.',
    selected: false
  },
  {
    id: 3,
    title: 'Network Partition',
    desc: 'Subnet routing failure between EKS nodes and RDS.',
    confidence: 8,
    evidence: 'VPC Flow Logs show successful TCP handshakes.',
    action: 'Verify route tables.',
    selected: false
  },
  {
    id: 4,
    title: 'Bad Deployment',
    desc: 'A recent deployment introduced a massive connection leak.',
    confidence: 65,
    evidence: 'auth-service was deployed 2 hours ago (v1.4.2).',
    action: 'Rollback to v1.4.1 immediately.',
    selected: false
  }
];

export default function AIHypotheses() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          AI Hypothesis Engine
        </h1>
        <p className="text-gray-400">Gemini 1.5 Flash evaluates potential root causes via deductive reasoning.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hypotheses.map((h, i) => (
          <motion.div 
            key={h.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel p-6 border-2 transition-all duration-300 ${h.selected ? 'border-primary shadow-[0_0_30px_rgba(99,102,241,0.2)]' : 'border-transparent'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">{h.title}</h3>
              {h.selected ? (
                <CheckCircle2 className="w-6 h-6 text-success" />
              ) : (
                <span className="text-xs font-bold text-gray-500 bg-dark-bg px-2 py-1 rounded">REJECTED</span>
              )}
            </div>
            
            <p className="text-gray-300 mb-6">{h.desc}</p>
            
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-gray-400">Confidence Score</span>
                <span className={h.confidence > 80 ? 'text-success' : h.confidence > 40 ? 'text-warning' : 'text-critical'}>
                  {h.confidence}%
                </span>
              </div>
              <div className="w-full bg-dark-bg h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${h.confidence}%` }}
                  transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                  className={`h-full rounded-full ${h.confidence > 80 ? 'bg-success' : h.confidence > 40 ? 'bg-warning' : 'bg-critical'}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-dark-bg p-3 rounded border border-dark-border">
                <p className="text-xs text-gray-500 mb-1">Evidence Analyzed</p>
                <p className="text-sm font-medium text-gray-200">{h.evidence}</p>
              </div>
              <div className="bg-primary/5 p-3 rounded border border-primary/20">
                <p className="text-xs text-primary mb-1">Recommended Action</p>
                <p className="text-sm font-medium text-white">{h.action}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
