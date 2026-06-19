import React from 'react'

export default function SeverityBadge({ severity }) {
  const getStyles = () => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStyles()}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse"></span>
      {severity || 'Unknown'}
    </span>
  )
}
