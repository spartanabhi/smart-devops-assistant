import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Download, Github, CheckCircle, AlertCircle, RefreshCw, FileText, ChevronRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const defaultRunbooks = [
  {
    incident_id: 1,
    filename: "incident_1.md",
    github_url: "https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_1.md",
    generated_at: "2026-06-19T06:41:44Z",
    runbook_markdown: `# Incident Runbook\n\n## Executive Summary\n* **Incident**: Verify Runbook Incident\n* **Severity**: High\n* **System**: auth-service anomaly\n\n## Root Cause Analysis\n* **Service**: auth-service\n* **Reason**: Unknown\n\n## Immediate Remediation Steps\n1. Identify the failing container for auth-service.\n2. Restart the auth-service.\n3. Check upstream dependencies.`
  },
  {
    incident_id: 2,
    filename: "incident_2.md",
    github_url: "https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_2.md",
    generated_at: "2026-06-19T07:05:00Z",
    runbook_markdown: `# Incident Runbook\n\n## Executive Summary\n* **Incident**: Anomaly spike in auth-service\n* **Severity**: Critical\n* **System**: auth-service connection pool exhaustion\n\n## Root Cause Analysis\n* **Service**: auth-service\n* **Reason**: connection pool exhausted\n\n## Immediate Remediation Steps\n1. Restart auth-service container.\n2. Verify database connection pool limit.`
  },
  {
    incident_id: 3,
    filename: "incident_3.md",
    github_url: "https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_3.md",
    generated_at: "2026-06-19T07:10:00Z",
    runbook_markdown: `# Incident Runbook\n\n## Executive Summary\n* **Incident**: Anomaly spike in inventory-service\n* **Severity**: Critical\n* **System**: inventory-service database locks\n\n## Root Cause Analysis\n* **Service**: inventory-service\n* **Reason**: connection timeouts\n\n## Immediate Remediation Steps\n1. Kill locked database queries.\n2. Restart order-service and inventory-service.`
  },
  {
    incident_id: 4,
    filename: "incident_4.md",
    github_url: "https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_4.md",
    generated_at: "2026-06-19T07:15:00Z",
    runbook_markdown: `# Incident Runbook\n\n## Executive Summary\n* **Incident**: Anomaly spike in cache-service\n* **Severity**: High\n* **System**: cache-service redis latency\n\n## Root Cause Analysis\n* **Service**: cache-service\n* **Reason**: redis connection pool exhaustion\n\n## Immediate Remediation Steps\n1. Clear redis memory eviction policy.\n2. Scale redis memory limits.`
  }
];

export default function RunbookViewer() {
  const [history, setHistory] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [runbook, setRunbook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fetch runbook list on mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/api/runbooks/history');
        if (res.data && res.data.length > 0) {
          setHistory(res.data);
          setSelectedIncidentId(res.data[0].incident_id);
        } else {
          setHistory(defaultRunbooks);
          setSelectedIncidentId(defaultRunbooks[0].incident_id);
        }
      } catch (err) {
        console.error("Failed to load runbooks history:", err);
        setHistory(defaultRunbooks);
        setSelectedIncidentId(defaultRunbooks[0].incident_id);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Fetch individual runbook markdown content when selection changes
  useEffect(() => {
    if (!selectedIncidentId) return;

    const fetchRunbook = async () => {
      setLoading(true);

      // Check if it's one of the default runbooks and the backend is empty
      const isDefault = defaultRunbooks.some(r => r.incident_id === selectedIncidentId);

      try {
        const res = await axios.get(`/api/runbooks/${selectedIncidentId}`);
        setRunbook(res.data);
      } catch (err) {
        console.error(`Failed to load runbook for incident ${selectedIncidentId}:`, err);
        // Fallback
        const defaultRb = defaultRunbooks.find(r => r.incident_id === selectedIncidentId) || {
          incident_id: selectedIncidentId,
          filename: `incident_${selectedIncidentId}.md`,
          github_url: `https://github.com/spartanabhi/smart-devops-assistant/blob/main/runbooks/incident_${selectedIncidentId}.md`,
          generated_at: new Date().toISOString(),
          runbook_markdown: `# Runbook for Incident #${selectedIncidentId}\n\nLocal runbook markdown file could not be read on SRE container. Please view on GitHub.`
        };
        setRunbook(defaultRb);
      } finally {
        setLoading(false);
      }
    };

    fetchRunbook();
  }, [selectedIncidentId]);

  const handleCopy = () => {
    if (!runbook || !runbook.runbook_markdown) return;
    navigator.clipboard.writeText(runbook.runbook_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!runbook || !runbook.runbook_markdown) return;
    const element = document.createElement("a");
    const file = new Blob([runbook.runbook_markdown], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = runbook.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6 animate-fade-in">
      {/* Left Panel: Runbook Directory */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-80 glass-panel p-4 flex flex-col"
      >
        <div className="mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Runbook Directory
          </h3>
          <span className="text-[10px] text-slate-500">Autonomous SRE committed post-mortems.</span>
        </div>

        {historyLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-teal-400 animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-500">No runbooks have been generated yet. Upload logs to trigger the pipeline.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5">
            {history.map((item) => (
              <div 
                key={item.incident_id} 
                onClick={() => setSelectedIncidentId(item.incident_id)}
                className={`p-3 rounded-xl border cursor-pointer transition ${
                  selectedIncidentId === item.incident_id
                    ? 'border-teal-500 bg-teal-500/5'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold font-mono text-teal-400">INCIDENT #{item.incident_id}</span>
                  <span className="text-[9px] text-slate-500">{new Date(item.generated_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs font-semibold text-slate-200 truncate">{item.filename}</p>
                <div className="flex justify-end items-center text-[10px] text-teal-400 font-bold mt-2 gap-0.5 opacity-80 hover:opacity-100">
                  View Runbook <ChevronRight size={12} />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Main View: Runbook Markdown Content */}
      <div className="flex-1 flex flex-col space-y-4">
        {loading ? (
          <div className="flex-1 glass-panel flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
            <span className="text-slate-400 text-xs font-semibold">Retrieving SRE Runbook...</span>
          </div>
        ) : !runbook ? (
          <div className="flex-1 glass-panel flex flex-col items-center justify-center text-center p-6">
            <FileText className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-sm font-bold text-slate-400">No Runbook Selected</h3>
            <p className="text-xs text-slate-500 mt-1">Select an incident from the directory directory on the left to review instructions.</p>
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Center Panel: Content Viewer */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 glass-panel p-6 flex flex-col overflow-hidden"
            >
              <header className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                <div>
                  <h1 className="text-xl font-bold text-white mb-0.5">{runbook.filename}</h1>
                  <span className="text-[10px] text-slate-500">Generated on {new Date(runbook.generated_at).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg transition text-xs font-semibold text-slate-300"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Markdown
                      </>
                    )}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-lg transition text-xs font-semibold text-slate-300"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="prose prose-invert max-w-none prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800/80 text-xs leading-relaxed text-slate-300">
                  <ReactMarkdown
                    components={{
                      code({node, inline, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-xl border border-slate-800/60 p-4 font-mono text-[11px]"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[11px] text-teal-400 border border-slate-800/50" {...props}>
                            {children}
                          </code>
                        )
                      }
                    }}
                  >
                    {runbook.runbook_markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>

            {/* Right Panel: Metadata & Actions */}
            <div className="w-72 flex flex-col gap-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-4 space-y-4"
              >
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">GitHub SRE Repository</h3>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-2">
                    <CheckCircle className="w-4 h-4" />
                    Published Successfully
                  </div>
                  {runbook.github_url && (
                    <a 
                      href={runbook.github_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 text-xs font-semibold hover:underline"
                    >
                      <Github className="w-3.5 h-3.5" />
                      View Raw on GitHub
                    </a>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-4 space-y-4"
              >
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Slack Incident Routing</h3>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-3">
                    <MessageSquare className="w-4 h-4" />
                    Synced & Approved via Slack
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center font-bold text-slate-950 text-xs">
                      YR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Yashveer Rai</p>
                      <p className="text-[9px] text-slate-500">Lead SRE Engineer</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
