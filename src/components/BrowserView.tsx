import React, { useState, MouseEvent, KeyboardEvent, useEffect, useRef } from 'react';
import { Search, RotateCw, MousePointer2, Type, AlertCircle, FileDigit, Play, Disc } from 'lucide-react';
import { MacroStep } from '../types';

interface Props {
  onRecordStep: (step: Omit<MacroStep, 'id'>) => void;
  recording: boolean;
  setRecording: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BrowserView({ onRecordStep, recording, setRecording }: Props) {
  const [url, setUrl] = useState('https://www.gov.br/');
  const [currentUrl, setCurrentUrl] = useState('https://www.gov.br/');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardInput, setKeyboardInput] = useState('');
  
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    handleNavigate('https://www.gov.br/pt-br');
  }, []);

  const handleNavigate = async (targetUrl: string = url) => {
    if (!targetUrl) return;
    setLoading(true);
    setError(null);
    
    if (recording) {
      onRecordStep({ action: 'navigate', url: targetUrl });
    }

    try {
      const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
      const res = await fetch('/api/browser/goto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScreenshot(data.screenshot);
      setCurrentUrl(data.url);
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNavigate();
    }
  };

  const handleClick = async (e: MouseEvent<HTMLImageElement>) => {
    if (loading) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 800 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (recording) {
      onRecordStep({ action: 'click', target: { x, y } });
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/browser/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScreenshot(data.screenshot);
      setCurrentUrl(data.url);
      setUrl(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleType = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!keyboardInput) return;
    
    if (recording) {
      onRecordStep({ action: 'type', text: keyboardInput });
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/browser/type', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: keyboardInput, key: 'Enter' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScreenshot(data.screenshot);
      setKeyboardInput('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleScroll = async (deltaY: number) => {
    if (loading) return;
    
    if (recording) {
      onRecordStep({ action: 'scroll' });
    }

    setLoading(true);
    try {
      const res = await fetch('/api/browser/scroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deltaY })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScreenshot(data.screenshot);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
      {/* HEADER / OMNIBOX */}
      <header className="flex h-14 items-center px-4 bg-white border-b border-gray-200 justify-between shrink-0 shadow-sm z-10">
        
        <div className="flex-1 max-w-3xl flex items-center space-x-4">
          <button 
            onClick={() => handleNavigate()}
            disabled={loading}
            className="text-gray-500 hover:text-blue-600 disabled:opacity-50 transition-colors"
            title="Recarregar"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex-1 h-9 bg-gray-50 border border-gray-200 rounded-md flex items-center px-3 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-blue-500 transition-all shadow-sm">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              className="bg-transparent border-none outline-none w-full text-sm text-gray-700 font-mono placeholder-gray-400"
              placeholder="https://..."
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 ml-4">
          <button 
            onClick={() => setRecording(!recording)}
            className={`flex items-center gap-2 px-4 py-1.5 border rounded-full text-[10px] uppercase font-bold tracking-widest transition-colors shadow-sm ${recording ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-white border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200'}`}
          >
            <Disc className="w-3 h-3" />
            {recording ? 'Gravando Macro...' : 'Gravar Macro'}
          </button>

          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full hidden sm:flex">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-700 font-bold font-mono uppercase tracking-wider">Container Env</span>
          </div>
        </div>
      </header>

      {/* TOOLBAR INFERIOR DO NAVEGADOR */}
      <div className="h-12 bg-white border-b border-gray-200 px-4 flex items-center justify-between overflow-x-auto shrink-0 z-10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded font-medium">
             <MousePointer2 className="w-3 h-3 text-blue-500" />
             <span className="uppercase tracking-widest">Clique na imagem para interagir</span>
          </div>
          
          <form onSubmit={handleType} className="flex items-center space-x-2">
             <Type className="w-4 h-4 text-gray-400" />
             <input 
                type="text" 
                value={keyboardInput}
                onChange={e => setKeyboardInput(e.target.value)}
                placeholder="Digitar texto na página..."
                className="h-8 bg-gray-50 border border-gray-200 rounded-md px-3 text-xs text-gray-700 font-mono w-56 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
             />
             <button type="submit" disabled={loading || !keyboardInput} className="h-8 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded shadow-sm transition-colors">
               Enviar
             </button>
          </form>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button onClick={() => handleScroll(-400)} disabled={loading} className="h-8 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded uppercase tracking-widest disabled:opacity-50 transition-colors border border-gray-200">
            Subir ↑
          </button>
          <button onClick={() => handleScroll(400)} disabled={loading} className="h-8 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded uppercase tracking-widest disabled:opacity-50 transition-colors border border-gray-200">
            Descer ↓
          </button>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col hidden md:flex shrink-0 p-4">
          <div className="mb-8">
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <FileDigit className="w-3.5 h-3.5 text-blue-500" /> Serviços Frequentes
            </h3>
            <nav className="space-y-1">
              <button onClick={() => handleNavigate('https://cav.receita.fazenda.gov.br/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 group">
                <Play className="w-3 h-3 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" /> Receita Federal (e-CAC)
              </button>
              <button onClick={() => handleNavigate('https://www8.receita.fazenda.gov.br/SimplesNacional/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 group">
                <Play className="w-3 h-3 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" /> Simples Nacional
              </button>
              <button onClick={() => handleNavigate('https://meu.inss.gov.br/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-white hover:text-blue-600 rounded-lg transition-colors border border-transparent hover:border-gray-200 group">
                <Play className="w-3 h-3 mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" /> Meu INSS
              </button>
            </nav>
          </div>

          <div className="mt-auto">
             <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
               <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Logs do Container</div>
               <div className="font-mono text-[9px] text-gray-500 leading-relaxed">
                 <span className="text-green-600">[OK]</span> Xvfb iniciado<br/>
                 <span className="text-green-600">[OK]</span> Chromium fluxbox<br/>
                 <span className="text-green-600">[OK]</span> Proxy VNC: 3000<br/>
                 {recording && <span className="text-red-500 animate-pulse">[REC] Gravando Macro...<br/></span>}
               </div>
             </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-gray-100/50 overflow-auto relative p-6 items-center justify-start" ref={viewportRef}>
          {error && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white border border-red-200 text-gray-800 px-4 py-3 rounded-lg shadow-xl z-20 flex items-start gap-3 max-w-lg">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-600">Erro na automação</p>
                <p className="text-xs mt-1 text-gray-700">{error}</p>
              </div>
            </div>
          )}
          
          <div className="relative inline-block max-w-full shadow-2xl rounded-lg overflow-hidden bg-white border border-gray-300 ring-1 ring-gray-900/5">
            {screenshot ? (
              <img 
                src={screenshot} 
                alt="Browser Viewport" 
                className={`max-w-full h-auto cursor-crosshair transition-opacity bg-white ${loading ? 'opacity-50' : 'opacity-100'}`}
                style={{ width: '1280px', maxHeight: '800px', objectFit: 'contain' }}
                onClick={handleClick}
              />
            ) : (
              <div className="w-[1280px] h-[800px] max-w-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-mono tracking-widest uppercase">
                {loading ? '[ INICIANDO ENGINE... ]' : '[ NENHUM SINAL DE VÍDEO ]'}
              </div>
            )}
            
            {loading && screenshot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl p-4 shadow-xl flex items-center space-x-3">
                  <RotateCw className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-[10px] text-gray-600 font-mono font-bold uppercase tracking-widest">Processando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="h-8 bg-white border-t border-gray-200 flex items-center px-6 justify-between text-[10px] text-gray-500 font-mono shrink-0 shadow-sm">
        <div className="font-bold text-gray-600">Resolution: 1280x800 | Status: <span className={loading ? 'text-blue-500' : 'text-green-500'}>{loading ? 'BUSY' : 'IDLE'}</span></div>
        <div className="truncate max-w-md ml-4 text-right">URL: {currentUrl}</div>
      </footer>
    </div>
  );
}
