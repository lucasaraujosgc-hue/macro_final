import React, { useState } from 'react';
import { Macro, Company } from '../types';
import { Play, Code, MousePointer2, Type, AlertCircle, Save } from 'lucide-react';

interface Props {
  macros: Macro[];
  setMacros: React.Dispatch<React.SetStateAction<Macro[]>>;
  companies: Company[];
}

export default function MacrosView({ macros, setMacros, companies }: Props) {
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null);

  const selectedMacro = macros.find(m => m.id === selectedMacroId);

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto flex gap-8">
        
        <div className="w-1/3 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            Macros Gravadas
          </h2>
          
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
               <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                 Use o navegador para gravar novas macros. Os passos aparecerão aqui automaticamente.
               </p>
            </div>
            <div className="p-2 space-y-1">
              {macros.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">Nenhuma macro salva.</div>
              ) : (
                macros.map(m => (
                  <button 
                    key={m.id}
                    onClick={() => setSelectedMacroId(m.id)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${selectedMacroId === m.id ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                  >
                    <span className="text-sm font-bold">{m.name}</span>
                    <span className="text-[10px] bg-gray-100 border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{m.steps.length} passos</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {selectedMacro ? (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h3 className="text-lg font-bold text-gray-800">{selectedMacro.name}</h3>
                <button className="flex items-center gap-2 h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] uppercase tracking-widest font-bold rounded shadow-sm transition-colors">
                  <Play className="w-3 h-3" />
                  Executar Macro
                </button>
              </div>

              <div className="space-y-4">
                {selectedMacro.steps.map((step, index) => (
                  <div key={step.id} className="flex items-start gap-4 p-3 bg-white border border-gray-200 shadow-sm rounded-lg hover:border-blue-200 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-[10px] text-gray-600 shrink-0 font-mono mt-0.5">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        {step.action === 'click' && <><MousePointer2 className="w-3 h-3 text-blue-500" /> Clique</>}
                        {step.action === 'type' && <><Type className="w-3 h-3 text-green-500" /> Digitar</>}
                        {step.action === 'navigate' && <><AlertCircle className="w-3 h-3 text-yellow-500" /> Navegar</>}
                      </div>
                      
                      <div className="text-xs text-gray-600 font-mono">
                        {step.action === 'click' && `X: ${Math.round(step.target?.x || 0)}, Y: ${Math.round(step.target?.y || 0)}`}
                        {step.action === 'navigate' && `URL: ${step.url}`}
                        {step.action === 'type' && (
                          <div className="flex flex-col gap-2 mt-2">
                            <span className="bg-gray-50 p-1.5 rounded text-gray-700 border border-gray-100">Texto original: "{step.text}"</span>
                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200 mt-1">
                              <span className="text-[10px] uppercase text-gray-500 font-sans font-bold">Usar Variável:</span>
                              <select 
                                className="bg-white border border-gray-300 text-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans shadow-sm"
                                value={step.variable || ''}
                                onChange={(e) => {
                                  const newMacros = macros.map(m => m.id === selectedMacro.id ? {
                                    ...m, steps: m.steps.map(s => s.id === step.id ? { ...s, variable: e.target.value } : s)
                                  } : m);
                                  setMacros(newMacros);
                                }}
                              >
                                <option value="">Nenhuma (usar texto original)</option>
                                <option value="company.cnpj">Empresa: CNPJ</option>
                                <option value="company.razaoSocial">Empresa: Razão Social</option>
                                <option value="company.inscricaoEstadual">Empresa: Inscrição Estadual</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Code className="w-12 h-12 mb-4 opacity-30 text-gray-300" />
              <p className="text-sm font-medium">Selecione uma macro para visualizar os detalhes e editar as variáveis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
