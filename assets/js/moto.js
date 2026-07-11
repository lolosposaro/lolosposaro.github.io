/* ===== MOTO CLIMA ===== */
const WMO_CODES = {
  0:  ['Despejado',                   '☀️'],
  1:  ['Principalmente despejado',    '🌤️'],
  2:  ['Parcialmente nublado',        '⛅'],
  3:  ['Nublado / cubierto',          '☁️'],
  45: ['Niebla',                      '🌫️'],
  48: ['Niebla con escarcha',         '🌫️'],
  51: ['Llovizna leve',               '🌦️'],
  53: ['Llovizna moderada',           '🌦️'],
  55: ['Llovizna intensa',            '🌧️'],
  61: ['Lluvia leve',                 '🌧️'],
  63: ['Lluvia moderada',             '🌧️'],
  65: ['Lluvia intensa',              '🌧️'],
  71: ['Nieve leve',                  '🌨️'],
  73: ['Nieve moderada',              '🌨️'],
  75: ['Nieve intensa',               '🌨️'],
  80: ['Chubascos leves',             '🌦️'],
  81: ['Chubascos moderados',         '🌧️'],
  82: ['Chubascos intensos',          '⛈️'],
  95: ['Tormenta eléctrica',          '⛈️'],
  96: ['Tormenta con granizo',        '⛈️'],
  99: ['Tormenta severa con granizo', '⛈️'],
};
const WMO_LLUVIA         = new Set([51,53,55,61,63,65,80,81,82,95,96,99]);
const WMO_TORMENTA       = new Set([95,96,99]);
const WMO_LLUVIA_INTENSA = new Set([63,65,81,82,95,96,99]);

function sensacionMoto(temp, viento, velMoto) {
  const v = viento + velMoto;
  if (temp <= 10) {
    const vEff = Math.max(v, 4.8);
    return +(13.12 + 0.6215*temp - 11.37*(vEff**0.16) + 0.3965*temp*(vEff**0.16)).toFixed(1);
  } else if (temp <= 28) {
    return +(temp - (v/100) * 8 * ((28 - temp) / 28)).toFixed(1);
  }
  return +(temp - 1).toFixed(1);
}

function analizarLluvia(data) {
  const cur = data.current;
  const llueveAhora = cur.precipitation > 0.05 || WMO_LLUVIA.has(cur.weathercode);
  const hora = new Date().getHours();
  const probs = data.hourly.precipitation_probability.slice(hora, hora + 4);
  const probMax = probs.length ? Math.round(Math.max(...probs)) : 0;
  return { llueveAhora, vaALlover: probMax >= 50, probMax };
}

function recomendar(temp, sensacion, llueve, vaLlover, probLluvia, viento, rafagas, wmoCode) {
  const rec = { superior: [], inferior: [], calzado: [], guantes: [], alertas: [] };
  const esTormenta    = WMO_TORMENTA.has(wmoCode);
  const lluviaIntensa = WMO_LLUVIA_INTENSA.has(wmoCode);
  const riesgoLluvia  = llueve || (vaLlover && probLluvia >= 60);
  const posibleLluvia = !riesgoLluvia && probLluvia >= 30;

  if      (sensacion < 0)  rec.superior.push('Campera de invierno con forro térmico grueso (obligatorio)', 'Remera térmica de base (manga larga)', 'Cuello / balaclava para proteger cara y cuello');
  else if (sensacion < 5)  rec.superior.push('Campera de invierno con forro térmico', 'Remera térmica de base', 'Cuello / balaclava recomendado');
  else if (sensacion < 10) rec.superior.push('Campera de abrigo (con fleece o polar adentro)');
  else if (sensacion < 15) rec.superior.push('Campera de moto con forro, o campera de abrigo');
  else if (sensacion < 20) rec.superior.push('Campera rompevientos o campera de moto sin forro térmico');
  else if (sensacion < 26) rec.superior.push('Rompevientos liviano o campera de moto de verano');
  else                     rec.superior.push('Campera mesh / ventilada — hace calor', '(Siempre llevar algo que proteja ante una caída)');

  if (llueve || lluviaIntensa)  rec.superior.unshift('[LLUVIA] Traje de lluvia superior o campera impermeable');
  else if (riesgoLluvia)        rec.superior.push('Llevá el traje/capa de lluvia (alta probabilidad)');
  else if (posibleLluvia)       rec.superior.push('Por las dudas: guardá el traje de lluvia en la mochila');

  if      (sensacion < 5)  rec.inferior.push('Ropa interior térmica', 'Pantalón de moto con protecciones y forro térmico');
  else if (sensacion < 12) rec.inferior.push('Pantalón de moto con protecciones (o jeans con calza térmica abajo)');
  else if (sensacion < 22) rec.inferior.push('Pantalón de moto o jeans resistentes');
  else                     rec.inferior.push('Pantalón cómodo / jeans (o pantalón de moto de verano)');

  if (llueve || (vaLlover && probLluvia >= 60)) rec.inferior.unshift('[LLUVIA] Pantalón impermeable o pantalón de lluvia');
  else if (posibleLluvia)                       rec.inferior.push('Llevar pantalón de lluvia en la mochila');

  if (riesgoLluvia || llueve) rec.calzado.push('Botas de moto impermeables (esencial si llueve)', 'Evitar zapatillas de tela — se empaparán');
  else if (sensacion < 10)    rec.calzado.push('Botas de moto (protección y abrigo)');
  else if (sensacion < 22)    rec.calzado.push('Botas de moto o zapatillas deportivas resistentes', 'Evitar calzado casual / de vestir');
  else                        rec.calzado.push('Zapatillas deportivas resistentes está bien', 'Evitar sandalias, ojotas o calzado abierto (siempre)');

  if      (sensacion < 5)  rec.guantes.push('Guantes de invierno impermeables (esencial — las manos se entumen rápido)');
  else if (sensacion < 12) rec.guantes.push('Guantes de abrigo para moto');
  else if (sensacion < 22) rec.guantes.push('Guantes de moto de media estación');
  else                     rec.guantes.push('Guantes de verano o cortos');

  if (llueve || riesgoLluvia) rec.guantes.push('Guantes impermeables o funda impermeable sobre los guantes');

  if (esTormenta)      rec.alertas.push('TORMENTA ELECTRICA — Considera no salir en moto');
  if (rafagas > 70)    rec.alertas.push(`RAFAGAS MUY FUERTES (${rafagas.toFixed(0)} km/h) — Conducción peligrosa, tené mucho cuidado`);
  else if (rafagas > 50 || viento > 40) rec.alertas.push(`Viento fuerte (${viento.toFixed(0)} km/h, ráfagas ${rafagas.toFixed(0)} km/h) — Andar con precaución`);
  if (sensacion < -5) rec.alertas.push('Temperatura extrema — Riesgo de hipotermia en viajes largos');
  if (llueve && (lluviaIntensa || rafagas > 50)) rec.alertas.push('Lluvia intensa + viento — Visibilidad reducida y piso resbaladizo');

  return rec;
}

function nivelFrio(s) {
  if (s < 0)  return 'MUY FRIO';
  if (s < 8)  return 'FRIO';
  if (s < 15) return 'FRESCO';
  if (s < 22) return 'TEMPLADO';
  if (s < 28) return 'CALIDO';
  return 'MUCHO CALOR';
}

function renderReporte(ciudad, data, sensacion, lluvia, rec, vel) {
  const c = data.current;
  const [desc, em] = WMO_CODES[c.weathercode] || ['Desconocido', '?'];
  const hora = new Date().toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
  const S = '='.repeat(56);
  const s = '-'.repeat(56);
  const pad = (n, w=6) => String(n).padStart(w);

  let o = `\n${S}\n`;
  o += `  MOTO CLIMA | ${ciudad}\n`;
  o += `  ${hora}  —  ${em} ${desc}\n`;
  o += `${S}\n`;
  o += `  Temp real              ${pad(c.temperature_2m.toFixed(1))} °C\n`;
  o += `  Sensación a pie        ${pad(c.apparent_temperature.toFixed(1))} °C\n`;
  o += `  SENSACIÓN EN MOTO      ${pad(sensacion.toFixed(1))} °C   a ${vel} km/h\n`;
  o += `    nivel: ${nivelFrio(sensacion)}\n`;
  o += `  Viento                 ${pad(c.windspeed_10m.toFixed(1))} km/h  (ráfagas: ${c.windgusts_10m.toFixed(0)} km/h)\n`;
  o += `  Lluvia actual          ${pad(c.precipitation.toFixed(1))} mm\n`;
  o += `  Prob. lluvia 4h        ${pad(lluvia.probMax, 5)} %\n`;
  o += `  Humedad                ${pad(Math.round(c.relativehumidity_2m), 5)} %\n`;
  o += `  Nubosidad              ${pad(Math.round(c.cloudcover), 5)} %\n`;

  if (rec.alertas.length) {
    o += `\n${s}\n  ⚠  ALERTAS\n${s}\n`;
    rec.alertas.forEach(a => o += `  !  ${a}\n`);
  }

  for (const [titulo, clave] of [['PARTE SUPERIOR', 'superior'], ['PARTE INFERIOR', 'inferior'], ['CALZADO', 'calzado'], ['GUANTES', 'guantes']]) {
    o += `\n${s}\n  ${titulo}\n${s}\n`;
    rec[clave].forEach(item => o += `  -  ${item}\n`);
  }

  return o + `\n${S}\n`;
}

const motoForm = document.getElementById('moto-form');
motoForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const city   = document.getElementById('moto-city').value.trim() || 'Montevideo';
  const vel    = parseFloat(document.getElementById('moto-speed').value) || 80;
  const output = document.getElementById('moto-output');
  const btn    = motoForm.querySelector('.moto__btn');

  btn.disabled = true;
  btn.textContent = 'cargando...';
  output.textContent = '';
  output.classList.remove('visible');

  try {
    const geoRes  = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=10&language=es&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results?.length) throw new Error(`Ciudad '${city}' no encontrada`);

    const lugar  = geoData.results.find(r => r.country_code === 'UY') || geoData.results[0];
    const nombre = `${lugar.name}, ${lugar.country || ''}`;

    const params = new URLSearchParams({
      latitude: lugar.latitude, longitude: lugar.longitude,
      current:  'temperature_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,windgusts_10m,cloudcover,relativehumidity_2m,is_day',
      hourly:   'precipitation_probability,temperature_2m,windspeed_10m,precipitation',
      forecast_days: 1, timezone: 'America/Montevideo', windspeed_unit: 'kmh',
    });
    const wxRes  = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const wxData = await wxRes.json();

    const c        = wxData.current;
    const sensacion = sensacionMoto(c.temperature_2m, c.windspeed_10m, vel);
    const lluvia   = analizarLluvia(wxData);
    const rec      = recomendar(c.temperature_2m, sensacion, lluvia.llueveAhora, lluvia.vaALlover, lluvia.probMax, c.windspeed_10m, c.windgusts_10m, c.weathercode);

    output.textContent = renderReporte(nombre, wxData, sensacion, lluvia, rec, vel);
    output.classList.add('visible');
  } catch (err) {
    output.textContent = `\nError: ${err.message}\n`;
    output.classList.add('visible');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'consultar';
  }
});

/* ===== HEADER SHADOW ON SCROLL ===== */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    header?.classList.add('header--scrolled');
  } else {
    header?.classList.remove('header--scrolled');
  }
}, { passive: true });
