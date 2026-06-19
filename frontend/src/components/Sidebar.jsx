import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  AlertOctagon, 
  Activity, 
  Lightbulb, 
  Database, 
  GitMerge, 
  BookOpen, 
  MessageSquare,
  Server,
  UploadCloud
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Log Ingestion', path: '/upload', icon: UploadCloud },
  { name: 'Incidents', path: '/incidents', icon: AlertOctagon },
  { name: 'Root Cause', path: '/rca', icon: Activity },
  { name: 'AI Hypotheses', path: '/hypotheses', icon: Lightbulb },
  { name: 'RAG Memory', path: '/rag', icon: Database },
  { name: 'Blame Graph', path: '/graph', icon: GitMerge },
  { name: 'Runbooks', path: '/runbooks', icon: BookOpen },
  { name: 'Slack Workflow', path: '/slack', icon: MessageSquare },
  { name: 'System Metrics', path: '/metrics', icon: Server },
];

export default function Sidebar() {
  return (
    <div className="w-64 h-screen bg-dark-surface border-r border-dark-border flex flex-col pt-6 z-50 fixed">
      <div className="flex items-center gap-3 px-6 mb-10">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          S
        </div>
        <h1 className="font-bold text-xl tracking-tight text-white">Smart DevOps</h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              isActive 
                ? "bg-primary/10 text-primary border border-primary/20 shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]" 
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-dark-border mt-auto">
        <div className="glass-card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Yashveer Rai</span>
            <span className="text-[10px] text-gray-400">Lead SRE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
