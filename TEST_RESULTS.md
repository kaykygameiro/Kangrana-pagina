# Verificação local — 16/09/2026

Ambiente: Windows, Microsoft Edge em modo headless, Playwright para testes funcionais e servidor HTTP local para Lighthouse. Nenhum deploy foi feito.

## Resultados

- `node --check main.js` e `node --check config.js`: passaram.
- `tests/verify.cjs`: passou em 320, 360, 390, 430, 768, 1280 e 1600 px. Sem rolagem horizontal; CTA principal na primeira dobra; menu móvel, barra fixa, FAQ, links, imagens, foco de teclado, redução de movimento e console verificados.
- Todos os CTAs disponíveis com `CHECKOUT_URL` vazia exibiram a mensagem correta. URL HTTPS de teste redirecionou com UTM e `ref`; URL HTTP, parâmetros inválidos e dados fora da lista permitida foram rejeitados.
- O link “Entrar” não existe sem `APP_URL` válida e aparece com URL HTTPS de teste.
- As páginas legais abriram sem texto provisório. A demonstração usa apenas `assets`; o recorte desktop foi inspecionado visualmente sem nome ou e-mail no conteúdo exibido.
- Capturas finais: `screenshots/final-320.png`, `screenshots/final-390.png`, `screenshots/final-1280.png` e `screenshots/final-offer-390.png`.
- Lighthouse móvel local: desempenho **100**, acessibilidade **100**, boas práticas **100**, SEO **66**. LCP **1,4 s** e CLS **0**. O único item reprovado em SEO é o bloqueio intencional de indexação enquanto não há domínio público. Relatório: `screenshots/lighthouse-final.json`.

## Limites

- O Lighthouse mede um servidor local, sem CDN, cache de produção ou rede móvel real. A CLI retornou `EPERM` ao remover sua pasta temporária no Windows depois de salvar o relatório íntegro.
- O checkout e a entrega de acesso pertencem a serviços externos e foram testados apenas com URLs simuladas no navegador.
- O domínio real é necessário para canonical, URLs sociais absolutas e liberação de indexação.
