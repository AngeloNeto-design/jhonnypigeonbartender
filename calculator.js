// calculator.js
import { PRICING_RULES } from './pricingConfig.js';

export function calculateEventEstimate(data) {
  const { guests, durationHours, packageType, isFullService, needsMobileBar } = data;

  // 0. Validação de entrada
  const g = Math.floor(Number(guests) || 0);
  const hours = Number(durationHours) || PRICING_RULES.STANDARD_HOURS;
  if (g <= 0) {
    return { error: 'Informe um número de convidados válido.' };
  }

  const bartendersNeeded = Math.ceil(g / PRICING_RULES.GUESTS_PER_BARTENDER);

  // 1. Base conforme o modelo de contratação
  let baseTotal;
  if (isFullService) {
    // O preço por convidado JÁ inclui equipe + bar móvel + insumos + bebidas.
    // NÃO somar diária nem logística de novo (evita a dupla contagem).
    const pkg = PRICING_RULES.PACKAGES[packageType] || PRICING_RULES.PACKAGES.PREMIUM;
    baseTotal = g * pkg;
    if (needsMobileBar) baseTotal += PRICING_RULES.LOGISTICS_FEE; // logística à parte
  } else {
    // Mão de obra + insumos: soma equipe + insumos/pessoa + estrutura.
    const laborCost = bartendersNeeded * PRICING_RULES.BARTENDER_DAILY_RATE;
    const suppliesCost = g * PRICING_RULES.LABOR_ONLY_PER_GUEST;
    const structureCost = needsMobileBar ? PRICING_RULES.LOGISTICS_FEE : 0;
    baseTotal = laborCost + suppliesCost + structureCost;
  }

  // 2. Duração acima do padrão (o cálculo original ignorava durationHours)
  if (hours > PRICING_RULES.STANDARD_HOURS) {
    const extraHours = hours - PRICING_RULES.STANDARD_HOURS;
    const extraLabor =
      bartendersNeeded *
      PRICING_RULES.BARTENDER_DAILY_RATE *
      PRICING_RULES.EXTRA_HOUR_RATE *
      extraHours;
    baseTotal += extraLabor;
  }

  // 3. Piso mínimo de evento (qualifica o cliente por cima)
  baseTotal = Math.max(baseTotal, PRICING_RULES.MIN_EVENT_VALUE);

  // 4. Faixa exibida (premium, nunca abaixo do custo base)
  const minEstimate = Math.round(baseTotal * PRICING_RULES.MIN_MARGIN);
  const maxEstimate = Math.round(baseTotal * PRICING_RULES.MAX_MARGIN);

  return { bartendersNeeded, minEstimate, maxEstimate, baseTotal };
}

export function generateWhatsAppLink(phoneNumber, formData, calculationResult) {
  const { name, eventDate, eventType, guests, durationHours, packageType } = formData;
  const { minEstimate, maxEstimate } = calculationResult;

  // Rótulo amigável, não a chave crua (CLASSIC/PREMIUM/HIGH_END)
  const packageLabel = PRICING_RULES.PACKAGE_LABELS[packageType] || packageType;

  const text = `Olá! Fiz uma simulação no site para o meu evento:

👤 *Nome:* ${name}
📅 *Data pretendida:* ${eventDate}
🎉 *Tipo de evento:* ${eventType}
👥 *Convidados:* ${guests} pessoas (${durationHours}h de duração)
🍸 *Pacote:* ${packageLabel}

💰 *Estimativa do site:* R$ ${minEstimate.toLocaleString('pt-BR')} a R$ ${maxEstimate.toLocaleString('pt-BR')}

Gostaria de verificar a disponibilidade para esta data e receber a proposta detalhada.`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}
