import React from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-dark-bg text-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto custom-scrollbar relative">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-[20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
