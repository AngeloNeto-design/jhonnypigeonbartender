// main.js
import { calculateEventEstimate, generateWhatsAppLink } from './calculator.js';

const WHATSAPP_NUMBER = '5571996467164';

/* ---------- WhatsApp sempre acessível (flutuante, hero, footer) ---------- */
const genericMsg = encodeURIComponent(
  'Olá, Jhonny! Vi seu trabalho e quero saber mais sobre coquetelaria para o meu evento.'
);
const genericLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${genericMsg}`;
['float-whatsapp', 'hero-whatsapp', 'footer-whatsapp'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.href = genericLink;
});

/* ---------- Ano do footer ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Calculadora em passos ---------- */
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

function goToStep(n) {
  panels.forEach((p) => p.classList.toggle('is-active', p.dataset.step === String(n)));
  dots.forEach((d) => {
    const num = Number(d.dataset.dot);
    d.classList.toggle('is-active', num === n);
    d.classList.toggle('is-done', num < n);
  });
  if (n === 3) renderEstimate();
  form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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
  estimateMeta.textContent = `${data.guests} convidados · ${data.durationHours}h · equipe de ${result.bartendersNeeded} ${plural}`;
}

/* Navegação entre passos */
form.addEventListener('click', (e) => {
  const next = e.target.closest('[data-next]');
  const back = e.target.closest('[data-back]');
  if (next) {
    const target = Number(next.dataset.next);
    if (target >= 2) {
      const g = Math.floor(Number(guestsInput.value) || 0);
      const invalid = g <= 0;
      errGuests.hidden = !invalid;
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
  });
});

/* Estimativa reativa enquanto o passo 3 está aberto */
[guestsInput, durationInput, mobileBarInput].forEach((el) => {
  el.addEventListener('input', () => {
    if (panels[2].classList.contains('is-active')) renderEstimate();
  });
});

/* Envio → WhatsApp com mensagem formatada */
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const invalidName = name.length < 2;
  errName.hidden = !invalidName;
  if (invalidName) {
    nameInput.focus();
    return;
  }

  const data = readForm();
  const result = calculateEventEstimate(data);
  if (result.error) {
    goToStep(1);
    errGuests.hidden = false;
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
  window.open(link, '_blank', 'noopener');
});

/* ---------- Scroll suave do CTA do hero ---------- */
document.querySelectorAll('[data-scroll]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});
