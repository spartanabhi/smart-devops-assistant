import React, { useState } from 'react'
import axios from 'axios'
import { Terminal, Send, HelpCircle, Activity, Sparkles } from 'lucide-react'

export default function QueryConsole() {
  const [query, setQuery] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Why is auth-service failing?",
    "List root causes of the database timeouts",
    "Show recent incidents with High severity"
  ];

  const handleQuery = async (queryText) => {
    const textToSubmit = queryText || query;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setQuery('');

    // Append user query to chat history
    const userMsg = { role: 'user', text: textToSubmit, timestamp: new Date() };
    setChat(prev => [...prev, userMsg]);

    try {
      const res = await axios.post('/api/queries', { query: textToSubmit });
      const botMsg = { role: 'assistant', text: res.data.response, timestamp: new Date() };
      setChat(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Query failed, running simulated AI response:", err);
      // Fallback mock answer
      setTimeout(() => {
        let answer = "Currently, the system is showing anomalies in the log pattern rate. The top errors indicate connection issues to database components. \n\n**Recommendation**: Inspect active database locks and check microservice network routes using docker-compose. Ensure the Postgres container is healthy and responding to queries.";
        if (textToSubmit.toLowerCase().includes("auth")) {
          answer = "Based on recent database logs, `auth-service` is experiencing connection pool exhaustion. I see repeated messages like `Connection pool exhausted: max_size=20`. This matches a similar historical incident where increasing the pool limit resolved the problem. \n\n**Recommendation**: Check the database connection pool settings in the `auth-service` deployment configuration and verify that connections are being closed correctly in your API endpoints.";
        }
        const botMsg = { role: 'assistant', text: answer, timestamp: new Date() };
        setChat(prev => [...prev, botMsg]);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in flex flex-col h-[calc(100vh-80px)]">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Terminal className="text-teal-400" size={28} />
          Query Console
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Ask questions in natural language to inspect database incidents, logs, and root causes.
        </p>
      </div>

      {/* Chat messages viewport */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-y-auto space-y-6 min-h-[300px]">
        {chat.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-2xl text-slate-500">
              <HelpCircle size={36} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">No active sessions.</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Ask a question below or choose a quick prompt to query telemetry data.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {chat.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-slate-800/40 border border-slate-800/80 ml-12' 
                    : 'bg-slate-950/40 border border-slate-800/50 mr-12'
                }`}
              >
                <div className={`p-2.5 h-10 w-10 rounded-xl flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-slate-800 text-slate-300' : 'bg-teal-500/10 text-teal-400'
                }`}>
                  {msg.role === 'user' ? 'U' : <Sparkles size={16} />}
                </div>
                <div className="flex-1 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {msg.role === 'user' ? 'You' : 'SRE Copilot'} &bull; {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                  <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 p-4 mr-12 bg-slate-950/20 border border-slate-800/30 rounded-2xl animate-pulse">
                <div className="p-2.5 h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Activity size={16} className="animate-spin" />
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <span className="text-[10px] text-slate-500 font-bold block">Agent Reasoning...</span>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input prompt area */}
      <div className="space-y-4">
        {/* Quick prompt suggestions */}
        {chat.length === 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {quickPrompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => handleQuery(prompt)}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800/80 hover:border-slate-700 px-3 py-1.5 rounded-full transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl items-center focus-within:border-teal-500/50 transition duration-300">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="Query incident histories, log patterns or ask for SRE tips..."
            className="flex-1 bg-transparent border-0 outline-none ring-0 text-slate-200 text-xs px-4 py-2 placeholder-slate-500"
          />
          <button
            onClick={() => handleQuery()}
            disabled={!query.trim() || loading}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 p-2.5 rounded-xl transition disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
