## PLA confirmat (i ara sí: net)

* **Nivell A = V2 /v2 = 5 nits (5 preguntes)** → mirall ràpid + informe en pantalla + export local.
* **Nivell PRO = més preguntes + més profunditat + email** → informe PRO personalitzat + **Pla 7 dies** enviat per correu.
* **PRO V1 = reaprofitar el qüestionari de 15** que ja tens (el guardem com a base).
* **PRO V2+ = qüestionari nou** construït amb:

  * preguntes d’**Intervencions Emocionals Estratègiques**
  * * preguntes de les **Nits** del llibre *TU NO ETS TU*
  * (i el fem créixer sense perdre el que funciona)

Això és embut real: **A enganxa → PRO transforma → automatització**.

---

# README MESTRE — TREMOLOR.APP (V2 + PRO)

## 0) Què és (1 línia)

**Tremolor** és una microapp “mirall” que fa escriure a l’usuari i li retorna un **informe curt, útil i accionable**. No és teràpia. És claredat.

## 1) Per què existeix (estratègia)

1. Convertir **lectura/vídeo → experiència** (QR).
2. Capturar **intenció** (lead) quan toca (PRO).
3. Segmentar i automatitzar (veu/patró/resultat).
4. Crear actiu escalable: **Nivell A gratuït → PRO monetitzable**.

## 2) Producte i to

* Foscor minimal, premium, directe.
* Promesa: *“Això no és un test. És un mirall.”*
* Regla: **valor > poesia** (si no ajuda, fora).

---

## 3) Estructura actual (què tenim avui)

### 3.1 Rutes

* `/v2/` ✅ **Nivell A canònic (5 nits)**
* `/preguntes/` (o similar) ✅ **base del PRO V1 (15 preguntes)**
* `/informe/` (legacy) (si existeix, no promocionar)
* `/dashboard/` (si existeix al build, és PRO/Backoffice)

### 3.2 Dades

* Nivell A (V2): **localStorage** (respostes per nit).
* PRO V1 (15Q): localStorage actual + càlcul veu (Tu/Ego/Ombra) si ja hi és.

### 3.3 Deploy

* Next.js export estàtic (`out/`) desplegat a `public_html/tremolor/`
* Regla: **NO trencar `/_next/static/*`** amb antivirus o htaccess.

---

# 4) Els nivells del producte (camí clar)

## NIVELL A (V2) — “enganxar”

**Objectiu:** que l’usuari completi 5 nits i surti amb una sensació clara: *“m’ha pillat”*.

**Inclou:**

* 5 preguntes (NIT1…NIT5)
* Informe a pantalla per nit + tancament “I ara què?”
* Export local: TXT / Word / Print-PDF
* Persistència local (si tanca, no perd)
* **Sense email, sense API, sense backend**

**KPI A:**

* % Entrar
* % completen 5/5
* temps mitjà
* % clic CTA cap a PRO

## NIVELL PRO — “transformar + automatitzar”

**Objectiu:** convertir Tremolor en **captador + segmentador + pla de 7 dies + informe PRO per email**.

**Inclou:**

* Qüestionari PRO (més preguntes, més profund)
* Captura email (sense xantatge)
* Guardat DB (leads + resultats + timestamp + campanya)
* Enviament automàtic:

  * Informe PRO (HTML o PDF)
  * **Pla 7 dies**
* Seqüències D0/D1/D3/D7/D14 (per patró/veu)

**Versions PRO:**

* **PRO V1 (ara):** reaprofitar el qüestionari de **15 preguntes** existent (guardem intacte).
* **PRO V2+ (després):** qüestionari nou amb preguntes d’Intervenció Estratègica + Nits *TU NO ETS TU*.

---

# 5) Problema clau actual: l’informe A “repeteix” i perd valor

**Error:** frases genèriques + repeticions (“mecanisme concret”) → sensació de “text automàtic”.

**Solució A (sense IA): Informe per patrons**

* Detectar patrons semàntics bàsics (8–12 màxim):
  evitació / control / por d’exposició / validació / culpa / rumiació / autoexigència / fugida…
* Per cada nit, output curt:

  1. **Etiqueta del patró**
  2. Paràfrasi (no copiar literal)
  3. Cost real (concret)
  4. **Microacció 24h (mesurable)**
  5. Pregunta final que obre PRO

Això fa que l’usuari senti **valor real** i entengui que el PRO serà el “mapa complet + pla 7 dies”.

---

# 6) Backlog “ben parit” (tasques tancades i verificables)

## SPRINT 1 — Nivell A “DONE”

**A1. Confirmació canònic**

* `/v2` és la ruta principal (landing i CTA apunten aquí).

**A2. Informe A sense repeticions**

* Cap frase plantilla es repeteix igual a 3 nits seguides.
* Cada nit té **microacció 24h**.

**A3. Persistència**

* refrescar navegador a 3/5 → continua a 3/5.

**A4. Export**

* TXT i Word generen contingut complet (5 nits) sense trencar format.

**A5. CTA final PRO**

* Botó clar: “No em vull escapar” → porta a PRO (ruta definida).

## SPRINT 2 — PRO Light (captura sense trencar)

**P1. Captura email no bloquejant**

* si no deixa email → pot veure el seu informe A igualment.
* si deixa email → queda registrat (encara que sigui log/JSON provisional).

**P2. Tracking mínim**

* guardar `utm_source / utm_campaign` (si existeix) a localStorage.

## SPRINT 3 — PRO complet (automatització)

**P3. DB**

* leads + resultats + timestamp + campanya.

**P4. Email**

* informe PRO + pla 7 dies (D0) + seqüència D1/D3/D7/D14.

**P5. Dashboard admin**

* filtrar per patró/veu + export CSV.

---

# 7) Decisions tancades (per no discutir cada cop)

* **Nivell A no depèn d’API.**
* **El PRO és on hi ha email + DB + automatització.**
* **PRO V1 reaprofita 15Q; PRO V2+ serà nou (intervencions + Nits del llibre).**
* **No volem “funciona”. Volem “converteix”.**

---

## 8) El que toca ara (acció immediata)

1. Actualitzar text del README antic (15 → 5 nits a Nivell A).
2. Implementar **Informe A per patrons + microacció** (sense IA).
3. Definir ruta PRO V1 (ex: `/pro` que internament pot ser l’actual `/preguntes`).

---

## Nota tècnica (anti-drames)

* Antivirus/htaccess: no bloquejar `/_next/static/*`.
* Deploy net quan peti: pujar `out/` net, sense barrejar `_next` antics.

---

## On ho guardes

**Guardar a:**
`EdmondSystems/00__SISTEMA/20_ENTREGABLES_AI/TREMOLOR/2026-01-09__DE__README_MESTRE_TREMOLOR_V2_PRO.md`

---

### Següent peça (i aquí hi ha la màgia)

Si em dius **“OK, fes el Sprint 1”**, et trec:

* la **llista exacta de patrons (8–12)**
* i les **plantilles de sortida** per nit (3 variants per patró)
  perquè l’informe A deixi de sonar robòtic i passi a ser **útil de veritat** (sense IA, sense fum).
