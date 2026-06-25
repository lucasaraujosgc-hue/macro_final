import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import puppeteer, { Browser, Page } from 'puppeteer';
import multer from 'multer';
import forge from 'node-forge';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());
const PORT = 3000;

const upload = multer({ storage: multer.memoryStorage() });

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
      throw new Error("Falha ao iniciar navegador: " + err.message);
    }
  }
  if (!page && browser) {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    // User agent padrão para simular um navegador real e evitar bloqueios
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  }
  return page;
}

app.post('/api/browser/goto', async (req, res) => {
  try {
    const { url } = req.body;
    const p = await getPage();
    if (!p) throw new Error("Página não encontrada");
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
    if (!p) throw new Error("Página não encontrada");
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
    if (!p) throw new Error("Página não encontrada");
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
    if (!p) throw new Error("Página não encontrada");
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

app.post("/api/certificates/upload", upload.single("pfx"), async (req, res) => {
  try {
    const file = req.file;
    const password = req.body.password;

    if (!file) return res.status(400).json({ error: "No file uploaded" });
    if (!password) return res.status(400).json({ error: "Password is required" });

    // Parse PFX
    const p12Asn1 = forge.asn1.fromDer(file.buffer.toString("binary"));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    let validFrom = new Date();
    let validTo = new Date();
    let titular = "Unknown";
    let serial = "Unknown";
    let issuer = "Unknown";
    let cpfCnpj = "N/A";

    const bags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = bags[forge.pki.oids.certBag]?.[0];

    if (certBag && certBag.cert) {
      const cert = certBag.cert;
      validFrom = cert.validity.notBefore;
      validTo = cert.validity.notAfter;
      serial = cert.serialNumber;

      const subject = cert.subject.attributes.reduce((acc: Record<string, string>, attr: any) => {
        acc[attr.shortName || attr.name] = attr.value;
        return acc;
      }, {});

      const issuerAttr = cert.issuer.attributes.reduce(
        (acc: Record<string, string>, attr: any) => {
          acc[attr.shortName || attr.name] = attr.value;
          return acc;
        },
        {}
      );

      titular = subject["CN"] || "Unknown";
      issuer = issuerAttr["CN"] || issuerAttr["O"] || "Unknown";

      // Extract CPF/CNPJ from BR certificate CN (format: "NAME:CPF_OR_CNPJ")
      if (titular.includes(":")) {
        const parts = titular.split(":");
        const raw = parts[parts.length - 1].replace(/\D/g, "");
        cpfCnpj = raw;
      }
    }

    const type = cpfCnpj.replace(/\D/g, "").length > 11 ? "PJ" : "PF";

    const certificate = {
      id: uuidv4(),
      name: titular, // Use titular as name for the existing UI
      filename: file.originalname,
      passwordEncrypted: Buffer.from(password).toString("base64"),
      titular,
      cpfCnpj,
      serial,
      issuer,
      validFrom: validFrom.toISOString(),
      validTo: validTo.toISOString(),
      type: type as "PF" | "PJ",
      valid: true,
      uploadedAt: new Date().toISOString()
    };

    // Return the parsed certificate to the frontend so it can save it in state
    res.json({ success: true, message: 'Certificado e senha válidos!', certificate });
  } catch (error: any) {
    console.error("[Certificate Upload Error]", error);
    res.status(400).json({
      error: "Certificado inválido ou senha incorreta. " + error.message,
    });
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
