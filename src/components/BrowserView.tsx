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
      <header className="flex h-12 items-center px-4 bg-[#1A1C1E] border-b border-[#2D3135] justify-between shrink-0">
        
        <div className="flex-1 max-w-3xl flex items-center space-x-4">
          <button 
            onClick={() => handleNavigate()}
            disabled={loading}
            className="text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors"
            title="Recarregar"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex-1 h-8 bg-[#0F1113] border border-[#2D3135] rounded-md flex items-center px-3 focus-within:border-blue-500 transition-all">
            <Search className="w-3 h-3 text-gray-500 mr-2 shrink-0" />
            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleUrlKeyDown}
              className="bg-transparent border-none outline-none w-full text-xs text-gray-400 font-mono placeholder-gray-600"
              placeholder="https://..."
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4 ml-4">
          <button 
            onClick={() => setRecording(!recording)}
            className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-[10px] uppercase font-bold tracking-widest transition-colors ${recording ? 'bg-red-900/30 border-red-500/50 text-red-400 animate-pulse' : 'bg-[#0F1113] border-[#2D3135] text-gray-500 hover:text-gray-300'}`}
          >
            <Disc className="w-3 h-3" />
            {recording ? 'Gravando Macro...' : 'Gravar Macro'}
          </button>

          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full hidden sm:flex">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-green-400 font-mono uppercase">Container Env</span>
          </div>
        </div>
      </header>

      {/* TOOLBAR INFERIOR DO NAVEGADOR */}
      <div className="h-12 bg-[#1A1C1E] border-b border-[#2D3135] px-4 flex items-center justify-between overflow-x-auto shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-[10px] text-gray-500 bg-[#0F1113] border border-[#2D3135] px-2 py-1 rounded">
             <MousePointer2 className="w-3 h-3" />
             <span className="uppercase tracking-widest">Clique na imagem para interagir</span>
          </div>
          
          <form onSubmit={handleType} className="flex items-center space-x-2">
             <Type className="w-3 h-3 text-gray-500" />
             <input 
                type="text" 
                value={keyboardInput}
                onChange={e => setKeyboardInput(e.target.value)}
                placeholder="Digitar texto na página..."
                className="h-7 bg-[#0F1113] border border-[#2D3135] rounded-md px-2 text-xs text-gray-400 font-mono w-48 focus:outline-none focus:border-blue-500"
             />
             <button type="submit" disabled={loading || !keyboardInput} className="h-7 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium rounded shadow-lg transition-colors">
               Enviar
             </button>
          </form>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button onClick={() => handleScroll(-400)} disabled={loading} className="h-7 px-3 bg-[#2D3135] hover:bg-[#3d4247] text-gray-300 text-[10px] font-medium rounded uppercase tracking-widest disabled:opacity-50 transition-colors">
            Subir ↑
          </button>
          <button onClick={() => handleScroll(400)} disabled={loading} className="h-7 px-3 bg-[#2D3135] hover:bg-[#3d4247] text-gray-300 text-[10px] font-medium rounded uppercase tracking-widest disabled:opacity-50 transition-colors">
            Descer ↓
          </button>
        </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-[#141618] border-r border-[#2D3135] flex flex-col hidden md:flex shrink-0 p-4">
          <div className="mb-8">
            <h3 className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-4 flex items-center gap-2">
              <FileDigit className="w-3.5 h-3.5" /> Serviços Frequentes
            </h3>
            <nav className="space-y-1">
              <button onClick={() => handleNavigate('https://cav.receita.fazenda.gov.br/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors group">
                <Play className="w-3 h-3 mr-2 text-gray-500 group-hover:text-gray-300 transition-colors" /> Receita Federal (e-CAC)
              </button>
              <button onClick={() => handleNavigate('https://www8.receita.fazenda.gov.br/SimplesNacional/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors group">
                <Play className="w-3 h-3 mr-2 text-gray-500 group-hover:text-gray-300 transition-colors" /> Simples Nacional
              </button>
              <button onClick={() => handleNavigate('https://meu.inss.gov.br/')} className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors group">
                <Play className="w-3 h-3 mr-2 text-gray-500 group-hover:text-gray-300 transition-colors" /> Meu INSS
              </button>
            </nav>
          </div>

          <div className="mt-auto">
             <div className="p-4 bg-[#1A1C1E] border border-[#2D3135] rounded-xl">
               <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Logs do Container</div>
               <div className="font-mono text-[9px] text-gray-400 leading-relaxed">
                 [OK] Xvfb iniciado<br/>
                 [OK] Chromium fluxbox<br/>
                 [OK] Proxy VNC: 3000<br/>
                 {recording && <span className="text-red-400 animate-pulse">[REC] Gravando Macro...<br/></span>}
               </div>
             </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col bg-[#0A0B0C] overflow-auto relative p-6 items-center justify-start" ref={viewportRef}>
          {error && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#1A1C1E] border border-red-500/50 text-gray-300 px-4 py-3 rounded-lg shadow-2xl z-20 flex items-start gap-3 max-w-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-400">Erro na automação</p>
                <p className="text-[10px] mt-1 opacity-90">{error}</p>
                <p className="text-[9px] mt-2 text-gray-500 font-mono">Nota: O ambiente de preview pode não suportar dependências do Chromium. Use os arquivos Dockerfile/docker-compose fornecidos para executar localmente.</p>
              </div>
            </div>
          )}
          
          <div className="relative inline-block max-w-full shadow-2xl rounded-lg overflow-hidden bg-[#1A1C1E] border border-[#2D3135]">
            {screenshot ? (
              <img 
                src={screenshot} 
                alt="Browser Viewport" 
                className={`max-w-full h-auto cursor-crosshair transition-opacity bg-white ${loading ? 'opacity-60' : 'opacity-100'}`}
                style={{ width: '1280px', maxHeight: '800px', objectFit: 'contain' }}
                onClick={handleClick}
              />
            ) : (
              <div className="w-[1280px] h-[800px] max-w-full bg-[#141618] flex items-center justify-center text-gray-600 text-xs font-mono tracking-widest uppercase">
                {loading ? '[ INICIANDO ENGINE... ]' : '[ NENHUM SINAL DE VÍDEO ]'}
              </div>
            )}
            
            {loading && screenshot && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[#0F1113]/80 backdrop-blur-sm border border-[#2D3135] rounded-xl p-4 shadow-2xl flex items-center space-x-3">
                  <RotateCw className="w-5 h-5 text-gray-400 animate-spin" />
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">Processando...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="h-6 bg-[#1A1C1E] border-t border-[#2D3135] flex items-center px-4 justify-between text-[10px] text-gray-500 font-mono shrink-0">
        <div>Resolution: 1280x800 | Status: {loading ? 'BUSY' : 'IDLE'}</div>
        <div className="truncate max-w-md ml-4 text-right">URL: {currentUrl}</div>
      </footer>
    </div>
  );
}
