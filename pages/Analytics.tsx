
import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LeatherRecord, AnalysisStatus } from '../types';
import Navbar from '../components/Navbar';

// --- COMPONENTES DE GRÁFICOS NATIVOS (SVG/CSS) ---

// Componente Auxiliar de Card
const CardKPI = ({ title, value, color, tooltip }: any) => {
    const colors: any = {
        brand: "bg-brand-50 text-brand-600 border-brand-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        gray: "bg-slate-50 text-slate-600 border-slate-100",
        red: "bg-red-50 text-red-600 border-red-100",
        green: "bg-emerald-50 text-emerald-600 border-emerald-100",
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        emerald: "bg-green-50 text-green-600 border-green-100",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        slate: "bg-slate-100 text-slate-600 border-slate-200",
    };

    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-visible group">
            <div className={`absolute top-0 right-0 p-3 rounded-bl-2xl ${colors[color]} opacity-20 group-hover:opacity-30 transition-opacity overflow-hidden`}>
               <div className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
                {tooltip && (
                    <div className="relative group/tooltip">
                        <svg className="w-3.5 h-3.5 text-slate-300 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-50 text-center">
                            {tooltip}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
        </div>
    );
}

// 1. Gráfico de Barras Vertical (Simples)
const NativeBarChart = ({ data, colorClass = "bg-brand-500", labelKey = "label", valueKey = "value" }: any) => {
    const maxValue = Math.max(...data.map((d: any) => d[valueKey]), 1); 
    
    return (
        <div className="w-full h-full flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {data.map((item: any, idx: number) => {
                const heightPercent = Math.round((item[valueKey] / maxValue) * 100);
                return (
                    <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                        <div className="absolute -top-8 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {item[valueKey]} análises
                        </div>
                        <div 
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 ease-out ${colorClass} hover:opacity-80`}
                            style={{ height: `${heightPercent}%` }}
                        ></div>
                        <span className="text-[10px] text-slate-400 mt-2 font-medium truncate w-full text-center">{item[labelKey]}</span>
                    </div>
                );
            })}
        </div>
    );
};

// 2. Gráfico de Barras Empilhadas (Evolução da Qualidade - TR System)
const NativeStackedBarChart = ({ data }: any) => {
    // Encontrar o maior volume diário para escalar o eixo Y
    const maxValue = Math.max(...data.map((d: any) => d.value), 1);

    return (
        <div className="w-full h-full flex items-end justify-between gap-2 pt-6 pb-2 px-2">
            {data.map((item: any, idx: number) => {
                const total = item.value || 0;
                // Altura da barra inteira relativa ao dia com mais movimento
                const barHeightPercent = Math.round((total / maxValue) * 100);

                // Porcentagens internas de cada segmento
                const pTR1 = total ? (item.TR1 / total) * 100 : 0;
                const pTR2 = total ? (item.TR2 / total) * 100 : 0;
                const pTR3 = total ? (item.TR3 / total) * 100 : 0;
                const pTR4 = total ? (item.TR4 / total) * 100 : 0;
                const pR = total ? (item.R / total) * 100 : 0;

                return (
                    <div key={idx} className="flex flex-col items-center justify-end h-full flex-1 group relative">
                         {/* Tooltip Detalhado */}
                         <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none w-max shadow-xl">
                            <div className="font-bold mb-1 border-b border-white/20 pb-1">{item.label}: {total} total</div>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px]">
                                <span className="text-emerald-400">TR1: {item.TR1}</span>
                                <span className="text-blue-400">TR2: {item.TR2}</span>
                                <span className="text-amber-400">TR3: {item.TR3}</span>
                                <span className="text-orange-400">TR4: {item.TR4}</span>
                                <span className="text-red-400">R: {item.R}</span>
                            </div>
                        </div>

                        {/* Barra Segmentada */}
                        <div className="w-full max-w-[40px] flex flex-col-reverse rounded-t-lg overflow-hidden bg-slate-100 relative" style={{ height: `${barHeightPercent}%` }}>
                             {pTR1 > 0 && <div style={{ height: `${pTR1}%` }} className="bg-emerald-500 w-full hover:bg-emerald-400 transition-colors"></div>}
                             {pTR2 > 0 && <div style={{ height: `${pTR2}%` }} className="bg-blue-500 w-full hover:bg-blue-400 transition-colors"></div>}
                             {pTR3 > 0 && <div style={{ height: `${pTR3}%` }} className="bg-amber-500 w-full hover:bg-amber-400 transition-colors"></div>}
                             {pTR4 > 0 && <div style={{ height: `${pTR4}%` }} className="bg-orange-500 w-full hover:bg-orange-400 transition-colors"></div>}
                             {pR > 0 && <div style={{ height: `${pR}%` }} className="bg-red-500 w-full hover:bg-red-400 transition-colors"></div>}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 font-medium truncate w-full text-center">{item.label}</span>
                    </div>
                )
            })}
        </div>
    )
}

// 3. Gráfico de Rosca (Donut)
const NativeDonutChart = ({ data }: { data: { name: string; value: number; color: string }[] }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);

    if (total === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Sem dados</div>;

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 h-full w-full">
            {/* Gráfico */}
            <div className="relative w-52 h-52 flex-shrink-0">
                <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `conic-gradient(${data.map((d, i, arr) => {
                            const prev = arr.slice(0, i).reduce((acc, cur) => acc + cur.value, 0);
                            const start = (prev / total) * 100;
                            const end = ((prev + d.value) / total) * 100;
                            return `${d.color} ${start}% ${end}%`;
                        }).join(', ')})`
                    }}
                ></div>
                {/* Máscara interna menor (inset-8) cria uma rosca mais grossa */}
                <div className="absolute inset-10 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-bold text-slate-700">{total}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">Total</span>
                </div>
            </div>

            {/* Legenda Otimizada (1 por linha horizontal) */}
            <div className="flex flex-col gap-2 w-full max-w-[200px]">
                {data.map((item, i) => (
                    <div key={i} className="flex items-center justify-between w-full border-b border-slate-50 pb-1 last:border-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-bold text-slate-700">{item.name}</span>
                        </div>
                        <span className="text-sm text-slate-500 font-mono font-medium">
                            {Math.round((item.value / total) * 100)}% <span className="text-xs text-slate-400">({item.value})</span>
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. Gráfico de Barras Horizontais
const NativeHorizontalBar = ({ data }: any) => {
    const maxVal = Math.max(...data.map((d: any) => d.count), 1);

    if (data.length === 0) return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Nenhum defeito registrado</div>;

    return (
        <div className="w-full space-y-3">
            {data.map((item: any, i: number) => (
                <div key={i} className="w-full">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="text-slate-500 font-mono">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${(item.count / maxVal) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

type TabType = 'productivity' | 'quality' | 'defects';

// --- HELPER DE DATA À PROVA DE BALAS ---
// Extrai YYYY-MM-DD usando os métodos locais do navegador.
// Se seu relógio diz dia 29, ele retorna "2025-11-29". Sem conversão UTC.
const getLocalYYYYMMDD = (d: Date | number) => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper para converter ISO YYYY-MM-DD para DD/MM/AAAA (Apenas visualização)
const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
};

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Custom Date Range State
  // Inicializa com data LOCAL (hoje e 6 dias atrás)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return getLocalYYYYMMDD(d);
  });
  const [endDate, setEndDate] = useState(() => {
    return getLocalYYYYMMDD(new Date());
  });

  const [isEmpty, setIsEmpty] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('productivity');

  // KPIs
  const [metrics, setMetrics] = useState({
    total: 0,
    avgPerDay: 0,
    pending: 0,
    error: 0,
    approvalRate: 0,
    confidenceAvg: 0,
    dominantGrade: '-', 
    rejectRate: 0,
    totalDefects: 0,
    avgDefects: 0,
    criticalDefects: 0
  });

  // Chart Data
  const [dailyData, setDailyData] = useState<any[]>([]); 
  const [qualityDistribution, setQualityDistribution] = useState<any[]>([]);
  const [topDefects, setTopDefects] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      const q = query(
        collection(db, 'leather_records'),
        where('userId', '==', auth.currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const allData = snapshot.docs.map(doc => doc.data() as LeatherRecord);

      // Filtragem Estrita por String YYYY-MM-DD
      // Compara "2025-11-29" >= "2025-11-29" (TRUE)
      const filteredData = allData.filter(r => {
          const rDateKey = getLocalYYYYMMDD(r.timestamp);
          return rDateKey >= startDate && rDateKey <= endDate;
      });
      
      // Datas para loop de geração de gráfico
      // Precisamos garantir que o objeto Date comece zerado no dia certo
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const startObj = new Date(startYear, startMonth - 1, startDay);
      
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      const endObj = new Date(endYear, endMonth - 1, endDay);
      
      if (filteredData.length === 0) {
        setIsEmpty(true);
        generateEmptyCharts(startObj, endObj);
      } else {
        setIsEmpty(false);
        processMetricsAndCharts(filteredData, startObj, endObj);
      }

    } catch (error) {
      console.error("Erro ao carregar analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const generateEmptyCharts = (start: Date, end: Date) => {
      const emptyDays = [];
      let current = new Date(start); 
      
      // Loop seguro comparando timestamps
      while (current.getTime() <= end.getTime()) {
        const label = current.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
        emptyDays.push({ label, value: 0, TR1:0, TR2:0, TR3:0, TR4:0, R:0 });
        current.setDate(current.getDate() + 1);
      }
      setDailyData(emptyDays);
      setQualityDistribution([]);
      setTopDefects([]);
      setMetrics({
          total: 0, avgPerDay: 0, pending: 0, error: 0,
          approvalRate: 0, confidenceAvg: 0, dominantGrade: '-', rejectRate: 0,
          totalDefects: 0, avgDefects: 0, criticalDefects: 0
      });
  };

  const processMetricsAndCharts = (data: LeatherRecord[], start: Date, end: Date) => {
    const datesMap = new Map<string, any>();
    
    // 1. Inicializar dias no intervalo (Gap Filling)
    let current = new Date(start);
    const loopEnd = end.getTime();

    let daysCount = 0;
    while (current.getTime() <= loopEnd) {
        const isoKey = getLocalYYYYMMDD(current); // Chave consistente
        const label = current.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
        
        datesMap.set(isoKey, { 
            isoKey,
            label: label, 
            value: 0, 
            TR1: 0, TR2: 0, TR3: 0, TR4: 0, R: 0 
        });
        current.setDate(current.getDate() + 1);
        daysCount++;
    }

    // 2. Preencher com dados
    let completedCount = 0;
    let approved = 0;
    let rejected = 0;
    let totalConf = 0;
    let totalDefectsCount = 0;
    let critDefects = 0;
    
    const qualityTotalCounts: Record<string, number> = { TR1: 0, TR2: 0, TR3: 0, TR4: 0, R: 0 };
    const defectsMap = new Map<string, number>();

    data.forEach(r => {
        const isoKey = getLocalYYYYMMDD(r.timestamp);

        if (datesMap.has(isoKey)) {
            const dayData = datesMap.get(isoKey);
            dayData.value += 1;

            if (r.status === AnalysisStatus.COMPLETED && r.result) {
                const q = r.result.quality;
                
                // Mapeamento de Qualidade
                let mappedQ = '';
                if (q === 'A' || q === 'TR1') mappedQ = 'TR1';
                else if (q === 'B' || q === 'TR2') mappedQ = 'TR2';
                else if (q === 'C' || q === 'TR3') mappedQ = 'TR3';
                else if (q === 'D' || q === 'TR4') mappedQ = 'TR4';
                else if (q.includes('Rejeit') || q.includes('Refugo') || q === 'R') mappedQ = 'R';
                else mappedQ = 'R';

                // Agregar Por Dia
                if (mappedQ === 'TR1') dayData.TR1++;
                else if (mappedQ === 'TR2') dayData.TR2++;
                else if (mappedQ === 'TR3') dayData.TR3++;
                else if (mappedQ === 'TR4') dayData.TR4++;
                else if (mappedQ === 'R') dayData.R++;

                // Agregar Totais
                completedCount++;
                if (mappedQ === 'TR1') { approved++; qualityTotalCounts.TR1++; }
                else if (mappedQ === 'TR2') { approved++; qualityTotalCounts.TR2++; }
                else if (mappedQ === 'TR3') { qualityTotalCounts.TR3++; }
                else if (mappedQ === 'TR4') { qualityTotalCounts.TR4++; }
                else if (mappedQ === 'R') { rejected++; qualityTotalCounts.R++; }

                totalConf += r.result.confidence_level || 0;

                const defects = r.result.defects_detected || [];
                totalDefectsCount += defects.length;
                
                if (mappedQ === 'TR4' || mappedQ === 'R') critDefects += defects.length;

                defects.forEach(d => {
                    const key = d.trim().toLowerCase();
                    const prettyKey = key.charAt(0).toUpperCase() + key.slice(1);
                    defectsMap.set(prettyKey, (defectsMap.get(prettyKey) || 0) + 1);
                });
            }
        }
    });

    let maxGradeCount = 0;
    let domGrade = '-';
    Object.entries(qualityTotalCounts).forEach(([key, count]) => {
        if (count > maxGradeCount) {
            maxGradeCount = count;
            domGrade = key;
        }
    });
    if (maxGradeCount === 0) domGrade = '-';

    setDailyData(Array.from(datesMap.values()));

    setQualityDistribution([
        { name: 'TR1', value: qualityTotalCounts.TR1, color: '#10b981' },
        { name: 'TR2', value: qualityTotalCounts.TR2, color: '#3b82f6' },
        { name: 'TR3', value: qualityTotalCounts.TR3, color: '#f59e0b' },
        { name: 'TR4', value: qualityTotalCounts.TR4, color: '#f97316' },
        { name: 'R', value: qualityTotalCounts.R, color: '#ef4444' },
    ].filter(item => item.value > 0));

    const sortedDefects = Array.from(defectsMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    setTopDefects(sortedDefects);

    setMetrics({
        total: data.length,
        avgPerDay: daysCount > 0 ? data.length / daysCount : 0,
        pending: data.filter(r => r.status === AnalysisStatus.PENDING).length,
        error: data.filter(r => r.status === AnalysisStatus.ERROR).length,
        approvalRate: completedCount ? (approved / completedCount) * 100 : 0,
        confidenceAvg: completedCount ? (totalConf / completedCount) * 100 : 0,
        dominantGrade: domGrade,
        rejectRate: completedCount ? (rejected / completedCount) * 100 : 0,
        totalDefects: totalDefectsCount,
        avgDefects: completedCount ? totalDefectsCount / completedCount : 0,
        criticalDefects: critDefects
    });
  };

  const getDominantColor = (grade: string) => {
      if (grade === 'TR1') return 'emerald';
      if (grade === 'TR2') return 'blue';
      if (grade === 'TR3') return 'amber';
      if (grade === 'TR4') return 'orange';
      if (grade === 'R') return 'red';
      return 'slate';
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Compacto com Abas Integradas */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
            {/* Título */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Gerencial</h1>
                <p className="text-slate-500 mt-1">Visão estratégica da operação.</p>
            </div>
            
            {/* Grupo de Ações (Abas + Filtros) */}
            <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                
                {/* Abas Estilo Segmented Control */}
                <div className="p-1 bg-white border border-slate-200 rounded-xl shadow-sm flex w-full md:w-auto overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('productivity')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex-1 md:flex-none text-center ${
                            activeTab === 'productivity' 
                            ? 'bg-slate-800 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        Produtividade
                    </button>
                    <button
                        onClick={() => setActiveTab('quality')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex-1 md:flex-none text-center ${
                            activeTab === 'quality' 
                            ? 'bg-slate-800 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        Qualidade
                    </button>
                    <button
                        onClick={() => setActiveTab('defects')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex-1 md:flex-none text-center ${
                            activeTab === 'defects' 
                            ? 'bg-slate-800 text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                    >
                        Problemas
                    </button>
                </div>

                {/* Separador Vertical (apenas desktop) */}
                <div className="hidden md:block w-px h-8 bg-slate-200"></div>

                {/* Filtros de Data com Máscara Visual PT-BR e Input Absoluto */}
                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 w-full md:w-auto">
                    {/* Campo DE */}
                    <div className="relative group w-32 bg-slate-50 rounded-lg border border-slate-100 bg-white">
                        {/* Camada Visual (Fundo) */}
                        <div className="flex items-center gap-2 px-2 py-1 pointer-events-none">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">De</label>
                             <span className="text-sm text-slate-700 font-medium whitespace-nowrap overflow-hidden">
                                {formatDisplayDate(startDate)}
                             </span>
                        </div>
                        {/* Camada Funcional (Input Invisível por Cima - Clicável) */}
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                    
                    <span className="text-slate-300">→</span>
                    
                    {/* Campo ATÉ */}
                    <div className="relative group w-32 bg-slate-50 rounded-lg border border-slate-100 bg-white">
                        {/* Camada Visual (Fundo) */}
                        <div className="flex items-center gap-2 px-2 py-1 pointer-events-none">
                             <label className="text-[10px] font-bold text-slate-400 uppercase">Até</label>
                             <span className="text-sm text-slate-700 font-medium whitespace-nowrap overflow-hidden">
                                {formatDisplayDate(endDate)}
                             </span>
                        </div>
                        {/* Camada Funcional (Input Invisível por Cima - Clicável) */}
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                    </div>
                </div>
            </div>
        </div>

        {loading ? (
             <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600"></div></div>
        ) : (
            <div className="min-h-[400px]">
                
                {isEmpty && (
                     <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 mb-8 text-center animate-fade-in-up">
                        Não existem dados suficientes no período selecionado.
                     </div>
                )}

                {/* SEÇÃO 1: PRODUTIVIDADE */}
                {activeTab === 'productivity' && (
                    <div className="animate-fade-in-up space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <CardKPI title="Total Análises" value={metrics.total} color="brand" />
                            <CardKPI title="Média / Dia" value={metrics.avgPerDay.toFixed(1)} color="blue" />
                            <CardKPI title="Pendentes" value={metrics.pending} color="gray" />
                            <CardKPI title="Erros" value={metrics.error} color="red" />
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-96 flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Volume de Análises Diário</h3>
                            <p className="text-sm text-slate-500 mb-4">Quantidade absoluta de processamentos realizados por dia.</p>
                            <div className="flex-1 w-full">
                                <NativeBarChart data={dailyData} colorClass="bg-brand-500" />
                            </div>
                        </div>
                    </div>
                )}

                {/* SEÇÃO 2: QUALIDADE */}
                {activeTab === 'quality' && (
                    <div className="animate-fade-in-up space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <CardKPI 
                                title="Aprovação" 
                                value={`${metrics.approvalRate.toFixed(0)}%`} 
                                color="green" 
                                tooltip="Considera TR1 e TR2 como aprovados."
                            />
                            <CardKPI title="Confiança IA" value={`${metrics.confidenceAvg.toFixed(0)}%`} color="indigo" />
                            <CardKPI 
                                title="Predominante" 
                                value={metrics.dominantGrade} 
                                color={getDominantColor(metrics.dominantGrade)} 
                                tooltip="Classificação com maior volume no período."
                            />
                            <CardKPI title="Rejeição" value={`${metrics.rejectRate.toFixed(1)}%`} color="red" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[420px] flex flex-col">
                                 <h3 className="text-lg font-bold text-slate-800 mb-2">Distribuição de Classes</h3>
                                 <p className="text-sm text-slate-500 mb-6">Proporção total de cada classificação no período.</p>
                                 <div className="flex-1 w-full flex items-center justify-center">
                                     <NativeDonutChart data={qualityDistribution} />
                                 </div>
                            </div>
                            
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[420px] flex flex-col">
                                 <h3 className="text-lg font-bold text-slate-800 mb-2">Evolução da Qualidade</h3>
                                 <p className="text-sm text-slate-500 mb-4">Variação diária da classificação das peles.</p>
                                 <div className="flex-1 w-full">
                                     <NativeStackedBarChart data={dailyData} />
                                 </div>
                                 <div className="flex justify-center gap-4 mt-6 text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-lg flex-wrap">
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>TR1</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>TR2</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>TR3</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>TR4</span>
                                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>R</span>
                                 </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEÇÃO 3: DEFEITOS */}
                {activeTab === 'defects' && (
                    <div className="animate-fade-in-up space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <CardKPI title="Total Defeitos" value={metrics.totalDefects} color="orange" />
                            <CardKPI title="Média / Peça" value={metrics.avgDefects.toFixed(1)} color="amber" />
                            <CardKPI title="Críticos" value={metrics.criticalDefects} color="red" />
                            <CardKPI title="Mais Comum" value={topDefects[0]?.name || '-'} color="slate" />
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm h-[500px] flex flex-col">
                            <h3 className="text-lg font-bold text-slate-800 mb-2 flex-shrink-0">Top 10 Defeitos Recorrentes</h3>
                            <p className="text-sm text-slate-500 mb-6 flex-shrink-0">Tipos de problemas mais frequentes identificados pela IA.</p>
                            <div className="flex-1 w-full min-h-0 overflow-y-auto custom-scrollbar pr-2">
                                 <NativeHorizontalBar data={topDefects} />
                            </div>
                        </div>
                    </div>
                )}

            </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
