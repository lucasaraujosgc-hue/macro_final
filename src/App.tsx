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
    <div className="h-screen bg-gray-50 text-gray-900 flex font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 border-b border-gray-200 flex items-center px-6 bg-white">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
            <TerminalSquare className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm tracking-widest text-gray-800 uppercase">Gov Automator</span>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('browser')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'browser' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <MonitorPlay className="w-4 h-4" /> Navegador
          </button>
          
          <button 
            onClick={() => setActiveTab('certificates')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'certificates' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <FileKey2 className="w-4 h-4" /> Certificados
          </button>
          
          <button 
            onClick={() => setActiveTab('companies')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'companies' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Building2 className="w-4 h-4" /> Empresas
          </button>

          <button 
            onClick={() => setActiveTab('macros')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'macros' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Code className="w-4 h-4" /> Macros
            {recording && <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
          </button>
        </nav>

        <div className="mt-auto p-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full w-fit">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">VNC: 3000</span>
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
