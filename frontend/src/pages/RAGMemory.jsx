import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Database, ArrowRight, Activity } from 'lucide-react';

const memories = [
  { id: 'INC-284', score: 98.4, root: 'auth-service connection pool exhaustion', action: 'Increased max_connections to 200', date: '2 hours ago' },
  { id: 'INC-211', score: 87.2, root: 'redis-cache memory limit reached', action: 'Evicted LRU keys and scaled up memory', date: '5 days ago' },
  { id: 'INC-156', score: 64.5, root: 'api-gateway rate limit configuration error', action: 'Reverted rate-limiting configuration to previous commit', date: '12 days ago' },
  { id: 'INC-089', score: 42.1, root: 'payment-service timeout to external provider', action: 'Increased context timeout to 15s', date: '1 month ago' },
];

export default function RAGMemory() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          RAG Memory Explorer
        </h1>
        <p className="text-gray-400">pgvector semantic search querying historical incident resolutions.</p>
      </header>

      <div className="glass-panel p-6">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search by vector similarity (e.g. 'auth service dropping connections')..."
            className="w-full bg-dark-bg border border-dark-border rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {memories.map((m, i) => (
            <motion.div 
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center p-2 bg-dark-bg rounded border border-dark-border w-16 h-16">
                  <span className="text-xs text-gray-500 mb-1">Match</span>
                  <span className={m.score > 80 ? 'text-success font-bold' : m.score > 60 ? 'text-warning font-bold' : 'text-gray-400 font-bold'}>{m.score}%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-primary">{m.id}</span>
                    <span className="text-xs text-gray-500">• {m.date}</span>
                  </div>
                  <h4 className="font-bold text-white mb-1">{m.root}</h4>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-success" />
                    Resolution: {m.action}
                  </p>
                </div>
              </div>
              <ArrowRight className="text-gray-600 group-hover:text-primary transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
