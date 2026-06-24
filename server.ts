import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import puppeteer, { Browser, Page } from 'puppeteer';

const app = express();
app.use(express.json());
const PORT = 3000;

let browser: Browser | null = null;
let page: Page | null = null;

// Helper para iniciar o Puppeteer com os argumentos corretos para Docker e ambientes headless
async function getPage() {
  if (!browser) {
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox', 
          '--disable-dev-shm-usage',
          '--window-size=1280,800',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu'
        ]
      });
    } catch (err: any) {
      console.error("Erro ao iniciar Puppeteer:", err.message);
      throw new Error("Falha ao iniciar o navegador interno. O ambiente atual pode não ter as dependências do sistema. Execute via Docker.");
    }
  }
  if (!page) {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    // User agent padrão para simular um navegador real e evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }
  return page;
}

// Rotas da API de Automação
app.post('/api/browser/goto', async (req, res) => {
  try {
    const { url } = req.body;
    const p = await getPage();
    await p.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
    const screenshot = await p.screenshot({ encoding: 'base64' });
    const currentUrl = p.url();
    const title = await p.title();
    res.json({ screenshot: `data:image/png;base64,${screenshot}`, url: currentUrl, title });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/browser/click', async (req, res) => {
  try {
    const { x, y } = req.body;
    const p = await getPage();
    await p.mouse.click(x, y);
    // Aguarda um momento para a página reagir ao clique (navegação, modais, etc)
    await new Promise(r => setTimeout(r, 1500));
    const screenshot = await p.screenshot({ encoding: 'base64' });
    const currentUrl = p.url();
    const title = await p.title();
    res.json({ screenshot: `data:image/png;base64,${screenshot}`, url: currentUrl, title });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/browser/type', async (req, res) => {
  try {
    const { text, key } = req.body;
    const p = await getPage();
    
    if (text) {
      await p.keyboard.type(text);
    }
    if (key) {
      await p.keyboard.press(key);
    }
    
    // Pequena pausa para a UI atualizar após digitação
    await new Promise(r => setTimeout(r, 500));
    const screenshot = await p.screenshot({ encoding: 'base64' });
    res.json({ screenshot: `data:image/png;base64,${screenshot}`, url: p.url() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/browser/scroll', async (req, res) => {
  try {
    const { deltaY } = req.body;
    const p = await getPage();
    await p.evaluate((y) => window.scrollBy(0, y), deltaY);
    await new Promise(r => setTimeout(r, 300));
    const screenshot = await p.screenshot({ encoding: 'base64' });
    res.json({ screenshot: `data:image/png;base64,${screenshot}`, url: p.url() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/browser/close', async (req, res) => {
  if (browser) {
    await browser.close();
    browser = null;
    page = null;
  }
  res.json({ success: true });
});

app.post('/api/certificates/verify', async (req, res) => {
  try {
    const { base64Data, password } = req.body;
    
    // Quick mock validation for P12 files since we can't easily parse complex p12 without node-forge
    // To make it simple for this prototype, if it has data and a password, we will just return success.
    // If you want actual node-forge parsing:
    const forge = await import('node-forge');
    try {
      const p12Der = forge.util.decode64(base64Data);
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      forge.pkcs12.pkcs12FromAsn1(p12Asn1, password || '');
      res.json({ success: true, message: 'Certificado e senha válidos!' });
    } catch (e: any) {
      res.status(400).json({ error: 'Senha incorreta ou certificado inválido.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Inicializa o servidor web (Express + Vite)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
  });
}

startServer();
