import React, { useState, useEffect } from 'react';
import { MonitorPlay, FileKey2, Building2, Code, TerminalSquare } from 'lucide-react';
import BrowserView from './components/BrowserView';
import CertificatesView from './components/CertificatesView';
import CompaniesView from './components/CompaniesView';
import MacrosView from './components/MacrosView';
import { Company, Certificate, Macro, MacroStep } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'browser' | 'certificates' | 'companies' | 'macros'>('browser');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [recording, setRecording] = useState(false);
  const [currentMacroSteps, setCurrentMacroSteps] = useState<MacroStep[]>([]);

  useEffect(() => {
    if (!recording && currentMacroSteps.length > 0) {
      // Save macro when recording stops
      const newMacro: Macro = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Macro - ${new Date().toLocaleString()}`,
        steps: currentMacroSteps
      };
      setMacros(prev => [...prev, newMacro]);
      setCurrentMacroSteps([]);
    }
  }, [recording]);

  const handleRecordStep = (step: Omit<MacroStep, 'id'>) => {
    setCurrentMacroSteps(prev => [...prev, { ...step, id: Math.random().toString(36).substr(2, 9) }]);
  };

  return (
    <div className="h-screen bg-[#0F1113] text-gray-200 flex font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#141618] border-r border-[#2D3135] flex flex-col shrink-0">
        <div className="h-12 border-b border-[#2D3135] flex items-center px-4 bg-[#1A1C1E]">
          <TerminalSquare className="w-5 h-5 text-gray-400 mr-2" />
          <span className="font-bold text-sm tracking-wider uppercase">GovAutomator</span>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'browser' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <MonitorPlay className="w-4 h-4" /> Navegador
          </button>
          
          <button 
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'certificates' ? 'bg-green-600/10 text-green-400 border border-green-600/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <FileKey2 className="w-4 h-4" /> Certificados
          </button>
          
          <button 
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'companies' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Building2 className="w-4 h-4" /> Empresas
          </button>

          <button 
            onClick={() => setActiveTab('macros')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'macros' ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Code className="w-4 h-4" /> Macros
            {recording && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </button>
        </nav>

        <div className="mt-auto p-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full w-fit">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-400 font-mono uppercase">VNC: 3000</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      {activeTab === 'browser' && <BrowserView onRecordStep={handleRecordStep} recording={recording} setRecording={setRecording} />}
      {activeTab === 'certificates' && <CertificatesView certificates={certificates} setCertificates={setCertificates} />}
      {activeTab === 'companies' && <CompaniesView companies={companies} setCompanies={setCompanies} />}
      {activeTab === 'macros' && <MacrosView macros={macros} setMacros={setMacros} companies={companies} />}
      
    </div>
  );
}
