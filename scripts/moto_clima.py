#!/usr/bin/env python3
"""
Moto Weather Advisor
Evalúa el clima y recomienda equipamiento para andar en moto en Uruguay.
Usa Open-Meteo (gratis, sin API key): https://open-meteo.com/
"""

import sys
import argparse
import requests
from datetime import datetime

# ──────────────────────────────────────────────────────────────
# Códigos WMO de condición climática
# ──────────────────────────────────────────────────────────────
WMO_CODES = {
    0:  ("Despejado",                    "☀️"),
    1:  ("Principalmente despejado",     "🌤️"),
    2:  ("Parcialmente nublado",         "⛅"),
    3:  ("Nublado / cubierto",           "☁️"),
    45: ("Niebla",                       "🌫️"),
    48: ("Niebla con escarcha",          "🌫️"),
    51: ("Llovizna leve",                "🌦️"),
    53: ("Llovizna moderada",            "🌦️"),
    55: ("Llovizna intensa",             "🌧️"),
    61: ("Lluvia leve",                  "🌧️"),
    63: ("Lluvia moderada",              "🌧️"),
    65: ("Lluvia intensa",               "🌧️"),
    71: ("Nieve leve",                   "🌨️"),
    73: ("Nieve moderada",               "🌨️"),
    75: ("Nieve intensa",                "🌨️"),
    80: ("Chubascos leves",              "🌦️"),
    81: ("Chubascos moderados",          "🌧️"),
    82: ("Chubascos intensos",           "⛈️"),
    95: ("Tormenta eléctrica",           "⛈️"),
    96: ("Tormenta con granizo",         "⛈️"),
    99: ("Tormenta severa con granizo",  "⛈️"),
}

WMO_LLUVIA = {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99}
WMO_TORMENTA = {95, 96, 99}
WMO_LLUVIA_INTENSA = {63, 65, 81, 82, 95, 96, 99}


# ──────────────────────────────────────────────────────────────
# API helpers
# ──────────────────────────────────────────────────────────────
def geocodificar(ciudad: str, solo_uruguay: bool = True) -> tuple[float, float, str]:
    """
    Busca coordenadas de una ciudad usando la API de geocodificación de Open-Meteo.
    Por defecto prioriza resultados de Uruguay. Si no encuentra en UY, cae al primero global.
    """
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": ciudad, "count": 10, "language": "es", "format": "json"}
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    if not data.get("results"):
        raise ValueError(f"Ciudad '{ciudad}' no encontrada. Probá con otra ortografía.")

    resultados = data["results"]
    if solo_uruguay:
        uy = [res for res in resultados if res.get("country_code") == "UY"]
        res = uy[0] if uy else resultados[0]
    else:
        res = resultados[0]

    return res["latitude"], res["longitude"], f"{res['name']}, {res.get('country', '')}"


def obtener_clima(lat: float, lon: float) -> dict:
    """Descarga el clima actual y datos horarios de Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "precipitation",
            "weathercode",
            "windspeed_10m",
            "windgusts_10m",
            "cloudcover",
            "relativehumidity_2m",
            "is_day",
        ],
        "hourly": [
            "precipitation_probability",
            "temperature_2m",
            "windspeed_10m",
            "precipitation",
        ],
        "forecast_days": 1,
        "timezone": "America/Montevideo",
        "windspeed_unit": "kmh",
    }
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    return r.json()


# ──────────────────────────────────────────────────────────────
# Cálculo de sensación térmica en moto
# ──────────────────────────────────────────────────────────────
def sensacion_termica_moto(temp_c: float, viento_kmh: float, velocidad_moto_kmh: float) -> float:
    """
    Calcula la sensación térmica para un motociclista.

    A la temperatura real le suma el viento del ambiente MÁS la velocidad de la moto,
    porque el cuerpo experimenta toda esa corriente de aire a la vez.

    Para T <= 10°C usa la fórmula oficial de wind chill (Environment Canada / OMM).
    Para T > 10°C aplica una reducción moderada (el viento refresca menos agresivamente
    a temperaturas templadas y casi no afecta por encima de ~28°C).
    """
    v = viento_kmh + velocidad_moto_kmh  # viento efectivo total en km/h

    if temp_c <= 10:
        # Fórmula wind chill — válida para V > 4.8 km/h y T <= 10°C
        v_eff = max(v, 4.8)
        wc = (13.12
              + 0.6215  * temp_c
              - 11.37   * (v_eff ** 0.16)
              + 0.3965  * temp_c * (v_eff ** 0.16))
        return round(wc, 1)
    elif temp_c <= 28:
        # Zona templada: el viento refresca pero de forma más suave
        # Reducción proporcional al viento y a cuán "fresco" está el ambiente
        factor = (28 - temp_c) / 28  # disminuye conforme sube la temp
        reduccion = (v / 100) * 8 * factor
        return round(temp_c - reduccion, 1)
    else:
        # Calor: el viento ya no refresca (temperatura ambiente > temperatura piel)
        return round(temp_c - 1.0, 1)


# ──────────────────────────────────────────────────────────────
# Análisis de lluvia
# ──────────────────────────────────────────────────────────────
def analizar_lluvia(clima: dict) -> tuple[bool, bool, int]:
    """
    Retorna (llueve_ahora, va_a_llover_pronto, prob_max_pct).
    'pronto' = probabilidad máxima en las próximas 4 horas.
    """
    current = clima["current"]
    llueve_ahora = (current["precipitation"] > 0.05
                    or current["weathercode"] in WMO_LLUVIA)

    hora = datetime.now().hour
    probs = clima["hourly"]["precipitation_probability"]
    ventana = probs[hora: hora + 4]
    prob_max = int(max(ventana)) if ventana else 0

    va_a_llover = prob_max >= 50
    return llueve_ahora, va_a_llover, prob_max


# ──────────────────────────────────────────────────────────────
# Motor de recomendaciones
# ──────────────────────────────────────────────────────────────
def recomendar(
    temp: float,
    sensacion: float,
    llueve: bool,
    va_llover: bool,
    prob_lluvia: int,
    viento: float,
    rfagas: float,
    wmo_code: int,
) -> dict:
    """Genera el conjunto de recomendaciones de vestimenta y alertas."""

    rec = {
        "superior":  [],
        "inferior":  [],
        "calzado":   [],
        "guantes":   [],
        "alertas":   [],
    }

    es_tormenta      = wmo_code in WMO_TORMENTA
    lluvia_intensa   = wmo_code in WMO_LLUVIA_INTENSA
    riesgo_lluvia    = llueve or (va_llover and prob_lluvia >= 60)
    posible_lluvia   = not riesgo_lluvia and prob_lluvia >= 30

    # ── PARTE SUPERIOR ──────────────────────────────────────────
    if sensacion < 0:
        rec["superior"] += [
            "Campera de invierno con forro térmico grueso (obligatorio)",
            "Remera térmica de base (manga larga)",
            "Cuello / balaclava para proteger cara y cuello",
        ]
    elif sensacion < 5:
        rec["superior"] += [
            "Campera de invierno con forro térmico",
            "Remera térmica de base",
            "Cuello / balaclava recomendado",
        ]
    elif sensacion < 10:
        rec["superior"] += [
            "Campera de abrigo (con fleece o polar adentro)",
        ]
    elif sensacion < 15:
        rec["superior"] += [
            "Campera de moto con forro, o campera de abrigo",
        ]
    elif sensacion < 20:
        rec["superior"] += [
            "Campera rompevientos o campera de moto sin forro térmico",
        ]
    elif sensacion < 26:
        rec["superior"] += [
            "Rompevientos liviano o campera de moto de verano",
        ]
    else:
        rec["superior"] += [
            "Campera mesh / ventilada — hace calor",
            "(Siempre llevar algo que proteja ante una caída)",
        ]

    if llueve or lluvia_intensa:
        rec["superior"].insert(0, "[LLUVIA] Traje de lluvia superior o campera impermeable")
    elif riesgo_lluvia:
        rec["superior"].append("Llevá el traje/capa de lluvia (alta probabilidad)")
    elif posible_lluvia:
        rec["superior"].append("Por las dudas: guardá el traje de lluvia en la mochila")

    # ── PARTE INFERIOR ──────────────────────────────────────────
    if sensacion < 5:
        rec["inferior"] += [
            "Ropa interior térmica",
            "Pantalón de moto con protecciones y forro térmico",
        ]
    elif sensacion < 12:
        rec["inferior"] += [
            "Pantalón de moto con protecciones (o jeans con calza térmica abajo)",
        ]
    elif sensacion < 22:
        rec["inferior"] += [
            "Pantalón de moto o jeans resistentes",
        ]
    else:
        rec["inferior"] += [
            "Pantalón cómodo / jeans (o pantalón de moto de verano)",
        ]

    if llueve or (va_llover and prob_lluvia >= 60):
        rec["inferior"].insert(0, "[LLUVIA] Pantalón impermeable o pantalón de lluvia")
    elif posible_lluvia:
        rec["inferior"].append("Llevar pantalón de lluvia en la mochila")

    # ── CALZADO ─────────────────────────────────────────────────
    if riesgo_lluvia or llueve:
        rec["calzado"] += [
            "Botas de moto impermeables (esencial si llueve)",
            "Evitar zapatillas de tela — se empaparán",
        ]
    elif sensacion < 10:
        rec["calzado"] += [
            "Botas de moto (protección y abrigo)",
        ]
    elif sensacion < 22:
        rec["calzado"] += [
            "Botas de moto o zapatillas deportivas resistentes",
            "Evitar calzado casual / de vestir",
        ]
    else:
        rec["calzado"] += [
            "Zapatillas deportivas resistentes está bien",
            "Evitar sandalias, ojotas o calzado abierto (siempre)",
        ]

    # ── GUANTES ─────────────────────────────────────────────────
    if sensacion < 5:
        rec["guantes"] += [
            "Guantes de invierno impermeables (esencial — las manos se entumen rápido)",
        ]
    elif sensacion < 12:
        rec["guantes"] += [
            "Guantes de abrigo para moto",
        ]
    elif sensacion < 22:
        rec["guantes"] += [
            "Guantes de moto de media estación",
        ]
    else:
        rec["guantes"] += [
            "Guantes de verano o cortos",
        ]

    if llueve or riesgo_lluvia:
        rec["guantes"].append("Guantes impermeables o funda impermeable sobre los guantes")

    # ── ALERTAS ─────────────────────────────────────────────────
    if es_tormenta:
        rec["alertas"].append("TORMENTA ELECTRICA — Considera no salir en moto")
    if rfagas > 70:
        rec["alertas"].append(
            f"RAFAGAS MUY FUERTES ({rfagas:.0f} km/h) — Conducción peligrosa, tené mucho cuidado"
        )
    elif rfagas > 50 or viento > 40:
        rec["alertas"].append(
            f"Viento fuerte ({viento:.0f} km/h, ráfagas {rfagas:.0f} km/h) — Andar con precaución"
        )
    if sensacion < -5:
        rec["alertas"].append("Temperatura extrema — Riesgo de hipotermia en viajes largos")
    if llueve and (lluvia_intensa or rfagas > 50):
        rec["alertas"].append("Lluvia intensa + viento — Visibilidad reducida y piso resbaladizo")

    return rec


# ──────────────────────────────────────────────────────────────
# Output
# ──────────────────────────────────────────────────────────────
def nivel_frio(sensacion: float) -> str:
    if sensacion < 0:    return "MUY FRIO"
    if sensacion < 8:    return "FRIO"
    if sensacion < 15:   return "FRESCO"
    if sensacion < 22:   return "TEMPLADO"
    if sensacion < 28:   return "CALIDO"
    return "MUCHO CALOR"


def imprimir_reporte(
    ciudad: str,
    clima: dict,
    sensacion: float,
    llueve: bool,
    va_llover: bool,
    prob_lluvia: int,
    rec: dict,
    vel: float,
):
    c = clima["current"]
    temp     = c["temperature_2m"]
    viento   = c["windspeed_10m"]
    rfagas   = c["windgusts_10m"]
    wmo      = c["weathercode"]
    desc, em = WMO_CODES.get(wmo, ("Desconocido", "?"))
    hora     = datetime.now().strftime("%H:%M")

    sep  = "=" * 58
    sep2 = "-" * 58

    print(f"\n{sep}")
    print(f"  MOTO WEATHER ADVISOR | {ciudad}")
    print(f"  {hora}  —  {em} {desc}")
    print(sep)
    print(f"  Temperatura real          {temp:>6.1f} °C")
    print(f"  Sensacion termica a pie   {c['apparent_temperature']:>6.1f} °C")
    print(f"  SENSACION EN MOTO         {sensacion:>6.1f} °C   a {vel:.0f} km/h")
    print(f"    (nivel: {nivel_frio(sensacion)})")
    print(f"  Viento                    {viento:>6.1f} km/h  (rafagas: {rfagas:.0f} km/h)")
    print(f"  Lluvia actual             {c['precipitation']:>6.1f} mm")
    print(f"  Prob. lluvia proximas 4h  {prob_lluvia:>5d} %")
    print(f"  Humedad                   {c['relativehumidity_2m']:>5.0f} %")
    print(f"  Nubosidad                 {c['cloudcover']:>5.0f} %")

    if rec["alertas"]:
        print(f"\n{sep2}")
        print("  ⚠  ALERTAS")
        print(sep2)
        for a in rec["alertas"]:
            print(f"  !  {a}")

    secciones = [
        ("PARTE SUPERIOR  (campera / impermeable)", "superior"),
        ("PARTE INFERIOR  (pantalon / lluvia)",     "inferior"),
        ("CALZADO",                                  "calzado"),
        ("GUANTES",                                  "guantes"),
    ]

    for titulo, clave in secciones:
        print(f"\n{sep2}")
        print(f"  {titulo}")
        print(sep2)
        for item in rec[clave]:
            print(f"  -  {item}")

    print(f"\n{sep}\n")


# ──────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(
        description="Recomendador de equipamiento para moto según el clima."
    )
    parser.add_argument(
        "ciudad",
        nargs="?",
        default="Montevideo",
        help="Ciudad (default: Montevideo)",
    )
    parser.add_argument(
        "--velocidad",
        "-v",
        type=float,
        default=80,
        metavar="KMH",
        help="Velocidad de crucero en km/h (default: 80)",
    )
    args = parser.parse_args()

    try:
        print(f"\nBuscando '{args.ciudad}'...")
        lat, lon, nombre = geocodificar(args.ciudad, solo_uruguay=True)

        print(f"Obteniendo clima para {nombre}...")
        clima = obtener_clima(lat, lon)

        c = clima["current"]
        sensacion = sensacion_termica_moto(
            temp_c=c["temperature_2m"],
            viento_kmh=c["windspeed_10m"],
            velocidad_moto_kmh=args.velocidad,
        )
        llueve, va_llover, prob = analizar_lluvia(clima)
        rec = recomendar(
            temp=c["temperature_2m"],
            sensacion=sensacion,
            llueve=llueve,
            va_llover=va_llover,
            prob_lluvia=prob,
            viento=c["windspeed_10m"],
            rfagas=c["windgusts_10m"],
            wmo_code=c["weathercode"],
        )
        imprimir_reporte(nombre, clima, sensacion, llueve, va_llover, prob, rec, args.velocidad)

    except ValueError as e:
        print(f"\nError: {e}", file=sys.stderr)
        sys.exit(1)
    except requests.RequestException as e:
        print(f"\nError de red: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
