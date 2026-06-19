import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';

const approvals = [
  { id: 'INC-284', status: 'approved', time: '10:18 AM', approver: 'Yashveer Rai', text: 'Approve runbook execution to increase max_connections to 200.' },
  { id: 'INC-285', status: 'pending', time: '10:42 AM', approver: 'Awaiting...', text: 'Rollback payment-service to v1.2.4 due to high latency.' },
  { id: 'INC-281', status: 'rejected', time: 'Yesterday', approver: 'Security Team', text: 'Open port 22 on staging database.' },
];

export default function SlackWorkflow() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          Slack Human-in-the-Loop
        </h1>
        <p className="text-gray-400">Review and audit interactive Block Kit approvals from your Slack workspace.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {approvals.map((req, i) => (
          <motion.div 
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-panel p-6 border-l-4 ${req.status === 'approved' ? 'border-l-success' : req.status === 'rejected' ? 'border-l-critical' : 'border-l-warning'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{req.id}</h3>
                <p className="text-sm text-gray-400">{req.text}</p>
              </div>
              {req.status === 'approved' ? <CheckCircle className="w-6 h-6 text-success" /> : 
               req.status === 'rejected' ? <XCircle className="w-6 h-6 text-critical" /> : 
               <Clock className="w-6 h-6 text-warning" />}
            </div>

            <div className="bg-dark-bg p-4 rounded-lg border border-dark-border mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-xs font-bold text-white">S</div>
                <span className="font-bold text-sm text-white">Smart DevOps Assistant</span>
                <span className="text-xs text-gray-500 px-1 bg-dark-surface rounded">APP</span>
              </div>
              <p className="text-sm text-gray-300 mb-4">🚨 *Incident Detected* - Please review the attached runbook and approve execution.</p>
              
              <div className="flex gap-2">
                <button disabled className="px-4 py-1.5 bg-success/20 text-success border border-success/30 rounded text-sm font-medium opacity-50">Approve</button>
                <button disabled className="px-4 py-1.5 bg-critical/20 text-critical border border-critical/30 rounded text-sm font-medium opacity-50">Reject</button>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-gray-400">Approver: <span className="text-white">{req.approver}</span></span>
              <span className="text-gray-500">{req.time}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
