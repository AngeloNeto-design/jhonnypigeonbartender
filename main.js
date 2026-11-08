// main.js · Jhonny Pigeon (build de teste scroll-craft)
// Porta a lógica do site atual (calculadora em 3 passos -> WhatsApp) e acrescenta
// a assinatura: "A etiqueta se escreve", uma etiqueta ao vivo no simulador.
import { calculateEventEstimate, generateWhatsAppLink } from './calculator.js';
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

/* ---------- Contador: se o motor escrever milhar com vírgula, vira ponto (pt-BR) ---------- */
const countEl = document.getElementById('valor-minimo');
if (countEl) {
  const fix = () => {
    const t = countEl.textContent;
    if (/,/.test(t)) countEl.textContent = t.replace(/,/g, '.');
  };
  new MutationObserver(fix).observe(countEl, { childList: true, characterData: true, subtree: true });
  fix();
}

/* ---------- Simulador em passos ---------- */
const form = document.getElementById('calc-form');
const panels = [...form.querySelectorAll('.calc__panel')];
const dots = [...form.querySelectorAll('.calc__step-dot')];

const guestsInput = document.getElementById('f-guests');
const durationInput = document.getElementById('f-duration');
const eventTypeInput = document.getElementById('f-event-type');
const mobileBarInput = document.getElementById('f-mobile-bar');
const nameInput = document.getElementById('f-name');
const dateInput = document.getElementById('f-date');
const packageGroup = document.getElementById('package-group');
const errGuests = document.getElementById('err-guests');
const errName = document.getElementById('err-name');
const estimateValue = document.getElementById('estimate-value');
const estimateMeta = document.getElementById('estimate-meta');

function readForm() {
  const isFullService =
    form.querySelector('input[name="service-model"]:checked').value === 'full';
  const packageType = isFullService
    ? form.querySelector('input[name="package"]:checked').value
    : 'Equipe + insumos (bebidas por conta do anfitrião)';
  return {
    guests: guestsInput.value,
    durationHours: durationInput.value,
    eventType: eventTypeInput.value,
    isFullService,
    packageType,
    needsMobileBar: mobileBarInput.checked
  };
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

let faixaVisivel = false;

function syncRotulo() {
  const d = readForm();
  const g = Math.floor(Number(d.guests) || 0);
  const h = Number(d.durationHours) || PRICING_RULES.STANDARD_HOURS;

  escrever('formato', d.eventType);
  g > 0 ? escrever('convidados', `${g} pessoas`) : escrever('convidados', 'a definir', true);
  escrever('duracao', `${h}h`);
  escrever(
    'carta',
    d.isFullService
      ? PRICING_RULES.PACKAGE_LABELS[d.packageType] || d.packageType
      : 'Equipe + insumos'
  );

  const r = g > 0 ? calculateEventEstimate(d) : { error: true };
  if (!r.error) {
    escrever('equipe', `${r.bartendersNeeded} ${r.bartendersNeeded > 1 ? 'bartenders' : 'bartender'}`);
  } else {
    escrever('equipe', 'a definir', true);
  }

  if (faixaVisivel && !r.error) {
    const fmt = (v) => `R$ ${v.toLocaleString('pt-BR')}`;
    escrever('faixa', `${fmt(r.minEstimate)} a ${fmt(r.maxEstimate)}`);
  } else {
    escrever('faixa', 'no último passo', true);
  }
}

/* ---------- Passos ---------- */
function renderEstimate() {
  const data = readForm();
  const result = calculateEventEstimate(data);
  if (result.error) {
    estimateValue.textContent = '—';
    estimateMeta.textContent = result.error;
    return;
  }
  const fmt = (v) => `R$ ${v.toLocaleString('pt-BR')}`;
  estimateValue.textContent = `${fmt(result.minEstimate)} – ${fmt(result.maxEstimate)}`;
  const plural = result.bartendersNeeded > 1 ? 'bartenders' : 'bartender';
  const rate = fmt(PRICING_RULES.HOURLY_RATE);
  estimateMeta.textContent =
    `${Math.floor(Number(data.guests))} convidados · equipe: ${result.bartendersNeeded} ${plural} × ${result.hours}h × ${rate}/h = ${fmt(result.laborCost)}` +
    ` · bebidas, insumos${result.structureCost ? ' e bar móvel' : ''}: ${fmt(result.suppliesCost + result.structureCost)}`;
}

function goToStep(n) {
  panels.forEach((p) => p.classList.toggle('is-active', p.dataset.step === String(n)));
  dots.forEach((d) => {
    const num = Number(d.dataset.dot);
    d.classList.toggle('is-active', num === n);
    d.classList.toggle('is-done', num < n);
    if (num === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
  });
  faixaVisivel = n === 3;
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
        guestsInput.focus();
        return;
      }
    }
    goToStep(target);
  }
  if (back) goToStep(Number(back.dataset.back));
});

/* Pacotes só fazem sentido no serviço completo */
form.querySelectorAll('input[name="service-model"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    packageGroup.classList.toggle('is-hidden', radio.value !== 'full' || !radio.checked);
    syncRotulo();
  });
});

/* A etiqueta e a estimativa acompanham cada campo */
form.addEventListener('input', () => {
  if (panels[2].classList.contains('is-active')) renderEstimate();
  if (!errGuests.hidden && Math.floor(Number(guestsInput.value) || 0) > 0) {
    errGuests.hidden = true;
    guestsInput.setAttribute('aria-invalid', 'false');
  }
  syncRotulo();
});
form.addEventListener('change', syncRotulo);

/* Cartas: "Escolher esta carta" marca a opção e leva ao simulador */
document.querySelectorAll('[data-pick]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const radio = form.querySelector(`input[name="package"][value="${btn.dataset.pick}"]`);
    const full = form.querySelector('input[name="service-model"][value="full"]');
    if (full) { full.checked = true; packageGroup.classList.remove('is-hidden'); }
    if (radio) radio.checked = true;
    syncRotulo();
    document.getElementById('simular').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });
});

/* ---------- Envio -> WhatsApp com a mesma mensagem do site atual ---------- */
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
      guests: Math.floor(Number(data.guests)),
      durationHours: data.durationHours,
      packageType: data.packageType
    },
    result
  );
  window.open(link, '_blank', 'noopener,noreferrer');
});

/* Estado inicial da etiqueta */
syncRotulo();
