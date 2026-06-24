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
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileKey2 className="w-5 h-5 text-blue-600" />
          Certificados Digitais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 h-fit shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Adicionar e Validar A1</h3>
            
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-2">Arquivo PFX/P12</label>
                <div className="relative border-2 border-dashed border-gray-300 hover:border-blue-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50/50">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} accept=".pfx,.p12" />
                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 font-medium">{file ? file.name : 'Clique ou arraste o certificado aqui'}</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Senha do Certificado</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 bg-gray-50 border border-gray-200 rounded-md px-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className={`p-3 rounded-md text-xs flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  <span className="font-medium">{message.text}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded shadow-sm transition-colors flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin text-lg leading-none">⟳</span> : <ShieldAlert className="w-4 h-4" />}
                {loading ? 'Validando...' : 'Validar e Salvar'}
              </button>
            </form>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Certificados Ativos</h3>
            </div>
            <div className="p-4 flex-1 overflow-auto space-y-3">
              {certificates.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">Nenhum certificado instalado.</div>
              ) : (
                certificates.map(cert => (
                  <div key={cert.id} className="p-3 bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center border border-green-100">
                        <FileKey2 className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-800">{cert.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">Status: {cert.valid ? 'Validado' : 'Inválido'}</div>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(cert.id)} className="text-red-500 hover:text-red-600 text-[10px] uppercase tracking-widest font-bold px-2 py-1 hover:bg-red-50 rounded transition-colors">
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
