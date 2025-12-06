
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { LeatherRecord } from '../types';
import jsPDF from 'jspdf';
import Navbar from '../components/Navbar';
import Button from '../components/Button';

const DEFECT_COLORS = [
    '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899',
];

const Report: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<LeatherRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'leather_records', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRecord({ id: docSnap.id, ...docSnap.data() } as LeatherRecord);
        }
      } catch (error) {
        console.error("Error fetching record:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecord();
  }, [id]);

  const generatePDF = () => {
    if (!record || !record.result) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // --- Header ---
    doc.setFillColor(30, 41, 59); // Slate-900
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Relatório de Análise Técnica", 15, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225); // Slate-300
    doc.text(`Gerado via LeatherAI`, 15, 28);

    doc.text(`ID Lote: ${record.lotId}`, pageWidth - 15, 20, { align: "right" });
    const dateStr = new Date(record.timestamp).toLocaleDateString('pt-BR');
    doc.text(`Data: ${dateStr}`, pageWidth - 15, 28, { align: "right" });

    // --- Resumo ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo da Qualidade", 15, 55);
    
    // Quality Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 60, 40, 30, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Classificação", 35, 68, { align: "center" });
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(record.result.quality, 35, 82, { align: "center" });

    // Confidence Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(65, 60, 40, 30, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold"); // Reset font
    doc.text("Confiança", 85, 68, { align: "center" });
    doc.setFontSize(20);
    doc.setTextColor(16, 185, 129); // Emerald
    doc.text(`${(record.result.confidence_level * 100).toFixed(0)}%`, 85, 82, { align: "center" });

    // --- Imagem ---
    // Adicionar imagem
    const imgY = 100;
    const imgMargin = 15;
    const imgMaxWidth = pageWidth - (imgMargin * 2);
    const imgMaxHeight = 100; // Limite de altura para não quebrar página
    
    // Adiciona a imagem base
    try {
        const imgProps = doc.getImageProperties(record.imageUrl);
        const imgRatio = imgProps.width / imgProps.height;
        let finalImgW = imgMaxWidth;
        let finalImgH = imgMaxWidth / imgRatio;

        if (finalImgH > imgMaxHeight) {
            finalImgH = imgMaxHeight;
            finalImgW = imgMaxHeight * imgRatio;
        }
        
        // Centralizar
        const finalImgX = (pageWidth - finalImgW) / 2;
        
        doc.addImage(record.imageUrl, 'JPEG', finalImgX, imgY, finalImgW, finalImgH);

        // Desenhar Bounding Boxes no PDF
        if (record.result.defects_visual) {
            record.result.defects_visual.forEach((defect, idx) => {
                const [ymin, xmin, ymax, xmax] = defect.box_2d;
                // Converter coordenadas 0-1000 para coordenadas do PDF
                // ymin/1000 * altura_imagem + y_inicial_imagem
                const rectX = finalImgX + (xmin / 1000) * finalImgW;
                const rectY = imgY + (ymin / 1000) * finalImgH;
                const rectW = ((xmax - xmin) / 1000) * finalImgW;
                const rectH = ((ymax - ymin) / 1000) * finalImgH;

                doc.setDrawColor(255, 0, 0); // Vermelho para destaque no PDF
                doc.setLineWidth(0.5);
                doc.rect(rectX, rectY, rectW, rectH);
                
                // Label com número
                doc.setFillColor(255, 0, 0);
                doc.rect(rectX, rectY - 4, 6, 4, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(6);
                doc.text(`${idx + 1}`, rectX + 3, rectY - 1, { align: 'center' });
            });
        }
        
        // --- Lista de Defeitos ---
        let cursorY = imgY + finalImgH + 15;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhamento de Defeitos", 15, cursorY);
        cursorY += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (record.result.defects_visual && record.result.defects_visual.length > 0) {
            record.result.defects_visual.forEach((defect, idx) => {
                // Checar quebra de página
                if (cursorY > 270) {
                    doc.addPage();
                    cursorY = 20;
                }
                doc.setTextColor(50, 50, 50);
                doc.text(`${idx + 1}. ${defect.type}`, 20, cursorY);
                cursorY += 6;
            });
        } else {
             doc.text("Nenhum defeito visual detectado.", 20, cursorY);
             cursorY += 6;
        }

        // --- Descrição ---
        cursorY += 10;
        // Checar quebra de página
        if (cursorY > 250) {
            doc.addPage();
            cursorY = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text("Parecer Técnico", 15, cursorY);
        cursorY += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        
        const splitText = doc.splitTextToSize(record.result.description, pageWidth - 30);
        doc.text(splitText, 15, cursorY);

    } catch (err) {
        console.error("Erro ao processar imagem para PDF", err);
        doc.setTextColor(255, 0, 0);
        doc.text("Erro ao renderizar imagem no relatório.", 15, imgY + 20);
    }

    doc.save(`Analise-${record.lotId}.pdf`);
  };

  if (loading) return <div className="flex justify-center items-center h-screen bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-200 border-t-brand-600"></div></div>;
  if (!record || !record.result) return <div className="p-8 text-center text-slate-500">Registro não encontrado.</div>;

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Header */}
        <div className="mb-8 flex justify-between items-center">
          <Link to="/history" className="text-slate-500 hover:text-slate-900 flex items-center font-medium transition-colors">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Voltar
          </Link>
          <div className="flex gap-3">
             <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-500 font-mono flex items-center">
                ID: {record.id.slice(0,8)}...
             </span>
             <Button onClick={generatePDF} variant="secondary" className="!py-1.5 !px-4 text-sm">
                Download PDF
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          
          {/* Header Panel */}
          <div className="px-8 py-8 bg-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             
             <div className="relative z-10">
               <h2 className="text-xs font-bold text-brand-300 uppercase tracking-widest mb-1">Resultado da Análise</h2>
               <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{record.lotId}</h1>
               <div className="flex items-center gap-3 text-sm text-slate-400">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                 {new Date(record.timestamp).toLocaleDateString('pt-BR')}
               </div>
             </div>

             <div className="relative z-10 flex items-center gap-6 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/10">
               <div className="text-right">
                  <p className="text-xs text-slate-300 font-medium uppercase">Qualidade</p>
                  <p className="text-2xl font-bold">{record.result.quality}</p>
               </div>
               <div className="w-px h-10 bg-white/20"></div>
               <div className="text-right">
                  <p className="text-xs text-slate-300 font-medium uppercase">Confiança</p>
                  <p className="text-2xl font-bold text-emerald-400">{(record.result.confidence_level * 100).toFixed(0)}%</p>
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12">
            
            {/* Visual Column */}
            <div className="lg:col-span-7 bg-slate-50 p-8 border-r border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Mapeamento de Defeitos</h3>
               </div>

               <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm group bg-white">
                  <img src={record.imageUrl} alt="Analyzed" className="w-full h-auto block" />
                  
                  {/* CSS-based Overlay (Percentual) - Correção de Desalinhamento */}
                  {record.result.defects_visual && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                      {record.result.defects_visual.map((defect, idx) => {
                        const [ymin, xmin, ymax, xmax] = defect.box_2d;
                        const color = DEFECT_COLORS[idx % DEFECT_COLORS.length];
                        
                        // Conversão de escala 0-1000 para %
                        const top = (ymin / 1000) * 100;
                        const left = (xmin / 1000) * 100;
                        const width = ((xmax - xmin) / 1000) * 100;
                        const height = ((ymax - ymin) / 1000) * 100;

                        return (
                          <div
                            key={idx}
                            style={{ 
                              top: `${top}%`, 
                              left: `${left}%`, 
                              width: `${width}%`, 
                              height: `${height}%`,
                              borderColor: color
                            }}
                            className="absolute border-[3px] shadow-sm transition-all duration-300"
                          >
                             {/* Label */}
                             <div 
                                style={{ backgroundColor: color }}
                                className="absolute -top-6 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm flex items-center justify-center min-w-[20px]"
                             >
                                {idx + 1}
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>

            {/* Info Column */}
            <div className="lg:col-span-5 p-8 space-y-8 bg-white">
               
               <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Lista de Ocorrências</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {record.result.defects_visual && record.result.defects_visual.length > 0 ? (
                          record.result.defects_visual.map((defect, idx) => (
                              <div key={idx} className="flex items-start p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                  <span 
                                    className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white mr-3 shadow-sm mt-0.5"
                                    style={{ backgroundColor: DEFECT_COLORS[idx % DEFECT_COLORS.length] }}
                                  >
                                      {idx + 1}
                                  </span>
                                  <div>
                                      <p className="text-sm font-semibold text-slate-700 capitalize">{defect.type}</p>
                                      <p className="text-xs text-slate-400">Detectado via Visão Computacional</p>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-sm font-medium flex gap-2">
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                             Nenhum defeito visual detectado.
                          </div>
                      )}
                  </div>
               </div>

               <div className="pt-6 border-t border-slate-100">
                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Avaliação Descritiva</h3>
                 <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {record.result.description}
                 </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
