import React from 'react'

export default function MetricCard({ label, value, icon: Icon, color = 'blue', description }) {
  const colorMap = {
    blue: {
      border: 'border-blue-500/20',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20'
    },
    red: {
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      iconBg: 'bg-red-500/20'
    },
    amber: {
      border: 'border-amber-500/20',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20'
    },
    green: {
      border: 'border-green-500/20',
      bg: 'bg-green-500/10',
      text: 'text-green-400',
      iconBg: 'bg-green-500/20'
    },
    teal: {
      border: 'border-teal-500/20',
      bg: 'bg-teal-500/10',
      text: 'text-teal-400',
      iconBg: 'bg-teal-500/20'
    }
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div className={`p-6 rounded-2xl bg-slate-900 border ${currentTheme.border} transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/60`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">{label}</span>
          <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`${currentTheme.iconBg} p-3 rounded-xl flex items-center justify-center`}>
            <Icon size={20} className={currentTheme.text} />
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-slate-500 mt-3 font-medium">
          {description}
        </p>
      )}
    </div>
  )
}
