# Arquitetura Técnica - LeatherAI V1.0

## 1. Visão Geral do Sistema

### 1.1 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (Browser)                         │
│                  React 18 + TypeScript                       │
│              Vite + Tailwind CSS + React Router              │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS/WSS
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  FIREBASE HOSTING (CDN)                      │
│              - Serve React SPA (build estático)              │
│              - SSL/TLS automático                            │
│              - Cache CDN global (99.9% SLA)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌──────────────┐ ┌─────────────┐ ┌──────────────────┐
│   Firebase   │ │  Firestore  │ │ Google Gemini    │
│ Authentication│ │  Database   │ │ 2.5 Flash API    │
│              │ │             │ │                  │
│ - Email/Pass │ │ - NoSQL     │ │ - Vision AI      │
│ - JWT tokens │ │ - Real-time │ │ - JSON Schema    │
│ - User mgmt  │ │ - Security  │ │ - Bounding boxes │
└──────────────┘ └─────────────┘ └──────────────────┘
```

### 1.2 Fluxo de Dados Principal

```
Usuário → Upload Imagem → Otimização (resize/compress) 
    → Firestore (status: PENDING) 
    → Gemini API (análise visual) 
    → Parse JSON Response 
    → Firestore Update (status: COMPLETED) 
    → Renderizar Relatório
```

---

## 2. Componentes Frontend

### 2.1 Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.3 | UI framework |
| TypeScript | 5.6 | Type safety |
| Vite | 5.4 | Build tool + dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| React Router | 6.27 | Client-side routing |
| Firebase SDK | 10.x | Backend integration |

### 2.2 Estrutura de Pastas

```
src/
├── components/
│   ├── Dashboard.tsx           # Upload + formulário de análise
│   ├── Report.tsx              # Exibição de resultados
│   ├── History.tsx             # Lista de análises passadas
│   ├── Login.tsx               # Autenticação
│   └── PrivateRoute.tsx        # Proteção de rotas
│
├── services/
│   ├── geminiService.ts        # Integração Gemini API
│   ├── firebaseConfig.ts       # Configuração Firebase
│   ├── imageUtils.ts           # Otimização de imagens
│   └── pdfGenerator.ts         # Geração de relatórios PDF
│
├── types/
│   └── leather.ts              # TypeScript interfaces
│
├── hooks/
│   └── useAuth.ts              # Hook de autenticação
│
├── App.tsx                     # Root component + Router
├── main.tsx                    # Entry point
└── index.css                   # Tailwind imports
```

### 2.3 Componentes Principais

#### Dashboard.tsx
```typescript
Responsabilidades:
- Upload de imagem (drag-and-drop + file input)
- Formulário (loteId + notes)
- Validação client-side
- Otimização de imagem antes do upload
- Criação de registro no Firestore
- Chamada à Gemini API
- Feedback de loading (4 estados)
```

#### Report.tsx
```typescript
Responsabilidades:
- Buscar análise do Firestore por ID
- Renderizar imagem com bounding boxes sobrepostos
- Exibir classificação (badge colorido TR1-TR4)
- Listar defeitos em tabela
- Mostrar parecer técnico
- Gerar e download PDF
```

#### History.tsx
```typescript
Responsabilidades:
- Query Firestore com filtros (loteId, data, status)
- Ordenação por timestamp (desc)
- Paginação (limit 50)
- Ações: Ver relatório, Excluir registro
- Badges de status (Pendente, Concluído, Erro)
```

---

## 3. Modelo de Dados

### 3.1 Firestore - Coleção `leatherAnalysis`

```typescript
interface LeatherAnalysis {
  // Identificação
  id: string;                    // Auto-gerado pelo Firestore
  userId: string;                // FK → Firebase Auth UID
  
  // Input do usuário
  loteId: string;                // Identificador do lote
  notes: string;                 // Observações opcionais
  imageUrl: string;              // Base64 data URI (V1.0)
  
  // Resultado da análise IA
  quality: 'TR1' | 'TR2' | 'TR3' | 'TR4' | 'R';
  defects: Array<{
    name: string;
    severity: 'Baixa' | 'Moderada' | 'Alta';
    location: string;
    bounding_box: {
      x_min: number;  // 0.0 - 1.0 (normalizado)
      y_min: number;
      x_max: number;
      y_max: number;
    };
  }>;
  confidence_level: number;      // 0.0 - 1.0
  technical_opinion: string;     // Texto descritivo
  
  // Metadados do sistema
  timestamp: Timestamp;          // Data/hora da análise
  status: 'PENDING' | 'COMPLETED' | 'ERROR';
  processingTime?: number;       // Milissegundos (opcional)
  errorMessage?: string;         // Apenas se status = ERROR
}
```

### 3.2 Índices Firestore (para performance)

```javascript
// Índice 1: Queries por usuário ordenadas por data
Index: userId (ASC) + timestamp (DESC)
Use case: History.tsx → listar análises do usuário

// Índice 2: Filtro por status + data
Index: userId (ASC) + status (ASC) + timestamp (DESC)
Use case: Filtrar apenas "COMPLETED" ou "ERROR"

// Índice 3: Busca por loteId (opcional)
Index: userId (ASC) + loteId (ASC)
Use case: Buscar análises de um lote específico
```

### 3.3 Limitações V1.0

⚠️ **Firestore Document Size Limit: 1MB**
- Imagens em Base64 devem ser comprimidas (< 800KB)
- Solução V1.1: Migrar para Firebase Storage
  - Firestore armazena apenas URL: `gs://bucket/analysis/{id}.jpg`
  - Storage suporta arquivos de até 5TB

---

## 4. Integração Gemini API

### 4.1 Fluxo de Análise Detalhado

```typescript
// 1. Otimização de Imagem (client-side)
async function optimizeImage(file: File): Promise<string> {
  const canvas = document.createElement('canvas');
  const img = new Image();
  
  // Resize para max 800px (mantém aspect ratio)
  const maxDim = 800;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  
  // Desenhar e comprimir
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // JPEG quality 70% = bom balanço tamanho/qualidade
  return canvas.toDataURL('image/jpeg', 0.7);
}

// 2. Chamada Gemini API
async function analyzeLeather(
  base64Image: string, 
  loteId: string
): Promise<LeatherQualityResponse> {
  
  const model = genai.GenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: LeatherQualitySchema  // Validação forçada
    }
  });
  
  const prompt = `
    Você é um especialista técnico em classificação de couro bovino...
    [PROMPT COMPLETO OMITIDO POR BREVIDADE]
  `;
  
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image.split(',')[1]  // Remove "data:image/jpeg;base64,"
      }
    }
  ]);
  
  // Parse e validação
  const response = JSON.parse(result.response.text());
  return response;
}
```

### 4.2 Schema de Resposta (JSON Schema Enforcement)

```typescript
const LeatherQualitySchema = {
  type: SchemaType.OBJECT,
  properties: {
    quality: {
      type: SchemaType.STRING,
      enum: ['TR1', 'TR2', 'TR3', 'TR4', 'R'],
      description: 'Classificação técnica do couro'
    },
    defects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          name: { 
            type: SchemaType.STRING,
            description: 'Nome padronizado do defeito'
          },
          severity: {
            type: SchemaType.STRING,
            enum: ['Baixa', 'Moderada', 'Alta']
          },
          location: {
            type: SchemaType.STRING,
            description: 'Descrição textual da localização'
          },
          bounding_box: {
            type: SchemaType.OBJECT,
            properties: {
              x_min: { type: SchemaType.NUMBER },
              y_min: { type: SchemaType.NUMBER },
              x_max: { type: SchemaType.NUMBER },
              y_max: { type: SchemaType.NUMBER }
            },
            required: ['x_min', 'y_min', 'x_max', 'y_max']
          }
        },
        required: ['name', 'severity', 'location', 'bounding_box']
      }
    },
    confidence_level: {
      type: SchemaType.NUMBER,
      minimum: 0,
      maximum: 1,
      description: 'Confiança da análise (0.0 - 1.0)'
    },
    technical_opinion: {
      type: SchemaType.STRING,
      description: 'Parecer técnico em português'
    }
  },
  required: ['quality', 'defects', 'confidence_level', 'technical_opinion']
};
```

### 4.3 Tratamento de Erros

```typescript
try {
  const result = await analyzeLeather(imageBase64, loteId);
  
  // Atualizar Firestore com sucesso
  await updateDoc(docRef, {
    ...result,
    status: 'COMPLETED',
    processingTime: Date.now() - startTime
  });
  
} catch (error) {
  // Logar erro e atualizar status
  console.error('Gemini API Error:', error);
  
  await updateDoc(docRef, {
    status: 'ERROR',
    errorMessage: error.message,
    notes: `Erro na análise: ${error.message}`
  });
  
  throw error;  // Re-throw para UI handling
}
```

---

## 5. Segurança

### 5.1 Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regra para coleção leatherAnalysis
    match /leatherAnalysis/{docId} {
      
      // Permitir leitura apenas para análises do próprio usuário
      allow read: if request.auth != null 
                  && resource.data.userId == request.auth.uid;
      
      // Permitir criação apenas se userId corresponde ao auth
      allow create: if request.auth != null 
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.status == 'PENDING';
      
      // Permitir atualização apenas do próprio registro
      allow update: if request.auth != null 
                    && resource.data.userId == request.auth.uid;
      
      // Permitir exclusão apenas do próprio registro
      allow delete: if request.auth != null 
                    && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 5.2 Autenticação Firebase

```typescript
// Login
const login = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth, 
    email, 
    password
  );
  
  // JWT token gerado automaticamente
  const token = await userCredential.user.getIdToken();
  
  // Token é incluído automaticamente em requests do SDK
  return userCredential.user;
};

// Logout
const logout = async () => {
  await signOut(auth);
};

// Auth State Observer
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário logado
    setCurrentUser(user);
  } else {
    // Usuário deslogado
    setCurrentUser(null);
    navigate('/login');
  }
});
```

### 5.3 Proteção de API Keys

```env
# .env (NUNCA commitar no Git)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=leatherai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=leatherai-prod
VITE_FIREBASE_STORAGE_BUCKET=leatherai-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

VITE_GEMINI_API_KEY=AIzaSy...
```

⚠️ **Nota de Segurança:**
- Firebase API Key é público (OK, regras protegem dados)
- Gemini API Key deve ser exposta no frontend (limitação V1.0)
  - Solução V1.1: Migrar para Cloud Function (backend)
  - Backend chama Gemini, frontend apenas consome resultado

---

## 6. Performance e Otimizações

### 6.1 Otimizações Implementadas

| Otimização | Implementação | Impacto |
|------------|---------------|---------|
| **Code Splitting** | `React.lazy()` + Suspense | Bundle inicial -40% |
| **Tree Shaking** | Vite (automático) | Remove código não usado |
| **Image Compression** | Canvas API (resize + JPEG 70%) | Imagens -85% tamanho |
| **Lazy Loading** | Routes carregadas sob demanda | TTI -60% |
| **Debounce** | Filtros com 500ms delay | Menos queries desnecessárias |
| **CDN Caching** | Firebase Hosting headers | Assets servidos da edge |

### 6.2 Métricas de Performance Alvo

```yaml
Core Web Vitals:
  LCP (Largest Contentful Paint): < 2.5s
  FID (First Input Delay): < 100ms
  CLS (Cumulative Layout Shift): < 0.1

Custom Metrics:
  Time to Interactive: < 2s
  First Contentful Paint: < 1s
  Bundle Size (gzipped): < 500KB
  Análise completa (E2E): < 30s
  
Firestore:
  Read latency: < 100ms (95th percentile)
  Write latency: < 200ms (95th percentile)
```

### 6.3 Monitoramento (Planejado V1.1)

```typescript
// Firebase Analytics Events
logEvent(analytics, 'analysis_started', {
  loteId: string,
  imageSize: number
});

logEvent(analytics, 'analysis_completed', {
  loteId: string,
  quality: string,
  processingTime: number,
  confidence: number
});

logEvent(analytics, 'analysis_failed', {
  loteId: string,
  error: string
});

logEvent(analytics, 'pdf_downloaded', {
  analysisId: string
});
```

---

## 7. Deploy e CI/CD

### 7.1 Build de Produção

```bash
# 1. Instalar dependências
npm ci

# 2. Build otimizado
npm run build

# Output:
dist/
  ├── index.html
  ├── assets/
  │   ├── index-[hash].js      # Bundle principal
  │   ├── Dashboard-[hash].js  # Lazy loaded
  │   ├── Report-[hash].js
  │   └── index-[hash].css
```

### 7.2 Deploy Firebase

```bash
# Login
firebase login

# Deploy
firebase deploy --only hosting

# Output:
✔  Deploy complete!
Hosting URL: https://leatherai-prod.web.app
```

### 7.3 CI/CD com GitHub Actions (Planejado V1.1)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
```

---

## 8. Custos Operacionais

### 8.1 Firebase (Free Tier Spark Plan)

| Serviço | Free Tier | Uso Estimado (1000 análises/mês) | Custo |
|---------|-----------|-----------------------------------|-------|
| Hosting | 10GB storage, 360MB/day transfer | ~5GB storage, 100MB/day | $0 |
| Firestore | 1GB storage, 50K reads/day | 500MB, 1K reads/day | $0 |
| Authentication | Ilimitado | 50 usuários ativos | $0 |

### 8.2 Gemini API

```
Custo por 1M tokens input (imagem 800x600): ~$0.002
1000 análises/mês × $0.002 = $2/mês
```

### 8.3 Total Mensal

**1.000 análises/mês: ~$2-5/mês**
**10.000 análises/mês: ~$20-30/mês**

---

## 9. Roadmap Técnico

### V1.1 - Melhorias Backend (Q1 2026)

```typescript
// 1. Cloud Function para Gemini API
exports.analyzeLeatherImage = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) throw new Error('Unauthorized');
  
  // Chamar Gemini (API key no backend, não exposta)
  const result = await callGeminiAPI(data.imageUrl);
  
  // Salvar resultado
  await firestore.collection('leatherAnalysis').doc(data.docId).update(result);
  
  return { success: true };
});

// 2. Migration para Storage
const storageRef = ref(storage, `analysis/${userId}/${docId}.jpg`);
await uploadBytes(storageRef, imageFile);
const downloadURL = await getDownloadURL(storageRef);

// Firestore agora só armazena URL
{ imageUrl: downloadURL }  // vs. { imageUrl: base64String }
```

### V2.0 - Vision Pipeline (Q2-Q3 2026)

Ver documentação `VISION_PIPELINE.md` para detalhes completos.

---

**Versão**: 1.0  
**Última Atualização**: 30/11/2025  
**Mantido por**: Anderson Miranda das Neves
