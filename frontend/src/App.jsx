import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import IncidentInvestigation from './pages/IncidentInvestigation';
import IncidentAnalysis from './pages/IncidentAnalysis';
import RootCauseAnalysis from './pages/RootCauseAnalysis';
import AIHypotheses from './pages/AIHypotheses';
import RAGMemory from './pages/RAGMemory';
import BlameGraph from './pages/BlameGraph';
import RunbookViewer from './pages/RunbookViewer';
import SlackWorkflow from './pages/SlackWorkflow';
import SystemMetrics from './pages/SystemMetrics';
import LogUpload from './pages/LogUpload';
import RecruiterJourneyStepper from './components/RecruiterJourneyStepper';

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Dashboard /></PageTransition>} />
        <Route path="/upload" element={<PageTransition><LogUpload /></PageTransition>} />
        <Route path="/incidents" element={<PageTransition><IncidentInvestigation /></PageTransition>} />
        <Route path="/incidents/:id" element={<PageTransition><IncidentAnalysis /></PageTransition>} />
        <Route path="/rca" element={<PageTransition><RootCauseAnalysis /></PageTransition>} />
        <Route path="/hypotheses" element={<PageTransition><AIHypotheses /></PageTransition>} />
        <Route path="/rag" element={<PageTransition><RAGMemory /></PageTransition>} />
        <Route path="/graph" element={<PageTransition><BlameGraph /></PageTransition>} />
        <Route path="/runbooks" element={<PageTransition><RunbookViewer /></PageTransition>} />
        <Route path="/slack" element={<PageTransition><SlackWorkflow /></PageTransition>} />
        <Route path="/metrics" element={<PageTransition><SystemMetrics /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        {/* Recruiter Wow-Factor at the top of every page for maximum visibility */}
        <RecruiterJourneyStepper />
        <AnimatedRoutes />
      </Layout>
    </BrowserRouter>
  );
}
