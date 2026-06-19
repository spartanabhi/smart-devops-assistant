import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { History, Search, RefreshCw, ChevronRight } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge.jsx'

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/incidents');
      setIncidents(res.data);
    } catch (err) {
      console.error("Error loading incidents, using fallback:", err);
      setIncidents([
        {
          id: 101,
          title: "Anomaly spike in auth-service",
          severity: "Critical",
          root_cause: "auth-service",
          summary: "Database connection pool exhausted (max_size=20 reached). Connection refused to db-host:5432.",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 102,
          title: "Redis connection pool limit warning",
          severity: "Medium",
          root_cause: "cache-service",
          summary: "Redis cache memory pool utilization exceeded 95%.",
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 103,
          title: "Gateway 503 upstream gateway timeouts",
          severity: "High",
          root_cause: "api-gateway",
          summary: "Checkouts failing due to backend API gateway timeouts.",
          created_at: new Date(Date.now() - 14400000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const filteredIncidents = incidents.filter(incident => 
    incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.root_cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
    incident.severity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <History className="text-teal-400" size={28} />
            Incident Directory
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review previously parsed incident diagnosis reports and blame trees.</p>
        </div>
        <button
          onClick={fetchIncidents}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white p-2.5 rounded-xl transition"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex bg-slate-900 border border-slate-800 p-2.5 rounded-2xl items-center max-w-md focus-within:border-teal-500/50 transition duration-300">
        <Search className="text-slate-500 ml-2" size={18} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by title, service or severity..."
          className="bg-transparent border-0 outline-none ring-0 text-slate-200 text-xs px-4 py-2 placeholder-slate-500 w-full"
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw size={24} className="text-teal-400 animate-spin" />
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl">
          <p className="text-slate-500 text-xs font-semibold">No incidents match your filter query.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/20 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Incident ID</th>
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Root Cause Service</th>
                  <th className="px-6 py-4">Detected At</th>
                  <th className="px-6 py-4 text-right">View Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-semibold text-slate-300">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/20 transition">
                    <td className="px-6 py-4 font-mono text-[11px] text-slate-400">
                      #{incident.id}
                    </td>
                    <td className="px-6 py-4 text-white">
                      {incident.title}
                    </td>
                    <td className="px-6 py-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded font-mono text-[10px]">
                        {incident.root_cause}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-medium">
                      {new Date(incident.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/incidents/${incident.id}`}
                        className="inline-flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-bold transition hover:underline"
                      >
                        Details <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
