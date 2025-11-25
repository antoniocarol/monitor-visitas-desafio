# 🔒 Sistema de Monitoramento Prisional

Sistema high-tech para gerenciamento e acompanhamento de visitas presenciais a usuários com medida protetiva.

![Stack](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan?style=flat-square)

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS v4** - Estilização utility-first
- **Fonte Inter** - Tipografia profissional e autoritária

## ✨ Funcionalidades

### ✅ Implementadas

- **Dashboard de Monitoramento** com 3 categorias:
  - 🔴 **ATRASADAS**: Visitas vencidas (ordenadas por tempo de atraso)
  - 🟡 **URGENTES**: Visitas próximas (0-2 dias)
  - 🟢 **PROGRAMADAS**: Visitas futuras (3+ dias)

- **Sistema de Busca** em tempo real (CPF/Nome)
- **Contadores Visuais** por categoria
- **Registro de Visita** com:
  - Loading state (spinner + texto)
  - Atualização otimista
  - Rollback automático em caso de erro
  - Toast de sucesso/erro

- **UI/UX Profissional**:
  - Glassmorphism effect em todos os componentes
  - Skeleton loading com shimmer effect
  - Animações suaves (toast slide-in)
  - Design responsivo (mobile-first)
  - Sistema de cores semafóricas

- **Gerenciamento de Estado Robusto**:
  - Hook customizado `useMonitorData`
  - Separação de responsabilidades
  - Error handling completo
  - Sincronização com API

## 📁 Estrutura do Projeto

```
app/
├── components/          # Componentes React
│   ├── MonitorCard.tsx      # Card individual do monitorado
│   ├── MonitorColumn.tsx    # Coluna de categoria
│   ├── SearchBar.tsx        # Busca + contadores
│   ├── Skeleton.tsx         # Loading skeleton
│   ├── StatusBadge.tsx      # Badge de status
│   └── Toast.tsx            # Sistema de notificações
├── hooks/              # React hooks customizados
│   ├── useMonitorData.ts    # Gerenciamento de dados
│   └── useToast.ts          # Sistema de toast
├── types/              # Definições TypeScript
│   └── monitor.ts           # Tipos da aplicação
├── utils/              # Funções utilitárias
│   └── dateCalculations.ts # Lógica de datas
├── globals.css         # Estilos globais + animações
├── layout.tsx          # Layout raiz
└── page.tsx            # Página principal
```

## 🎯 Regras de Negócio

### Categorização de Visitas

```typescript
ATRASADA:   data_atual > (última_visita + frequência)
URGENTE:    0 ≤ dias_restantes ≤ 2
PROGRAMADA: dias_restantes ≥ 3
```

### Ordenação

- **ATRASADAS**: Mais tempo atrasado primeiro
- **URGENTES**: Menos tempo restante primeiro
- **PROGRAMADAS**: Próxima data cronológica

### Fluxo de Registro

1. Usuário clica em "Registrar Visita"
2. UI atualiza otimisticamente
3. PATCH enviado para API
4. Em caso de sucesso: Toast verde + dados revalidados
5. Em caso de erro: Rollback + Toast vermelho

## 🔧 Instalação

```bash
# Clone o repositório
git clone [url-do-repositorio]

# Entre na pasta
cd desafio-monitor

# Instale as dependências
npm install

# Rode o servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## ⚙️ Configuração

### Variáveis de Ambiente

O projeto utiliza variáveis de ambiente para configuração da API. Siga os passos:

1. **Copie o arquivo de exemplo**:
```bash
cp .env.example .env.local
```

2. **Edite `.env.local` com suas configurações**:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://tatico.spocws.icu/teste/followups_f38d
```

#### Variáveis Disponíveis

| Variável | Descrição | Valor Padrão |
|----------|-----------|--------------|
| `NEXT_PUBLIC_API_URL` | URL base da API de monitoramento | `https://tatico.spocws.icu/teste/followups_f38d` |

> **⚠️ Nota**: Arquivos `.env.local` não são versionados (estão no `.gitignore`). Nunca commit credenciais ou tokens sensíveis.

## 🌐 API

**Endpoint Base**: Configurado via `NEXT_PUBLIC_API_URL` (padrão: `https://tatico.spocws.icu/teste/followups_f38d`)

### GET - Listar usuários
```bash
GET /teste/followups_e5aa
```

### PATCH - Registrar visita
```bash
PATCH /teste/followups_e5aa/:id
Content-Type: application/json

{
  "last_verified_date": "2025/04/20 14:30:00"
}
```

## 📊 Formato de Dados

```typescript
interface MonitoredUser {
  id: number;
  name: string;
  cpf: string;
  active: boolean;
  last_verified_date: string; // "2025/04/12 08:00:00"
  verify_frequency_in_days: number;
}
```

## 🎨 Design System

### Cores Semafóricas

- 🔴 **Vermelho**: Atrasadas (urgência máxima)
- 🟡 **Amarelo**: Urgentes (atenção)
- 🟢 **Verde**: Programadas (sob controle)

### Efeitos Visuais

- **Glassmorphism**: `bg-white/10 backdrop-blur-md`
- **Shimmer Loading**: Gradiente animado
- **Hover States**: Transições suaves
- **Responsividade**: Mobile-first approach

## 📱 Responsividade

- **Desktop (lg+)**: 3 colunas lado a lado
- **Tablet (md)**: 2 colunas
- **Mobile (sm)**: 1 coluna stack

## 🧪 Próximas Melhorias

- [ ] Adicionar filtro por status ativo/inativo
- [ ] Implementar paginação para listas grandes
- [ ] Adicionar gráficos/estatísticas
- [ ] Modo offline com sync quando reconectar
- [ ] Export de relatórios (PDF/Excel)
- [ ] Notificações push para visitas urgentes

## 📝 Notas de Desenvolvimento

### Boas Práticas Implementadas

- ✅ Código 100% TypeScript (strict mode)
- ✅ Separação clara de responsabilidades
- ✅ Hooks customizados reutilizáveis
- ✅ Error boundaries e tratamento de erros
- ✅ Atualização otimista com rollback
- ✅ Loading states em todas operações async
- ✅ Comentários claros e descritivos

### Decisões Arquiteturais

- **Por que não Redux?** Estado relativamente simples, Context API suficiente
- **Por que Next.js App Router?** Performance e Server Components quando necessário
- **Por que Tailwind v4?** Melhor performance e CSS inline
- **Por que animações CSS puras?** Mais performáticas que bibliotecas para este caso

## 📄 Licença

MIT

---

Desenvolvido com ⚡ para sistemas de monitoramento de alta criticidade.
# monitor-visitas-desafio
