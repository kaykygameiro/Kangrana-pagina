const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(async () => {
  const root = path.resolve(__dirname, '..');
  const url = 'file:///' + path.join(root, 'index.html').replace(/\\/g, '/');
  const browser = await chromium.launch({
    executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true
  });
  const errors = [];
  try {
    for (const width of [320, 360, 390, 430, 768, 1280, 1600]) {
      const page = await browser.newPage({ viewport: { width, height: 850 }, deviceScaleFactor: 1 });
      page.on('pageerror', error => errors.push(width + ': ' + error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(width + ': ' + message.text()); });
      await page.goto(url);
      await page.locator('.hero-phone img').waitFor();
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        viewport: innerWidth,
        overflow: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 8).map(el => ({tag:el.tagName,className:el.className,right:Math.round(el.getBoundingClientRect().right)})),
        heroButton: document.querySelector('.hero [data-checkout]').getBoundingClientRect().bottom,
        loadedImages: [...document.images].filter(image => image.loading !== 'lazy').every(image => image.complete && image.naturalWidth > 0),
        h1Count: document.querySelectorAll('h1').length
      }));
      assert(metrics.scrollWidth <= metrics.viewport, 'horizontal overflow at ' + width + ': ' + JSON.stringify(metrics));
      assert(metrics.heroButton < 850, 'hero CTA outside first fold at ' + width);
      assert(metrics.loadedImages, 'image load failed at ' + width);
      assert.equal(metrics.h1Count, 1);
      assert(await page.locator('[data-login]:visible').count() === 0, 'login visible without APP_URL');
      assert(await page.locator('#mobile-cta').isHidden(), 'bar visible in hero');
      if ([390, 1280].includes(width)) {
        await page.screenshot({ path: path.join(root, 'screenshots', 'final-' + width + '.png'), fullPage: true });
      }
      if (width <= 800) {
        await page.locator('.mobile-menu summary').click();
        assert(await page.locator('.mobile-menu nav').isVisible());
        await page.locator('.mobile-menu nav a[href="#recursos"]').click();
        assert.equal(await page.locator('.mobile-menu').evaluate(el => el.open), false);
        await page.evaluate(() => scrollTo(0, document.querySelector('.problem-section').offsetTop + 100));
        await page.waitForTimeout(100);
        assert(await page.locator('#mobile-cta').isVisible(), 'bar hidden after hero at ' + width);
        await page.locator('#mobile-cta [data-checkout]').click();
        assert.match(await page.locator('#notice').innerText(), /checkout está sendo configurado/);
        await page.locator('#oferta [data-checkout]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        assert(await page.locator('#mobile-cta').isHidden(), 'bar covers offer CTA at ' + width);
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        assert(await page.locator('#mobile-cta').isHidden(), 'bar covers footer at ' + width);
      }
      for (const button of await page.locator('main [data-checkout], .header-actions [data-checkout]').all()) {
        if (await button.isVisible()) {
          await button.click();
          assert.match(await page.locator('#notice').innerText(), /checkout está sendo configurado/);
        }
      }
      await page.locator('.faq-list details').first().locator('summary').click();
      assert(await page.locator('.faq-list details').first().evaluate(el => el.open));
      await page.keyboard.press('Tab');
      assert(await page.evaluate(() => document.activeElement !== document.body));
      await page.close();
      console.log(width + 'px: layout, menu, bar, CTAs, FAQ and keyboard OK');
    }

    const checkoutPage = await browser.newPage();
    await checkoutPage.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.KANGRANA_CONFIG={CHECKOUT_URL:'https://checkout.example.test/pay?fixed=1',APP_URL:'https://app.example.test/login',BILLING_DESCRIPTION:'Pagamento único'};" }));
    await checkoutPage.route('https://checkout.example.test/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Checkout de teste</h1>' }));
    await checkoutPage.goto(url + '?utm_source=instagram&utm_medium=influencer&utm_campaign=lancamento&utm_content=nome_do_criador&ref=codigo&email=private%40example.com');
    assert.equal(await checkoutPage.locator('[data-login]:visible').count(), 2);
    assert.equal(await checkoutPage.locator('.header-actions [data-login]').getAttribute('href'), 'https://app.example.test/login');
    await checkoutPage.locator('.hero [data-checkout]').click();
    await checkoutPage.waitForURL('https://checkout.example.test/**');
    const target = new URL(checkoutPage.url());
    for (const [key, value] of Object.entries({ fixed: '1', utm_source: 'instagram', utm_medium: 'influencer', utm_campaign: 'lancamento', utm_content: 'nome_do_criador', ref: 'codigo' })) assert.equal(target.searchParams.get(key), value);
    assert(!target.searchParams.has('email'));
    await checkoutPage.close();
    console.log('HTTPS checkout, APP_URL and attribution allowlist OK');

    const invalid = await browser.newPage();
    await invalid.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.KANGRANA_CONFIG={CHECKOUT_URL:'http://checkout.example.test/pay',APP_URL:'javascript:alert(1)',BILLING_DESCRIPTION:'Pagamento único'};" }));
    await invalid.goto(url + '?utm_source=' + 'x'.repeat(101) + '&ref=bad%20value&token=secret');
    await invalid.locator('.hero [data-checkout]').click();
    assert.match(await invalid.locator('#notice').innerText(), /checkout está sendo configurado/);
    assert.equal(await invalid.locator('[data-login]:visible').count(), 0);
    await invalid.close();

    const filtered = await browser.newPage();
    await filtered.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: "window.KANGRANA_CONFIG={CHECKOUT_URL:'https://checkout.example.test/pay',APP_URL:'',BILLING_DESCRIPTION:'Pagamento único'};" }));
    await filtered.route('https://checkout.example.test/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Checkout de teste</h1>' }));
    await filtered.goto(url + '?utm_source=' + 'x'.repeat(101) + '&ref=bad%20value&token=secret');
    await filtered.locator('.hero [data-checkout]').click();
    await filtered.waitForURL('https://checkout.example.test/**');
    assert.equal(new URL(filtered.url()).search, '');
    await filtered.close();
    console.log('Invalid URL and attribution values blocked');

    const reduced = await browser.newPage({ reducedMotion: 'reduce' });
    await reduced.goto(url);
    assert.equal(await reduced.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
    await reduced.close();

    const printPage = await browser.newPage();
    await printPage.goto(url);
    await printPage.emulateMedia({ media: 'print' });
    assert.equal(await printPage.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(16, 24, 39)');
    await printPage.close();

    for (const href of ['privacidade.html', 'termos.html', 'exclusao.html']) {
      assert(fs.existsSync(path.join(root, href)));
      const page = await browser.newPage();
      await page.goto('file:///' + path.join(root, href).replace(/\\/g, '/'));
      assert(await page.locator('h1').isVisible());
      assert(!/provisório|pendente|placeholder/i.test(await page.locator('body').innerText()));
      await page.close();
    }
    for (const asset of ['kangrana-dashboard-desktop.png', 'kangrana-dashboard-mobile.png', 'kangrana-new-transaction-mobile.png', 'kangrana-reports-desktop.png', 'kangrana-analysis-mobile.png', 'kangrana-analysis-desktop.png', 'kangrana-social.jpg', 'kangrana-icon.jpg']) assert(fs.existsSync(path.join(root, 'assets', asset)));
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    assert(!/href="#"/.test(html));
    assert(!/screenshots\//.test(html));
    assert(!/FinanceFlow|127\.0\.0\.1|em preparação|será adicionado|após acesso ao código|representação ilustrativa|precisa ser revisada|\bpendente\b|Modo Demonstração Ativo|IA avançada/i.test(html));
    assert(!/\bTODO\b/.test(html));
    assert.deepEqual(errors, []);
    console.log('Legal pages, media, reduced motion and console OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
