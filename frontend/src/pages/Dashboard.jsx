import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { AlertTriangle, Clock, CheckCircle, FileText, Slack, Github } from 'lucide-react';

const timelineData = [
  { time: '10:00', errors: 12, cpu: 45 },
  { time: '10:05', errors: 15, cpu: 48 },
  { time: '10:10', errors: 80, cpu: 85 }, // Spike
  { time: '10:15', errors: 120, cpu: 95 }, // Incident
  { time: '10:20', errors: 40, cpu: 70 }, // Mitigation
  { time: '10:25', errors: 10, cpu: 50 }, // Resolved
];

const severityData = [
  { name: 'Critical', value: 4, color: '#EF4444' },
  { name: 'High', value: 12, color: '#F59E0B' },
  { name: 'Medium', value: 34, color: '#3B82F6' },
  { name: 'Low', value: 56, color: '#10B981' },
];

const rootCauseData = [
  { service: 'auth-service', count: 18 },
  { service: 'db-cluster', count: 12 },
  { service: 'payment-gateway', count: 8 },
  { service: 'cache-layer', count: 5 },
];

const StatCard = ({ title, value, icon: Icon, trend, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="glass-panel p-5 relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-24 h-24 bg-${colorClass}/10 rounded-full blur-2xl -mr-10 -mt-10`} />
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-${colorClass}/10 text-${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <span className={`text-xs font-semibold ${trend > 0 ? 'text-success' : 'text-success'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
  </motion.div>
);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-8">
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold tracking-tight text-white mb-2"
          >
            Executive Overview
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400"
          >
            Real-time AIOps telemetry and autonomous resolution metrics.
          </motion.p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 text-sm text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            System Healthy
          </span>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard title="Total Incidents" value="1,284" icon={AlertTriangle} trend={-12} colorClass="primary" delay={0.1} />
        <StatCard title="Avg MTTR" value="4m 12s" icon={Clock} trend={-45} colorClass="success" delay={0.2} />
        <StatCard title="Resolved (AI)" value="98.4%" icon={CheckCircle} colorClass="primary" delay={0.3} />
        <StatCard title="Runbooks" value="842" icon={FileText} trend={+24} colorClass="warning" delay={0.4} />
        <StatCard title="Slack Approvals" value="821" icon={Slack} colorClass="primary" delay={0.5} />
        <StatCard title="GitHub Publishes" value="842" icon={Github} colorClass="success" delay={0.6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-panel p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Incident Timeline (Last 30 Mins)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="time" stroke="#6B7280" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <YAxis stroke="#6B7280" tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                />
                <Area type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorErrors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Severity Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-semibold mb-6">Severity Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#1F2937'}}
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Root Cause Breakdown */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-panel p-6"
      >
        <h3 className="text-lg font-semibold mb-6">Top AI-Identified Root Causes</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {rootCauseData.map((item, i) => (
            <div key={item.service} className="glass-card p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-300">{item.service}</p>
                <div className="w-full bg-dark-bg h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${(item.count / 18) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold">{item.count}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
