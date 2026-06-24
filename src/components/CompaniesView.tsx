import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, Plus, Trash2 } from 'lucide-react';

interface Props {
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
}

export default function CompaniesView({ companies, setCompanies }: Props) {
  const [cnpj, setCnpj] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpj || !razaoSocial) return;
    const newCompany: Company = {
      id: Math.random().toString(36).substr(2, 9),
      cnpj,
      razaoSocial,
      inscricaoEstadual
    };
    setCompanies([...companies, newCompany]);
    setCnpj('');
    setRazaoSocial('');
    setInscricaoEstadual('');
  };

  const handleRemove = (id: string) => {
    setCompanies(companies.filter(c => c.id !== id));
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Gerenciamento de Empresas
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Adicionar Nova Empresa</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-md px-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Razão Social</label>
              <input
                type="text"
                value={razaoSocial}
                onChange={e => setRazaoSocial(e.target.value)}
                placeholder="Empresa Exemplo LTDA"
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-md px-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Inscrição Estadual</label>
              <input
                type="text"
                value={inscricaoEstadual}
                onChange={e => setInscricaoEstadual(e.target.value)}
                placeholder="123.456.789.000"
                className="w-full h-9 bg-gray-50 border border-gray-200 rounded-md px-3 text-xs text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
            <div className="md:col-span-3 flex justify-end mt-2">
              <button type="submit" className="flex items-center gap-2 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded shadow-sm transition-colors">
                <Plus className="w-4 h-4" />
                Cadastrar Empresa
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-[10px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-medium">CNPJ</th>
                <th className="px-6 py-3 font-medium">Razão Social</th>
                <th className="px-6 py-3 font-medium">Inscrição Estadual</th>
                <th className="px-6 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-500">Nenhuma empresa cadastrada.</td>
                </tr>
              ) : (
                companies.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-800">{c.cnpj}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{c.razaoSocial}</td>
                    <td className="px-6 py-4 text-gray-500">{c.inscricaoEstadual || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleRemove(c.id)} className="text-red-500 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded-md">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
