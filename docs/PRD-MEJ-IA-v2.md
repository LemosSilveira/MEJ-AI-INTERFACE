# PRD v2 — MEJ IA (UFC_AI)
## Atualização de design, responsividade e segurança

> **Como usar:** salve em `docs/PRD-MEJ-IA-v2.md` e peça ao Claude Code para ler **este documento e o `docs/PRD-MEJ-IA.md` (v1) por completo** antes de escrever qualquer código. Este PRD é **incremental**: tudo que o v1 define continua valendo, exceto onde este documento diz explicitamente o contrário.

---

## 0. Regra de ouro desta atualização

> **Nada que já funciona pode regredir.**

O MVP está publicado e funcional. Esta atualização troca o design de algumas telas, adiciona links nas logos, implementa o layout mobile e endurece a segurança. Ela **não** reescreve a arquitetura, **não** mexe na camada de API e **não** altera nenhuma das regras de negócio do v1.

### Funcionalidades que devem continuar idênticas (checar ao fim de cada etapa)

| # | Funcionalidade | Regra (do v1) |
|---|---|---|
| F1 | "+ Nova Conversa" | Cria aba nova sem apagar mensagens **nem o rascunho** da anterior; adiciona item na sidebar |
| F2 | Troca de conversa pela sidebar | Restaura mensagens **e** o `draft` no input, exatamente como estavam |
| F3 | Botão de copiar | Só em mensagens da IA; copia o **markdown cru**; indisponível durante o streaming; feedback "Copiado" isolado por mensagem |
| F4 | Chips de perguntas rápidas | Enviam o texto literal; **somem após a 1ª mensagem** da conversa e não voltam; reaparecem em conversa nova |
| F5 | Envio | Botão roxo ou `Enter`; `Shift+Enter` quebra linha; desabilitado com input vazio ou `isLoading` |
| F6 | Streaming | Resposta cresce chunk a chunk; chunks vão para a conversa/mensagem de **origem**, mesmo se o usuário trocar de aba |
| F7 | Erro de API | Bolha com mensagem tratada + "Tentar novamente"; a aplicação não quebra |
| F8 | Camada de API | `src/services/api.ts` permanece **byte a byte igual**; `askJuniorStream` é a única porta de entrada |

## 1. Escopo desta versão

**Entra:**
1. Novo design da tela inicial (desktop) — node `50-3323`.
2. Logos clicáveis (UFC e UFC Inova) em todas as telas.
3. Design mobile da tela padrão — node `50-3390`.
4. Design mobile com a aba lateral aberta — node `50-3446`.
5. Seção de segurança da aplicação (§7) e testes de segurança (§8).
6. Revalidação da tela de conversa — node `41-5153` (já implementada no v1; conferir se o novo visual da inicial exigiu ajuste de tokens).

**Não entra (segue fora de escopo):** persistência das conversas, autenticação, modo escuro, renomear/excluir conversas, histórico multi-turno na API, cancelamento de resposta.

## 2. Fonte de verdade do design — MCP do Figma

Arquivo: `zptptXkpDpSPVXq4upIBB2` — `UFC_AI`.

| Tela | Node ID | Status | URL |
|---|---|---|---|
| Inicial — desktop (**novo**) | `50-3323` (`50:3323`) | Substitui o `41-5110` | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=50-3323&m=dev |
| Conversa — desktop | `41-5153` (`41:5153`) | Mantido, revalidar | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=41-5153&m=dev |
| Mobile — tela padrão (**novo**) | `50-3390` (`50:3390`) | Novo | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=50-3390&m=dev |
| Mobile — sidebar aberta (**novo**) | `50-3446` (`50:3446`) | Novo | https://www.figma.com/design/zptptXkpDpSPVXq4upIBB2/UFC_AI?node-id=50-3446&m=dev |

> ⚠️ O node `41-5110` (inicial antiga) está **descontinuado**. Não usar como referência.

### Procedimento

1. Confirmar que o MCP do Figma está conectado (`whoami` ou listagem de ferramentas). Se não estiver, **parar e avisar** — não recriar o design "de olho".
2. Para cada node: `get_code`, `get_image` e `get_variable_defs` (ou equivalentes).
3. **Diff de tokens:** comparar os valores extraídos com o `src/styles/tokens.css` atual. Atualizar apenas o que mudou, **sem renomear** variáveis já em uso — renomear quebraria o CSS existente. Tokens novos entram como adição.
4. Converter qualquer saída em Tailwind/CSS-in-JS para **CSS puro**.
5. Exportar assets novos para `src/assets/`. Reaproveitar os que já existem em vez de duplicar.
6. Ao final, **relatar** o que mudou em tokens e o que é asset novo, antes de aplicar nos componentes.

## 3. Logos clicáveis

Comportamento idêntico em **todas** as telas (inicial, conversa, desktop e mobile).

| Logo | Posição | Destino |
|---|---|---|
| Universidade Federal do Ceará | Canto **inferior esquerdo** (rodapé da sidebar) | `https://www.ufc.br/` |
| Logo do canto superior direito (UFC Inova) | Canto **superior direito** (header) | `https://ufcinova.ufc.br/pt/pagina-de-introducao/` |

### Requisitos de implementação (obrigatórios)

1. Usar `<a>` real, não `<div onClick>` — preserva abrir em nova aba pelo teclado/botão do meio.
2. Abrir em nova aba com **`target="_blank"` + `rel="noopener noreferrer"`**. Sem o `rel`, a página de destino recebe acesso a `window.opener` e pode redirecionar a sua (*tabnabbing*) — ver §7.4.
3. URLs **hardcoded como constantes** em `src/constants/links.ts`, nunca vindas de estado, props dinâmicas ou da resposta da IA.
4. Acessibilidade: `aria-label` descritivo ("Site da Universidade Federal do Ceará", "Site do UFC Inova"), foco visível, e `alt` na imagem.
5. Área de clique confortável (mínimo 44×44 px no mobile) e cursor `pointer`.
6. O link **não** pode interferir no layout: nada de mudar o fluxo do rodapé da sidebar nem do header.

```ts
// src/constants/links.ts
export const EXTERNAL_LINKS = {
  ufc: 'https://www.ufc.br/',
  ufcInova: 'https://ufcinova.ufc.br/pt/pagina-de-introducao/',
} as const;
```

## 4. Responsividade / mobile

### 4.1 Breakpoint

Adotar **768px** como corte, salvo se o Figma indicar outro. Acima: layout desktop atual. Abaixo: layout dos nodes `50-3390` / `50-3446`.

Implementar com **CSS media queries**, não com renderização condicional em JS baseada em `window.innerWidth` — evita divergência entre estados e re-render desnecessário. Se um comportamento precisar mesmo de JS (ex.: fechar a sidebar ao navegar), usar `window.matchMedia` com listener.

### 4.2 Tela padrão mobile (node `50-3390`)

- Sidebar **fechada por padrão**, fora do fluxo (sem ocupar largura).
- Botão de abrir a aba lateral visível no header, conforme o node.
- Área de chat ocupa 100% da largura.
- Input fixo na base, respeitando `safe-area-inset-bottom` (iPhone com barra inferior).
- Os chips de perguntas rápidas seguem a **mesma regra F4** — mudam de arranjo visual conforme o Figma, mas a lógica de sumiço é idêntica.

### 4.3 Sidebar aberta no mobile (node `50-3446`)

- Abre como overlay/drawer sobre o conteúdo, conforme o node.
- **Overlay de fundo** clicável que fecha a sidebar.
- Fecha também com `Esc` e ao selecionar uma conversa.
- Enquanto aberta: `aria-expanded` no botão, foco movido para dentro do drawer e **scroll do body travado**.
- O estado aberto/fechado é **estado de UI**, não pertence a `Conversation`. Não contaminar o modelo de dados do v1.
- Ao redimensionar para desktop, o drawer deve fechar e a sidebar voltar ao layout fixo, sem estado preso.

### 4.4 Cuidados de teclado mobile

- Ao focar o input, o teclado virtual não pode cobrir o campo nem a última mensagem — testar em viewport real.
- `textarea` cresce até um limite e depois rola internamente.

## 5. Alterações nas telas

### 5.1 Tela inicial — node `50-3323`

Substitui integralmente o visual da inicial. Ao aplicar:

- Manter o **componente** `EmptyState`/`QuickPrompts` e sua lógica; trocar somente a marcação e o CSS.
- Reconferir textos de apresentação e dos chips contra o novo node. **Se algum texto de chip mudou no Figma, o texto enviado à IA muda junto** — o chip envia sempre o seu label literal.
- Se o número de chips mudou, ajustar a lista sem hardcodar índices.

### 5.2 Tela de conversa — node `41-5153`

Sem mudança funcional. Revalidar visualmente após a atualização de tokens da §2 e corrigir apenas o que destoar.

## 6. Correções e dívidas técnicas a resolver

Além do design, esta versão fecha pendências identificadas no MVP.

### 6.1 CORS / URL da API — **bloqueio conhecido em produção**

Em produção o front está em `https://lemossilveira.github.io` e a API em `https://projetopdi.atlab.ufc.br`. A chamada falha com `Failed to fetch` porque o backend não devolve `Access-Control-Allow-Origin` para essa origem.

**Isto é uma correção de backend, não de front.** O Claude Code **não deve** tentar contornar com proxy público de terceiros, `mode: 'no-cors'` (que torna a resposta ilegível) ou qualquer gambiarra.

O que o front **deve** fazer nesta versão:
- Garantir que `VITE_API_URL` seja a **URL absoluta** em produção e que não haja dependência do proxy do `vite.config.ts` (que só existe em dev).
- Tratar o erro de rede com mensagem em português compreensível, sem vazar detalhe técnico na UI (ver §7.5), mantendo o "Tentar novamente".
- Documentar no README os headers que o backend precisa devolver:
  ```
  Access-Control-Allow-Origin: https://lemossilveira.github.io
  Access-Control-Allow-Methods: POST, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  ```

### 6.2 Base path do GitHub Pages

O site é servido em subdiretório (`/MEJ-AI-INTERFACE/`). Confirmar que `base` no `vite.config.ts` está correto e que **todos** os assets (logos, ícones, fontes) carregam em produção — caminhos absolutos iniciados por `/` quebram nesse cenário. Usar `import` dos assets em vez de string de caminho.

### 6.3 Higiene de repositório

- `.gitignore` deve cobrir `.env`, `.env.*` (com exceção de `.env.example`) e `.claude/settings.local.json`.
- Se `.env` já estiver versionado: `git rm --cached .env`.
- Manter `.env.example` com as chaves sem valores.

## 7. Segurança da aplicação

Esta seção é **requisito**, não recomendação. A aplicação exibe conteúdo gerado por IA vindo de um servidor remoto — esse é o principal vetor de risco.

### 7.1 Renderização de markdown — XSS

A resposta da API é markdown renderizado na tela. É a superfície de ataque mais crítica do projeto.

**Obrigatório:**
- **Nunca** usar `dangerouslySetInnerHTML` com o conteúdo da resposta.
- Se usar `react-markdown`: **não** habilitar `rehype-raw` nem qualquer plugin que permita HTML embutido. Por padrão a biblioteca escapa HTML — manter assim.
- Se o renderizador for próprio: escapar `<`, `>`, `&`, `"` **antes** de qualquer transformação, e nunca construir HTML por concatenação de string.
- Sanitizar URLs de links e imagens do markdown: permitir apenas `http:` e `https:`. **Bloquear** `javascript:`, `data:` e `vbscript:`.
- Links dentro da resposta da IA: `target="_blank"` + `rel="noopener noreferrer nofollow"`.

### 7.2 Injeção de conteúdo via resposta da IA

Tratar a resposta como **dado não confiável**, jamais como instrução:
- A resposta nunca decide navegação, nunca altera estado da aplicação, nunca é usada em `eval`, `new Function`, `innerHTML` ou como URL de destino.
- Se a resposta contiver texto do tipo "clique aqui" com uma URL, ela é renderizada como link comum, sem tratamento especial.

### 7.3 Segredos e variáveis de ambiente

- Toda variável com prefixo `VITE_` é **embutida no bundle** e visível no DevTools. Nada sensível pode usar esse prefixo.
- Nenhuma chave de API, token ou credencial no código do front, em nenhuma hipótese.
- Se o backend passar a exigir autenticação, ela precisa ser intermediada por um serviço server-side — **não** guardar o token no front. Registrar isso como pendência, não implementar por conta própria.

### 7.4 Links externos

Todo `target="_blank"` deve ter `rel="noopener noreferrer"` (§3). Sem `noopener`, a aba aberta pode manipular a original via `window.opener`.

### 7.5 Tratamento de erros

- Mensagens de erro na UI são genéricas e em português ("Não foi possível obter a resposta. Tente novamente.").
- **Não** exibir na tela: URL da API, stack trace, corpo bruto da resposta de erro, cabeçalhos.
- Nada de `console.log` com dados de requisição no build de produção.

### 7.6 Entrada do usuário

- O texto do usuário é enviado como JSON via `askJuniorStream` — o `JSON.stringify` já escapa corretamente. Não montar o body por concatenação.
- Limite razoável de caracteres no input (ex.: 2000), aplicado na UI, com feedback visual.
- Impedir envios múltiplos simultâneos na mesma conversa (`isLoading`), evitando flood acidental.

### 7.7 Dependências

- Rodar `npm audit` e reportar vulnerabilidades **high/critical**. Não atualizar versões maiores sem perguntar.
- Nenhuma dependência nova sem justificativa e aprovação.

### 7.8 Cabeçalhos e transporte

- Todas as requisições em **HTTPS**. Nenhum recurso carregado por `http://` (mixed content quebra em produção).
- Registrar no README a recomendação de CSP para quando houver controle do servidor; o GitHub Pages não permite headers customizados, então documentar como pendência de infraestrutura, não tentar simular com `<meta>` sem avaliar impacto.

## 8. Testes de segurança

Executar ao final da Etapa 6 e registrar o resultado de cada item.

### 8.1 XSS via resposta da IA

Como a resposta vem do backend, simular a entrada no ponto de renderização (mock local do `onChunk`, sem alterar `api.ts`) com os payloads abaixo. **Nenhum** pode executar código ou alterar a página:

| # | Payload | Esperado |
|---|---|---|
| T1 | `<img src=x onerror="alert(1)">` | Renderizado como texto, sem alerta |
| T2 | `<script>alert(1)</script>` | Renderizado como texto, sem execução |
| T3 | `[clique](javascript:alert(1))` | Link inerte ou não renderizado como link |
| T4 | `<a href="data:text/html,<script>alert(1)</script>">x</a>` | Bloqueado |
| T5 | `<iframe src="https://exemplo.com"></iframe>` | Não renderiza iframe |
| T6 | `![x](javascript:alert(1))` | Imagem não carrega script |
| T7 | Markdown com `<style>` ou `onload=` | Escapado como texto |

### 8.2 Links externos

- T8: as duas logos abrem em nova aba com `rel="noopener noreferrer"` (verificar no DOM).
- T9: `window.opener` é `null` na aba aberta.
- T10: links dentro de respostas da IA também têm `rel` correto.

### 8.3 Vazamento de informação

- T11: buscar no bundle de produção (`dist/`) por strings sensíveis: token, senha, chave, `Authorization`. Resultado esperado: nada.
- T12: forçar erro de rede (offline / URL inválida) e confirmar que a UI não exibe URL, stack ou corpo bruto.
- T13: `dist/` não contém `console.log` com dados de requisição.

### 8.4 Robustez de entrada

- T14: colar 50 mil caracteres no input — o limite atua, a aplicação não trava.
- T15: enviar texto com aspas, chaves e barras invertidas — o JSON não quebra e a mensagem chega intacta.
- T16: cliques repetidos e rápidos no botão de enviar não disparam requisições duplicadas.
- T17: trocar de conversa durante um streaming não desvia texto para a conversa errada (regressão de F6).

### 8.5 Dependências e build

- T18: `npm audit` sem vulnerabilidades high/critical não justificadas.
- T19: `npm run build` sem erros de TypeScript.
- T20: nenhuma requisição a domínio de terceiros não previsto (conferir aba Network em produção).

## 9. Etapas de execução

> **Ao final de cada etapa: parar, rodar os testes indicados, apresentar o resultado e aguardar aprovação antes de seguir.** Não emendar etapas.

### Etapa 1 — Auditoria do estado atual
- Listar `src/`, ler `tokens.css`, componentes e `vite.config.ts`.
- Rodar `npm run build` e `npm audit`; reportar a saída.
- Confirmar `.gitignore` (§6.3) e o `base` do Vite (§6.2).
- **Entregável:** relatório do estado atual + lista do que este PRD vai tocar. **Nenhum código alterado ainda.**

### Etapa 2 — Extração do Figma
- Verificar conexão do MCP. Se falhar, **parar e avisar**.
- Extrair os quatro nodes; gerar o diff de tokens (§2.3); exportar assets novos.
- **Teste:** `tokens.css` atualizado sem variável renomeada; build passa; nenhum componente quebrado visualmente.
- **Entregável:** diff de tokens + lista de assets novos.

### Etapa 3 — Nova tela inicial (desktop, node `50-3323`)
- Aplicar marcação e CSS novos mantendo a lógica dos componentes.
- **Teste (regressão):** F4 (chips somem após a 1ª mensagem e voltam em conversa nova), F5, e a transição visual para a tela de conversa.

### Etapa 4 — Logos clicáveis
- Criar `src/constants/links.ts`; aplicar nas duas logos, em todas as telas.
- **Teste:** T8, T9. Conferir `aria-label`, foco por teclado e que o layout não mudou.

### Etapa 5 — Mobile (nodes `50-3390` e `50-3446`)
- Media queries, drawer da sidebar, overlay, `Esc`, trava de scroll.
- **Teste:** F1, F2, F3, F4 funcionando em viewport mobile; drawer fecha ao selecionar conversa; redimensionar para desktop não deixa estado preso; teclado virtual não cobre o input.

### Etapa 6 — Segurança
- Implementar §7 integralmente.
- **Teste:** bateria completa da §8 (T1–T20), com resultado item a item.
- **Entregável:** tabela de resultados dos testes.

### Etapa 7 — Revalidação e deploy
- Revalidar a tela de conversa (`41-5153`) contra os tokens novos.
- Rodar `npm run build` e `npm run preview`; conferir assets no subdiretório do GitHub Pages.
- Atualizar o README com a pendência de CORS (§6.1) e as de infraestrutura (§7.8).
- **Teste:** checklist completo da §10.

## 10. Critérios de aceitação

**Design**
- [ ] Tela inicial fiel ao node `50-3323`; conversa fiel ao `41-5153`.
- [ ] Mobile fiel aos nodes `50-3390` e `50-3446`, com o drawer funcionando.
- [ ] Tokens vindos do Figma, sem valores mágicos espalhados no CSS.
- [ ] Sem scroll horizontal em nenhum breakpoint; assets carregam em produção.

**Funcionalidades novas**
- [ ] Logo UFC abre `https://www.ufc.br/` em nova aba, com `rel="noopener noreferrer"`.
- [ ] Logo UFC Inova abre `https://ufcinova.ufc.br/pt/pagina-de-introducao/` nas mesmas condições.
- [ ] Ambas funcionam em desktop e mobile, em todas as telas.

**Regressão — o que não pode quebrar**
- [ ] F1 a F8 da §0 verificados um a um, em desktop **e** mobile.
- [ ] `src/services/api.ts` inalterado.

**Segurança**
- [ ] T1 a T20 executados, com resultado documentado.
- [ ] Sem `dangerouslySetInnerHTML` no conteúdo da IA.
- [ ] Nenhum segredo no bundle; erros sem detalhe técnico na UI.

**Build**
- [ ] `npm run build` sem erros; `npm audit` sem high/critical não justificado.
- [ ] Sem erros no console em produção (exceto o CORS conhecido, §6.1).

## 11. Fora de escopo (reafirmado)

Persistência de conversas, autenticação, modo escuro, renomear/favoritar/excluir conversas, histórico multi-turno na API, cancelamento de resposta em andamento, correção do CORS (é backend), e qualquer refatoração de arquitetura não pedida aqui.
