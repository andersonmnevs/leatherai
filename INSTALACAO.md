# Manual de Instalação - LeatherAI

## 📋 Pré-requisitos

### Software Necessário

| Requisito | Versão Mínima | Versão Recomendada | Download |
|-----------|---------------|-------------------|----------|
| Node.js | 18.x | 20.x LTS | https://nodejs.org |
| npm | 9.x | 10.x | (incluído com Node.js) |
| Git | 2.x | Mais recente | https://git-scm.com |

### Contas Necessárias

1. **Conta Google** (para Firebase e Gemini API)
2. **GitHub** (opcional, para controle de versão)

---

## 🚀 Instalação Local (Desenvolvimento)

### Passo 1: Clone do Repositório

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/leatherai.git

# Entre na pasta
cd leatherai

# Verifique a versão do Node
node --version  # Deve ser >= 18.x
npm --version   # Deve ser >= 9.x
```

---

### Passo 2: Configuração Firebase

#### 2.1 Criar Projeto Firebase

1. Acesse https://console.firebase.google.com
2. Clique em **"Adicionar projeto"** ou **"Create a project"**
3. Configurações:
   - **Nome do projeto**: `LeatherAI-Prod` (ou nome de sua escolha)
   - **Google Analytics**: Opcional (recomendado para métricas)
   - **Conta do Analytics**: Selecione ou crie uma
4. Aguarde a criação do projeto (~30 segundos)

#### 2.2 Habilitar Serviços Firebase

##### Authentication (Autenticação)
```
1. Menu lateral → Authentication
2. Clique em "Get started"
3. Aba "Sign-in method"
4. Habilite "Email/Password"
   - Email/Password: ✅ Ativado
   - Email link (passwordless): ❌ Desativado (opcional)
5. Salvar
```

##### Firestore Database
```
1. Menu lateral → Firestore Database
2. Clique em "Create database"
3. Modo de segurança:
   - Selecione "Start in production mode"
   - (Vamos configurar regras customizadas depois)
4. Localização:
   - Escolha "us-central1" (ou mais próximo do Brasil)
5. Aguarde criação (~1-2 minutos)
```

##### Hosting
```
1. Menu lateral → Hosting
2. Clique em "Get started"
3. Siga o wizard (não precisa executar comandos agora)
4. Apenas habilite o serviço
```

#### 2.3 Obter Credenciais Firebase

```
1. Menu lateral → Configurações do projeto (ícone ⚙️)
2. Aba "Geral"
3. Seção "Seus aplicativos"
4. Clique no ícone "</>" (Web)
5. Registrar aplicativo:
   - Apelido: "LeatherAI Web App"
   - Firebase Hosting: ✅ Marcar
6. Clique em "Registrar app"
7. COPIE o objeto firebaseConfig:

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "leatherai-prod.firebaseapp.com",
  projectId: "leatherai-prod",
  storageBucket: "leatherai-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};

8. Clique em "Continuar no console"
```

---

### Passo 3: Configuração Gemini API

#### 3.1 Obter API Key do Gemini

```
1. Acesse https://aistudio.google.com/app/apikey
2. Faça login com a mesma conta Google do Firebase
3. Clique em "Create API key"
4. Selecione o projeto Firebase criado (LeatherAI-Prod)
5. Clique em "Create API key in existing project"
6. COPIE a chave gerada: AIzaSy...
   ⚠️ IMPORTANTE: Guarde em local seguro, não será exibida novamente
```

#### 3.2 (Opcional) Verificar Quota

```
1. Acesse https://console.cloud.google.com
2. Selecione o projeto LeatherAI-Prod
3. Menu → APIs & Services → Enabled APIs
4. Procure "Generative Language API"
5. Se não estiver habilitada, clique em "Enable"
6. Verifique quotas em "Quotas & System Limits"
```

---

### Passo 4: Configuração Local do Projeto

#### 4.1 Criar arquivo de variáveis de ambiente

```bash
# Copiar template
cp .env.example .env

# Ou criar manualmente
touch .env
```

#### 4.2 Preencher variáveis no arquivo `.env`

Abra `.env` em um editor de texto e adicione:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSy...                          # Do passo 2.3
VITE_FIREBASE_AUTH_DOMAIN=leatherai-prod.firebaseapp.com # Do passo 2.3
VITE_FIREBASE_PROJECT_ID=leatherai-prod                  # Do passo 2.3
VITE_FIREBASE_STORAGE_BUCKET=leatherai-prod.appspot.com  # Do passo 2.3
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789              # Do passo 2.3
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef...           # Do passo 2.3

# Gemini API
VITE_GEMINI_API_KEY=AIzaSy...                            # Do passo 3.1
```

⚠️ **NUNCA commite o arquivo `.env` no Git!**
- Verifique se `.env` está listado no `.gitignore`

---

### Passo 5: Instalar Dependências

```bash
# Instalar todas as dependências do package.json
npm install

# Ou usando npm ci (mais rápido, recomendado para CI/CD)
npm ci
```

**Dependências principais instaladas:**
- react, react-dom (18.3.1)
- typescript (5.6.2)
- vite (5.4.10)
- tailwindcss (3.4.14)
- react-router-dom (6.27.0)
- firebase (10.14.1)
- @google/generative-ai (0.21.0)

---

### Passo 6: Configurar Firestore Security Rules

#### 6.1 Criar arquivo de regras

Crie um arquivo `firestore.rules` na raiz do projeto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para coleção leatherAnalysis
    match /leatherAnalysis/{docId} {
      
      // Permitir leitura apenas para o próprio usuário
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

#### 6.2 Publicar regras no Firebase Console

```
1. Firebase Console → Firestore Database
2. Aba "Regras" (Rules)
3. Cole o conteúdo do arquivo firestore.rules
4. Clique em "Publicar" (Publish)
5. Aguarde confirmação (~10 segundos)
```

---

### Passo 7: Criar Índices Firestore (Para Performance)

#### 7.1 Via Firebase Console

```
1. Firestore Database → Índices (Indexes)
2. Aba "Índices compostos" (Composite indexes)
3. Clique em "Criar índice"

Índice 1:
  - Coleção: leatherAnalysis
  - Campos:
    1. userId (Crescente)
    2. timestamp (Decrescente)
  - Status da consulta: Habilitado
  - Clique em "Criar"

Índice 2:
  - Coleção: leatherAnalysis
  - Campos:
    1. userId (Crescente)
    2. status (Crescente)
    3. timestamp (Decrescente)
  - Status da consulta: Habilitado
  - Clique em "Criar"

⏱️ Criação dos índices pode levar 5-10 minutos
```

#### 7.2 (Alternativa) Via Firebase CLI

```bash
# Criar arquivo firestore.indexes.json
cat > firestore.indexes.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "leatherAnalysis",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leatherAnalysis",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
EOF

# Deploy índices
firebase deploy --only firestore:indexes
```

---

### Passo 8: Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Output esperado:
  VITE v5.4.10  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### 8.1 Acessar a aplicação

1. Abra o navegador em http://localhost:5173
2. Você deve ver a tela de login
3. Crie uma conta de teste:
   - Email: teste@leatherai.com
   - Senha: senha123 (mínimo 6 caracteres)
4. Após login, você será redirecionado para o Dashboard

---

### Passo 9: Testes Funcionais

#### 9.1 Testar Upload e Análise

```
1. Dashboard → Fazer upload de uma imagem de couro
   (Formatos: JPG, PNG - máx 10MB)
2. Preencher:
   - ID do Lote: TESTE-001
   - Observações: Teste de análise
3. Clicar em "Processar Análise"
4. Aguardar loading (15-30 segundos)
5. Verificar redirecionamento para página de Relatório
6. Conferir:
   ✅ Classificação (TR1-TR4 ou R)
   ✅ Lista de defeitos
   ✅ Bounding boxes na imagem
   ✅ Parecer técnico
```

#### 9.2 Testar Histórico

```
1. Menu → Histórico
2. Verificar se a análise aparece na tabela
3. Testar filtros:
   - Filtrar por ID do Lote: TESTE-001
   - Filtrar por intervalo de datas
   - Filtrar por status: Concluído
4. Clicar em "Ver Relatório" → deve abrir detalhes
5. Clicar em "Excluir" → confirmar exclusão
```

---

## 🌐 Deploy em Produção

### Passo 10: Preparar para Deploy

#### 10.1 Build de Produção

```bash
# Criar build otimizado
npm run build

# Output esperado:
vite v5.4.10 building for production...
✓ 125 modules transformed.
dist/index.html                   0.45 kB │ gzip:  0.30 kB
dist/assets/index-a1b2c3d4.css    8.25 kB │ gzip:  2.10 kB
dist/assets/index-e5f6g7h8.js   156.30 kB │ gzip: 52.40 kB
✓ built in 3.45s
```

#### 10.2 Testar Build Localmente

```bash
# Preview do build de produção
npm run preview

# Acesse http://localhost:4173
# Teste todas as funcionalidades novamente
```

---

### Passo 11: Deploy Firebase

#### 11.1 Instalar Firebase CLI

```bash
# Instalar globalmente
npm install -g firebase-tools

# Verificar instalação
firebase --version  # Deve exibir versão (ex: 13.x.x)
```

#### 11.2 Login Firebase

```bash
# Fazer login
firebase login

# Navegador abrirá → Selecione a conta Google
# Autorize o Firebase CLI

# Verificar login
firebase projects:list
# Deve exibir o projeto LeatherAI-Prod
```

#### 11.3 Inicializar Firebase Hosting

```bash
# Inicializar projeto
firebase init hosting

# Responda as perguntas:
? Select a default Firebase project: LeatherAI-Prod
? What do you want to use as your public directory? dist
? Configure as a single-page app (rewrite all urls to /index.html)? Yes
? Set up automatic builds and deploys with GitHub? No
? File dist/index.html already exists. Overwrite? No

✔  Firebase initialization complete!
```

**Arquivo `firebase.json` criado:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

#### 11.4 Deploy

```bash
# Deploy para produção
firebase deploy --only hosting

# Output esperado:
=== Deploying to 'leatherai-prod'...

i  deploying hosting
i  hosting[leatherai-prod]: beginning deploy...
i  hosting[leatherai-prod]: found 12 files in dist
✔  hosting[leatherai-prod]: file upload complete
i  hosting[leatherai-prod]: finalizing version...
✔  hosting[leatherai-prod]: version finalized
i  hosting[leatherai-prod]: releasing new version...
✔  hosting[leatherai-prod]: release complete

✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/leatherai-prod/overview
Hosting URL: https://leatherai-prod.web.app
```

---

### Passo 12: Verificar Deploy

1. Acesse a **Hosting URL** fornecida (ex: https://leatherai-prod.web.app)
2. Teste todas as funcionalidades em produção
3. Verifique em diferentes dispositivos (desktop, mobile)
4. Teste em diferentes navegadores (Chrome, Firefox, Safari)

---

## 🔧 Troubleshooting

### Problema 1: "Firebase config not found"

**Sintoma:** Erro no console do navegador ao iniciar a aplicação

**Solução:**
```bash
# Verificar se .env existe
ls -la .env

# Verificar conteúdo
cat .env

# Se vazio ou incorreto, preencher novamente com credenciais do Passo 2.3
```

---

### Problema 2: "Gemini API quota exceeded"

**Sintoma:** Análises falham com erro de quota

**Solução:**
```
1. Acesse https://console.cloud.google.com
2. Selecione projeto LeatherAI-Prod
3. Menu → APIs & Services → Quotas
4. Procure "Generative Language API"
5. Verifique limites:
   - Free tier: 60 requests/minute
   - Se excedido, aguarde 1 minuto ou habilite billing
```

---

### Problema 3: "Firestore permission denied"

**Sintoma:** Erro ao salvar ou ler dados do Firestore

**Solução:**
```
1. Firestore Console → Regras
2. Verificar se regras foram publicadas corretamente
3. Testar regras no simulador:
   - Authenticated: Yes
   - UID: [seu UID de teste]
   - Path: /leatherAnalysis/[docId]
   - Método: get/create/update/delete
4. Se ainda falhar, verificar se userId no documento = auth.uid
```

---

### Problema 4: Build falha com erro de TypeScript

**Sintoma:** `npm run build` falha com erros de tipo

**Solução:**
```bash
# Limpar cache
rm -rf node_modules dist
npm cache clean --force

# Reinstalar dependências
npm install

# Tentar build novamente
npm run build
```

---

### Problema 5: Imagem não aparece no relatório

**Sintoma:** Bounding boxes não renderizam

**Solução:**
```typescript
// Verificar se imageUrl está salvo no Firestore
// Dashboard console (F12) → aba Network → filtrar por "firestore"

// Verificar se Base64 está correto
console.log(imageUrl.substring(0, 50));
// Deve começar com: data:image/jpeg;base64,...

// Se vazio, verificar função optimizeImage()
```

---

## 📚 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm run preview          # Preview do build

# Firebase
firebase login           # Login CLI
firebase logout          # Logout CLI
firebase projects:list   # Listar projetos
firebase deploy          # Deploy tudo
firebase deploy --only hosting  # Deploy apenas hosting
firebase serve           # Emulador local

# Linting (se configurado)
npm run lint             # Verificar erros
npm run lint:fix         # Corrigir automaticamente

# Testes (se configurado)
npm test                 # Executar testes
npm run test:coverage    # Cobertura de testes
```

---

## 🔐 Boas Práticas de Segurança

### Nunca commitar credenciais

```bash
# Verificar .gitignore
cat .gitignore

# Deve conter:
.env
.env.local
.env.production
firebase-debug.log
.firebase/
```

### Rotacionar API Keys periodicamente

```
1. Gemini API: Criar nova key, substituir no .env, deletar antiga
2. Firebase: Regerar credenciais via Console
3. Frequência recomendada: A cada 6 meses
```

### Monitorar uso de quota

```
1. Configurar alertas no Google Cloud Console
2. Limite recomendado: 80% da quota gratuita
3. Receber email quando atingir limite
```

---

## 📞 Suporte

### Documentação Oficial

- Firebase: https://firebase.google.com/docs
- Vite: https://vitejs.dev/guide
- React: https://react.dev
- Gemini API: https://ai.google.dev/docs

### Comunidade

- Firebase Discord: https://discord.gg/firebase
- Stack Overflow: Tag `firebase` + `react`
- GitHub Issues: [Link do repositório]

---

**Versão do Manual**: 1.0  
**Última Atualização**: 30/11/2025  
**Mantido por**: Anderson Miranda das Neves

**Tempo estimado de instalação completa**: 30-45 minutos
