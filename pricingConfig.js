// pricingConfig.js
export const PRICING_RULES = {
  // Proporção de atendimento
  GUESTS_PER_BARTENDER: 40,

  // Diária do bartender-chefe (alto padrão)
  BARTENDER_DAILY_RATE: 500.00,

  // Serviço completo — preço por pessoa (JÁ inclui equipe, bar móvel, insumos e bebidas)
  PACKAGES: {
    CLASSIC: 70.00,    // Clássicos Autorais
    PREMIUM: 110.00,   // Gin Bar & Internacionais
    HIGH_END: 160.00   // Coquetelaria de Autor
  },

  // Rótulos amigáveis (mensagem de WhatsApp — não expor as chaves cruas)
  PACKAGE_LABELS: {
    CLASSIC: 'Clássicos Autorais',
    PREMIUM: 'Gin Bar & Internacionais',
    HIGH_END: 'Coquetelaria de Autor'
  },

  // Mão de obra + insumos (sem bebidas) — por pessoa
  LABOR_ONLY_PER_GUEST: 30.00,

  // Logística de acesso à Península de Maraú (barco/4x4) — custo real
  LOGISTICS_FEE: 800.00,

  // Duração padrão inclusa; acima disso cobra hora extra
  STANDARD_HOURS: 4,
  EXTRA_HOUR_RATE: 0.20, // 20% da diária por hora extra, por bartender

  // Piso mínimo de evento — ESTE é o filtro que qualifica o cliente
  MIN_EVENT_VALUE: 3500.00,

  // Faixa exibida — puxada para cima, mas honesta (nunca abaixo do custo)
  MIN_MARGIN: 1.10,
  MAX_MARGIN: 1.35
};
