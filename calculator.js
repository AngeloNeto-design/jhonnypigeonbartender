// calculator.js
import { PRICING_RULES } from './pricingConfig.js';

const brl = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

export function calculateEventEstimate(data) {
  const { guests, durationHours, packageType, isFullService, needsMobileBar } = data;

  // 0. Validação de entrada
  const g = Math.floor(Number(guests) || 0);
  const hours = Math.max(1, Number(durationHours) || PRICING_RULES.STANDARD_HOURS);
  if (g <= 0) {
    return { error: 'Informe um número de convidados válido.' };
  }

  const bartendersNeeded = Math.ceil(g / PRICING_RULES.GUESTS_PER_BARTENDER);

  // 1. Equipe: R$ 250 por hora, por bartender
  const laborCost = bartendersNeeded * hours * PRICING_RULES.HOURLY_RATE;

  // 2. Bebidas e insumos, conforme o modelo de contratação
  const perGuest = isFullService
    ? PRICING_RULES.PACKAGES[packageType] || PRICING_RULES.PACKAGES.PREMIUM
    : PRICING_RULES.LABOR_ONLY_PER_GUEST;
  const suppliesCost = g * perGuest;

  // 3. Estrutura de bar móvel + logística da península
  const structureCost = needsMobileBar ? PRICING_RULES.LOGISTICS_FEE : 0;

  const baseTotal = laborCost + suppliesCost + structureCost;

  // 4. Faixa exibida
  const minEstimate = Math.round(baseTotal * PRICING_RULES.MIN_MARGIN);
  const maxEstimate = Math.round(baseTotal * PRICING_RULES.MAX_MARGIN);

  return {
    bartendersNeeded,
    hours,
    laborCost,
    suppliesCost,
    structureCost,
    minEstimate,
    maxEstimate,
    baseTotal
  };
}

export function generateWhatsAppLink(phoneNumber, formData, calculationResult) {
  const { name, eventDate, eventType, guests, durationHours, packageType } = formData;
  const { minEstimate, maxEstimate, bartendersNeeded, hours, laborCost } = calculationResult;

  // Rótulo amigável, não a chave crua (CLASSIC/PREMIUM/HIGH_END)
  const packageLabel = PRICING_RULES.PACKAGE_LABELS[packageType] || packageType;
  const equipe = `${bartendersNeeded} ${bartendersNeeded > 1 ? 'bartenders' : 'bartender'} × ${hours}h × ${brl(PRICING_RULES.HOURLY_RATE)}/h = ${brl(laborCost)}`;

  const text = `Olá! Fiz uma simulação no site para o meu evento:

👤 *Nome:* ${name}
📅 *Data pretendida:* ${eventDate}
🎉 *Tipo de evento:* ${eventType}
👥 *Convidados:* ${guests} pessoas (${durationHours}h de duração)
🍸 *Pacote:* ${packageLabel}
⏱️ *Equipe:* ${equipe}

💰 *Estimativa do site:* ${brl(minEstimate)} a ${brl(maxEstimate)}

Gostaria de verificar a disponibilidade para esta data e receber a proposta detalhada.`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}
