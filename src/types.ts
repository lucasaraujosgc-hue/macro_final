export interface Company {
  id: string;
  cnpj: string;
  razaoSocial: string;
  inscricaoEstadual: string;
}

export interface Certificate {
  id: string;
  name: string;
  uploadedAt: string;
  valid: boolean;
}

export interface MacroStep {
  id: string;
  action: 'click' | 'type' | 'navigate' | 'scroll';
  target?: { x: number, y: number };
  text?: string;
  url?: string;
  variable?: string;
}

export interface Macro {
  id: string;
  name: string;
  steps: MacroStep[];
}
