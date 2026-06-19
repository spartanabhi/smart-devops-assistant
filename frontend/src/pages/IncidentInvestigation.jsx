import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, Server, Activity } from 'lucide-react';

export default function IncidentInvestigation() {
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Left Panel: Feed */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 glass-panel p-4 flex flex-col"
      >
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Feed
        </h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="glass-card p-3 border-l-4 border-l-critical cursor-pointer hover:bg-white/5">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-critical">CRITICAL</span>
                <span className="text-[10px] text-gray-500">2m ago</span>
              </div>
              <p className="text-sm font-medium">Connection timeout in auth-service</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Center Panel: Timeline */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 glass-panel p-6 flex flex-col"
      >
        <h3 className="text-xl font-bold mb-6">Investigation Timeline: INC-284</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative pl-6">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-dark-border" />
          
          {['Anomaly Detected', 'LangGraph Triggered', 'Root Cause Isolated: auth-db', 'Hypotheses Evaluated', 'Runbook Published'].map((event, i) => (
            <div key={i} className="relative pl-8 mb-8">
              <div className="absolute left-[-5px] top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-dark-surface" />
              <h4 className="font-bold text-white mb-1">{event}</h4>
              <p className="text-sm text-gray-400">System autonomously executed diagnostic protocol...</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right Panel: Metadata */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-80 glass-panel p-6"
      >
        <h3 className="text-lg font-bold mb-6">Incident Metadata</h3>
        
        <div className="space-y-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Severity</p>
            <div className="flex items-center gap-2 text-critical font-bold">
              <AlertTriangle className="w-5 h-5" />
              SEV-1
            </div>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 mb-1">Affected Services</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded">auth-service</span>
              <span className="px-2 py-1 text-xs bg-dark-bg border border-dark-border rounded">redis-cache</span>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Error Rate</p>
            <p className="text-2xl font-bold text-white">42.5%</p>
          </div>

          <div className="pt-6 border-t border-dark-border">
            <button className="w-full py-2 bg-primary hover:bg-primary/80 text-white rounded-lg font-medium transition-colors">
              View Generated Runbook
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
