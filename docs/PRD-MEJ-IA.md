# PRD — Interface MEJ IA (UFC_AI)

> **Como usar este documento:** salve na raiz do projeto (ex.: `docs/PRD-MEJ-IA.md`) e peça ao Claude Code para lê-lo **inteiro** antes de escrever qualquer código. Ele foi escrito para ser executado por um agente de código, não por um humano.

---

## 1. Contexto

Estou migrando para código uma interface de chat com IA já finalizada no Figma. O produto é o **MEJ IA**, um assistente treinado com informações da Universidade Federal do Ceará para responder dúvidas sobre o Movimento Empresa Júnior (empresas juniores, editais, eventos, oportunidades, regulamentações e iniciativas da UFC).

O backend **já existe e já está funcionando**. O front atual é apenas uma página de teste da API. A tarefa é construir a interface real, fiel ao Figma, reaproveitando a camada de API que já está pronta.

## 2. Estado atual do projeto

### 2.1 Stack

React + TypeScript + **Vite**, CSS puro (`App.css`), com `axios` já instalado. Variáveis de ambiente via `import.meta.env`.

### 2.2 `src/services/api.ts` — **já pronto, não alterar**

```ts
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error('VITE_API_URL não está definida no .env')
}

export const api = axios.create({ baseURL })

export const getAlgo = () => api.get('/algum-endpoint')
export const getUsuarios = () => api.get('/usuarios')

export async function askJuniorStream(
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> { /* fetch + ReadableStream reader, decodifica e chama onChunk a cada pedaço */ }
```

**Contrato da função que a UI deve usar:**

- Assinatura: `askJuniorStream(pergunta: string, onChunk: (chunk: string) => void): Promise<void>`
- Faz `POST` em `${VITE_API_URL}/junior_stream` com body JSON `{ "pergunta": string }`.
- A resposta vem com `transfer-encoding: chunked`: `onChunk` é chamado **várias vezes**, cada uma com um pedaço de texto que deve ser **concatenado** ao anterior.
- O texto retornado está em **sintaxe markdown**.
- A promise resolve quando o stream termina; lança `Error` em status != 2xx ou quando não há corpo de streaming.
- Não recebe histórico de conversa — cada chamada envia apenas a pergunta atual (ver §8.2).

`getAlgo` e `getUsuarios` são placeholders não utilizados nesta interface — ignorar, não remover.

### 2.3 `.env`

`VITE_API_URL` deve apontar para `https://projetopdi.atlab.ufc.br/api` (o endpoint completo é `/junior_stream`, concatenado dentro de `api.ts`). CORS já está liberado pelo backend.

### 2.4 `src/App.tsx` — **página de teste, a ser substituída**

O `App.tsx` atual é um formulário simples ("Teste da API AI") com `pergunta`, `resposta`, `status` e `erro` em `useState`. Ele serve **apenas como referência do fluxo correto de chamada** — em especial o padrão:

```ts
await askJuniorStream(pergunta, (chunk) => {
  setResposta((prev) => prev + chunk)
})
```

Esse componente deve ser **inteiramente substituído** pela interface do Figma. O `App.css` de teste também pode ser descartado.

## 3. Restrições obrigatórias

1. **NÃO modificar `src/services/api.ts`.** Reutilizar `askJuniorStream` exatamente como está.
2. **NÃO trocar `fetch` por `axios`** no fluxo de chat — o streaming depende do `ReadableStream` do `fetch`.
3. **NÃO expor nem hardcodar a URL da API** nos componentes. Ela vive no `.env` e é lida dentro de `api.ts`.
4. **CSS puro**, sem Tailwind, sem styled-components, sem biblioteca de UI.
5. **NÃO instalar bibliotecas novas sem perguntar antes** (ver §7 sobre markdown — é o único caso em que uma dependência pode ser necessária).
6. **NÃO inventar telas, textos ou fluxos** que não estejam no Figma ou neste PRD.
7. Antes de codar, **listar a estrutura atual de `src/`** e adaptar-se ao padrão de pastas já existente.

## 4. Fonte de verdade do design — MCP do Figma

O design deve ser extraído via **MCP do Figma** (Dev Mode). Não recriar "de olho" a partir de descrições.

**Arquivo:** `zptptXkpDpSPVXq4upIBB2` — `UFC_AI`

| Tela | Node ID | URL |
|---|---|---|
| Página inicial (estado vazio) | `41-5110` (`41:5110`) | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=41-5110&m=dev |
| Página com mensagem (estado de conversa) | `41-5153` (`41:5153`) | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=41-5153&m=dev |

### Passos com o MCP

1. Confirmar que o servidor MCP do Figma está conectado e listar as ferramentas disponíveis.
2. Para **cada** node acima, obter: o **código/estrutura** do frame (`get_code` ou equivalente), a **imagem de referência** (`get_image` ou equivalente) e as **variáveis de design** (`get_variable_defs` ou equivalente).
3. Converter os tokens em **CSS variables** num arquivo global (`src/styles/tokens.css`): cores, tipografia, espaçamentos, raios, sombras. Todo o CSS consome essas variáveis — nada de valores mágicos repetidos.
4. Se a saída do MCP vier em Tailwind ou CSS-in-JS, **converter para CSS puro** mantendo os valores idênticos.
5. Exportar os assets para `src/assets/`: logo do mascote, wordmark "MEJ IA", mascote da marca d'água de fundo, ícone de enviar, ícone de copiar, logos UFC e ATLAB.

## 5. Layout

Três regiões fixas:

- **Header (topo, largura total):** logo do mascote + wordmark "MEJ IA" em roxo.
- **Sidebar (esquerda):** botão "+ Nova Conversa" (roxo, arredondado) no topo; lista de conversas abaixo; rodapé com "Parcerias: / Projeto PDI - AI/WEB" e os logos UFC e ATLAB.
- **Área principal (direita):** marca d'água do mascote ao fundo; conteúdo central; barra de input fixa embaixo com placeholder "Pergunta para o MEJ IA" e botão circular roxo de enviar.

A área principal tem **dois estados**:

- **Estado vazio (node 41-5110):** texto de apresentação do MEJ IA + "Como posso lhe ajudar hoje ?" + os 3 chips de perguntas rápidas.
- **Estado de conversa (node 41-5153):** lista de mensagens de usuário e IA, com botão de copiar nas mensagens da IA.

## 6. Modelo de dados

```ts
type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;        // markdown cru, no caso do assistant
  isStreaming?: boolean;  // true enquanto os chunks ainda estão chegando
  error?: string;         // preenchido se a chamada falhar
  createdAt: number;
}

interface Conversation {
  id: string;
  title: string;   // "Nova Conversa" até a 1ª mensagem do usuário definir o título
  messages: Message[];
  draft: string;   // texto digitado e ainda NÃO enviado — não pode ser perdido ao trocar de aba
  isLoading: boolean;
  createdAt: number;
}

interface AppState {
  conversations: Conversation[];
  activeConversationId: string;
}
```

Estado centralizado (Context + `useReducer`, ou um hook `useConversations`), **não** duplicado dentro dos componentes filhos.

## 7. Renderização da resposta (markdown)

A API devolve **markdown**. Renderizar markdown cru como texto puro deixaria `##`, `**` e listas visíveis na tela.

**Decisão pendente — perguntar antes de implementar.** Opções:

- **A)** Instalar `react-markdown` (+ `remark-gfm` para tabelas/listas) e renderizar com estilos próprios alinhados ao Figma. É a opção recomendada.
- **B)** Escrever um renderizador mínimo próprio (negrito, itálico, títulos, listas, links, código) sem dependência nova.

Enquanto a decisão não for tomada, renderizar em `<pre>`/texto simples e **deixar o ponto sinalizado no relatório da etapa**. Em qualquer das opções, o markdown **cru** continua guardado em `message.content` — é ele que o botão de copiar usa (§9.2).

## 8. Fluxo de envio (streaming)

### 8.1 Sequência

1. Validar: `pergunta.trim()` não vazio e `isLoading === false` na conversa ativa.
2. Adicionar `Message` com `role: 'user'` e o texto; limpar o `draft` da conversa.
3. Adicionar **imediatamente** uma `Message` com `role: 'assistant'`, `content: ''` e `isStreaming: true` — é ela que vai crescendo. Enquanto `content` estiver vazio, exibir o indicador de "digitando".
4. Marcar `isLoading: true` na conversa.
5. Chamar `askJuniorStream(pergunta, onChunk)`, concatenando cada chunk ao `content` daquela mensagem.
6. Ao resolver: `isStreaming: false`, `isLoading: false`.
7. No `catch`: `isStreaming: false`, `isLoading: false`, `error` preenchido com a mensagem do `Error`, exibida de forma discreta na bolha, com opção de "Tentar novamente" que reenvia a mesma pergunta.

### 8.2 Regras técnicas críticas do streaming

- **Chunks devem ir para a conversa e a mensagem certas, não para "a ativa".** O callback precisa capturar `conversationId` e `messageId` no momento do envio e atualizar por esses ids. Se o usuário clicar em "+ Nova Conversa" ou trocar de aba no meio de uma resposta, o texto tem que continuar entrando na conversa de origem, sem vazar para a nova.
- Atualizar estado de forma **imutável e funcional** (`prev => ...`), nunca lendo o estado antigo de fora do updater — chunks chegam rápido e em sequência.
- Concatenar chunks **sem trim e sem `join(' ')`**: o markdown depende de espaços e quebras de linha; `content + chunk` puro.
- **Sem histórico:** o endpoint recebe apenas `{ pergunta }`, então a IA não tem memória das mensagens anteriores. As abas são organização de UI, não contexto conversacional. **Não** tentar contornar isso concatenando o histórico dentro do campo `pergunta` — apenas registrar a limitação no relatório final para eu alinhar com o dev de backend.
- Rolagem automática para o fim durante o streaming, mas **respeitando o usuário**: se ele rolou para cima, não forçar o scroll de volta.
- `AbortController` / botão de parar geração: fora de escopo agora (exigiria mudar `api.ts`), mas mencionar no relatório se o problema aparecer.

## 9. Especificação funcional dos elementos interativos

Esta é a parte mais importante do documento. Cada comportamento abaixo é obrigatório.

### 9.1 Botão "+ Nova Conversa" (sidebar)

**Função:** criar uma nova aba de conversa no front **sem apagar a conversa anterior nem o que estava sendo escrito nela**, e adicionar mais um item de conversa na sidebar.

1. Ao clicar, cria uma `Conversation` nova com `messages: []` e `draft: ''`, adiciona à lista e define como `activeConversationId`.
2. A conversa anterior **permanece inteira na memória**: mensagens **e** o texto ainda não enviado (`draft`). Ao voltar por ela pela sidebar, tudo reaparece como estava, inclusive o rascunho no input.
   - Consequência técnica: o valor do input **não pode** ser um `useState` solto do componente de input. Ele lê e grava em `conversations[i].draft`.
3. Um novo item aparece na lista da sidebar (mais recente no topo), com destaque visual no item ativo conforme o Figma.
4. A área principal volta ao **estado vazio** — apresentação e chips visíveis de novo, pois a conversa nova não tem mensagens.
5. Se houver uma resposta em streaming na conversa anterior, ela **continua sendo escrita lá** (§8.2) e o indicador de carregamento aparece no item correspondente da sidebar.
6. O título do item passa a ser um resumo da primeira mensagem do usuário (~30 caracteres, com reticências). Antes disso, "Nova Conversa".
7. Clicar em qualquer item da sidebar troca a conversa ativa sem perder nada da anterior.

### 9.2 Botão de copiar (dentro do chat)

**Função:** copiar a mensagem enviada pela IA.

1. Aparece **somente** em mensagens `role: 'assistant'`, posicionado conforme o node `41-5153`.
2. Copia o `content` **daquela** mensagem — o **markdown cru**, exatamente como a API devolveu, sem prefixos de remetente e sem o HTML renderizado.
3. Fica **oculto ou desabilitado enquanto `isStreaming === true`** — só faz sentido copiar a resposta completa.
4. Usa `navigator.clipboard.writeText()` com `try/catch` e fallback silencioso se a API não estiver disponível.
5. Feedback visual imediato: muda para "Copiado" por ~2 segundos e volta ao normal. O feedback é **isolado por mensagem** — copiar a mensagem 3 não altera a aparência da mensagem 1.
6. Acessível: `aria-label="Copiar resposta"` e navegável por teclado.

### 9.3 Chips de perguntas rápidas

Textos (conforme o Figma):
- "Encontre editais, eventos ou oportunidades"
- "Tire dúvidas sobre a Universidade"
- "Quero participar de uma Empresa Júnior"

**Função:** ao clicar, o texto do chip é enviado à IA como se o usuário o tivesse digitado, e a resposta retorna **na mesma página**, sem navegação nem recarga.

1. O clique dispara **exatamente o mesmo fluxo da §8.1**, com `pergunta` = o texto literal do chip. Nada de endpoint diferente ou prompt extra.
2. **Os chips somem assim que a primeira pergunta é enviada** e não voltam mais naquela conversa. Regra: renderizar apenas quando `activeConversation.messages.length === 0`.
3. Vale para qualquer forma de envio — chip ou input. Enviada a primeira mensagem, o bloco de apresentação e os chips saem e a área vira a lista de mensagens (transição do node `41-5110` para o `41-5153`).
4. A regra é **por conversa**: uma aba nova criada pelo "+ Nova Conversa" volta a exibir os chips normalmente.

### 9.4 Input e botão de enviar

1. Envio por clique no botão circular roxo **ou** por `Enter`. `Shift + Enter` quebra linha.
2. Botão desabilitado quando o input está vazio (só espaços) ou quando `isLoading === true` na conversa ativa — mesma lógica do `App.tsx` de teste.
3. Ao enviar, limpar o `draft` da conversa ativa e exibir a mensagem do usuário imediatamente.
4. `textarea` com altura que cresce com o conteúdo até um limite, conforme o Figma.
5. Em caso de erro da API, mostrar o erro de forma discreta e **não** derrubar a aplicação; a pergunta continua recuperável.

## 10. Estrutura de arquivos sugerida

Adaptar aos nomes já existentes. Um componente por arquivo, com o CSS ao lado.

```
src/
  components/
    Header/
    Sidebar/
      Sidebar.tsx
      ConversationItem.tsx
      NewChatButton.tsx
    Chat/
      ChatWindow.tsx
      MessageList.tsx
      MessageBubble.tsx
      MarkdownMessage.tsx
      CopyButton.tsx
      EmptyState.tsx
      QuickPrompts.tsx
      ChatInput.tsx
  context/
    ConversationsContext.tsx
  hooks/
    useConversations.ts
    useCopyToClipboard.ts
  services/
    api.ts            <-- NÃO ALTERAR
  types/
    chat.ts
  styles/
    tokens.css
    global.css
  assets/
  App.tsx             <-- substituir o conteúdo de teste
```

## 11. Ordem de execução

Executar em etapas e **parar para mostrar o resultado ao final de cada uma**, em vez de entregar tudo de uma vez:

1. Listar a estrutura de `src/`, confirmar que `.env` tem `VITE_API_URL` e que `npm run dev` sobe. Reportar antes de mudar qualquer coisa.
2. Extrair design e tokens dos dois nodes via MCP do Figma; gerar `tokens.css`; exportar assets.
3. Montar o layout estático (Header, Sidebar, área principal, input) no estado vazio, fiel ao node `41-5110`.
4. Implementar o estado (`Conversation`/`Message`) e o fluxo de envio com streaming via `askJuniorStream`; estado de conversa fiel ao node `41-5153`.
5. Resolver a renderização de markdown (§7) — **perguntar antes de instalar**.
6. Implementar "+ Nova Conversa", troca de abas e preservação do rascunho.
7. Implementar botão de copiar e chips de perguntas rápidas com a regra de desaparecimento.
8. Revisão: responsividade, acessibilidade, `npm run build` sem erros de TypeScript.

## 12. Critérios de aceitação

- [ ] Layout fiel aos nodes `41-5110` e `41-5153` (cores, tipografia, espaçamentos e raios vindos dos tokens do Figma).
- [ ] `src/services/api.ts` permanece **byte a byte igual** ao original.
- [ ] Enviar uma pergunta pelo input exibe a resposta **aparecendo progressivamente** na tela, chunk a chunk, na mesma página.
- [ ] Clicar num chip envia aquele texto exato e retorna a resposta na mesma página.
- [ ] Os chips e o texto de apresentação desaparecem após a primeira mensagem da conversa e não retornam.
- [ ] "+ Nova Conversa" cria uma aba nova, adiciona o item na sidebar e ativa o estado vazio.
- [ ] Escrever um texto sem enviar, criar uma conversa nova e voltar: o texto continua no input e as mensagens continuam lá.
- [ ] Trocar de aba durante um streaming não desvia o texto para a conversa errada nem interrompe a resposta.
- [ ] O botão de copiar aparece só nas mensagens da IA, copia o markdown cru correto, fica indisponível durante o streaming e dá feedback isolado por mensagem.
- [ ] Erro de rede/API exibe mensagem tratada, sem quebrar a aplicação.
- [ ] Nenhuma URL de API ou variável de ambiente hardcodada nos componentes.
- [ ] `npm run build` passa sem erros e sem `any` desnecessário.

## 13. Fora de escopo

- Persistência das conversas (elas vivem apenas na sessão, salvo instrução contrária).
- Autenticação e contas de usuário.
- Modo escuro.
- Renomear, favoritar ou excluir conversas pela sidebar.
- Envio de histórico/contexto multi-turno para a API (o endpoint não suporta hoje).
- Cancelamento de resposta em andamento (`AbortController`), pois exigiria alterar `api.ts`.
