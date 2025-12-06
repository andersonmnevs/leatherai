
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { analyzeLeatherImage, processImageForAI, processImageForStorage } from '../services/geminiService';
import { AnalysisStatus } from '../types';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Processando...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [lotId, setLotId] = useState('');
  const [notes, setNotes] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setErrorMessage(null);
    }
  };

  const handleUploadAndAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !auth.currentUser) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      setLoadingText("Otimizando imagem...");
      
      // FLUXO HÍBRIDO:
      // 1. Gera imagem leve (JPG) para o Banco de Dados (<1MB)
      const storageImage = await processImageForStorage(file);
      
      // 2. Gera imagem pesada (PNG 3K) para a IA (Alta Precisão)
      const aiImage = await processImageForAI(file);

      setLoadingText("Salvando registro...");
      let docRef;
      try {
        const addDocPromise = addDoc(collection(db, 'leather_records'), {
          userId: auth.currentUser.uid,
          lotId,
          notes,
          imageUrl: storageImage, // Salva a leve no banco
          storagePath: 'firestore_direct',
          timestamp: Date.now(),
          status: AnalysisStatus.PENDING
        });

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Tempo limite excedido ao salvar. Verifique conexão.")), 15000)
        );

        docRef = await Promise.race([addDocPromise, timeoutPromise]) as any;

      } catch (firestoreError: any) {
        throw new Error(`Erro de Banco de Dados: ${firestoreError.message}`);
      }

      setLoadingText("IA Analisando...");
      try {
        // Envia a imagem pesada (High-Res) para o Gemini
        const analysisResult = await analyzeLeatherImage(aiImage);
        
        setLoadingText("Finalizando...");
        await updateDoc(doc(db, 'leather_records', docRef.id), {
          status: AnalysisStatus.COMPLETED,
          result: analysisResult
        });

        navigate(`/report/${docRef.id}`);

      } catch (aiError: any) {
        const errMsg = aiError.message || "Erro desconhecido na IA";
        setErrorMessage(`Análise falhou. Erro: ${errMsg}`);
        
        await updateDoc(doc(db, 'leather_records', docRef.id), {
          status: AnalysisStatus.ERROR,
          notes: notes + ` (Erro IA: ${errMsg})`
        });
      }

    } catch (error: any) {
      setErrorMessage(error.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
      setLoadingText("Processando...");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-12">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 animate-fade-in-up">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
                Nova Análise <span className="text-brand-600">Inteligente</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-slate-600">
                Carregue a imagem do lote para classificação automática de defeitos e graduação de qualidade em segundos.
            </p>
        </div>

        {errorMessage && (
          <div className="mb-8 rounded-xl bg-red-50 border border-red-100 p-4 flex items-start gap-4 animate-shake">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-full text-red-600">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-900">Falha no Processamento</h3>
              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center transition-all duration-300">
                    <div className="relative w-24 h-24">
                         <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-100 rounded-full"></div>
                         <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-6 text-xl font-medium text-slate-800 animate-pulse">{loadingText}</p>
                </div>
            )}
            
            <form onSubmit={handleUploadAndAnalyze} className="p-8 sm:p-12 space-y-10">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Identificação do Lote</label>
                    <input
                        type="text"
                        required
                        value={lotId}
                        onChange={(e) => setLotId(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3.5 px-4 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 outline-none"
                        placeholder="Ex: LOTE-A-2023"
                        disabled={loading}
                    />
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700">Observações (Opcional)</label>
                    <input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="block w-full rounded-xl border-slate-200 bg-slate-50 py-3.5 px-4 text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200 outline-none"
                        placeholder="Ex: Fornecedor X..."
                        disabled={loading}
                    />
                </div>
            </div>

            {/* Modern Upload Area */}
            <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700">Imagem da Peça</label>
                <div className={`group relative flex flex-col items-center justify-center w-full h-80 rounded-2xl border-2 border-dashed transition-all duration-300 ease-out
                    ${previewUrl ? 'border-brand-200 bg-brand-50/10' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'}
                `}>
                    
                    {previewUrl ? (
                        <div className="relative w-full h-full p-4 flex items-center justify-center">
                            <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-h-full max-w-full rounded-lg shadow-lg object-contain" 
                            />
                            <button 
                                type="button" 
                                onClick={() => {setFile(null); setPreviewUrl(null)}}
                                className="absolute top-6 right-6 p-2 bg-white text-red-500 rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all"
                                title="Remover"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ) : (
                        <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                            <div className="p-4 bg-brand-50 text-brand-600 rounded-full mb-4 group-hover:scale-110 group-hover:bg-brand-100 transition-transform duration-300">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <p className="mb-2 text-lg font-medium text-slate-700">
                                <span className="text-brand-600 font-bold hover:underline">Clique para enviar</span> ou arraste aqui
                            </p>
                            <p className="text-sm text-slate-400">JPG, PNG (Alta Resolução)</p>
                            <input id="file-upload" name="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={loading} />
                        </label>
                    )}
                </div>
            </div>

            <div className="pt-4">
                <Button 
                    type="submit" 
                    isLoading={loading} 
                    disabled={!file} 
                    className="w-full py-4 text-lg font-bold shadow-xl shadow-brand-500/20 hover:shadow-brand-500/40"
                >
                    {loading ? loadingText : 'Processar Análise'}
                </Button>
            </div>
            </form>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
