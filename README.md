# MEJ IA — Interface

Interface web da MEJ IA, assistente treinado com informações da Universidade
Federal do Ceará para responder dúvidas sobre o Movimento Empresa Júnior.

React + TypeScript + Vite, CSS puro com tokens extraídos do Figma.

## Rodando localmente

```bash
npm install
cp .env.example .env   # e preencha VITE_API_URL
npm run dev            # http://localhost:5173/
```

| Script | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, servido na raiz (`/`) |
| `npm run build` | Type-check (`tsc -b`) + build de produção em `dist/` |
| `npm run preview` | Serve o `dist/` já no subdiretório `/MEJ-AI-INTERFACE/` |
| `npm run lint` | oxlint |

### Variáveis de ambiente

Só existe uma, `VITE_API_URL`:

- **Desenvolvimento:** `/api` — usa o proxy definido no `vite.config.ts`, que
  encaminha para o backend e evita CORS na máquina local.
- **Produção:** a URL absoluta, injetada pelo GitHub Actions no momento do build.

> ⚠️ Toda variável com prefixo `VITE_` é **embutida no bundle** e fica visível no
> DevTools de qualquer visitante. Nunca coloque chave, token ou credencial ali.
> Se o backend passar a exigir autenticação, ela precisa ser intermediada por um
> serviço server-side — o token não pode viver no front.

## Deploy

Automático via GitHub Actions (`.github/workflows/`) a cada push na `main`.
O site é servido em subdiretório, então `base` no `vite.config.ts` é
`/MEJ-AI-INTERFACE/` no build **e no preview**. Por isso os assets são sempre
referenciados por `import`, nunca por string de caminho absoluto montada em
runtime — só assim o Vite reescreve os caminhos para o subdiretório.

---

## Pendências de infraestrutura

As duas seções abaixo **não são corrigíveis no front-end**. Estão registradas
aqui para não se perderem.

### 1. CORS — bloqueio ativo em produção

Em produção o front roda em `https://lemossilveira.github.io` e a API em
`https://projetopdi.atlab.ufc.br`. As requisições falham com `Failed to fetch`
porque o backend não devolve o cabeçalho de origem permitida.

O front já está correto: usa a URL absoluta em produção e não depende do proxy
do Vite (que só existe em dev). O erro é tratado e mostrado ao usuário em
português, com botão de "Tentar novamente", sem vazar detalhe técnico na tela.

**O backend precisa devolver:**

```
Access-Control-Allow-Origin: https://lemossilveira.github.io
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Precisa responder também ao *preflight* `OPTIONS` de `/junior_stream`.

Não contornar com proxy público de terceiros nem com `mode: 'no-cors'` — o
segundo torna a resposta ilegível e quebraria o streaming.

### 2. Content-Security-Policy

O GitHub Pages **não permite cabeçalhos HTTP customizados**, então não há como
aplicar CSP hoje. Quando houver controle do servidor (ou um CDN à frente),
recomenda-se:

```
Content-Security-Policy:
  default-src 'self';
  connect-src 'self' https://projetopdi.atlab.ufc.br;
  img-src 'self' data:;
  style-src 'self' 'unsafe-inline';
  font-src 'self';
  frame-ancestors 'none';
  base-uri 'self'
```

Simular via `<meta http-equiv>` não foi feito de propósito: a versão em `<meta>`
ignora várias diretivas (`frame-ancestors` entre elas) e dá falsa sensação de
proteção.

## Segurança

A resposta da IA vem de um servidor remoto e é tratada como **dado não
confiável**. O que está implementado:

- Markdown renderizado por `react-markdown` **sem** `rehype-raw`; HTML embutido
  na resposta é escapado como texto. Nenhum uso de `dangerouslySetInnerHTML`.
- URLs de links e imagens passam por allowlist de protocolo (`http:`, `https:`,
  `mailto:`). `javascript:`, `data:`, `vbscript:`, `file:` e `blob:` são
  descartados e o link vira texto inerte.
- Todo link externo leva `rel="noopener noreferrer"`; os vindos da resposta da
  IA levam também `nofollow`.
- Mensagens de erro na UI são genéricas: URL da API, corpo bruto da resposta e
  stack traces nunca chegam à tela.
- Entrada limitada a 2000 caracteres, com contador; envios simultâneos na mesma
  conversa são bloqueados.

`src/services/api.ts` é a única porta de entrada para a API e não deve ser
alterado sem necessidade.
