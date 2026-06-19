import React from 'react';
import { motion } from 'framer-motion';
import { GitMerge, Database, Shield, Zap } from 'lucide-react';

export default function RootCauseAnalysis() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Root Cause Analysis</h1>
        <p className="text-gray-400">Agentic isolation of failure origin points.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass-panel p-6"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-critical/10 rounded-xl">
              <Database className="w-8 h-8 text-critical" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">auth-postgres-primary</h2>
              <p className="text-critical font-medium">98% Confidence Score</p>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-4">Evidence Log Stream</h3>
          <div className="bg-dark-bg p-4 rounded-lg font-mono text-sm space-y-2 border border-dark-border">
            <div className="text-gray-400">[10:14:02] <span className="text-critical">FATAL: remaining connection slots are reserved for non-replication superuser connections</span></div>
            <div className="text-gray-400">[10:14:05] <span className="text-warning">WARN: pg_stat_activity shows 100/100 active connections</span></div>
            <div className="text-gray-400">[10:14:10] <span className="text-gray-500">INFO: LangGraph Agent inferred connection pool exhaustion</span></div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-primary" />
            Cascade Impact
          </h3>
          <div className="space-y-4">
            <div className="glass-card p-4 border-l-2 border-l-warning">
              <h4 className="font-bold text-white">api-gateway</h4>
              <p className="text-xs text-gray-400 mt-1">HTTP 503 Service Unavailable spikes</p>
            </div>
            <div className="glass-card p-4 border-l-2 border-l-warning">
              <h4 className="font-bold text-white">user-service</h4>
              <p className="text-xs text-gray-400 mt-1">ReadTimeout exceptions rising</p>
            </div>
            <div className="glass-card p-4 border-l-2 border-l-success">
              <h4 className="font-bold text-white">billing-service</h4>
              <p className="text-xs text-gray-400 mt-1">Isolated. Healthy via circuit breaker.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
