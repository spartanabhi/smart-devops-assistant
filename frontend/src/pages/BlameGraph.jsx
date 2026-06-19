import React, { useEffect, useState, useCallback } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  RefreshCw, 
  AlertCircle, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

export default function BlameGraph() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [incidentTitle, setIncidentTitle] = useState("");
  
  // Real-time Upload states
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [loaderStep, setLoaderStep] = useState(0);

  const loadingSteps = [
    "Uploading log file...",
    "Parsing entries & database transaction...",
    "Detecting service anomalies...",
    "Executing LangGraph agent...",
    "Compiling blame graph topology..."
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
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [uploading]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const mapGraphData = (graphData) => {
    const mappedNodes = graphData.nodes.map((node, index) => {
      const isRoot = node.type === 'root_cause';
      const isCascade = node.type === 'cascade';
      const isHypothesis = node.type === 'hypothesis';
      const isHist = node.type === 'historical_match';

      // Calculate layout coordinates dynamically to avoid overlap
      let x = 250;
      let y = 80 + index * 90;
      
      if (isHypothesis) {
        x = 60;
        y = 120 + (index % 4) * 80;
      } else if (isHist) {
        x = 480;
        y = 120 + (index % 4) * 80;
      }

      // Custom styling based on node SRE type
      let bg = '#1e293b';
      let border = '1px solid #334155';
      let color = '#f1f5f9';
      let fontWeight = '500';
      let boxShadow = 'none';

      if (isRoot) {
        bg = '#ef4444'; // Red
        border = 'none';
        color = '#000';
        fontWeight = '700';
        boxShadow = '0 0 15px rgba(239, 68, 68, 0.4)';
      } else if (isCascade) {
        bg = '#f59e0b'; // Amber
        border = 'none';
        color = '#000';
        fontWeight = '600';
        boxShadow = '0 0 10px rgba(245, 158, 11, 0.2)';
      } else if (isHypothesis) {
        bg = '#1d4ed8'; // Blue
        border = '1px solid #3b82f6';
      } else if (isHist) {
        bg = '#065f46'; // Green
        border = '1px solid #10b981';
      }

      return {
        id: node.id,
        position: { x, y },
        data: { 
          label: (
            <div className="text-center">
              <div className="font-bold">{node.label}</div>
              {node.error_count > 0 && (
                <span className="inline-block bg-slate-950/60 px-1.5 py-0.5 rounded text-[8px] mt-1 text-red-400 font-bold border border-red-900/30">
                  {node.error_count} Errors
                </span>
              )}
              {isRoot && <div className="text-[7px] text-red-950 uppercase font-black tracking-wider mt-0.5">Root Cause</div>}
              {isCascade && <div className="text-[7px] text-amber-950 uppercase font-black tracking-wider mt-0.5">Cascade Failure</div>}
            </div>
          )
        },
        style: { 
          background: bg, 
          color: color, 
          border: border, 
          borderRadius: '12px', 
          fontWeight: fontWeight,
          boxShadow: boxShadow,
          padding: '10px 14px',
          minWidth: '120px'
        }
      };
    });

    const mappedEdges = graphData.edges.map((edge, idx) => {
      let stroke = '#475569';
      const isErrorLink = edge.reason && (edge.reason.includes('refuse') || edge.reason.includes('unreachable') || edge.reason.includes('fail'));
      const isTimeoutLink = edge.reason && edge.reason.includes('timeout');

      if (isErrorLink) stroke = '#ef4444';
      else if (isTimeoutLink) stroke = '#f59e0b';

      return {
        id: `e-${idx}-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: true,
        label: edge.reason || 'cascades',
        style: { stroke, strokeWidth: 2 },
        labelStyle: { fill: '#94a3b8', fontSize: '8px', fontWeight: 'bold', background: '#0B1020' }
      };
    });

    setNodes(mappedNodes);
    setEdges(mappedEdges);
  };

  const fetchLatestGraphData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get latest incident
      const latestRes = await axios.get('/api/incidents/latest');
      const latestIncident = latestRes.data;
      setIncidentTitle(latestIncident.title);

      // 2. Fetch blame graph for latest incident
      const graphRes = await axios.post('/api/incidents/blame-graph', {
        incident_id: latestIncident.id
      });
      mapGraphData(graphRes.data);
    } catch (err) {
      console.error("Failed to fetch blame graph data:", err);
      setError("No incidents parsed yet. Please upload a log file to compile the failure topology.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestGraphData();
  }, []);

  // Upload Handlers inside Blame Graph Page
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadAndProcessLog(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadAndProcessLog(e.target.files[0]);
    }
  };

  const uploadAndProcessLog = async (fileToUpload) => {
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("file", fileToUpload);

    try {
      const res = await axios.post("/api/logs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const uploadData = res.data;
      
      if (uploadData && uploadData.incident && uploadData.incident.id) {
        setIncidentTitle(uploadData.incident.title);
        
        // Fetch new blame graph instantly
        const graphRes = await axios.post('/api/incidents/blame-graph', {
          incident_id: uploadData.incident.id
        });
        mapGraphData(graphRes.data);
      }
    } catch (err) {
      console.error("Log analysis upload failed:", err);
      setError("Upload failed. Verify log file format (.log or .txt).");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Interactive Blame Graph</h1>
          <p className="text-gray-400 text-sm">
            {incidentTitle ? `Topological failure cascade mapping for: ${incidentTitle}` : 'Topological mapping of cascading microservice failures.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLatestGraphData}
            disabled={loading || uploading}
            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload Graph
          </button>
        </div>
      </header>

      {/* Drag & Drop Upload Zone at the top of the Graph View */}
      {!uploading && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border border-dashed rounded-2xl py-3 px-6 text-center transition-all duration-200 ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-center gap-3 text-xs">
            <UploadCloud size={16} className="text-slate-400" />
            <span className="font-semibold text-slate-300">Drag & drop log file here to map instantly</span>
            <span className="text-slate-600 font-bold">|</span>
            <label className="text-primary hover:text-primary-hover font-bold cursor-pointer transition">
              Browse Files
              <input type="file" className="hidden" onChange={handleFileChange} accept=".log,.txt" />
            </label>
          </div>
        </div>
      )}

      {/* Uploading Status Playcard Loader */}
      {uploading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-primary animate-spin" />
            <div>
              <p className="text-xs font-bold text-slate-100">Analyzing uploaded logs...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{loadingSteps[loaderStep]}</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {loadingSteps.map((_, index) => (
              <span key={index} className={`w-1.5 h-1.5 rounded-full block ${
                index <= loaderStep ? 'bg-primary' : 'bg-slate-850'
              }`}></span>
            ))}
          </div>
        </div>
      )}

      {loading && !uploading ? (
        <div className="flex-1 glass-panel flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          <span className="text-slate-400 text-xs font-semibold">Generating Dynamic Failure Topology...</span>
        </div>
      ) : error && !uploading ? (
        <div className="flex-1 glass-panel flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-12 h-12 text-slate-700 mb-3" />
          <h3 className="text-sm font-bold text-slate-400">Blame Graph Empty</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">{error}</p>
          <div className="mt-4">
            <label className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-4 py-2 rounded-xl cursor-pointer transition">
              Upload Log File
              <input type="file" className="hidden" onChange={handleFileChange} accept=".log,.txt" />
            </label>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 glass-panel overflow-hidden border border-dark-border rounded-3xl relative"
        >
          {/* Custom Legends Overlay */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-2xl flex flex-col gap-2.5 text-[10px] font-semibold backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-red-500 block"></span>
              <span className="text-slate-300">Root Cause Service</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 block"></span>
              <span className="text-slate-300">Cascading Failures</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-blue-600 block"></span>
              <span className="text-slate-300">AI Hypotheses (Gemini)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-700 block"></span>
              <span className="text-slate-300">Historical Matches</span>
            </div>
          </div>

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            className="bg-[#070b19]"
            colorMode="dark"
          >
            <Background color="#1E293B" gap={16} size={1} />
            <Controls className="bg-slate-900 border-slate-800 fill-white rounded-lg p-1" />
            <MiniMap 
              nodeColor={(n) => '#1e293b'}
              maskColor="rgba(11, 16, 32, 0.7)"
              className="bg-slate-900 border border-slate-800 rounded-xl"
            />
          </ReactFlow>
        </motion.div>
      )}
    </div>
  );
}
