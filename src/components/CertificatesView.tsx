import React, { useState } from 'react';
import { Certificate } from '../types';
import { FileKey2, Upload, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  certificates: Certificate[];
  setCertificates: React.Dispatch<React.SetStateAction<Certificate[]>>;
}

export default function CertificatesView({ certificates, setCertificates }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ text: 'Por favor, selecione um arquivo de certificado.', type: 'error' });
      return;
    }
    if (!password) {
      setMessage({ text: 'Por favor, digite a senha do certificado.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        
        const res = await fetch('/api/certificates/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64Data, password })
        });
        
        const data = await res.json();
        
        if (data.error) {
          setMessage({ text: data.error, type: 'error' });
        } else {
          setMessage({ text: data.message || 'Certificado validado com sucesso!', type: 'success' });
          const newCert: Certificate = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            uploadedAt: new Date().toISOString(),
            valid: true
          };
          setCertificates([...certificates, newCert]);
          setFile(null);
          setPassword('');
        }
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setMessage({ text: 'Erro ao ler arquivo: ' + err.message, type: 'error' });
      setLoading(false);
    }
  };

  const handleRemove = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
  };

  return (
    <div className="flex-1 p-8 bg-[#0A0B0C] overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-200 mb-6 flex items-center gap-2">
          <FileKey2 className="w-5 h-5 text-green-400" />
          Certificados Digitais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1A1C1E] border border-[#2D3135] rounded-xl p-6 h-fit">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Adicionar e Validar A1</h3>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-2">Arquivo PFX/P12</label>
                <div className="relative border-2 border-dashed border-[#2D3135] hover:border-green-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0F1113]">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pfx,.p12" />
                  <Upload className="w-6 h-6 text-gray-500 mb-2" />
                  <p className="text-xs text-gray-400">{file ? file.name : 'Clique ou arraste o certificado aqui'}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase tracking-wider mb-1">Senha do Certificado</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 bg-[#0F1113] border border-[#2D3135] rounded-md px-3 text-xs text-gray-300 focus:outline-none focus:border-green-500"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-md text-xs flex items-start gap-2 ${message.type === 'error' ? 'bg-red-900/20 border border-red-500/50 text-red-400' : 'bg-green-900/20 border border-green-500/50 text-green-400'}`}>
                  {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full h-9 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-medium rounded shadow-lg transition-colors flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin text-lg leading-none">⟳</span> : <ShieldAlert className="w-4 h-4" />}
                {loading ? 'Validando...' : 'Validar e Salvar'}
              </button>
            </form>
          </div>

          <div className="bg-[#1A1C1E] border border-[#2D3135] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[#2D3135] bg-[#141618]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Certificados Ativos</h3>
            </div>
            <div className="p-4 flex-1 overflow-auto space-y-3">
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-600">Nenhum certificado instalado.</div>
              ) : (
                certificates.map(cert => (
                  <div key={cert.id} className="p-3 bg-[#0F1113] border border-[#2D3135] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-900/30 flex items-center justify-center border border-green-500/20">
                        <FileKey2 className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-300">{cert.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">Status: {cert.valid ? 'Validado' : 'Inválido'}</div>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(cert.id)} className="text-red-400 hover:text-red-300 text-xs uppercase tracking-widest font-bold">
                      Remover
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
