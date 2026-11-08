// calculator.js
import { PRICING_RULES } from './pricingConfig.js';

export const brl = (v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`;

const QUEM = {
  host: 'Por sua conta',
  jhonny: 'Cotação do Jhonny'
};

// Valor fechado = equipe (R$ 250/h por bartender) + bar móvel, se escolhido.
// Bebidas e insumos nunca têm preço aqui: por conta do contratante ou cotados à parte.
export function calculateEventEstimate(data) {
  const { guests, durationHours, drinksBy, suppliesBy, needsMobileBar } = data;

  // 0. Validação de entrada
  const g = Math.floor(Number(guests) || 0);
  const hours = Math.max(1, Math.floor(Number(durationHours) || PRICING_RULES.STANDARD_HOURS));
  if (g <= 0) {
    return { error: 'Informe um número de convidados válido.' };
  }

  const bartendersNeeded = Math.ceil(g / PRICING_RULES.GUESTS_PER_BARTENDER);
  const plural = bartendersNeeded > 1 ? 'bartenders' : 'bartender';
  const drinksByJhonny = drinksBy === 'jhonny';
  const suppliesByJhonny = suppliesBy === 'jhonny';
  const items = [];

  // 1. Equipe: R$ 250 por hora, por bartender (1 a cada 40 convidados)
  const laborCost = bartendersNeeded * hours * PRICING_RULES.HOURLY_RATE;
  items.push({
    label: 'Equipe',
    detail: `${bartendersNeeded} ${plural} × ${hours}h × ${brl(PRICING_RULES.HOURLY_RATE)}/h`,
    value: laborCost
  });

  // 2. Estrutura de bar móvel + logística da península
  const structureCost = needsMobileBar ? PRICING_RULES.LOGISTICS_FEE : 0;
  if (needsMobileBar) {
    items.push({ label: 'Bar móvel e logística', detail: 'Estrutura e acesso na península', value: structureCost });
  }

  // 3. Bebidas e insumos: sem preço no site
  items.push({
    label: 'Bebidas',
    detail: drinksByJhonny ? 'O Jhonny cota a partir da lista que você marcou' : 'Você compra as bebidas do evento',
    value: null,
    note: drinksByJhonny ? QUEM.jhonny : QUEM.host
  });
  items.push({
    label: 'Insumos',
    detail: `${PRICING_RULES.SUPPLIES_DESCRIPTION[0].toUpperCase()}${PRICING_RULES.SUPPLIES_DESCRIPTION.slice(1)}`,
    value: null,
    note: suppliesByJhonny ? QUEM.jhonny : QUEM.host
  });

  return {
    bartendersNeeded,
    hours,
    guests: g,
    laborCost,
    structureCost,
    drinksByJhonny,
    suppliesByJhonny,
    quoteNeeded: drinksByJhonny || suppliesByJhonny,
    items,
    total: laborCost + structureCost
  };
}

export function generateWhatsAppLink(phoneNumber, formData, calculationResult) {
  const { name, eventDate, eventType, guests, durationHours, packageType, drinksList, drinksOther } = formData;
  const { items, total, drinksByJhonny, suppliesByJhonny, quoteNeeded } = calculationResult;

  const carta = PRICING_RULES.PACKAGE_LABELS[packageType] || packageType;
  const fechados = items
    .filter((it) => it.value !== null)
    .map((it) => `• ${it.label}: ${it.detail} = ${brl(it.value)}`)
    .join('\n');

  const lista = [...drinksList, ...(drinksOther ? [drinksOther] : [])];
  const bebidasLinha = drinksByJhonny
    ? 'quero que o Jhonny ofereça (peço a cotação)'
    : 'por minha conta';
  const insumosLinha = suppliesByJhonny
    ? `quero que o Jhonny ofereça (${PRICING_RULES.SUPPLIES_DESCRIPTION}; peço a cotação)`
    : `por minha conta (${PRICING_RULES.SUPPLIES_DESCRIPTION})`;

  const text = `Olá! Fiz uma simulação no site para o meu evento:

👤 *Nome:* ${name}
📅 *Data pretendida:* ${eventDate}
🎉 *Tipo de evento:* ${eventType}
👥 *Convidados:* ${guests} pessoas (${durationHours}h de duração)
🍸 *Carta:* ${carta}

🧾 *Valor fechado da equipe${calculationResult.structureCost ? ' e do bar móvel' : ''}:*
${fechados}
💰 *Total fechado:* ${brl(total)}

🥃 *Bebidas:* ${bebidasLinha}
${lista.length ? `📝 *Bebidas que quero no evento:* ${lista.join(', ')}` : '📝 *Bebidas que quero no evento:* ainda vou definir'}
🍋 *Insumos:* ${insumosLinha}

${quoteNeeded
    ? `Gostaria de verificar a disponibilidade da data e receber a cotação ${
      drinksByJhonny && suppliesByJhonny ? 'das bebidas e dos insumos' : drinksByJhonny ? 'das bebidas' : 'dos insumos'
    } para fecharmos o contrato.`
    : 'Gostaria de verificar a disponibilidade da data para fecharmos o contrato.'}`;

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(text)}`;
}
