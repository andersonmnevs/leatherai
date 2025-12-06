# Fluxo de Dados - LeatherAI

## 1. Visão Geral

Este documento detalha os fluxos de dados da aplicação LeatherAI, desde a interação do usuário até a persistência e exibição de resultados.

---

## 2. Fluxo Principal: Análise de Couro (Happy Path)

### 2.1 Diagrama de Sequência

```mermaid
sequenceDiagram
    participant U as Usuário
    participant D as Dashboard.tsx
    participant IU as imageUtils.ts
    participant FS as Firestore
    participant G as Gemini API
    participant R as Report.tsx

    U->>D: 1. Upload imagem + preenche form
    Note over U,D: loteId + notes + arquivo
    
    D->>IU: 2. optimizeImage(file)
    Note over IU: Resize 800px<br/>JPEG quality 70%
    IU-->>D: base64 string
    
    D->>FS: 3. createDoc({ status: PENDING })
    Note over FS: Gera ID automático
    FS-->>D: Document ID
    
    D->>G: 4. POST generateContent
    Note over D,G: Payload:<br/>- prompt<br/>- base64 image<br/>- JSON schema
    
    Note over G: Processamento IA<br/>15-30 segundos
    
    G-->>D: 5. JSON response
    Note over G: { quality, defects,<br/>confidence, opinion }
    
    D->>D: 6. Validar schema
    
    D->>FS: 7. updateDoc({ ...result, status: COMPLETED })
    FS-->>D: Success
    
    D->>R: 8. navigate('/report/:id')
    
    R->>FS: 9. getDoc(id)
    FS-->>R: Analysis data
    
    R->>U: 10. Renderizar relatório
    Note over R,U: Imagem + bounding boxes<br/>Classificação + defeitos<br/>Parecer técnico
```

### 2.2 Fluxo Textual Detalhado

**Etapa 1-2: Preparação da Imagem**
```typescript
// Usuário seleciona arquivo
const file = event.target.files[0];

// Sistema valida
if (!file.type.startsWith('image/')) {
  throw new Error('Arquivo deve ser imagem');
}

// Otimiza imagem
const base64 = await optimizeImage(file);
// Reduz de ~5MB para ~500KB
```

**Etapa 3: Criação do Registro**
```typescript
const docRef = await addDoc(collection(db, 'leatherAnalysis'), {
  userId: currentUser.uid,
  loteId: formData.loteId,
  notes: formData.notes,
  imageUrl: base64,
  status: 'PENDING',
  timestamp: serverTimestamp()
});
// Retorna: docRef.id = "abc123..."
```

**Etapa 4-5: Análise IA**
```typescript
const model = genai.GenerativeModel('gemini-2.5-flash');
const result = await model.generateContent([
  PROMPT_COMPLETO,
  { inlineData: { mimeType: 'image/jpeg', data: base64 }}
]);

// Gemini retorna JSON estruturado
const analysis = JSON.parse(result.response.text());
```

**Etapa 6-7: Atualização do Resultado**
```typescript
await updateDoc(docRef, {
  ...analysis,  // quality, defects, confidence, opinion
  status: 'COMPLETED',
  processingTime: Date.now() - startTime
});
```

**Etapa 8-10: Exibição**
```typescript
navigate(`/report/${docRef.id}`);

// Report.tsx busca dados
const doc = await getDoc(doc(db, 'leatherAnalysis', id));
const data = doc.data();

// Renderiza UI com React
```

---

## 3. Fluxo de Erro: Análise com Falha

### 3.1 Diagrama de Estados

```mermaid
stateDiagram-v2
    [*] --> FormFilled: Usuário preenche form
    FormFilled --> ImageOptimizing: Upload arquivo
    ImageOptimizing --> RecordCreating: Otimização OK
    ImageOptimizing --> Error: Otimização falhou
    
    RecordCreating --> Analyzing: Firestore doc criado
    RecordCreating --> Error: Firestore falhou
    
    Analyzing --> Validating: Gemini response OK
    Analyzing --> Error: Timeout (60s)
    Analyzing --> Error: API error
    
    Validating --> Completed: Schema válido
    Validating --> Error: Schema inválido
    
    Completed --> [*]: Exibir relatório
    Error --> [*]: Mostrar mensagem
    
    state Error {
        [*] --> UpdateFirestore: status = ERROR
        UpdateFirestore --> NotifyUser: errorMessage salvo
        NotifyUser --> [*]
    }
```

### 3.2 Tratamento de Erros

**Erro 1: Otimização de Imagem**
```typescript
try {
  const base64 = await optimizeImage(file);
} catch (error) {
  setError('Falha ao processar imagem. Tente outro formato.');
  return;
}
```

**Erro 2: Timeout Gemini API**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 60000);

try {
  const result = await model.generateContent(
    [...],
    { signal: controller.signal }
  );
} catch (error) {
  if (error.name === 'AbortError') {
    await updateDoc(docRef, {
      status: 'ERROR',
      errorMessage: 'Timeout: Análise demorou mais de 60s'
    });
  }
}
```

**Erro 3: Schema Inválido**
```typescript
const analysis = JSON.parse(result.response.text());

// Validar campos obrigatórios
if (!analysis.quality || !analysis.defects) {
  throw new Error('Resposta da IA incompleta');
}

// Validar enums
const validQualities = ['TR1', 'TR2', 'TR3', 'TR4', 'R'];
if (!validQualities.includes(analysis.quality)) {
  throw new Error('Classificação inválida');
}
```

---

## 4. Fluxo de Autenticação

### 4.1 Diagrama de Sequência - Login

```mermaid
sequenceDiagram
    participant U as Usuário
    participant L as Login.tsx
    participant FA as Firebase Auth
    participant D as Dashboard.tsx
    participant FS as Firestore

    U->>L: 1. Digite email/senha
    U->>L: 2. Clique "Entrar"
    
    L->>FA: 3. signInWithEmailAndPassword()
    
    alt Credenciais válidas
        FA-->>L: 4. UserCredential + JWT token
        L->>L: 5. setCurrentUser(user)
        L->>D: 6. navigate('/dashboard')
        
        D->>FS: 7. Query análises do usuário
        Note over D,FS: where('userId', '==', user.uid)
        FS-->>D: 8. Documentos
        D->>U: 9. Exibir dashboard
    else Credenciais inválidas
        FA-->>L: Error: wrong-password
        L->>U: Mostrar erro
    end
```

### 4.2 Fluxo de Registro

```mermaid
sequenceDiagram
    participant U as Usuário
    participant L as Login.tsx
    participant FA as Firebase Auth

    U->>L: 1. Clique "Criar conta"
    U->>L: 2. Digite email/senha/confirmar
    
    L->>L: 3. Validar senha (min 6 chars)
    L->>L: 4. Validar email (regex)
    
    L->>FA: 5. createUserWithEmailAndPassword()
    
    alt Email disponível
        FA-->>L: 6. UserCredential
        L->>L: 7. Auto-login
        L->>U: 8. Redirect dashboard
    else Email já existe
        FA-->>L: Error: email-already-in-use
        L->>U: Mostrar erro
    end
```

### 4.3 Proteção de Rotas

```typescript
// PrivateRoute.tsx
function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
}

// App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  
  <Route path="/" element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } />
  
  <Route path="/report/:id" element={
    <PrivateRoute>
      <Report />
    </PrivateRoute>
  } />
  
  {/* ... outras rotas protegidas */}
</Routes>
```

---

## 5. Fluxo de Histórico e Filtros

### 5.1 Diagrama de Sequência

```mermaid
sequenceDiagram
    participant U as Usuário
    participant H as History.tsx
    participant FS as Firestore

    U->>H: 1. Acessa /history
    
    H->>FS: 2. Query inicial
    Note over H,FS: where('userId', '==', uid)<br/>orderBy('timestamp', 'desc')<br/>limit(50)
    FS-->>H: 3. Primeiros 50 docs
    H->>U: 4. Exibir tabela
    
    U->>H: 5. Preencher filtros
    Note over U,H: loteId: "LOTE-A"<br/>dataInicio: 01/11/2025<br/>status: "Concluído"
    
    U->>H: 6. Clique "Filtrar"
    
    H->>FS: 7. Query com filtros
    Note over H,FS: where('userId', '==', uid)<br/>where('loteId', '>=', 'LOTE-A')<br/>where('loteId', '<=', 'LOTE-A\uf8ff')<br/>where('timestamp', '>=', dataInicio)<br/>where('status', '==', 'COMPLETED')<br/>orderBy('timestamp', 'desc')
    
    FS-->>H: 8. Documentos filtrados
    H->>U: 9. Atualizar tabela
    
    alt Usuário clica "Ver Relatório"
        U->>H: 10. Click row action
        H->>H: 11. navigate('/report/:id')
    else Usuário clica "Excluir"
        U->>H: 12. Click delete
        H->>U: 13. Confirm dialog
        U->>H: 14. Confirma
        H->>FS: 15. deleteDoc(id)
        FS-->>H: 16. Success
        H->>H: 17. Remover da lista local
        H->>U: 18. Atualizar UI
    end
```

### 5.2 Lógica de Filtros

```typescript
// História.tsx
const applyFilters = async () => {
  let q = query(
    collection(db, 'leatherAnalysis'),
    where('userId', '==', currentUser.uid)
  );
  
  // Filtro por loteId (busca parcial)
  if (filters.loteId) {
    q = query(q, 
      where('loteId', '>=', filters.loteId),
      where('loteId', '<=', filters.loteId + '\uf8ff')
    );
  }
  
  // Filtro por intervalo de datas
  if (filters.dataInicio) {
    q = query(q, where('timestamp', '>=', filters.dataInicio));
  }
  if (filters.dataFim) {
    q = query(q, where('timestamp', '<=', filters.dataFim));
  }
  
  // Filtro por status
  if (filters.status && filters.status !== 'TODOS') {
    q = query(q, where('status', '==', filters.status));
  }
  
  // Ordenação e limite
  q = query(q, 
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  setAnalyses(results);
};
```

---

## 6. Fluxo de Geração de PDF

### 6.1 Diagrama de Sequência

```mermaid
sequenceDiagram
    participant U as Usuário
    participant R as Report.tsx
    participant P as pdfGenerator.ts
    participant J as jsPDF library

    U->>R: 1. Clique "Download PDF"
    R->>P: 2. generatePDF(analysisData)
    
    P->>J: 3. new jsPDF()
    P->>J: 4. Adicionar cabeçalho
    Note over P,J: Logo + Título
    
    P->>J: 5. Adicionar metadados
    Note over P,J: Lote ID, Data, Status
    
    P->>J: 6. Adicionar imagem
    Note over P,J: Base64 da imagem original
    
    P->>J: 7. Adicionar classificação
    Note over P,J: Badge colorido TR1-TR4
    
    P->>J: 8. Adicionar tabela de defeitos
    Note over P,J: autoTable plugin
    
    P->>J: 9. Adicionar parecer técnico
    
    P->>J: 10. Adicionar rodapé
    Note over P,J: Timestamp + assinatura
    
    J-->>P: 11. PDF blob
    P->>P: 12. Criar download link
    P->>U: 13. Trigger download
    Note over P,U: Filename: relatorio_{loteId}_{timestamp}.pdf
```

### 6.2 Código de Geração

```typescript
// pdfGenerator.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export async function generatePDF(analysis: LeatherAnalysis) {
  const doc = new jsPDF();
  
  // Cabeçalho
  doc.setFontSize(20);
  doc.text('LeatherAI - Relatório de Análise', 105, 20, { align: 'center' });
  
  // Metadados
  doc.setFontSize(12);
  doc.text(`Lote: ${analysis.loteId}`, 20, 40);
  doc.text(`Data: ${formatDate(analysis.timestamp)}`, 20, 50);
  doc.text(`Classificação: ${analysis.quality}`, 20, 60);
  
  // Imagem (reduzida)
  const imgData = analysis.imageUrl;
  doc.addImage(imgData, 'JPEG', 20, 70, 170, 100);
  
  // Tabela de defeitos
  doc.autoTable({
    startY: 180,
    head: [['Defeito', 'Severidade', 'Localização']],
    body: analysis.defects.map(d => [
      d.name,
      d.severity,
      d.location
    ])
  });
  
  // Parecer técnico
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text('Parecer Técnico:', 20, finalY);
  doc.text(analysis.technical_opinion, 20, finalY + 10, {
    maxWidth: 170
  });
  
  // Rodapé
  doc.setFontSize(8);
  doc.text(
    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
    105,
    280,
    { align: 'center' }
  );
  
  // Download
  doc.save(`relatorio_${analysis.loteId}_${Date.now()}.pdf`);
}
```

---

## 7. Fluxo Real-Time (Planejado V1.1)

### 7.1 WebSocket Updates

```mermaid
sequenceDiagram
    participant U as Usuário
    participant D as Dashboard.tsx
    participant FS as Firestore (onSnapshot)
    participant U2 as Outro Usuário

    D->>FS: 1. onSnapshot(query)
    Note over D,FS: Listener ativo
    
    U2->>FS: 2. Criar nova análise
    FS-->>D: 3. Event: 'added'
    D->>U: 4. Atualizar UI (nova linha)
    
    U2->>FS: 5. Atualizar status
    FS-->>D: 6. Event: 'modified'
    D->>U: 7. Atualizar UI (status badge)
    
    U->>D: 8. Sair da página
    D->>FS: 9. unsubscribe()
    Note over D,FS: Listener removido
```

### 7.2 Implementação

```typescript
// History.tsx (V1.1)
useEffect(() => {
  const q = query(
    collection(db, 'leatherAnalysis'),
    where('userId', '==', currentUser.uid),
    orderBy('timestamp', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // Nova análise criada
        setAnalyses(prev => [
          { id: change.doc.id, ...change.doc.data() },
          ...prev
        ]);
      }
      if (change.type === 'modified') {
        // Análise atualizada (ex: PENDING → COMPLETED)
        setAnalyses(prev => prev.map(a => 
          a.id === change.doc.id 
            ? { id: change.doc.id, ...change.doc.data() }
            : a
        ));
      }
      if (change.type === 'removed') {
        // Análise deletada
        setAnalyses(prev => prev.filter(a => a.id !== change.doc.id));
      }
    });
  });
  
  // Cleanup
  return () => unsubscribe();
}, [currentUser]);
```

---

## 8. Métricas de Performance dos Fluxos

### 8.1 Tempos Médios (Target vs Atual)

| Fluxo | Target | Atual (MVP) | Status |
|-------|--------|-------------|--------|
| Login | < 1s | 0.8s | ✅ |
| Upload + Otimização | < 2s | 1.5s | ✅ |
| Análise IA (E2E) | < 30s | 15-25s | ✅ |
| Carregar histórico (50 docs) | < 1s | 0.6s | ✅ |
| Gerar PDF | < 3s | 2s | ✅ |
| Aplicar filtros | < 500ms | 300ms | ✅ |

### 8.2 Monitoramento (V1.1)

```typescript
// Instrumentação de performance
import { getPerformance } from 'firebase/performance';

const perf = getPerformance(firebaseApp);

// Medir análise E2E
const trace = perf.trace('leather_analysis');
trace.start();

try {
  await analyzeLeather(image, loteId);
  trace.putAttribute('quality', result.quality);
  trace.putMetric('confidence', result.confidence_level);
} finally {
  trace.stop();
}
```

---

## 9. Fluxo de Dados - Vision Pipeline V2.0 (Futuro)

### 9.1 Arquitetura Edge + Cloud

```mermaid
graph TB
    A[Câmeras 1-6] -->|Trigger| B[Edge Device - Jetson]
    B -->|Captura frames| C[Stitching Service]
    C -->|Imagem completa| D[S3 Bucket]
    D -->|S3 Event| E[Lambda Function]
    E -->|API Call| F[Gemini 2.5 Flash]
    F -->|JSON Response| E
    E -->|Save| G[Firestore]
    G -->|WebSocket| H[Dashboard React]
    H -->|Notificação| I[Usuário]
```

### 9.2 Fluxo Detalhado

```
1. Couro entra na esteira
2. Encoder detecta movimento (a cada 10cm)
3. Trigger dispara captura simultânea (6 câmeras)
4. Edge Device:
   a. Recebe 6 frames (1920x1200 cada)
   b. Stitching em tempo real (~500ms)
   c. ROI detection (cortar background)
   d. Compressão JPEG 85%
5. Upload para S3 (~2-5s para 15-30MB)
6. Lambda triggered:
   a. Download imagem
   b. Chamar Gemini API
   c. Parse resultado
   d. Salvar Firestore
7. WebSocket notifica dashboard
8. Usuário vê resultado em tempo real
```

---

**Versão**: 1.0  
**Última Atualização**: 04/12/2025  
**Mantido por**: Anderson Miranda das Neves
