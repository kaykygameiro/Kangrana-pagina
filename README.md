# Página comercial Kangrana

Projeto estático e independente do aplicativo. Para testar localmente, abra `index.html` em um servidor estático, por exemplo `python -m http.server 4173`. Nenhum serviço externo, banco ou autenticação é necessário para renderizar a página.

## Configuração de publicação

Em `config.js`, preencha `CHECKOUT_URL` com a URL HTTPS final da Kiwify ou Hotmart. Enquanto estiver vazio ou inválido, os botões exibem uma mensagem curta e não redirecionam. `APP_URL` é opcional: o link “Entrar” só é criado quando uma URL HTTPS válida for informada. `BILLING_DESCRIPTION` registra a decisão comercial “Pagamento único”; a oferta já está escrita com esse modelo.

O domínio público ainda não foi informado. Por isso, `index.html` e as páginas legais usam `noindex,nofollow`, e `robots.txt` bloqueia indexação. No momento de publicar em domínio definitivo, revise o conteúdo, remova esses bloqueios e configure a canonical e os endereços absolutos de `og:image` e `twitter:image` no `<head>` de `index.html`. Não use um domínio fictício.

O checkout e o aplicativo estão fora deste projeto. A instrução de acesso por e-mail e o canal para solicitações de exclusão descritos nas páginas públicas devem estar operacionais no fluxo externo de compra. Ver `CHECKOUT_ACCESS_PLAN.md`.

## Atribuição

Todos os CTAs chamam a mesma função em `main.js`. Ela aceita apenas `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `ref`, com até 100 caracteres compostos por letras, números, `_`, `.`, `@` ou `-`. Valores inválidos são descartados e os demais são codificados pela API `URLSearchParams` no endereço do checkout. Outros parâmetros, como e-mail ou token, não são encaminhados. Parâmetros de URL nunca autorizam acesso ao aplicativo.

Os eventos internos `page_view`, `demo_view`, `offer_view`, `checkout_click` e `login_click` são emitidos como `kangrana:event` sem persistência ou ferramentas analíticas de terceiros.

## Imagens

O hero usa `kangrana-dashboard-mobile.png`. A demonstração usa `kangrana-dashboard-desktop.png`, `kangrana-dashboard-mobile.png` e `kangrana-analysis-mobile.png`. Os recursos usam `kangrana-new-transaction-mobile.png` e `kangrana-reports-desktop.png`; a seção de análise usa também `kangrana-analysis-desktop.png`. As imagens originais continuam em `assets`; nada vem de `screenshots` para a interface.

## Verificação

`tests/verify.cjs` cobre layout, CTAs, menu, barra móvel, FAQ, links, imagens, validação HTTPS, atribuição, teclado, redução de movimento e console. Exige Playwright e um navegador Chromium; o caminho do navegador pode ser definido por `BROWSER_PATH`. Resultados e capturas estão em `TEST_RESULTS.md` e `screenshots`.
