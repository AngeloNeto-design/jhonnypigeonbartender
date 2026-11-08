// pricingConfig.js
export const PRICING_RULES = {
  // Proporção de atendimento: 1 bartender a cada 40 convidados
  GUESTS_PER_BARTENDER: 40,

  // Valor da hora do bartender (informado pelo Jhonny): R$ 250 por hora, por bartender
  HOURLY_RATE: 250.00,

  // Serviço completo: bebidas e insumos por convidado (a equipe é cobrada por hora, à parte)
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

  // Equipe + insumos (bebidas por conta do anfitrião): insumos por convidado
  LABOR_ONLY_PER_GUEST: 30.00,

  // Estrutura de bar móvel + logística de acesso à Península de Maraú (barco/4x4)
  LOGISTICS_FEE: 800.00,

  // Duração sugerida no simulador
  STANDARD_HOURS: 4,

  // Faixa exibida: do valor calculado até 25% acima (variação de consumo e logística)
  MIN_MARGIN: 1.00,
  MAX_MARGIN: 1.25
};
