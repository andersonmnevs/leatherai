# LeatherAI - Resumo Executivo

## Problema
A classificação de couro bovino em curtumes enfrenta três desafios críticos:

1. **Inconsistência:** Divergência de até 30% entre diferentes classificadores para o mesmo couro, gerando perdas estimadas de R$400-500k/ano por classificação incorreta em curtumes médios (baseado em 500 couros/dia com diferença de R$30-40 entre classificações TR2/TR3).

2. **Falta de rastreabilidade:** Análises manuais não geram documentação auditável, impossibilitando conformidade com ISO 9001 e EUDR (regulamentação europeia de rastreabilidade obrigatória desde 2025, com multas de até €150.000 por não conformidade).

3. **Dependência de especialistas:** Classificadores sêniores (15-20 anos experiência) são escassos e concentram conhecimento crítico. Classificadores júniores levam 2-3 minutos por couro (6-9x mais lentos que sêniores) e apresentam taxa de erro de 20-30% nos primeiros meses de treinamento.

## Solução
LeatherAI automatiza a classificação de couro usando Google Gemini 2.5 Flash, garantindo **consistência 100%** através de schema estruturado (elimina divergência de 30% entre classificadores), **rastreabilidade total** com bounding boxes espaciais e relatórios PDF auditáveis (conformidade EUDR e ISO 9001), e **democratização do conhecimento** de classificação técnica (TR1-TR4) para qualquer operador, reduzindo dependência de especialistas escassos e acelerando treinamento de 6-12 meses para 1 dia.

## Diferencial Tecnológico
Não é um chatbot genérico, mas um motor de visão computacional especializado:
- **Multimodal nativo**: Análise visual + raciocínio espacial
- **Saída estruturada**: JSON Schema enforcement para consistência
- **Bounding boxes automáticos**: Localização precisa de cada defeito
- **Zero-shot learning**: Funciona sem dataset próprio ou treinamento

## Público-Alvo
Classificadores de couro e técnicos de controle de qualidade (25-50 anos) em curtumes de médio a grande porte. Principais dores: inspeção manual demorada (1-5 min/peça), inconsistências entre turnos (30% divergência), dificuldade em rastrear defeitos para auditorias ISO 9001 e conformidade EUDR, e perdas financeiras por classificação incorreta (5-10% dos lotes em retrabalho).

## Funcionalidades Principais (MVP V1.0)
1. **Upload e análise**: Drag-and-drop de imagens com processamento < 30s
2. **Classificação técnica**: TR1-TR4 + lista de defeitos com severidade e nomenclatura padronizada
3. **Rastreabilidade**: Bounding boxes espaciais + parecer técnico em português
4. **Histórico auditável**: Filtros por lote, data e status com dados isolados por usuário
5. **Relatórios PDF**: Documentação profissional para ISO 9001 e compliance
6. **Autenticação**: Sistema multi-usuário com Firebase Auth e regras de segurança

## Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Firebase (Authentication + Firestore + Hosting)
- **IA**: Google Gemini 2.5 Flash API com schema estruturado
- **Deploy**: Firebase Hosting (CDN global, SLA 99.9%)
- **Performance**: Bundle < 500KB, TTI < 2s, FCP < 1s

## Métricas de Sucesso
- ✅ **Consistência**: 100% padronização vs. 30% divergência manual (schema enforcement garante mesmos critérios sempre)
- ✅ **Velocidade**: Tempo similar ao especialista (~20s) mas disponível 24/7 sem fadiga ou variação
- ✅ **Custo**: $0.002/análise vs. R$20-50 hora/homem tradicional
- ✅ **Rastreabilidade**: Bounding boxes + PDF + histórico completo vs. zero documentação manual
- ✅ **Democratização**: Qualquer operador treinado em 1 dia vs. 6-12 meses para classificador tradicional
- ✅ **ROI estimado**: R$400-500k/ano economizados em classificação correta (curtume médio 500 couros/dia)

## Roadmap de Evolução

### V1.1 - Melhorias (Q1 2026)
- Sistema de roles (admin, técnico, visualizador)
- Dashboard analytics com gráficos de tendências por fornecedor
- Migração para Firebase Storage (suporte a imagens de alta resolução)
- Interface de administração com CRUD de usuários e logs de atividades

### V2.0 - Vision Pipeline (Q2-Q3 2026)
Transformação de upload manual para **inspeção em linha em tempo real**:
- **Hardware**: 4-6 câmeras industriais Basler acA1920-40gm sobre esteira de classificação
- **Edge Computing**: Jetson AGX Orin para stitching de imagem completa (3-8m de couro)
- **Workflow**: Captura automática enquanto couro passa pela esteira → análise IA em cloud
- **Investimento**: $6k hardware + $9.6k desenvolvimento
- **ROI**: 9 meses (economia de 4h/dia em inspeção manual)
- **Tecnologia**: Encoder rotativo + trigger sincronizado + OpenCV stitching + mesmo pipeline IA

## Riscos e Mitigação

### Técnicos
- **Gemini API downtime**: Fallback para análise manual com notificação ao usuário + queue system
- **Firestore quota limit**: Migration para Firebase Storage planejada (V1.1) para imagens > 1MB
- **Browser compatibility**: Testes em Chrome, Firefox, Safari + fallbacks para features modernas

### Mercado
- **Resistência de classificadores sêniores**: Posicionar como "segunda opinião" e ferramenta de treinamento, não substituição
- **Conformidade LGPD**: Isolamento de dados por usuário + opt-in explícito + possibilidade de exclusão total
- **Dependência de API terceira**: Monitoramento de SLA Google + plano de contingência para modelo alternativo

## Impacto no Negócio
- **Qualidade**: Elimina divergência de 30% entre classificadores → reduz perdas de R$400-500k/ano por classificação incorreta
- **Conformidade**: Rastreabilidade automática para ISO 9001 e EUDR obrigatória (evita multas de até €150.000 e bloqueio de exportação)
- **Eficiência operacional**: Reduz dependência de especialistas escassos e treinamento de classificadores de 6-12 meses para 1 dia
- **Decisões estratégicas**: Base de dados auditável permite identificar fornecedores problemáticos e tendências de defeitos
- **Escalabilidade**: Custo marginal por análise próximo de zero ($0.002) permite processar qualquer volume

## Modelo de Negócio (Futuro)
- **Freemium**: 50 análises/mês grátis para validação
- **Pro**: $99/mês (500 análises + dashboard analytics + relatórios ilimitados)
- **Enterprise**: Pricing customizado (API integration + fine-tuning + Vision Pipeline + SLA dedicado)

---

**Posicionamento de Mercado:**

*"A única plataforma de IA generativa construída 100% para a indústria do couro. Entregamos em 30 segundos o que especialistas sêniores levam 30 minutos - com rastreabilidade espacial, consistência técnica e custo operacional de centavos."*

**Status Atual:** MVP validado e implementado. Sistema em produção com Firebase Hosting. Pronto para onboarding de curtumes piloto e escalabilidade imediata.

---

**Versão**: 2.0  
**Data**: 04/12/2025  
**Autoria**: Anderson Miranda das Neves  
**Contato**: https://www.linkedin.com/in/andersonneves-cloudaws-dev/
