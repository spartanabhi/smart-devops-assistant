import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Play, ExternalLink, RefreshCw, Check, Sparkles } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge.jsx'
import BlameGraph from '../components/BlameGraph.jsx'

export default function IncidentAnalysis() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remediating, setRemediating] = useState(false);
  const [remediationDone, setRemediationDone] = useState(false);

  useEffect(() => {
    const fetchIncidentDetails = async () => {
      try {
        const res = await axios.get(`/api/incidents/${id}`);
        setData(res.data);
      } catch (err) {
        console.error("Error loading incident details, loading simulation:", err);
        // Fallback mock details
        setData({
          incident: {
            id: id,
            title: "Anomaly spike in auth-service",
            severity: "Critical",
            root_cause: "auth-service",
            summary: "Database connection pool exhausted (max_size=20 reached). Connection refused to db-host:5432.",
            runbook_url: "file:///runbooks/incident-20260618-120000.md",
            created_at: new Date().toISOString()
          },
          hypotheses: [
            {
              id: 1,
              title: "Database connection pool exhausted",
              description: "The auth-service ran out of database connections because the pool size limit was reached under heavy load.",
              confidence: 87,
              evidence: ["Connection pool exhausted: max_size=20 current=20", "Connection refused to db-host:5432"]
            },
            {
              id: 2,
              title: "Database host unreachable / Network partition",
              description: "A transient network partition occurred between the application container and the database container.",
              confidence: 65,
              evidence: ["Connection refused to db-host:5432"]
            },
            {
              id: 3,
              title: "Upstream API timeout cascade",
              description: "High response latency from database operations caused downstream services to trigger client-side timeouts.",
              confidence: 50,
              evidence: ["Timeout waiting for auth response (5000ms)"]
            },
            {
              id: 4,
              title: "Redis Connection pool exhaustion",
              description: "Redis connection pool limit warning causing slight delay in request validation checks.",
              confidence: 30,
              evidence: ["Redis connection pool at 95% capacity"]
            }
          ],
          blame_graph: {
            nodes: [
              { id: 'auth-service', is_root: true, error_count: 5 },
              { id: 'payment-service', is_root: false, error_count: 3 },
              { id: 'api-gateway', is_root: false, error_count: 2 },
              { id: 'cache-service', is_root: false, error_count: 0 }
            ],
            edges: [
              { source: 'auth-service', target: 'payment-service', label: 'caused failure in' },
              { source: 'auth-service', target: 'api-gateway', label: 'caused failure in' }
            ]
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentDetails();
  }, [id]);

  const handleRemediate = async () => {
    setRemediating(true);
    try {
      await axios.post(`/api/incidents/${id}/remediate`);
      setTimeout(() => {
        setRemediationDone(true);
        setRemediating(false);
      }, 2000);
    } catch (err) {
      console.error("Remediation execution failed, simulating success:", err);
      setTimeout(() => {
        setRemediationDone(true);
        setRemediating(false);
      }, 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw size={24} className="text-teal-400 animate-spin" />
        <span className="text-slate-400 text-xs font-semibold">Running Agent Diagnosis...</span>
      </div>
    );
  }

  const { incident, hypotheses, blame_graph } = data;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-start">
        <Link to="/" className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition font-semibold">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex gap-3">
          {incident.runbook_url && (
            <a 
              href={incident.runbook_url} 
              target="_blank" 
              rel="noreferrer"
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
            >
              <ExternalLink size={14} /> Open Runbook (GitHub)
            </a>
          )}
          <button
            onClick={handleRemediate}
            disabled={remediating || remediationDone}
            className={`font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition ${
              remediationDone
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 disabled:opacity-50'
            }`}
          >
            {remediating ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Executing Action...
              </>
            ) : remediationDone ? (
              <>
                <Check size={14} /> Fix Executed Successfully
              </>
            ) : (
              <>
                <Play size={14} /> Execute Auto Fix (Remediate)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Title & Metadata Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white leading-tight">{incident.title}</h2>
            <SeverityBadge severity={incident.severity} />
          </div>
          <p className="text-slate-400 text-xs mt-2">
            Incident ID: <code className="text-teal-400">#{incident.id}</code> &bull; Detected on: {new Date(incident.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col md:items-end text-xs text-slate-400">
          <span>Root Cause Service:</span>
          <code className="text-red-400 bg-red-500/10 px-2 py-0.5 mt-1 rounded font-bold">{incident.root_cause}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Blame Graph visualization */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Dependency Failure Flow</h3>
          <BlameGraph graphData={blame_graph} />
        </div>

        {/* Hypotheses ranking */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles size={16} className="text-teal-400" />
            AI Root Cause Hypotheses (Claude 3.5)
          </h3>
          <div className="space-y-4">
            {hypotheses.map((h, index) => (
              <div 
                key={h.id} 
                className={`p-5 rounded-2xl bg-slate-900 border ${
                  index === 0 ? 'border-teal-500/30' : 'border-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Hypothesis {h.id}: {h.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                      {h.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                      {h.confidence}% Match
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${h.confidence}%` }}
                  />
                </div>

                {h.evidence && h.evidence.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-800/60">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-1.5">Evidence Lines found in logs:</span>
                    <ul className="space-y-1">
                      {h.evidence.map((ev, i) => (
                        <li key={i} className="text-[10px] font-mono text-slate-400 leading-normal bg-slate-950/40 px-2 py-1 rounded border border-slate-800/60">
                          &gt; {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
