import React from 'react';
import { motion } from 'framer-motion';
import { Server, Cpu, HardDrive, Activity } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

const Gauge = ({ value, label, icon: Icon, color, delay }) => {
  const data = [{ name: 'Metric', value: value, fill: color }];
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="glass-panel p-6 flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute top-4 left-4 p-2 bg-dark-bg rounded-lg border border-dark-border">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-48 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" cy="50%" 
            innerRadius="70%" outerRadius="100%" 
            barSize={15} data={data} 
            startAngle={180} endAngle={0}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar minAngle={15} background={{ fill: '#1F2937' }} clockWise={true} dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 text-center">
        <span className="text-4xl font-bold text-white">{value}%</span>
      </div>
      <h3 className="text-lg font-bold text-gray-300 mt-2">{label}</h3>
    </motion.div>
  );
};

export default function SystemMetrics() {
  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Server className="w-8 h-8 text-primary" />
          System Health Telemetry
        </h1>
        <p className="text-gray-400">Live EC2/Docker infrastructure monitoring.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Gauge value={42} label="CPU Utilization" icon={Cpu} color="#6366F1" delay={0.1} />
        <Gauge value={85} label="Memory Usage" icon={Activity} color="#F59E0B" delay={0.2} />
        <Gauge value={24} label="Disk Space" icon={HardDrive} color="#10B981" delay={0.3} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold mb-6">Container Status</h3>
          <div className="space-y-4">
            {['devops_postgres', 'devops_backend', 'devops_frontend'].map(c => (
              <div key={c} className="flex justify-between items-center p-3 bg-dark-bg rounded border border-dark-border">
                <span className="font-medium text-white">{c}</span>
                <span className="px-3 py-1 bg-success/10 text-success border border-success/20 rounded-full text-xs font-bold">RUNNING</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-bold mb-6">API Latency</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">POST /api/logs/upload</span>
              <span className="font-mono text-success">42ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">GET /api/incidents</span>
              <span className="font-mono text-success">18ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">POST /api/investigations/trigger</span>
              <span className="font-mono text-warning">842ms</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
