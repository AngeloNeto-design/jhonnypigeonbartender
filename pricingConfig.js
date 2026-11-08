// pricingConfig.js
// Só entra preço no que é fixo: a hora do bartender e a estrutura de bar móvel.
// Bebidas e insumos (gelo, limão, frutas da estação etc.) são sazonais e dependem
// de logística: ou ficam por conta do contratante, ou o Jhonny faz a cotação a
// partir da lista que o contratante marcar. Nunca têm preço fixo no site.
export const PRICING_RULES = {
  // Proporção de atendimento: 1 bartender a cada 40 convidados
  GUESTS_PER_BARTENDER: 40,

  // Valor da hora do bartender (informado pelo Jhonny): R$ 250 por hora, por bartender
  HOURLY_RATE: 250.00,

  // Estrutura de bar móvel + logística de acesso à Península de Maraú (barco/4x4)
  LOGISTICS_FEE: 800.00,

  // Duração sugerida no simulador
  STANDARD_HOURS: 4,

  // Estilos de carta (sem preço: definem o tipo de drink)
  PACKAGE_LABELS: {
    CLASSIC: 'Clássicos Autorais',
    PREMIUM: 'Gin Bar & Internacionais',
    HIGH_END: 'Coquetelaria de Autor'
  },

  // O que são os insumos (só descrição, sem preço)
  SUPPLIES_DESCRIPTION: 'gelo, limão, frutas da estação etc.'
};
