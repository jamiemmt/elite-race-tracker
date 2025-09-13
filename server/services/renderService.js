const puppeteer = require('puppeteer');

/**
 * Minimal headless rendering service for JS-heavy official sites.
 * Intended only for trusted domains (e.g., worldathletics.org, diamondleague.com).
 */
class RenderService {
  constructor() {
    this.browser = null;
  }

  async getBrowser() {
    if (this.browser) return this.browser;
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });
    return this.browser;
  }

  async close() {
    if (this.browser) {
      try { await this.browser.close(); } catch (_) {}
      this.browser = null;
    }
  }

  /**
   * Render the page and return HTML content.
   * @param {string} url
   * @param {{waitSelector?: string, timeoutMs?: number}} options
   * @returns {Promise<string>}
   */
  async renderToHtml(url, options = {}) {
    const { waitSelector, timeoutMs = 30000 } = options;
    const browser = await this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
      if (waitSelector) {
        await page.waitForSelector(waitSelector, { timeout: Math.max(5000, timeoutMs / 2) });
      }
      const html = await page.content();
      return html || '';
    } finally {
      try { await page.close(); } catch (_) {}
      try { await context.close(); } catch (_) {}
    }
  }

  /**
   * Extract Next.js __NEXT_DATA__ JSON from a dynamic page.
   * @param {string} url
   * @param {{timeoutMs?: number}} options
   * @returns {Promise<any|null>}
   */
  async renderNextData(url, options = {}) {
    const { timeoutMs = 30000 } = options;
    const browser = await this.getBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
      // Try direct window var
      const data = await page.evaluate(() => {
        try { return window.__NEXT_DATA__ || null; } catch (_) { return null; }
      });
      if (data) return data;
      // Fallback: parse script tag content
      const scriptContent = await page.evaluate(() => {
        try {
          const el = document.querySelector('script#__NEXT_DATA__');
          return el ? el.textContent : null;
        } catch (_) { return null; }
      });
      if (scriptContent) {
        try { return JSON.parse(scriptContent); } catch (_) {}
      }
      return null;
    } finally {
      try { await page.close(); } catch (_) {}
      try { await context.close(); } catch (_) {}
    }
  }
}

module.exports = new RenderService();
