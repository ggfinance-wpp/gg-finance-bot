# 🤖 GG Finance - Assistente Financeiro Inteligente via WhatsApp

> **Um chatbot inteligente que transforma conversas do WhatsApp em controle financeiro completo.**  
> Registre despesas, receitas, crie lembretes, acompanhe gastos por categoria e receba relatórios detalhados - tudo por mensagem de texto!

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20+-green" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Fastify-5.6-black" alt="Fastify">
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-8.0-orange" alt="MySQL">
  <img src="https://img.shields.io/badge/IA-Google_Gemini_2.5-purple" alt="Gemini">
</p>

---

## 📌 Sumário

1. [🎯 O que é o GG Finance?](#-o-que-é-o-gg-finance)  
2. [✨ Funcionalidades Principais](#-funcionalidades-principais)  
3. [🤖 Como Funciona?](#-como-funciona)  
4. [💡 Exemplos de Uso](#-exemplos-de-uso)  
5. [🛠 Tecnologias Utilizadas](#-tecnologias-utilizadas)  
6. [🏗 Arquitetura do Sistema](#-arquitetura-do-sistema)  
7. [🔐 Segurança e Privacidade](#-segurança-e-privacidade)  
8. [🚀 Como Executar o Projeto](#-como-executar-o-projeto)  
9. [🧩 Modelagem do Banco de Dados](#-modelagem-do-banco-de-dados)  
10. [📁 Estrutura de Pastas](#-estrutura-de-pastas)  
11. [🔮 Roadmap Futuro](#-roadmap-futuro)  
12. [📊 Monitoramento e Custos de IA](#-monitoramento-e-custos-de-ia)

---

## 🎯 O que é o GG Finance?

**GG Finance** é um assistente financeiro pessoal que funciona 100% pelo WhatsApp, utilizando **Inteligência Artificial (Google Gemini)** para entender suas mensagens em linguagem natural e executar ações financeiras automaticamente.

### 🎨 Propósito

- **Democratizar o controle financeiro**: Qualquer pessoa com WhatsApp pode gerenciar suas finanças sem precisar de apps complexos
- **Simplicidade absoluta**: Apenas envie mensagens como "gastei 50 no uber" ou "salário de 3000"
- **Inteligência artificial**: O bot entende contexto, datas relativas, gírias e mensagens mal formatadas
- **Privacidade e segurança**: Dados isolados por usuário, criptografia e conformidade com LGPD

### 🌟 Diferenciais

✅ **Linguagem natural**: Não precisa decorar comandos  
✅ **Contexto inteligente**: Lembra conversas anteriores  
✅ **Categorização automática**: IA sugere categorias baseadas na descrição  
✅ **Recorrências inteligentes**: Crie despesas/receitas que se repetem automaticamente  
✅ **Lembretes financeiros**: Nunca mais esqueça de pagar uma conta  
✅ **Relatórios completos**: Visualize gastos por categoria, mês e muito mais

---

## ✨ Funcionalidades Principais

### 💰 Gestão Financeira Completa

| Funcionalidade | Descrição | Exemplo |
|---------------|-----------|---------|
| **📊 Registrar Despesas** | Registre gastos de forma natural | *"Gastei 50 no uber"* |
| **💵 Registrar Receitas** | Adicione suas entradas financeiras | *"Recebi 3000 de salário"* |
| **🏷️ Categorias Personalizadas** | Crie e gerencie categorias customizadas | *"Criar categoria supermercado"* |
| **🔄 Recorrências Inteligentes** | Despesas/receitas que se repetem automaticamente | *"Criar recorrência mensal de 100 para academia"* |
| **✏️ Editar Transações** | Modifique valores e descrições | *"Editar transação 5"* |
| **🗑️ Excluir Transações** | Remova registros indesejados | *"Excluir despesa 3"* |

### 📈 Relatórios e Consultas

| Funcionalidade | Descrição | Exemplo |
|---------------|-----------|---------|
| **💰 Saldo Atual** | Consulte receitas, despesas e saldo | *"Qual meu saldo?"* |
| **📊 Gastos por Categoria** | Veja quanto gastou em cada categoria | *"Gastos por categoria"* |
| **🔍 Detalhes de Categoria** | Liste todas transações de uma categoria | *"Gastos com transporte"* |
| **📅 Relatórios Mensais** | Resumo completo do mês | *"Relatório de dezembro"* |
| **📋 Listar Despesas** | Veja todas suas despesas detalhadas | *"Minhas despesas"* |
| **💵 Listar Receitas** | Consulte todas as receitas | *"Minhas receitas"* |

### 🔔 Lembretes e Agendamentos

| Funcionalidade | Descrição | Exemplo |
|---------------|-----------|---------|
| **⏰ Criar Lembretes** | Receba notificações automáticas | *"Lembrete para pagar conta no dia 15"* |
| **📝 Lembretes com Valor** | Lembretes associados a valores | *"Lembrar de pagar 200 de internet"* |
| **🗑️ Excluir Lembretes** | Remova lembretes quando quiser | *"Excluir lembrete 2"* |
| **📅 Despesas Agendadas** | Registre gastos futuros | *"Gastar 500 em viagem dia 20"* |

### 🧠 Inteligência Artificial

- **Classificação Automática de Domínio**: A IA identifica se sua mensagem é sobre finanças, lembretes ou consultas
- **Extração Inteligente de Dados**: Reconhece valores, datas, categorias e descrições automaticamente
- **Compreensão de Linguagem Natural**: Entende gírias, abreviações e formatos variados
- **Sugestão de Categorias**: Baseado na descrição, sugere a categoria mais adequada
- **Contexto Conversacional**: Mantém o contexto entre mensagens para fluxos complexos

---

## 🤖 Como Funciona?

O GG Finance utiliza um **fluxo inteligente em 3 camadas** para processar suas mensagens:

```mermaid
graph LR
    A[📱 Usuário WhatsApp] --> B[🌐 WhatsApp Web.js]
    B --> C[🚀 API Fastify]
    C --> D{🔍 Detectores}
    D -->|Match| E[⚡ Ação Direta]
    D -->|Não Match| F[🤖 IA Gemini]
    F --> G[📊 Classificador de Domínio]
    G --> H[💡 Interpretador Especializado]
    H --> I[✅ Ação Executada]
    E --> J[💾 MySQL via Prisma]
    I --> J
    J --> K[📨 Resposta ao Usuário]
```

### 🔄 Fluxo de Processamento

1. **Recepção**: Mensagem recebida via WhatsApp Web.js
2. **Autenticação**: Verifica se o usuário está cadastrado
3. **Contexto**: Recupera contexto de conversas anteriores (se houver)
4. **Detecção Rápida**: Padrões comuns são detectados sem usar IA (economia de custo)
5. **IA Classificadora**: Identifica o domínio (financeiro, lembrete, consulta, outro)
6. **IA Especializada**: Prompt específico extrai dados estruturados
7. **Execução**: Handler apropriado processa a ação
8. **Persistência**: Dados salvos no MySQL via Prisma ORM
9. **Resposta**: Confirmação enviada ao usuário no WhatsApp

---

## 💡 Exemplos de Uso

### 💰 Registrando Despesas

```
Você: Gastei 45 no almoço
Bot: ✅ Despesa de R$ 45,00 registrada em 'Alimentação'

Você: 30 reais de uber ontem
Bot: ✅ Despesa de R$ 30,00 registrada em 'Transporte' (01/03/2026)

Você: Paguei 150 na academia
Bot: ✅ Despesa de R$ 150,00 registrada
```

### 💵 Registrando Receitas

```
Você: Recebi meu salário de 5000
Bot: 💰 Receita de R$ 5.000,00 registrada em 'Salário'

Você: Freelance 800 reais
Bot: 💰 Receita de R$ 800,00 registrada em 'Freelance'
```

### 🔄 Criando Recorrências

```
Você: Criar recorrência mensal de 100 para academia
Bot: 🔄 Recorrência criada!
     📊 Valor: R$ 100,00
     🔁 Frequência: Mensal
     📅 Próxima cobrança: 01/04/2026

Você: Netflix todo mês 30 reais
Bot: 🔄 Recorrência mensal de R$ 30,00 criada para Netflix
```

### 📊 Consultando Relatórios

```
Você: Qual meu saldo?
Bot: 💰 Resumo Financeiro - Março/2026
     💵 Receitas: R$ 5.800,00
     💸 Despesas: R$ 2.350,00
     📊 Saldo: R$ 3.450,00

Você: Gastos por categoria
Bot: 📊 Seus gastos por categoria:
     🍔 Alimentação: R$ 450,00 (19%)
     🚗 Transporte: R$ 280,00 (12%)
     💪 Academia: R$ 150,00 (6%)
     ...
```

### ⏰ Criando Lembretes

```
Você: Lembrar de pagar conta de luz dia 15
Bot: ⏰ Lembrete criado para 15/03/2026!
     📝 "Pagar conta de luz"

Você: Lembrete de 200 reais do condomínio dia 10
Bot: ⏰ Lembrete criado com valor de R$ 200,00
     📅 Data: 10/03/2026
```

---

## 🛠 Tecnologias Utilizadas

### Backend & API
- **Node.js 20+** - Runtime JavaScript
- **TypeScript 5.9** - Tipagem estática e segurança
- **Fastify 5.6** - Framework web de alta performance
- **Prisma 6.19** - ORM moderno e type-safe
- **MySQL 8.0** - Banco de dados relacional

### WhatsApp & Comunicação
- **whatsapp-web.js** - Integração com WhatsApp Web
- **Puppeteer** - Automação do navegador para WhatsApp

### Inteligência Artificial
- **Google Gemini 2.5 Flash** - Modelo de IA para processamento de linguagem natural
- **Classificador de Domínio** - Identifica a intenção da mensagem
- **Prompts Especializados** - Extração de dados estruturados

### Segurança & Validação
- **Zod 4.3** - Validação de schemas TypeScript-first
- **Rate Limiting** - Proteção contra abuso de requisições
- **CORS** - Controle de acesso cross-origin
- **dotenv** - Gerenciamento seguro de variáveis de ambiente

### Utilitários
- **node-cron** - Agendamento de tarefas (lembretes e recorrências)
- **Pino (via Fastify)** - Sistema de logs estruturados
- **QRCode Terminal** - Autenticação WhatsApp via QR Code

---

## 🏗 Arquitetura do Sistema

### 📐 Padrão de Arquitetura: Clean Architecture + Domain-Driven Design

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE INTERFACE                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  WhatsApp    │  │   Webhook    │  │    Routes    │ │
│  │   Bot.ts     │  │  Validator   │  │   Fastify    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  CAMADA DE APLICAÇÃO                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Controllers & Middlewares             │  │
│  │  • Auth Middleware  • Rate Limit  • CORS        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   CAMADA DE DOMÍNIO                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Assistente Financeiro (Core)           │  │
│  │  • Orquestração de Handlers                      │  │
│  │  • Detecção de Intenções                         │  │
│  │  • Gerenciamento de Contexto                     │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │  Handlers   │  │IA Gemini    │  │  Services    │  │
│  │ • Despesa   │  │ • Classificar│ │  • Categoria │  │
│  │ • Receita   │  │ • Interpretar│ │  • Enviador  │  │
│  │ • Lembrete  │  │ • Responder  │ │  • Bot       │  │
│  │ • Relatório │  │              │  │              │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                CAMADA DE INFRAESTRUTURA                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Repositories │  │   Prisma     │  │   MySQL      │ │
│  │ • Usuario    │  │   Client     │  │   Database   │ │
│  │ • Transacao  │  │              │  │              │ │
│  │ • Categoria  │  │              │  │              │ │
│  │ • Lembrete   │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 🎯 Responsabilidades por Camada

| Camada | Responsabilidade | Exemplos |
|--------|------------------|----------|
| **Interface** | Entrada/saída de dados | WhatsApp Bot, Webhooks, Routes |
| **Aplicação** | Controle de fluxo e segurança | Middlewares, Controllers |
| **Domínio** | Regras de negócio | Handlers, IA, Serviços |
| **Infraestrutura** | Persistência e serviços externos | Repositories, Prisma, MySQL |

---

## 🔐 Segurança e Privacidade

Como lidamos com **dados financeiros sensíveis**, a segurança é prioridade absoluta. O sistema implementa múltiplas camadas de proteção:

### 🛡️ Princípios de Segurança Implementados

| Proteção | Implementação | Status |
|----------|---------------|:------:|
| **Isolamento de Dados** | Todas queries usam `WHERE usuario_id = ?` | ✅ |
| **Prevenção SQL Injection** | Prisma ORM com queries parametrizadas | ✅ |
| **Validação de Entrada** | Zod schemas em todos endpoints | ✅ |
| **Rate Limiting** | Limite de requisições por usuário | ✅ |
| **Autenticação WhatsApp** | Verificação de número em toda interação | ✅ |
| **Credenciais Seguras** | `.env` para secrets, nunca no código | ✅ |
| **Logs Seguros** | Não registra valores financeiros ou mensagens | ✅ |
| **CORS Restritivo** | Apenas origens permitidas | ✅ |

### 🔒 Exemplo de Isolamento de Dados

**❌ Incorreto (vulnerável)**
```typescript
// Retorna dados de TODOS os usuários
const transacoes = await prisma.transacao.findMany();
```

**✅ Correto (seguro)**
```typescript
// Retorna apenas dados do usuário autenticado
const transacoes = await prisma.transacao.findMany({
  where: { usuarioId: usuario.id }
});
```

### 📋 Conformidade LGPD

- ✅ Coleta mínima de dados (apenas nome e telefone)
- ✅ Consentimento explícito no cadastro
- ✅ Direito ao esquecimento (exclusão de conta)
- ✅ Portabilidade de dados
- ✅ Transparência no uso de IA

---

## 🚀 Como Executar o Projeto

### 📋 Pré-requisitos

- Node.js 20+ instalado
- MySQL 8.0+ rodando
- Conta Google Cloud (para Gemini API)
- Git

### ⚙️ Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/gg-finance-bot.git
cd gg-finance-bot
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

Variáveis necessárias:
```env
# Banco de Dados
DATABASE_URL="mysql://user:password@localhost:3306/gg_finance"

# Google Gemini IA
GEMINI_API_KEY="sua-api-key-aqui"

# WhatsApp (opcional para desenvolvimento)
WHATSAPP_SESSION_PATH="./whatsapp-session"

# Servidor
PORT=3000
NODE_ENV=development
```

4. **Execute as migrations do banco**
```bash
npm run db:migrate
npm run db:generate
```

5. **Inicie o servidor**
```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

6. **Conecte o WhatsApp**

No primeiro uso, um QR Code aparecerá no terminal. Escaneie com seu WhatsApp para autenticar.

### 🧪 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor em modo desenvolvimento
npm run build        # Compila TypeScript para JavaScript
npm start            # Inicia servidor em produção
npm run db:migrate   # Executa migrations do banco
npm run db:generate  # Gera Prisma Client
npm run db:pull      # Sincroniza schema com banco existente
npm run db:reset     # Reseta banco (cuidado!)
```

---

## 🧩 Modelagem do Banco de Dados

### 📊 Diagrama ER Simplificado

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  usuarios   │────┬───→│  transacoes  │←───┬───│ categorias  │
└─────────────┘    │    └──────────────┘    │   └─────────────┘
                   │                         │
                   │    ┌──────────────┐    │
                   ├───→│ recorrencias │    │
                   │    └──────────────┘    │
                   │                         │
                   │    ┌──────────────┐    │
                   ├───→│  lembretes   │    │
                   │    └──────────────┘    │
                   │                         │
                   │    ┌──────────────┐    │
                   └───→│   contexto   │    │
                        └──────────────┘    │
                                             │
                        ┌──────────────┐    │
                        │  ia_logs     │    │
                        └──────────────┘    │
```

### 🗄️ Tabelas Principais

#### `usuarios`
Armazena informações básicas dos usuários cadastrados via WhatsApp.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `telefone` | VARCHAR(255) | Número WhatsApp (único) |
| `nome` | VARCHAR(255) | Nome do usuário |
| `cpf_cnpj` | VARCHAR(20) | Documento (opcional) |
| `criado_em` | DATETIME | Data de cadastro |

#### `transacoes`
Registra todas despesas e receitas dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `usuario_id` | VARCHAR(36) | FK para usuários |
| `categoria_id` | VARCHAR(36) | FK para categorias |
| `tipo` | ENUM | 'receita' ou 'despesa' |
| `valor` | DECIMAL(10,2) | Valor da transação |
| `descricao` | TEXT | Descrição livre |
| `data` | DATETIME | Data da transação |
| `agendada` | BOOLEAN | Se é futura |

#### `categorias`
Categorias personalizadas por usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `usuario_id` | VARCHAR(36) | FK para usuários |
| `nome` | VARCHAR(255) | Nome da categoria |
| `tipo` | ENUM | 'receita' ou 'despesa' |
| `icone` | VARCHAR(10) | Emoji representativo |

#### `recorrencias`
Despesas/receitas que se repetem automaticamente.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `usuario_id` | VARCHAR(36) | FK para usuários |
| `descricao` | TEXT | Descrição |
| `valor` | DECIMAL(10,2) | Valor |
| `frequencia` | ENUM | 'diaria', 'semanal', 'mensal', 'anual' |
| `tipo` | ENUM | 'receita' ou 'despesa' |
| `proxima_execucao` | DATETIME | Próxima data de criação |
| `ativo` | BOOLEAN | Se está ativa |

#### `lembretes`
Notificações agendadas para o usuário.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `usuario_id` | VARCHAR(36) | FK para usuários |
| `mensagem` | TEXT | Texto do lembrete |
| `valor` | DECIMAL(10,2) | Valor associado (opcional) |
| `data` | DATETIME | Quando notificar |
| `enviado` | BOOLEAN | Se já foi enviado |

#### `contexto`
Mantém o estado de conversas multi-etapas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `usuario_id` | VARCHAR(36) | FK para usuários (PK) |
| `etapa` | VARCHAR(100) | Etapa atual do fluxo |
| `dados` | JSON | Dados temporários |
| `atualizado_em` | DATETIME | Última atualização |

#### `ia_logs`
Monitoramento de uso e custos da IA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | VARCHAR(36) | UUID único |
| `usuario_id` | VARCHAR(36) | FK para usuários |
| `etapa` | VARCHAR(50) | 'classificador' ou 'principal' |
| `model` | VARCHAR(50) | Modelo usado |
| `tokens_entrada` | INT | Tokens do prompt |
| `tokens_saida` | INT | Tokens da resposta |
| `custo_gemini_usd` | DECIMAL(10,6) | Custo estimado |

---

## 📁 Estrutura de Pastas

```
gg-finance-bot/
├── prisma/
│   ├── schema.prisma              # Schema do banco de dados
│   └── migrations/                # Histórico de migrations
│
├── src/
│   ├── app.ts                     # Configuração do Fastify
│   ├── server.ts                  # Entry point da aplicação
│   │
│   ├── config/                    # ⚙️ Configurações
│   │   ├── database.ts            # Conexão com MySQL
│   │   └── env.ts                 # Variáveis de ambiente
│   │
│   ├── core/                      # 🧠 Lógica Central
│   │   └── assistenteFinanceiro.ts # Orquestrador principal
│   │
│   ├── ia/                        # 🤖 Inteligência Artificial
│   │   ├── interpretadorGemini.ts # Processa mensagens com IA
│   │   ├── respostaGemini.ts      # Gera respostas naturais
│   │   └── prompts/               # Prompts especializados
│   │       ├── classificadorDominio.prompt.ts
│   │       ├── financeiro.prompt.ts
│   │       ├── lembrete.prompt.ts
│   │       ├── consulta.prompt.ts
│   │       └── fallbackCompleto.prompt.ts
│   │
│   ├── services/                  # 📦 Serviços de Negócio
│   │   ├── bot.service.ts         # Lógica do bot WhatsApp
│   │   ├── CategoriaAutoService.ts # Categorização automática
│   │   ├── EnviadorWhatsApp.ts    # Envio de mensagens
│   │   │
│   │   └── handlers/              # 🎯 Manipuladores de Ações
│   │       ├── AgendamentoHandler.ts
│   │       ├── BoasVindasHandler.ts
│   │       ├── CadastroUsuarioHandler.ts
│   │       ├── PerfilHandler.ts
│   │       │
│   │       ├── financeiro/        # 💰 Handlers Financeiros
│   │       │   ├── RegistrarDespesaHandler.ts
│   │       │   ├── RegistrarReceitaHandler.ts
│   │       │   ├── EditarTransacaoHandler.ts
│   │       │   ├── ExcluirTransacaoHandler.ts
│   │       │   ├── ListarDespesaHandler.ts
│   │       │   ├── ListarReceitaHandler.ts
│   │       │   ├── CategoriaHandler.ts
│   │       │   └── RecorrenciaHandler.ts
│   │       │
│   │       ├── lembrete/          # ⏰ Handlers de Lembretes
│   │       │   ├── LembreteHandler.ts
│   │       │   ├── ExcluirLembreteHandler.ts
│   │       │   └── ListarLembretesHandler.ts
│   │       │
│   │       └── relatorios/        # 📊 Handlers de Relatórios
│   │           ├── RelatorioHandler.ts
│   │           ├── GastoPorCategoriaHandler.ts
│   │           ├── GastosDaCategoriaHandler.ts
│   │           ├── DespesasPorMesHandler.ts
│   │           └── ReceitasPorMesHandler.ts
│   │
│   ├── repositories/              # 🗄️ Acesso ao Banco
│   │   ├── usuario.repository.ts
│   │   ├── transacao.repository.ts
│   │   ├── categoria.repository.ts
│   │   ├── lembrete.repository.ts
│   │   └── contexto.repository.ts
│   │
│   ├── infra/                     # 🔧 Infraestrutura
│   │   ├── prisma.ts              # Cliente Prisma
│   │   │
│   │   ├── ia/                    # Monitoramento IA
│   │   │   ├── IAUsageLogger.ts   # Logger de uso
│   │   │   ├── estimadorCusto.ts  # Estimador de custos
│   │   │   └── logUsoGemini.ts    # Logs específicos Gemini
│   │   │
│   │   └── scheduler/             # ⏲️ Agendamentos
│   │       ├── index.ts           # Configuração cron
│   │       └── lembrete.scheduler.ts # Envio de lembretes
│   │
│   ├── middlewares/               # 🛡️ Middlewares
│   │   ├── auth.middleware.ts     # Autenticação
│   │   └── rateLimit.middleware.ts # Limite de requisições
│   │
│   ├── utils/                     # 🔨 Utilitários
│   │   ├── detectoresDeIntencao.ts # Detecção rápida de padrões
│   │   ├── categoriaNormalizada.ts # Normalização de categorias
│   │   ├── LembreteClassifier.ts  # Classificação de lembretes
│   │   ├── parseDatabr.ts         # Parse de datas em PT-BR
│   │   ├── periodo.ts             # Manipulação de períodos
│   │   ├── recorrencia.ts         # Lógica de recorrências
│   │   ├── normalizaTelefone.ts   # Normalização de telefones
│   │   ├── validaNome.ts          # Validação de nomes
│   │   └── logger.ts              # Sistema de logs
│   │
│   ├── validators/                # ✅ Validadores
│   │   ├── documento.validator.ts
│   │   └── webhook.validator.ts
│   │
│   ├── whatsapp/                  # 📱 WhatsApp
│   │   └── bot.ts                 # Configuração WhatsApp Web
│   │
│   ├── webhooks/                  # 🔗 Webhooks
│   │   └── whatsapp.webhook.ts
│   │
│   └── routes/                    # 🛣️ Rotas da API
│       └── index.ts
│
├── .env.example                   # Exemplo de variáveis
├── .gitignore
├── Dockerfile                     # Container Docker
├── docker-compose.yml             # Orquestração (se houver)
├── package.json
├── tsconfig.json                  # Configuração TypeScript
└── README.md
```

### 🧠 Função de Cada Pasta

| Pasta | Responsabilidade | Arquivos Principais |
|-------|------------------|---------------------|
| **`core/`** | Orquestração central do sistema | `assistenteFinanceiro.ts` |
| **`ia/`** | Processamento de linguagem natural | Interpretador, Prompts |
| **`services/handlers/`** | Lógica de negócio por domínio | Handlers de ações específicas |
| **`repositories/`** | Acesso e manipulação de dados | Queries do banco |
| **`infra/`** | Serviços externos e agendamentos | Prisma, Schedulers, IA Logs |
| **`middlewares/`** | Segurança e interceptação | Auth, Rate Limit |
| **`utils/`** | Funções auxiliares reutilizáveis | Parsers, Validadores, Formatadores |
| **`whatsapp/`** | Integração com WhatsApp | Bot configuration |
| **`config/`** | Configurações globais | Database, Env vars |

---

## 🔮 Roadmap Futuro

### 🚀 Versão 2.0 (Próximos 3-6 meses)

- [ ] **Dashboard Web** - Visualização de dados via interface web
- [ ] **Gráficos Interativos** - Charts de gastos por período
- [ ] **Metas Financeiras** - Estabeleça objetivos e acompanhe progresso
- [ ] **Orçamentos** - Defina limites por categoria
- [ ] **Alertas Inteligentes** - Notificações quando gastar demais
- [ ] **Exportação de Dados** - PDF, Excel, CSV
- [ ] **Múltiplas Contas** - Separe finanças pessoais e empresariais
- [ ] **Compartilhamento** - Finanças compartilhadas em família

### 🌟 Versão 3.0 (Longo Prazo)

- [ ] **Reconhecimento de Imagem** - Upload de notas fiscais
- [ ] **Integração Bancária** - Open Finance/Open Banking
- [ ] **Análise Preditiva** - IA prevê gastos futuros
- [ ] **Assistente de Voz** - Integração com Alexa/Google Assistant
- [ ] **Investimentos** - Acompanhamento de carteira
- [ ] **Multi-idioma** - Suporte internacional
- [ ] **App Nativo** - iOS e Android

---

## 📊 Monitoramento e Custos de IA

### 💰 Estimativa de Custos (Google Gemini 2.5 Flash)

O sistema utiliza **duas chamadas de IA** por mensagem que não é detectada por padrões:

1. **Classificador de Domínio** (~50 tokens entrada + ~20 tokens saída)
2. **Interpretador Principal** (~200 tokens entrada + ~100 tokens saída)

**Total por mensagem**: ~370 tokens (≈ $0.00015 USD)

#### 📈 Projeção de Custos Mensais

| Usuários | Mensagens/dia | Mensagens/mês | Custo/mês (USD) |
|----------|---------------|---------------|-----------------|
| 10       | 5             | 1.500         | $0.23           |
| 50       | 5             | 7.500         | $1.13           |
| 100      | 5             | 15.000        | $2.25           |
| 500      | 5             | 75.000        | $11.25          |
| 1.000    | 10            | 300.000       | $45.00          |

> 💡 **Otimização**: O sistema usa **detectores de padrões** para ações comuns, economizando até 60% em chamadas de IA.

### 📊 Logs de Monitoramento

O sistema registra automaticamente:
- ✅ Tokens consumidos por chamada
- ✅ Custo estimado (Gemini vs GPT)
- ✅ Etapa do processamento (classificador/principal)
- ✅ Modelo utilizado
- ✅ Usuário que gerou a requisição

Consulte os logs em: `ia_logs` no banco de dados.

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga estas etapas:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### 📝 Padrões de Código

- Use TypeScript strict mode
- Siga o padrão de nomenclatura do projeto
- Adicione testes quando aplicável
- Documente funções complexas

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com 💚 para democratizar o controle financeiro pessoal.

---

## ⭐ Agradecimentos

- [Fastify](https://www.fastify.io/) - Framework web de alta performance
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- [Google Gemini](https://ai.google.dev/) - IA de processamento de linguagem natural
- [whatsapp-web.js](https://wwebjs.dev/) - Cliente WhatsApp para Node.js

---

<p align="center">
  <strong>🤖 Transforme conversas em controle financeiro!</strong><br>
  Se este projeto foi útil, considere dar uma ⭐ no repositório!
</p>  

