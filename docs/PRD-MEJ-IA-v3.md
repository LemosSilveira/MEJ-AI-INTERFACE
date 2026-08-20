# PRD v3 — MEJ IA (UFC_AI)
## Dois modelos (Junior / Vitra), gestão de conversas, 404, Docker e segurança

> **Como usar:** salve em `docs/PRD-MEJ-IA-v3.md` e peça ao Claude Code para ler **os três PRDs** (`PRD-MEJ-IA.md`, `PRD-MEJ-IA-v2.md` e este) antes de escrever qualquer código. Este PRD é **incremental**: tudo dos anteriores continua valendo, exceto onde este documento diz explicitamente o contrário.

---

## 0. Regra de ouro

> **Nada que já funciona pode regredir. Cada feature nova é testada isoladamente antes da próxima entrar.**

### 0.1 Funcionalidades existentes — checar ao fim de CADA etapa

| # | Funcionalidade | Regra |
|---|---|---|
| F1 | "+ Nova Conversa" | Cria aba nova sem apagar mensagens **nem o rascunho** da anterior |
| F2 | Troca de conversa | Restaura mensagens **e** o `draft` no input, exatamente como estavam |
| F3 | Botão de copiar | Só em mensagens da IA; copia **markdown cru**; indisponível durante streaming; feedback isolado por mensagem |
| F4 | Chips de perguntas rápidas | Enviam o texto literal; **somem após a 1ª mensagem**; reaparecem em conversa nova |
| F5 | Envio | Botão ou `Enter`; `Shift+Enter` quebra linha; desabilitado com input vazio ou `isLoading` |
| F6 | Streaming | Resposta cresce chunk a chunk; chunks vão para a conversa/mensagem de **origem**, mesmo trocando de aba |
| F7 | Erro de API | Mensagem tratada em português + "Tentar novamente"; a aplicação não quebra |
| F8 | Logos clicáveis | UFC → `https://www.ufc.br/`; UFC Inova → `https://ufcinova.ufc.br/pt/pagina-de-introducao/`; `target="_blank"` + `rel="noopener noreferrer"` |
| F9 | Mobile / drawer | Sidebar como drawer; fecha por overlay, `Esc` e ao selecionar conversa; scroll do body travado |
| F10 | Segurança do markdown | Sem `dangerouslySetInnerHTML`; sem `rehype-raw`; URLs `javascript:`/`data:` bloqueadas |

### 0.2 Alteração de contrato — atenção

O v1 congelou `src/services/api.ts` ("byte a byte igual"). **Esta versão libera esse arquivo**, porque o segundo endpoint exige. A liberação é **estritamente aditiva**:

- `askJuniorStream` **permanece exportada e com a mesma assinatura** (outros pontos podem depender dela).
- O novo código é adicionado ao lado, sem reescrever o que existe.
- Continua proibido: trocar `fetch` por `axios` no streaming, hardcodar URL fora de `api.ts`, mexer em `getAlgo`/`getUsuarios`.

## 1. Contexto das duas IAs

A aplicação passa a expor **dois assistentes distintos**, com endpoints e identidade visual próprios.

| | **Junior** | **Vitra** |
|---|---|---|
| Propósito | Tira-dúvidas sobre Empresas Juniores | Guia da Vitrine Tecnológica da UFC |
| Endpoint | `POST /api/junior_stream` | `POST /api/vitra_stream` |
| Base de conhecimento | Arquivos da Coemp, vetorizados | Raspagem do site UFC Inova |
| Modelo atual | GPT-OSS 20b (v2, em avaliação) | — |
| Status | Em produção | **Novo — validar antes de integrar** |

Ambos usam a mesma arquitetura de backend (RAG/LLM com LangGraph, ChromaDB e Ollama) e, presumivelmente, o mesmo contrato de requisição/resposta — **isso precisa ser confirmado empiricamente na Etapa 2, não assumido**.

## 2. Design — nodes do Figma

Arquivo: `zptptXkpDpSPVXq4upIBB2` — `UFC_AI`. **16 nodes**, cobrindo dois temas × dois breakpoints × quatro estados.

### Desktop

| Tela | Node |
|---|---|
| Junior — padrão | `85-3761` |
| Junior — caixa de edição de conversa aberta | `85-3847` |
| Junior — caixa de mudança de modelo aberta | `85-3940` |
| Vitra — padrão | `85-4036` |
| Vitra — caixa de edição de conversa aberta | `85-4115` |
| Vitra — caixa de mudança de modelo aberta | `85-4201` |

### Mobile

| Tela | Node |
|---|---|
| Junior — padrão | `85-4292` |
| Junior — sidebar aberta | `85-4590` |
| Junior — caixa de edição de conversa aberta | `85-4681` |
| Junior — caixa de mudança de modelo aberta | `85-4364` |
| Vitra — padrão | `85-4447` |
| Vitra — sidebar aberta | `85-4779` |
| Vitra — caixa de edição de conversa aberta | `85-4860` |
| Vitra — caixa de mudança de modelo aberta | `85-4513` |

URL base: `https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=<NODE>&m=dev`

### 2.1 Procedimento de extração

1. Confirmar conexão do MCP (`whoami`). **Se não estiver conectado, PARAR e avisar** — não recriar design "de olho".
2. Extrair na ordem: primeiro os dois padrões desktop (`85-3761`, `85-4036`) para levantar o **diff de tema**; depois os estados; por fim o mobile.
3. Para cada node: `get_code`, `get_image`, `get_variable_defs`.
4. **Análise de tema (crítica, fazer antes de codar):** comparar Junior × Vitra e produzir uma tabela do que muda entre eles — cor primária, logo, ilustração de fundo, textos de apresentação, textos dos chips. O que é **igual** não vira token de tema; só o que difere.
5. Converter tudo para **CSS puro**. Reaproveitar tokens existentes; **não renomear** variáveis em uso.
6. **Entregável antes de qualquer código:** a tabela de diff de tema + lista de assets novos.

### 2.2 Arquitetura de tema (obrigatória)

**Não** criar dois conjuntos de componentes, nem dois arquivos CSS paralelos, nem `if (modelo === 'vitra')` espalhado no JSX. Isso duplica manutenção e é a via mais rápida para quebrar F1–F10.

Abordagem: **um único conjunto de componentes**, tematizado por CSS variables trocadas via atributo no elemento raiz.

```css
/* tokens.css */
:root {
  /* tokens neutros, compartilhados */
  --espaco-md: 16px;
  --raio-lg: 24px;
}

[data-modelo="junior"] {
  --cor-primaria: /* do Figma 85-3761 */;
  --cor-primaria-suave: ...;
}

[data-modelo="vitra"] {
  --cor-primaria: /* do Figma 85-4036 */;
  --cor-primaria-suave: ...;
}
```

```tsx
<div className="app" data-modelo={modeloAtivo}>
```

Assets que trocam (logo, ilustração de fundo) resolvem-se por um mapa tipado, nunca por concatenação de string em caminho de arquivo:

```ts
const ASSETS_POR_MODELO = {
  junior: { logo: logoJunior, fundo: fundoJunior },
  vitra:  { logo: logoVitra,  fundo: fundoVitra  },
} as const;
```

Transição suave entre temas (`transition` nas cores), respeitando `prefers-reduced-motion`.

## 3. Feature A — Seleção de modelo

### 3.1 Interação

- Botão de **seta** (posição conforme Figma) abre uma caixa/popover com as duas opções.
- Cada opção mostra nome e uma linha de descrição:
  - **Junior** — Dúvidas sobre Empresas Juniores
  - **Vitra** — Vitrine Tecnológica da UFC
- Opção ativa marcada visualmente (`aria-checked`).
- Fecha: ao escolher, ao clicar fora, com `Esc`.
- Acessibilidade: `role="menu"` / `role="listbox"` conforme o padrão adotado, `aria-expanded` no botão, navegação por setas do teclado, foco retornando ao botão ao fechar.
- Ao trocar, a interface inteira reflete o novo tema (§2.2) — este é o feedback visual pedido.

### 3.2 Decisão de arquitetura — o modelo pertence à CONVERSA

Esta é a decisão mais importante do PRD. **O modelo ativo é uma propriedade de `Conversation`, não um estado global.**

```ts
type Modelo = 'junior' | 'vitra';

interface Conversation {
  id: string;
  title: string;
  modelo: Modelo;        // NOVO
  messages: Message[];
  draft: string;
  isLoading: boolean;
  createdAt: number;
}
```

Regras:

1. **Conversa vazia (`messages.length === 0`):** trocar o modelo altera `conversation.modelo` livremente.
2. **Conversa com mensagens:** a troca **não** reescreve a conversa atual. Ao escolher outro modelo numa conversa já iniciada, criar uma **nova conversa** com o modelo escolhido, seguindo exatamente as regras de F1 (a anterior permanece intacta, com mensagens e rascunho). O usuário precisa perceber que mudou de contexto — indicar isso na UI conforme o Figma permitir.
   - Justificativa: o endpoint não recebe histórico, e as bases de conhecimento são distintas. Misturar respostas de duas IAs numa mesma thread produz um histórico incoerente e sem rastreabilidade.
3. O item na sidebar indica a qual modelo a conversa pertence (badge, cor ou ícone — conforme o Figma).
4. **Trocar de modelo nunca cancela um streaming em andamento** e nunca desvia chunks: F6 continua valendo, os chunks vão para a conversa de origem.
5. `modelo` da nova conversa criada por "+ Nova Conversa" = o modelo da conversa ativa no momento (comportamento menos surpreendente).

> Se o Figma indicar comportamento diferente (ex.: seletor global no header, fora da conversa), **relatar a divergência e perguntar** antes de implementar. Não decidir sozinho.

### 3.3 Camada de API

Alteração **aditiva** em `src/services/api.ts`:

```ts
const ENDPOINTS = {
  junior: '/junior_stream',
  vitra: '/vitra_stream',
} as const;

export type Modelo = keyof typeof ENDPOINTS;

export async function askStream(
  modelo: Modelo,
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  // mesma lógica de fetch + ReadableStream já validada
}

// mantida por compatibilidade
export async function askJuniorStream(
  pergunta: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  return askStream('junior', pergunta, onChunk);
}
```

Regras inegociáveis:
- O endpoint sai **exclusivamente** do mapa `ENDPOINTS`, indexado por um valor do tipo `Modelo`.
- **Nunca** montar a URL a partir de string livre, de estado da UI não tipado, de parâmetro de query, de `localStorage` ou — sobretudo — de qualquer coisa vinda da resposta da IA (§7.2).
- Se o valor de modelo chegar inválido, cair no padrão `'junior'` e registrar aviso em dev. Não propagar valor arbitrário.
- `VITE_API_URL` continua sendo a única fonte da base; os dois endpoints são caminhos relativos a ela.

## 4. Feature B — Renomear e excluir conversa

### 4.1 Abertura

A "caixa de edição de conversas" (nodes `85-3847` / `85-4115` / `85-4681` / `85-4860`) abre a partir do item na sidebar, no gatilho definido pelo Figma (ícone de "..." ou equivalente). Fecha com clique fora e `Esc`.

### 4.2 Renomear

1. Abre um campo editável com o título atual pré-preenchido e selecionado.
2. Confirma com `Enter` ou botão; cancela com `Esc` (restaura o valor anterior).
3. **Validação:** `trim()`; nome vazio é rejeitado (mantém o anterior); limite de ~60 caracteres, com truncamento visual por CSS (`text-overflow: ellipsis`), não cortando o dado.
4. O nome é **conteúdo do usuário** — renderizado como texto puro, jamais como HTML (§7.1).
5. Renomear **não** altera mensagens, rascunho, modelo nem a conversa ativa.
6. Após renomear manualmente, o título passa a ser fixo: a regra automática do v1 (título derivado da 1ª mensagem) **não** pode sobrescrevê-lo depois. Marcar com um `titleManual: boolean` na `Conversation`.

### 4.3 Excluir

1. **Sempre pedir confirmação** — nunca excluir em um clique. Diálogo com o nome da conversa e ações claras ("Excluir" / "Cancelar"), foco inicial em "Cancelar".
2. Casos de borda, todos obrigatórios:
   - **Excluir a conversa ativa** → ativar a conversa mais recente restante.
   - **Excluir a última conversa da lista** → criar automaticamente uma conversa nova e vazia; a aplicação nunca fica sem conversa ativa.
   - **Excluir uma conversa com streaming em andamento** → o streaming daquela conversa é descartado sem quebrar a aplicação; o callback precisa verificar se a conversa ainda existe antes de aplicar o chunk (guarda contra "escrever em conversa fantasma").
   - **Excluir conversa não-ativa durante streaming de outra** → não afeta o streaming em curso.
3. Como não há persistência, a exclusão é definitiva na sessão — o diálogo deve deixar isso claro.

### 4.4 Acessibilidade

- Menu e diálogo com foco preso enquanto abertos (*focus trap*), retornando ao gatilho ao fechar.
- `aria-label` em todos os botões de ícone.
- Ações operáveis inteiramente por teclado.

## 5. Feature C — Página 404

1. Criar componente próprio, tematizado (§2.2), com a identidade do projeto: mensagem clara em português, ilustração/mascote e botão de volta para a raiz da aplicação.
2. **GitHub Pages:** o site é estático e não conhece rotas do SPA. Gerar um `public/404.html` que o Pages serve automaticamente. Se o app tiver rotas internas, aplicar o redirecionamento padrão de SPA para o Pages; se não tiver, o `404.html` estático já resolve.
3. **Docker/Nginx:** a configuração do Nginx (§6) deve usar `try_files $uri $uri/ /index.html;` e apontar `error_page 404` para a página do projeto.
4. Respeitar o `base` do Vite (`/MEJ-AI-INTERFACE/`) — assets da 404 também quebram com caminho absoluto.
5. **Segurança:** a 404 **não** pode ecoar na tela o caminho digitado pelo usuário (vetor clássico de XSS refletido) nem qualquer dado da URL.

## 6. Feature D — Docker

Objetivo: subir o front em qualquer sistema, com imagem enxuta.

### 6.1 Dockerfile multi-stage

```dockerfile
# ---- build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- runtime ----
FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 6.2 Pontos críticos

- **`VITE_API_URL` é build-time, não runtime.** Precisa entrar como `ARG` no estágio de build; passar como variável de ambiente do contêiner **não funciona**, porque o Vite já embutiu o valor no bundle. Documentar isso no README — é o erro nº 1 de quem sobe Vite em Docker.
- **`.dockerignore` obrigatório**, com no mínimo: `node_modules`, `dist`, `.git`, `.env`, `.env.*`, `.claude`, `*.log`. Sem ele, o `.env` vai para dentro da imagem.
- Imagem final baseada em `nginx:alpine`, sem `node_modules` — alvo abaixo de 50 MB.
- Nginx: `try_files` para SPA, `gzip` ligado, cache longo para assets com hash e `no-cache` para o `index.html`.
- Opcional: `docker-compose.yml` com o `build.args` já preenchido, para facilitar o uso local.
- **Nunca** copiar `.env` para dentro da imagem, nem embutir segredo em `ENV`/`ARG` que não seja público (lembrando: `VITE_*` é público por natureza — §7.3).

### 6.3 Validação

```bash
docker build --build-arg VITE_API_URL=https://projetopdi.atlab.ufc.br/api -t mej-ia .
docker run -p 8080:80 mej-ia
docker images mej-ia   # conferir tamanho
```

## 7. Feature E — Estados de carregamento

O pedido menciona "gifs de carregamento". Recomendação de sênior: **usar GIF apenas se o Figma trouxer uma animação específica de marca**. Para spinners e skeletons, preferir **CSS ou SVG animado** — um GIF de spinner pesa entre 20 e 200 KB, não escala com o tema (§2.2) e serra as bordas; CSS pesa quase nada e herda `--cor-primaria` automaticamente.

Onde aplicar:

1. **Resposta da IA (já existe):** indicador de "digitando" enquanto `content` está vazio e `isStreaming` é true. Manter.
2. **Troca de modelo:** se houver latência perceptível, transição suave — sem tela branca.
3. **Carga inicial da aplicação:** se o bundle demorar, um estado de carregamento no `index.html` que some quando o React monta.
4. Todos respeitam `prefers-reduced-motion: reduce` (sem animação para quem pediu).
5. Se usar GIF exportado do Figma: otimizar, servir com `loading="lazy"` quando fora da dobra, e **um só arquivo por tema no máximo**.

## 8. Segurança

Mantém integralmente a §7 do v2. Abaixo, o que a v3 **acrescenta**.

### 8.1 Reforço do já existente (não regredir)

- Sem `dangerouslySetInnerHTML` em conteúdo de IA; sem `rehype-raw`.
- URLs de markdown: só `http:`/`https:`; bloquear `javascript:`, `data:`, `vbscript:`.
- Links externos: `rel="noopener noreferrer nofollow"`.
- Nada sensível em variável `VITE_*` (elas vão para o bundle e são públicas).
- Erros na UI genéricos, em português, sem URL, status bruto, stack ou corpo de resposta.

### 8.2 Seleção de endpoint — novo vetor

O ponto mais delicado desta versão: agora existe lógica que **escolhe uma URL de destino**.

- O endpoint sai exclusivamente do mapa `ENDPOINTS` (§3.3), tipado como união literal. Nunca de string livre.
- Nenhum caminho de código permite que a resposta da IA, um parâmetro de URL, `localStorage` ou o nome de uma conversa influencie qual endpoint é chamado.
- Valor de modelo inválido → fallback para `'junior'`, sem propagar.
- O atributo `data-modelo` no DOM recebe apenas valores da união `Modelo` — nunca string arbitrária, que poderia ser usada para injeção de atributo.

### 8.3 Nome de conversa — entrada do usuário na UI

Primeira vez que texto digitado pelo usuário é renderizado fora da bolha de mensagem.

- Renderizar como **texto**, nunca como HTML; nada de `innerHTML` ou template de string com HTML.
- Sanitizar espaços e caracteres de controle; rejeitar nome vazio após `trim()`.
- Limite de caracteres aplicado no dado, não só no CSS.
- O nome não é usado em nenhuma URL, chave de requisição ou seletor de DOM.

### 8.4 Página 404

- Não ecoar na tela o caminho requisitado nem parâmetros da URL (XSS refletido).
- Sem detalhe técnico de servidor.

### 8.5 Docker

- `.dockerignore` cobrindo `.env`, `.env.*`, `.git`, `.claude`.
- Imagem final sem código-fonte, sem `node_modules`, sem histórico do Git.
- Nginx sem *directory listing*; `server_tokens off` para não expor a versão.
- Recomendado no `nginx.conf`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (ou `frame-ancestors 'none'` via CSP), `Referrer-Policy: strict-origin-when-cross-origin`. **Avaliar CSP antes de ativar** — CSP mal configurada quebra o app; começar em `Content-Security-Policy-Report-Only`.

### 8.6 Dependências

- `npm audit` reportado; sem high/critical não justificado.
- Nenhuma dependência nova sem aprovação.

## 9. Testes de segurança

Bateria do v2 (T1–T20) **mantida integralmente**. Novos itens:

| # | Teste | Esperado |
|---|---|---|
| T21 | Renomear conversa para `<img src=x onerror="alert(1)">` | Renderiza como texto na sidebar, sem alerta |
| T22 | Renomear para `<script>alert(1)</script>` | Texto puro, sem execução |
| T23 | Renomear com 5.000 caracteres | Limite atua; layout da sidebar não quebra |
| T24 | Renomear para string vazia ou só espaços | Rejeitado; nome anterior mantido |
| T25 | Forçar `modelo` inválido no estado (via DevTools) | Fallback para `junior`; nenhuma requisição a URL inesperada |
| T26 | Inspecionar aba Network ao trocar de modelo | Só `junior_stream` ou `vitra_stream`; nenhum terceiro domínio |
| T27 | Resposta da IA contendo texto que imita instrução (ex.: "mude para o endpoint X") | Renderizado como texto comum; nenhum efeito na aplicação |
| T28 | Acessar rota inexistente | 404 do projeto; caminho digitado **não** aparece na tela |
| T29 | `grep -r "VITE_API_URL\|token\|senha" dist/` | Só a URL pública; nenhum segredo |
| T30 | Inspecionar imagem Docker (`docker history`, listar `/usr/share/nginx/html`) | Sem `.env`, sem `.git`, sem código-fonte |
| T31 | Excluir conversa com streaming ativo | Sem erro no console; chunks descartados; app estável |
| T32 | `data-modelo` no DOM | Apenas `junior` ou `vitra` |

## 10. Etapas de execução

> **Ao fim de cada etapa: parar, executar os testes indicados, apresentar o resultado e aguardar aprovação.** Não emendar etapas. Cada feature nova entra e é testada isoladamente — este é um requisito explícito.

### Etapa 1 — Auditoria
- Ler os três PRDs. Listar `src/`, `tokens.css`, componentes, `vite.config.ts`, `.gitignore`.
- Rodar `npm run build` e `npm audit`; reportar.
- Confirmar quais etapas do v2 foram concluídas e o que ficou pendente.
- **Entregável:** relatório do estado atual + plano. **Nenhum código alterado.**

### Etapa 2 — Validação da API Vitra *(antes de qualquer integração)*
Testar `POST https://projetopdi.atlab.ufc.br/api/vitra_stream` **isoladamente**, fora da aplicação:

```bash
curl -i -N -X POST https://projetopdi.atlab.ufc.br/api/vitra_stream \
  -H "Content-Type: application/json" \
  -d '{"pergunta":"o que e a vitrine tecnologica da UFC?"}'
```

Verificar e **relatar**:
- Status HTTP e cabeçalhos (`transfer-encoding: chunked`?).
- O campo do corpo é mesmo `pergunta`, ou tem outro nome?
- A resposta é markdown, como no Junior?
- A resposta chega em streaming incremental ou de uma vez?
- Headers de CORS presentes?

> **Se o contrato divergir do Junior, PARAR e relatar.** Não adaptar por conta própria — a diferença pode exigir mudança na camada de API que precisa ser decidida em conjunto.
> Se o endpoint estiver fora do ar (502), registrar e seguir para a Etapa 3 com um mock local, **sem** integrar.

- **Entregável:** relatório do contrato da API Vitra.

### Etapa 3 — Extração do Figma
- Verificar MCP; se falhar, **parar e avisar**.
- Extrair os 16 nodes na ordem da §2.1; produzir a **tabela de diff de tema**; exportar assets.
- **Teste:** build passa; nenhum componente quebrado; nenhuma variável renomeada.
- **Entregável:** tabela de diff + lista de assets.

### Etapa 4 — Arquitetura de tema
- Implementar `data-modelo` + tokens por tema (§2.2), com o mapa de assets.
- Aplicar apenas o tema Junior primeiro; validar; depois Vitra.
- **Teste:** trocar o valor manualmente no DOM alterna a identidade visual inteira. **Regressão F1–F10.**

### Etapa 5 — Seletor de modelo (feature isolada)
- Estado `modelo` na `Conversation`; popover; regra da §3.2; `askStream` na camada de API.
- **Teste:** T25, T26, T32. Trocar modelo em conversa vazia altera o modelo; em conversa iniciada cria conversa nova sem tocar na anterior. **Regressão F1–F7.**

### Etapa 6 — Renomear e excluir (feature isolada)
- Menu de edição, renomear com validação, excluir com confirmação e todos os casos de borda da §4.3.
- **Teste:** T21, T22, T23, T24, T31. **Regressão F1–F3.**

### Etapa 7 — Mobile
- Aplicar os 8 nodes mobile; drawer, popovers e diálogos adaptados ao toque.
- **Teste:** F9 e todas as features novas em viewport mobile; alvos de toque ≥ 44px; teclado virtual não cobre o input.

### Etapa 8 — Página 404 e estados de carregamento
- Componente 404 tematizado, `public/404.html`, `try_files` no Nginx; indicadores de carregamento.
- **Teste:** T28; `prefers-reduced-motion` respeitado.

### Etapa 9 — Docker
- `Dockerfile` multi-stage, `.dockerignore`, `nginx.conf`, README atualizado com o `--build-arg`.
- **Teste:** T30; build e run conforme §6.3; tamanho da imagem reportado; app funcional em `localhost:8080`.

### Etapa 10 — Segurança e fechamento
- Bateria completa: T1–T32.
- `npm run build`, `npm run preview`, verificação de assets no subdiretório do Pages.
- **Entregável:** tabela de resultados item a item + checklist da §11.

## 11. Critérios de aceitação

**Modelos**
- [ ] Seletor abre, fecha (clique fora / `Esc`), navega por teclado e marca o ativo.
- [ ] Junior chama `/junior_stream`; Vitra chama `/vitra_stream`; nada mais.
- [ ] Identidade visual muda por completo conforme o modelo, nos dois breakpoints.
- [ ] Conversa iniciada + troca de modelo → conversa nova, anterior intacta.
- [ ] Sidebar indica o modelo de cada conversa.

**Gestão de conversas**
- [ ] Renomear valida, persiste na sessão e não é sobrescrito pelo título automático.
- [ ] Excluir sempre confirma; todos os casos de borda da §4.3 verificados.
- [ ] A aplicação nunca fica sem conversa ativa.

**Design**
- [ ] Os 16 nodes reproduzidos fielmente.
- [ ] Um só conjunto de componentes; sem CSS duplicado por tema.
- [ ] Sem scroll horizontal em nenhum breakpoint.

**404, carregamento e Docker**
- [ ] 404 tematizada, com volta para a raiz, sem ecoar a URL.
- [ ] Carregamentos respeitam `prefers-reduced-motion`.
- [ ] `docker build` e `docker run` funcionam; imagem sem `.env`/`.git`/fonte; tamanho reportado.

**Regressão**
- [ ] F1 a F10 verificados um a um, em desktop **e** mobile, ao fim de cada etapa.
- [ ] `askJuniorStream` continua exportada com a mesma assinatura.

**Segurança e build**
- [ ] T1 a T32 executados e documentados.
- [ ] `npm run build` sem erros; `npm audit` sem high/critical não justificado.
- [ ] Console limpo em produção (exceto pendências conhecidas de backend).

## 12. Pendências de backend (fora do escopo do front)

Registrar no README; **não** contornar no front com proxy de terceiros, `mode: 'no-cors'` ou gambiarra equivalente:

1. **CORS** — liberar `https://lemossilveira.github.io` (e a origem do Docker, se for publicada) para **ambos** os endpoints:
   ```
   Access-Control-Allow-Origin: https://lemossilveira.github.io
   Access-Control-Allow-Methods: POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```
2. **502 em `/junior_stream`** — instabilidade observada; confirmar se o serviço está estável.
3. **Contrato do `/vitra_stream`** — confirmar formato do corpo, do streaming e da resposta (Etapa 2).

## 13. Fora de escopo

Persistência de conversas em banco ou `localStorage`, autenticação, modo escuro, histórico multi-turno na API, cancelamento de resposta em andamento (`AbortController`), correção do CORS, e qualquer refatoração de arquitetura não pedida aqui.
