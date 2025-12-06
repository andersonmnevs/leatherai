
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { LeatherRecord, AnalysisStatus } from '../types';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { Link } from 'react-router-dom';

// Helper para converter ISO YYYY-MM-DD para DD/MM/AAAA
const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

const History: React.FC = () => {
  const [records, setRecords] = useState<LeatherRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filtros
  const [searchLotId, setSearchLotId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setLoading(true);
    setHasSearched(true);
    setRecords([]);

    try {
      const q = query(
        collection(db, 'leather_records'),
        where('userId', '==', auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      let docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LeatherRecord[];

      if (searchLotId.trim()) {
        const term = searchLotId.toLowerCase().trim();
        docs = docs.filter(r => r.lotId.toLowerCase().includes(term));
      }

      // Correção de Filtro de Data (Ignora Hora/Fuso)
      if (startDate) {
        // YYYY-MM-DD string comparison
        docs = docs.filter(r => {
             // Ajuste fuso horário local
             const offset = new Date(r.timestamp).getTimezoneOffset();
             const localDate = new Date(r.timestamp - (offset * 60 * 1000)).toISOString().split('T')[0];
             return localDate >= startDate;
        });
      }
      if (endDate) {
        docs = docs.filter(r => {
             const offset = new Date(r.timestamp).getTimezoneOffset();
             const localDate = new Date(r.timestamp - (offset * 60 * 1000)).toISOString().split('T')[0];
             return localDate <= endDate;
        });
      }

      if (statusFilter !== 'ALL') {
        docs = docs.filter(r => r.status === statusFilter);
      }

      docs.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(docs);

    } catch (error) {
      console.error("Erro busca:", error);
      alert("Erro ao buscar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Confirmar exclusão?")) {
      try {
        await deleteDoc(doc(db, 'leather_records', id));
        setRecords(prev => prev.filter(r => r.id !== id));
      } catch (error) {
        alert("Erro ao excluir.");
      }
    }
  };
  
  // Helper para cor da badge
  const getQualityBadgeColor = (quality: string) => {
      if (quality === 'TR1' || quality === 'A') return 'bg-green-50 text-green-700 border-green-200';
      if (quality === 'TR2' || quality === 'B') return 'bg-blue-50 text-blue-700 border-blue-200';
      if (quality === 'TR3' || quality === 'C') return 'bg-amber-50 text-amber-700 border-amber-200';
      if (quality === 'TR4' || quality === 'D') return 'bg-orange-50 text-orange-700 border-orange-200';
      if (quality === 'R' || quality.includes('Rejeit')) return 'bg-red-50 text-red-700 border-red-200';
      return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div>
               <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Histórico</h1>
               <p className="text-slate-500 mt-1">Gerencie seu banco de dados de qualidade.</p>
           </div>
           <Link to="/" className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Nova Análise
           </Link>
        </div>

        {/* Modern Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lote / ID</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar..." 
                            className="block w-full rounded-xl border-slate-200 bg-slate-50 pl-10 py-2.5 text-sm focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                            value={searchLotId}
                            onChange={(e) => setSearchLotId(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>
                </div>
                
                {/* Campo Data Inicial com Máscara Visual e Input Nativo por Cima */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">De</label>
                    <div className="relative group w-full bg-slate-50 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all">
                        {/* Visual Layer */}
                        <div className="flex items-center justify-between px-4 py-2.5 pointer-events-none">
                            <span className={`text-sm font-medium ${startDate ? 'text-slate-900' : 'text-slate-400'}`}>
                                {startDate ? formatDisplayDate(startDate) : 'dd/mm/aaaa'}
                            </span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        {/* Functional Layer */}
                        <input 
                            type="date" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                </div>

                {/* Campo Data Final com Máscara Visual e Input Nativo por Cima */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Até</label>
                    <div className="relative group w-full bg-slate-50 rounded-xl border border-slate-200 bg-white hover:border-brand-300 transition-all">
                        {/* Visual Layer */}
                        <div className="flex items-center justify-between px-4 py-2.5 pointer-events-none">
                            <span className={`text-sm font-medium ${endDate ? 'text-slate-900' : 'text-slate-400'}`}>
                                {endDate ? formatDisplayDate(endDate) : 'dd/mm/aaaa'}
                            </span>
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        {/* Functional Layer */}
                        <input 
                            type="date" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                   <Button type="submit" isLoading={loading} className="w-full justify-center py-2.5">
                       Filtrar Resultados
                   </Button>
                </div>
            </form>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {!hasSearched ? (
                <div className="text-center py-24 px-4 bg-slate-50/50">
                    <div className="mx-auto h-16 w-16 text-slate-300 mb-4 bg-white rounded-full p-3 shadow-sm">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Aplicar Filtros</h3>
                    <p className="mt-1 text-slate-500">Defina os parâmetros acima para visualizar os dados.</p>
                </div>
            ) : records.length === 0 ? (
                <div className="text-center py-20 px-4">
                    <p className="text-slate-500">Nenhum registro encontrado.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lote</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Qualidade</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Defeitos Principais</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-50">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {/* Formatação pt-BR dd/mm/aaaa */}
                                        <div className="font-medium">
                                            {new Date(record.timestamp).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(record.timestamp).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-900">{record.lotId}</div>
                                        {record.notes && <div className="text-xs text-slate-400 truncate max-w-[120px]">{record.notes}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {record.result?.quality ? (
                                            <span className={`inline-flex items-center justify-center w-10 h-8 rounded-full text-xs font-bold shadow-sm border ${getQualityBadgeColor(record.result.quality)}`}>
                                                {record.result.quality}
                                            </span>
                                        ) : (
                                            <span className="text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {record.result?.defects_detected?.slice(0, 2).map((d, i) => (
                                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                    {d}
                                                </span>
                                            ))}
                                            {(record.result?.defects_detected?.length || 0) > 2 && (
                                                <span className="text-xs text-slate-400 self-center font-medium">+{record.result!.defects_detected.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {record.status === AnalysisStatus.COMPLETED ? (
                                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                Concluído
                                             </span>
                                        ) : record.status === AnalysisStatus.ERROR ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                Erro
                                             </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                Pendente
                                             </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                            {record.status === AnalysisStatus.COMPLETED && (
                                                <Link to={`/report/${record.id}`} className="p-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="Ver Laudo">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                </Link>
                                            )}
                                            <button 
                                                onClick={() => handleDelete(record.id)} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default History;
