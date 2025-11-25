# Desafio Monitor

Sistema de monitoramento de visitas para acompanhamento de individuos sob medida protetiva. A aplicacao permite visualizar, categorizar e registrar visitas de forma eficiente, com atualizacoes em tempo real e interface responsiva.

## Sumario

1. [Introducao](#introducao)
2. [Primeiros Passos](#primeiros-passos)
3. [Conceitos Fundamentais](#conceitos-fundamentais)
4. [Arquitetura](#arquitetura)
5. [Componentes](#componentes)
6. [Hooks](#hooks)
7. [Logica de Negocios](#logica-de-negocios)
8. [API](#api)
9. [Tipos](#tipos)
10. [Estilizacao](#estilizacao)
11. [Testes](#testes)
12. [Configuracao](#configuracao)
13. [Licenca](#licenca)

---

## Introducao

O Desafio Monitor resolve um problema operacional critico: o gerenciamento de visitas periodicas a individuos monitorados. Cada pessoa possui uma frequencia de visitas definida, e o sistema automaticamente calcula e categoriza o status de cada caso baseado na ultima visita registrada.

A aplicacao foi construida com Next.js 16 utilizando o App Router, React 19 para a interface, TypeScript 5 para seguranca de tipos e Tailwind CSS v4 para estilizacao. A escolha dessas tecnologias prioriza performance, manutencao e experiencia do desenvolvedor.

O sistema opera em tres categorias distintas: visitas atrasadas que exigem atencao imediata, visitas urgentes que vencem nos proximos dias, e visitas programadas que estao dentro do prazo. Essa separacao visual permite que operadores priorizem acoes de forma intuitiva.

---

## Primeiros Passos

### Requisitos

- Node.js 22.15.0 ou superior
- npm 10.x ou superior

### Instalacao

Clone o repositorio e instale as dependencias:

```bash
git clone <url-do-repositorio>
cd desafio-monitor
npm install
```

### Execucao

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicacao estara disponivel em `http://localhost:3000`.

### Verificacao

Apos iniciar, a tela principal exibira tres colunas com os usuarios monitorados. Se a conexao com a API estiver funcionando, os dados serao carregados automaticamente. Caso contrario, uma mensagem de erro sera exibida com opcao de retry.

### Scripts Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de producao |
| `npm start` | Inicia build de producao |
| `npm run lint` | Verificacao de codigo |
| `npm run test` | Testes em modo watch |
| `npm run test:run` | Execucao unica dos testes |
| `npm run test:coverage` | Testes com cobertura |

---

## Conceitos Fundamentais

### Dominio do Problema

O sistema monitora usuarios que possuem visitas periodicas obrigatorias. Cada usuario possui:

- Uma data da ultima visita verificada
- Uma frequencia de visitas em dias
- Um status calculado automaticamente

### Modelo de Dados

O dado bruto da API (`MonitoredUser`) contem informacoes basicas. O sistema processa esses dados e adiciona campos calculados, resultando em `ProcessedUser`:

```typescript
// Dado bruto da API
interface MonitoredUser {
  id: number
  name: string
  cpf: string
  active: boolean
  last_verified_date: string    // "2025/04/12 08:00:00"
  verify_frequency_in_days: number
}

// Dado processado pelo sistema
interface ProcessedUser extends MonitoredUser {
  status: "overdue" | "urgent" | "scheduled"
  nextVisitDate: Date
  lastVerifiedDateObj: Date
  daysOverdue?: number      // presente se status = overdue
  daysRemaining?: number    // presente se status != overdue
}
```

### Categorizacao

A categorizacao baseia-se na diferenca entre a data da proxima visita e a data atual:

- **Atrasadas (overdue)**: A proxima visita ja deveria ter ocorrido. Dias restantes negativo.
- **Urgentes (urgent)**: A proxima visita ocorre em 0, 1 ou 2 dias.
- **Programadas (scheduled)**: A proxima visita ocorre em 3 ou mais dias.

A formula de calculo:

```
proximaVisita = ultimaVisita + frequenciaEmDias
diasRestantes = proximaVisita - dataAtual
```

---

## Arquitetura

### Estrutura de Diretorios

```
app/
├── __tests__/                    # Testes centralizados
│   ├── mocks/
│   │   ├── data.ts              # Dados de teste
│   │   ├── handlers.ts          # Handlers MSW
│   │   └── server.ts            # Servidor MSW
│   ├── utils/
│   │   └── dateCalculations.test.ts
│   └── setup.ts                 # Configuracao Vitest
│
├── components/                   # Componentes de UI
│   ├── AnimatedCounter/
│   ├── ConfirmationModal/
│   ├── ConnectionStatus/
│   ├── DateDisplay/
│   ├── EmptyState/
│   ├── ErrorBoundary/
│   ├── ErrorDisplay/
│   ├── MonitorCard/
│   ├── MonitorColumn/
│   ├── SearchBar/
│   ├── SelectionActionBar/
│   ├── Skeleton/
│   ├── StatusBadge/
│   └── Toast/
│
├── constants/                    # Constantes e configuracoes
│   ├── config.ts                # URLs, timeouts
│   ├── statusIcons.ts           # Mapeamento de icones
│   └── statusStyles.ts          # Classes Tailwind por status
│
├── hooks/                        # Hooks customizados
│   ├── useDebounce/
│   ├── useKeyboardShortcuts/
│   ├── useMonitorData/
│   ├── useSelectionMode/
│   └── useToast/
│
├── types/                        # Definicoes TypeScript
│   └── monitor.ts
│
├── utils/                        # Funcoes utilitarias
│   └── dateCalculations.ts
│
├── globals.css                  # Estilos globais
├── layout.tsx                   # Layout raiz
└── page.tsx                     # Pagina principal
```

### Fluxo de Dados

O fluxo de dados segue uma direcao unidirecional:

1. A API externa fornece os dados brutos de usuarios monitorados
2. O hook `useMonitorData` busca e processa esses dados
3. Cada usuario e transformado pela funcao `processUser`, que calcula status e datas
4. Os usuarios sao filtrados pela busca e categorizados em tres arrays
5. Cada categoria e ordenada segundo suas regras especificas
6. Os dados chegam aos componentes via props

### Separacao de Responsabilidades

A aplicacao segue uma separacao clara:

- **page.tsx**: Orquestracao e composicao de componentes
- **hooks/**: Logica de estado e efeitos colaterais
- **components/**: Renderizacao e interacao com usuario
- **utils/**: Logica de negocios pura, sem dependencias React
- **types/**: Contratos de dados
- **constants/**: Valores imutaveis de configuracao

---

## Componentes

### Hierarquia

A pagina principal compoe os seguintes componentes:

**page.tsx** (raiz)
- Header com titulo e controles
- ToastContainer para notificacoes
- SelectionActionBar para acoes em lote
- ConfirmationModal para confirmacoes
- SearchBar para filtragem
- MonitorColumn (tres instancias: overdue, urgent, scheduled)
  - MonitorCard (uma instancia por usuario)

### Componentes Principais

**MonitorCard**: Exibe informacoes de um usuario individual. Mostra nome, CPF formatado, status, datas e botao de registro. Suporta modo de selecao com checkbox e feedback visual de atualizacao.

**MonitorColumn**: Container de uma categoria. Exibe cabecalho com contador, lista de cards e estados vazios. Suporta colapso em mobile e selecao em lote.

**SearchBar**: Campo de busca com debounce. Filtra por CPF (somente digitos) ou nome (case-insensitive). Exibe contadores de resultados por categoria.

**Toast**: Sistema de notificacoes temporarias. Suporta tipos success, error e info com auto-dismiss configuravel.

**ConfirmationModal**: Modal de confirmacao para registro em lote. Lista usuarios selecionados e exibe avisos para casos atrasados.

**Skeleton**: Componentes de loading com efeito shimmer. Preserva layout durante carregamento.

### Padroes de Composicao

Os componentes seguem padroes consistentes:

- Props tipadas com interfaces explicitas
- Memoizacao com React.memo para componentes de lista
- Callbacks memoizados com useCallback
- Estados locais minimos, preferindo props

---

## Hooks

### useMonitorData

Hook central que gerencia todo o ciclo de dados:

```typescript
interface UseMonitorDataReturn {
  data: MonitorColumnData           // Dados categorizados
  allUsers: ProcessedUser[]         // Todos os usuarios
  loading: boolean
  error: ApiError | null
  searchTerm: string
  setSearchTerm: (term: string) => void
  registerVisit: (userId: number) => Promise<void>
  registerVisitBatch: (userIds: number[]) => Promise<BatchResult>
  refetch: () => Promise<void>
}
```

Responsabilidades:
- Busca dados da API com timeout
- Processa e categoriza usuarios
- Aplica filtro de busca com debounce
- Gerencia atualizacoes otimistas
- Executa rollback em caso de erro

### useToast

Gerencia notificacoes da aplicacao:

```typescript
interface UseToastReturn {
  toasts: ToastMessage[]
  removeToast: (id: string) => void
  success: (message: string) => void
  error: (message: string, duration?: number) => void
  info: (message: string) => void
}
```

Cada toast possui duracao configuravel e e removido automaticamente.

### useSelectionMode

Controla o modo de selecao em lote:

```typescript
interface UseSelectionModeReturn {
  isSelectionMode: boolean
  selectedIds: Set<number>
  selectedCount: number
  enterSelectionMode: (initialId?: number) => void
  exitSelectionMode: () => void
  toggleSelection: (id: number) => void
  selectAll: (ids: number[]) => void
  deselectAll: (ids: number[]) => void
  clearSelection: () => void
}
```

O modo de selecao e ativado por long-press em mobile ou botao no header.

### useDebounce

Atrasa atualizacoes de valor para evitar processamento excessivo:

```typescript
function useDebounce<T>(value: T, delay?: number): T
```

Usado principalmente na busca para evitar filtragem a cada tecla.

### useKeyboardShortcuts

Registra atalhos de teclado globais:

- `Cmd/Ctrl + R`: Atualiza dados
- `Cmd/Ctrl + K`: Foca na busca
- `Escape`: Sai do modo de selecao ou limpa busca

---

## Logica de Negocios

### Calculo de Status

A funcao `processUser` em `utils/dateCalculations.ts` executa o calculo:

1. Valida a frequencia (deve ser maior que zero)
2. Parseia a data da ultima visita
3. Adiciona a frequencia para obter a proxima visita
4. Calcula dias restantes ate a proxima visita
5. Determina status baseado nos dias restantes

```typescript
function determineStatus(daysRemaining: number): MonitorStatus {
  if (daysRemaining < 0) return "overdue"
  if (daysRemaining <= 2) return "urgent"
  return "scheduled"
}
```

### Ordenacao

Cada categoria possui ordenacao especifica:

- **Atrasadas**: Maior atraso primeiro (descendente por daysOverdue)
- **Urgentes**: Menor prazo primeiro (ascendente por daysRemaining)
- **Programadas**: Data mais proxima primeiro (ascendente por nextVisitDate)

### Registro de Visita

O fluxo de registro implementa atualizacao otimista:

1. Estado atual e armazenado para possivel rollback
2. UI atualiza imediatamente com nova data
3. Requisicao PATCH e enviada para API
4. Sucesso: dados sao refetchados para sincronizacao
5. Erro: estado anterior e restaurado, toast de erro exibido

### Registro em Lote

Para multiplas selecoes:

1. Todas as atualizacoes otimistas sao aplicadas via startTransition
2. Requisicoes PATCH sao enviadas em paralelo com Promise.all
3. Resultados sao agregados em sucessos e falhas
4. Toast apropriado e exibido baseado no resultado

---

## API

### Endpoint Base

A URL da API e configurada via variavel de ambiente:

```
NEXT_PUBLIC_API_URL=https://tatico.spocws.icu/teste/followups_e5aa
```

### Endpoints

**GET** - Lista todos os usuarios monitorados

```
GET /teste/followups_e5aa
```

Resposta:
```json
[
  {
    "id": 1,
    "name": "Nome do Usuario",
    "cpf": "123.456.789-00",
    "active": true,
    "last_verified_date": "2025/04/12 08:00:00",
    "verify_frequency_in_days": 7
  }
]
```

**PATCH** - Registra uma visita

```
PATCH /teste/followups_e5aa/:id
Content-Type: application/json

{
  "last_verified_date": "2025/04/20 14:30:00"
}
```

### Formato de Data

A API utiliza o formato `YYYY/MM/DD HH:mm:ss` com barras. O sistema possui funcoes de conversao:

- `parseApiDate`: Converte string da API para objeto Date
- `formatDateForApi`: Converte Date para string da API

### Tratamento de Erros

O sistema categoriza erros em tipos:

| Tipo | Causa | Retry |
|------|-------|-------|
| network | Sem conexao | Sim |
| timeout | Requisicao excedeu 10s | Sim |
| server | Status 5xx | Sim |
| validation | Dados invalidos | Nao |
| unknown | Erro nao mapeado | Nao |

---

## Tipos

### Tipos Base

```typescript
// Resposta da API
interface MonitoredUser {
  id: number
  name: string
  cpf: string
  active: boolean
  last_verified_date: string
  verify_frequency_in_days: number
}

// Status possiveis
type MonitorStatus = "overdue" | "urgent" | "scheduled"
```

### Tipos Derivados

```typescript
// Usuario com dados calculados
interface ProcessedUser extends MonitoredUser {
  status: MonitorStatus
  nextVisitDate: Date
  lastVerifiedDateObj: Date
  cpfDigits: string      // CPF sem formatacao para busca
  nameLower: string      // Nome em minusculas para busca
  daysOverdue?: number
  daysRemaining?: number
}

// Dados categorizados para colunas
interface MonitorColumnData {
  overdue: ProcessedUser[]
  urgent: ProcessedUser[]
  scheduled: ProcessedUser[]
}
```

### Tipos de UI

```typescript
// Notificacao toast
interface ToastMessage {
  id: string
  type: "success" | "error" | "info"
  message: string
  duration?: number
}

// Erro de API
interface ApiError {
  type: "network" | "server" | "timeout" | "validation" | "unknown"
  message: string
  userMessage: string
  canRetry: boolean
  originalError?: Error
}
```

---

## Estilizacao

### Design System

O sistema utiliza cores semaforicas para comunicar urgencia:

| Status | Cor | Uso |
|--------|-----|-----|
| overdue | Vermelho (red-500) | Situacoes criticas |
| urgent | Amarelo (yellow-500) | Atencao necessaria |
| scheduled | Verde (emerald-500) | Sob controle |

### Efeitos Visuais

**Glassmorphism**: Fundo semi-transparente com blur para profundidade visual.

```css
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(12px);
```

**Shimmer**: Animacao de loading que simula carregamento de conteudo.

**Transicoes**: Hover states e mudancas de estado utilizam transicoes suaves de 200-300ms.

### Responsividade

O layout adapta-se ao tamanho da tela:

| Breakpoint | Colunas | Comportamento |
|------------|---------|---------------|
| < 768px | 1 | Colunas colapsaveis |
| 768px-1023px | 2 | Layout lado a lado |
| >= 1024px | 3 | Todas visiveis |

### Tipografia

A fonte principal e Inter, escolhida por legibilidade em interfaces de dados. Tamanhos seguem escala consistente:

- Titulos: text-2xl/3xl
- Subtitulos: text-lg
- Corpo: text-sm
- Labels: text-xs

---

## Testes

### Estrutura

Os testes seguem organizacao mista:

- Testes unitarios de utils: `app/__tests__/utils/`
- Testes de hooks: colocados junto ao hook `hooks/*/hook.test.ts`
- Testes de componentes: colocados junto ao componente `components/*/Component.test.tsx`

### Ferramentas

| Ferramenta | Proposito |
|------------|-----------|
| Vitest | Test runner |
| React Testing Library | Testes de componente |
| MSW | Mock de requisicoes HTTP |
| jsdom | Ambiente DOM |

### Execucao

```bash
# Modo watch (desenvolvimento)
npm run test

# Execucao unica (CI)
npm run test:run

# Com relatorio de cobertura
npm run test:coverage
```

### Cobertura

O projeto exige 70% de cobertura em:
- Branches
- Funcoes
- Linhas
- Statements

### Mock de API

O MSW intercepta requisicoes HTTP em testes:

```typescript
// Configuracao em app/__tests__/mocks/handlers.ts
export const handlers = [
  http.get(API_URL, () => {
    return HttpResponse.json(mockUsers)
  }),
  http.patch(`${API_URL}/:id`, () => {
    return HttpResponse.json({ success: true })
  })
]
```

Handlers de erro permitem testar cenarios de falha.

---

## Configuracao

### Variaveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```
NEXT_PUBLIC_API_URL=https://tatico.spocws.icu/teste/followups_e5aa
```

### TypeScript

Configuracao em `tsconfig.json`:
- Modo strict habilitado
- Path alias `@/*` aponta para raiz
- Target ES2017 para compatibilidade

### Vitest

Configuracao em `vitest.config.ts`:
- Ambiente jsdom
- Setup file para MSW
- Thresholds de cobertura

### CI/CD

GitHub Actions em `.github/workflows/test.yml`:

1. Checkout do codigo
2. Setup Node.js 22 com cache npm
3. Instalacao de dependencias
4. Execucao do linter
5. Execucao dos testes com cobertura
6. Build de producao (apos testes passarem)

---

## Licenca

MIT
