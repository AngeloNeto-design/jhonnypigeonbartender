// main.js · Jhonny Pigeon
// Simulador em 3 passos -> WhatsApp, com a etiqueta "A sua festa" se escrevendo ao vivo.
// Valor fechado: só equipe (R$ 250/h por bartender) e bar móvel. Bebidas e insumos
// ficam por conta do contratante ou entram na cotação do Jhonny, sem preço no site.
import { calculateEventEstimate, generateWhatsAppLink, brl } from './calculator.js';
import { PRICING_RULES } from './pricingConfig.js';

const WHATSAPP_NUMBER = '5571996467164';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- WhatsApp sempre acessível (flutuante, hero, rodapé) ---------- */
const genericMsg = encodeURIComponent(
  'Olá, Jhonny! Vi seu trabalho e quero saber mais sobre coquetelaria para o meu evento.'
);
const genericLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${genericMsg}`;
['float-whatsapp', 'hero-whatsapp', 'footer-whatsapp'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = genericLink;
});

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- WhatsApp flutuante: aparece depois da abertura ---------- */
const floatWa = document.getElementById('float-whatsapp');
function syncFloat() {
  floatWa.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.45);
}
window.addEventListener('scroll', syncFloat, { passive: true });
syncFloat();

/* ---------- Scroll suave dos links internos ---------- */
document.querySelectorAll('[data-scroll]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

/* ---------- Simulador em passos ---------- */
const form = document.getElementById('calc-form');
const panels = [...form.querySelectorAll('.calc__panel')];
const dots = [...form.querySelectorAll('.calc__step-dot')];

const guestsInput = document.getElementById('f-guests');
const durationInput = document.getElementById('f-duration');
const eventTypeInput = document.getElementById('f-event-type');
const mobileBarInput = document.getElementById('f-mobile-bar');
const drinksOtherInput = document.getElementById('f-drinks-other');
const nameInput = document.getElementById('f-name');
const dateInput = document.getElementById('f-date');
const errGuests = document.getElementById('err-guests');
const errDrinks = document.getElementById('err-drinks');
const errName = document.getElementById('err-name');
const listaTitulo = document.getElementById('lista-titulo');
const listaHint = document.getElementById('lista-hint');
const estimateValue = document.getElementById('estimate-value');
const estimateMeta = document.getElementById('estimate-meta');
const estimateItems = document.getElementById('estimate-items');
const passoCotacao = document.getElementById('passo-cotacao');

function checked(name) {
  return form.querySelector(`input[name="${name}"]:checked`)?.value;
}

function readForm() {
  return {
    guests: guestsInput.value,
    durationHours: durationInput.value,
    eventType: eventTypeInput.value,
    drinksBy: checked('drinks-by') || 'host',
    suppliesBy: checked('supplies-by') || 'host',
    packageType: checked('package') || 'PREMIUM',
    drinksList: [...form.querySelectorAll('input[name="drink-item"]:checked')].map((c) => c.value),
    drinksOther: drinksOtherInput.value.trim(),
    needsMobileBar: mobileBarInput.checked
  };
}

/* A lista de bebidas muda de sentido conforme quem fornece */
function syncListaBebidas() {
  const jhonny = checked('drinks-by') === 'jhonny';
  listaTitulo.textContent = jhonny
    ? 'Quais bebidas você quer que o Jhonny ofereça?'
    : 'Quais bebidas vão ter no evento?';
  listaHint.textContent = jhonny
    ? 'Marque pelo menos uma. É com essa lista que o Jhonny faz a cotação.'
    : 'Opcional. Ajuda o Jhonny a planejar os drinks.';
  if (!jhonny) errDrinks.hidden = true;
}

/* ---------- A etiqueta se escreve ---------- */
const rotulo = {};
document.querySelectorAll('[data-rotulo]').forEach((dd) => { rotulo[dd.dataset.rotulo] = dd; });
const typing = new Map(); // dd -> timer

function escrever(key, texto, vazio = false) {
  const dd = rotulo[key];
  if (!dd) return;
  if (dd.dataset.alvo === texto && dd.classList.contains('is-vazio') === vazio) return;
  dd.dataset.alvo = texto;
  dd.classList.toggle('is-vazio', vazio);
  clearInterval(typing.get(dd));
  if (reduced || texto.length === 0) {
    dd.textContent = texto;
    dd.classList.remove('is-escrevendo');
    return;
  }
  let i = 0;
  dd.textContent = '';
  dd.classList.add('is-escrevendo');
  const timer = setInterval(() => {
    i += 1;
    dd.textContent = texto.slice(0, i);
    if (i >= texto.length) {
      clearInterval(timer);
      dd.classList.remove('is-escrevendo');
    }
  }, 22);
  typing.set(dd, timer);
}

let valorVisivel = false;

function syncRotulo() {
  const d = readForm();
  const g = Math.floor(Number(d.guests) || 0);
  const h = Math.floor(Number(d.durationHours) || PRICING_RULES.STANDARD_HOURS);

  escrever('formato', d.eventType);
  g > 0 ? escrever('convidados', `${g} pessoas`) : escrever('convidados', 'a definir', true);
  escrever('duracao', `${h}h`);
  escrever('carta', PRICING_RULES.PACKAGE_LABELS[d.packageType] || d.packageType);

  const r = g > 0 ? calculateEventEstimate(d) : { error: true };
  if (!r.error) {
    escrever('equipe', `${r.bartendersNeeded} ${r.bartendersNeeded > 1 ? 'bartenders' : 'bartender'}`);
  } else {
    escrever('equipe', 'a definir', true);
  }

  escrever('bebidas', d.drinksBy === 'jhonny' ? 'Cotação do Jhonny' : 'Por sua conta');
  escrever('insumos', d.suppliesBy === 'jhonny' ? 'Cotação do Jhonny' : 'Por sua conta');

  if (valorVisivel && !r.error) {
    escrever('valor', brl(r.total));
  } else {
    escrever('valor', 'no último passo', true);
  }
}

/* ---------- Passo 3: valor fechado, item por item ---------- */
function renderEstimate() {
  const result = calculateEventEstimate(readForm());
  estimateItems.replaceChildren();
  if (result.error) {
    estimateValue.textContent = '—';
    estimateMeta.textContent = result.error;
    return;
  }
  result.items.forEach((it) => {
    const li = document.createElement('li');
    const txt = document.createElement('span');
    const nome = document.createElement('strong');
    nome.textContent = it.label;
    const conta = document.createElement('small');
    conta.textContent = it.detail;
    txt.append(nome, conta);
    const val = document.createElement('span');
    val.className = 'estimativa__item-valor';
    if (it.value === null) {
      val.classList.add('is-aparte');
      val.textContent = it.note;
    } else {
      val.textContent = brl(it.value);
    }
    li.append(txt, val);
    estimateItems.append(li);
  });
  estimateValue.textContent = brl(result.total);

  const base = `Este é o valor fechado da equipe${result.structureCost ? ' e do bar móvel' : ''}.`;
  if (result.drinksByJhonny && result.suppliesByJhonny) {
    estimateMeta.textContent = `${base} Bebidas e insumos entram na cotação que o Jhonny manda a partir da sua lista.`;
    passoCotacao.textContent = 'O Jhonny confirma a data e manda a cotação das bebidas e dos insumos.';
  } else if (result.drinksByJhonny) {
    estimateMeta.textContent = `${base} As bebidas entram na cotação que o Jhonny manda a partir da sua lista. Os insumos ficam por sua conta.`;
    passoCotacao.textContent = 'O Jhonny confirma a data e manda a cotação das bebidas.';
  } else if (result.suppliesByJhonny) {
    estimateMeta.textContent = `${base} Os insumos entram na cotação do Jhonny. As bebidas ficam por sua conta.`;
    passoCotacao.textContent = 'O Jhonny confirma a data e manda a cotação dos insumos.';
  } else {
    estimateMeta.textContent = `${base} Bebidas e insumos ficam por sua conta.`;
    passoCotacao.textContent = 'O Jhonny confirma a data.';
  }
}

function validarBebidas() {
  const d = readForm();
  const invalid = d.drinksBy === 'jhonny' && d.drinksList.length === 0 && !d.drinksOther;
  errDrinks.hidden = !invalid;
  return !invalid;
}

function goToStep(n) {
  panels.forEach((p) => p.classList.toggle('is-active', p.dataset.step === String(n)));
  dots.forEach((d) => {
    const num = Number(d.dataset.dot);
    d.classList.toggle('is-active', num === n);
    d.classList.toggle('is-done', num < n);
    if (num === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
  });
  valorVisivel = n === 3;
  if (n === 3) renderEstimate();
  syncRotulo();
  form.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  const first = panels.find((p) => p.dataset.step === String(n))?.querySelector('input, select, button');
  if (first) first.focus({ preventScroll: true });
}

form.addEventListener('click', (e) => {
  const next = e.target.closest('[data-next]');
  const back = e.target.closest('[data-back]');
  if (next) {
    const target = Number(next.dataset.next);
    if (target >= 2) {
      const g = Math.floor(Number(guestsInput.value) || 0);
      const invalid = g <= 0;
      errGuests.hidden = !invalid;
      guestsInput.setAttribute('aria-invalid', String(invalid));
      if (invalid) {
        goToStepIfNeeded(1);
        guestsInput.focus();
        return;
      }
    }
    if (target === 3 && !validarBebidas()) {
      document.getElementById('drinks-list').querySelector('input')?.focus();
      return;
    }
    goToStep(target);
  }
  if (back) goToStep(Number(back.dataset.back));
});

function goToStepIfNeeded(n) {
  if (!panels[n - 1].classList.contains('is-active')) goToStep(n);
}

form.querySelectorAll('input[name="drinks-by"]').forEach((radio) => {
  radio.addEventListener('change', syncListaBebidas);
});

/* A etiqueta e o valor acompanham cada campo */
form.addEventListener('input', () => {
  if (panels[2].classList.contains('is-active')) renderEstimate();
  if (!errGuests.hidden && Math.floor(Number(guestsInput.value) || 0) > 0) {
    errGuests.hidden = true;
    guestsInput.setAttribute('aria-invalid', 'false');
  }
  if (!errDrinks.hidden) validarBebidas();
  syncRotulo();
});
form.addEventListener('change', syncRotulo);

/* Cartas: "Escolher esta carta" marca o estilo e leva ao simulador */
document.querySelectorAll('[data-pick]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const radio = form.querySelector(`input[name="package"][value="${btn.dataset.pick}"]`);
    if (radio) radio.checked = true;
    syncRotulo();
    document.getElementById('simular').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

/* ---------- Envio -> WhatsApp com a simulação completa ---------- */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const invalidName = name.length < 2;
  errName.hidden = !invalidName;
  nameInput.setAttribute('aria-invalid', String(invalidName));
  if (invalidName) {
    nameInput.focus();
    return;
  }

  const data = readForm();
  const result = calculateEventEstimate(data);
  if (result.error) {
    goToStep(1);
    errGuests.hidden = false;
    guestsInput.setAttribute('aria-invalid', 'true');
    return;
  }
  if (!validarBebidas()) {
    goToStep(2);
    errDrinks.hidden = false;
    return;
  }

  let eventDate = 'A definir';
  if (dateInput.value) {
    const [y, m, d] = dateInput.value.split('-');
    eventDate = `${d}/${m}/${y}`;
  }

  const link = generateWhatsAppLink(
    WHATSAPP_NUMBER,
    {
      name,
      eventDate,
      eventType: data.eventType,
      guests: result.guests,
      durationHours: result.hours,
      packageType: data.packageType,
      drinksList: data.drinksList,
      drinksOther: data.drinksOther
    },
    result
  );
  window.open(link, '_blank', 'noopener,noreferrer');
});

/* Estado inicial (o navegador pode lembrar marcações ao recarregar) */
syncListaBebidas();
syncRotulo();
