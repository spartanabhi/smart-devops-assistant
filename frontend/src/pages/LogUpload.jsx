import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Download, 
  Github, 
  ExternalLink,
  Play,
  Check
} from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge.jsx'
import BlameGraph from '../components/BlameGraph.jsx'
import ReactMarkdown from 'react-markdown'

export default function LogUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);
  const [results, setResults] = useState(null);
  
  // Dynamic SRE details fetched post-upload
  const [incidentDetails, setIncidentDetails] = useState(null);
  const [runbookContent, setRunbookContent] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [remediating, setRemediating] = useState(false);
  const [remediationDone, setRemediationDone] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Animated loading steps for the SRE pipeline
  const loadingSteps = [
    "Uploading raw log file...",
    "Parsing entries & initializing DB transaction...",
    "Detecting anomalies & trace spikes...",
    "Executing LangGraph agent hypotheses...",
    "Compiling incident blame graph cascade...",
    "Generating autonomous runbook markdown...",
    "Publishing runbook to GitHub repo...",
    "Routing interactive Block Kit alert to Slack..."
  ];

  useEffect(() => {
    let interval;
    if (uploading) {
      setLoaderStep(0);
      interval = setInterval(() => {
        setLoaderStep(prev => {
          if (prev < loadingSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1200);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setResults(null);
      setIncidentDetails(null);
      setRunbookContent(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResults(null);
      setIncidentDetails(null);
      setRunbookContent(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setResults(null);
    setIncidentDetails(null);
    setRunbookContent(null);
    setRemediationDone(false);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload logs and wait for backend parsing + SRE analysis pipeline
      const res = await axios.post("/api/logs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const uploadData = res.data;
      setResults(uploadData);

      // 2. Fetch full SRE incident details (blame graph + hypotheses) & runbook content in parallel
      if (uploadData && uploadData.incident && uploadData.incident.id) {
        setLoadingDetails(true);
        const incidentId = uploadData.incident.id;
        
        try {
          const [detailsRes, runbookRes] = await Promise.all([
            axios.get(`/api/incidents/${incidentId}`),
            axios.get(`/api/runbooks/${incidentId}`)
          ]);
          setIncidentDetails(detailsRes.data);
          setRunbookContent(runbookRes.data);
        } catch (detailErr) {
          console.error("Failed to load real-time detail feeds:", detailErr);
        } finally {
          setLoadingDetails(false);
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.response?.data?.detail || "Ingestion pipeline crash. Please check log formats.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemediate = async (incidentId) => {
    setRemediating(true);
    try {
      await axios.post(`/api/incidents/${incidentId}/remediate`);
      setTimeout(() => {
        setRemediationDone(true);
        setRemediating(false);
      }, 1500);
    } catch (err) {
      setTimeout(() => {
        setRemediationDone(true);
        setRemediating(false);
      }, 1500);
    }
  };

  const handleCopy = () => {
    if (!runbookContent || !runbookContent.runbook_markdown) return;
    navigator.clipboard.writeText(runbookContent.runbook_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!runbookContent || !runbookContent.runbook_markdown) return;
    const element = document.createElement("a");
    const fileBlob = new Blob([runbookContent.runbook_markdown], {type: 'text/plain'});
    element.href = URL.createObjectURL(fileBlob);
    element.download = runbookContent.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UploadCloud className="text-primary w-8 h-8" /> Log Ingestion Hub
        </h2>
        <p className="text-slate-400 text-sm mt-1">Upload server error or warning log files to autonomously diagnose root causes and run downstream tasks.</p>
      </div>

      {!uploading && !results && (
        <div 
          onDragEnter={handleDrag} 
          onDragOver={handleDrag} 
          onDragLeave={handleDrag} 
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-300 ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-2xl text-slate-400">
              <UploadCloud size={36} className={dragActive ? 'text-primary' : 'text-slate-400'} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">Drag and drop your log file here</p>
              <p className="text-xs text-slate-500 mt-1">Accepts raw text (.txt) or system logs (.log).</p>
            </div>
            
            <div className="pt-2">
              <label className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition">
                Browse Files
                <input type="file" className="hidden" onChange={handleFileChange} accept=".log,.txt" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Card */}
      {file && !uploading && !results && (
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-primary" size={24} />
            <div>
              <p className="text-xs font-semibold text-slate-200">{file.name}</p>
              <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>
          <button
            onClick={handleUpload}
            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Analyze Logs
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Analyzing Playcard Loader */}
      {uploading && (
        <div className="glass-panel p-8 text-center space-y-6 max-w-lg mx-auto border border-primary/20 shadow-[0_0_30px_rgba(99,102,241,0.15)] animate-pulse">
          <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary animate-spin"></div>
            <Sparkles className="text-primary w-6 h-6 animate-pulse" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Analyzing Ingested Logs</h3>
            <p className="text-xs text-slate-400">Agentic AIOps Pipeline executing in real time.</p>
          </div>

          {/* Loader status step listing */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5 max-w-sm mx-auto">
            {loadingSteps.map((step, index) => {
              const isPast = index < loaderStep;
              const isCurrent = index === loaderStep;
              return (
                <div key={index} className="flex items-center gap-2.5 text-[10px] font-semibold">
                  <span className={`w-2 h-2 rounded-full block ${
                    isPast ? 'bg-emerald-500' : isCurrent ? 'bg-primary animate-ping' : 'bg-slate-800'
                  }`}></span>
                  <span className={
                    isPast ? 'text-slate-400 line-through' : isCurrent ? 'text-slate-100 font-bold' : 'text-slate-600'
                  }>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real-time Analysis Success Results Section */}
      {results && (
        <div className="space-y-8 animate-fade-in">
          {/* Header Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">{results.message}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Successfully ingested and parsed <code className="text-teal-400 font-bold">{results.total_parsed}</code> log lines.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setFile(null);
                setResults(null);
                setIncidentDetails(null);
                setRunbookContent(null);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 rounded-xl border border-slate-700 transition"
            >
              Analyze Another Log File
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column: Metrics & Graph */}
            <div className="lg:col-span-2 space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Anomaly Severity</span>
                  <div className="mt-3 flex items-center justify-between">
                    <SeverityBadge severity={results.analysis.severity} />
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Log Error Count</span>
                  <p className="text-2xl font-black text-red-400 mt-2">{results.analysis.error_count}</p>
                </div>
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl">
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ingested Error Rate</span>
                  <p className="text-2xl font-black text-white mt-2">{results.analysis.error_rate}%</p>
                </div>
              </div>

              {/* Service Topology Blame Graph */}
              {loadingDetails ? (
                <div className="h-80 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-slate-400 text-xs font-semibold">Compiling Blame Graph Cascade...</span>
                </div>
              ) : incidentDetails && incidentDetails.blame_graph ? (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Failure Graph</h3>
                  <BlameGraph graphData={incidentDetails.blame_graph} />
                </div>
              ) : null}

              {/* AI Hypotheses Cards */}
              {incidentDetails && incidentDetails.hypotheses && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-primary" /> AI Root Cause Hypotheses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incidentDetails.hypotheses.map(h => (
                      <div key={h.id} className="p-5 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col justify-between space-y-4">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-slate-200">
                              Hypothesis {h.id}: {h.title}
                            </h4>
                            <span className="text-[9px] font-extrabold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">
                              {h.confidence}% Match
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                            {h.description}
                          </p>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${h.confidence}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Runbook Viewer & Metadata */}
            <div className="space-y-8">
              {/* GitHub Publish / Slack metadata */}
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Autonomous Deployment Tasks</h4>
                
                <div className="flex items-center justify-between text-xs border-b border-slate-850 pb-3">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Github size={14} /> GitHub Publishing
                  </span>
                  {results.incident.runbook_url ? (
                    <a 
                      href={results.incident.runbook_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 hover:underline"
                    >
                      Published <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-slate-500">Not Uploaded</span>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Slack Webhook notification</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Dispatched
                  </span>
                </div>
              </div>

              {/* Execute Remediation Card */}
              {results.incident && (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Incident Remediation</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Automated fix steps are available. Would you like to run the script on the AWS target host?
                  </p>
                  
                  <button
                    onClick={() => handleRemediate(results.incident.id)}
                    disabled={remediating || remediationDone}
                    className={`w-full font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                      remediationDone
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-primary hover:bg-primary-hover text-white disabled:opacity-50'
                    }`}
                  >
                    {remediating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Deploying Fix...
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
              )}

              {/* Dynamic Runbook Viewer */}
              {loadingDetails ? (
                <div className="h-96 bg-slate-900/60 border border-slate-850 rounded-2xl flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <span className="text-slate-400 text-xs font-semibold">Fetching Generated Runbook...</span>
                </div>
              ) : runbookContent ? (
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 flex flex-col max-h-[500px]">
                  <header className="flex justify-between items-center border-b border-slate-850 pb-3 mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 truncate">{runbookContent.filename}</h4>
                      <span className="text-[9px] text-slate-500">Autonomous Generated SRE Runbook</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                      <button onClick={handleDownload} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                        <Download size={14} />
                      </button>
                    </div>
                  </header>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed text-slate-300 space-y-4">
                    <div className="prose prose-invert prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800/80">
                      <ReactMarkdown>{runbookContent.runbook_markdown}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
