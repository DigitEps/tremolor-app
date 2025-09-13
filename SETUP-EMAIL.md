# 📧 Configuració d'Emails per Tremolor App

## Problema: "l'informe no arriba al correu"

Si els emails no arriben, és perquè falta configurar SendGrid. Aquí tens la solució pas a pas:

## 🚀 Configuració Ràpida (5 minuts)

### 1. Crear compte SendGrid (GRATUÏT)
- Ves a [SendGrid](https://sendgrid.com)
- Crea un compte gratuït (fins a 100 emails/dia)
- Verifica el teu email

### 2. Obtenir API Key
1. Entra a [SendGrid Dashboard](https://app.sendgrid.com)
2. Ves a **Settings** → **API Keys**
3. Clica **Create API Key**
4. Nom: `Tremolor App`
5. Permisos: **Full Access** (o almenys Mail Send)
6. **Copia la clau** (només es mostra una vegada!)

### 3. Verificar Sender Email
1. A SendGrid, ves a **Settings** → **Sender Authentication**
2. **Single Sender Verification**
3. Afegeix el teu email (ex: `no-reply@tremolor.app`)
4. Verifica l'email que rebràs

### 4. Configurar Variables d'Entorn
Crea un fitxer `.env.local` a l'arrel del projecte:

```bash
# .env.local
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=no-reply@tremolor.app
ADMIN_EMAIL=admin@tremolor.app
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Reiniciar el Servidor
```bash
npm run dev
```

## ✅ Verificar que Funciona

1. Ves a `/informe`
2. Introdueix el teu email
3. Clica "Enviar Informe"
4. Revisa la consola del servidor per logs:
   - ✅ `[LEAD] ✅ Email sent successfully`
   - ❌ `[LEAD] ❌ SendGrid error`

## 🔧 Debugging

### Si veus errors a la consola:

**Error: "Unauthorized"**
- Revisa que l'API key sigui correcta
- Assegura't que tingui permisos Mail Send

**Error: "The from address does not match a verified Sender Identity"**
- Verifica el sender email a SendGrid
- Assegura't que `FROM_EMAIL` coincideixi exactament

**Error: "No SendGrid API key configured"**
- Revisa que `.env.local` existeixi
- Reinicia el servidor després de crear `.env.local`

### Logs útils:
```bash
# Veure logs del servidor
npm run dev

# Els logs apareixeran així:
[LEAD] Configuration check: { hasSendGridKey: true, fromEmail: 'no-reply@tremolor.app' }
[LEAD] Attempting to send email via SendGrid...
[LEAD] ✅ Email sent successfully to: user@example.com
```

## 🎯 Configuració per Producció (Vercel)

1. A Vercel Dashboard → Settings → Environment Variables
2. Afegeix:
   - `SENDGRID_API_KEY`: La teva clau
   - `FROM_EMAIL`: Email verificat
   - `NEXT_PUBLIC_APP_URL`: `https://tremolor-app.vercel.app`

## 💡 Consells

- **Gratuït**: SendGrid ofereix 100 emails/dia gratuïts
- **Spam**: Afegeix SPF/DKIM records per millor deliverability
- **Testing**: Usa el teu propi email per provar primer
- **Logs**: Sempre revisa la consola per errors

## 🆘 Si Encara No Funciona

1. Revisa que `.env.local` estigui a l'arrel (mateix nivell que `package.json`)
2. Reinicia completament el servidor
3. Prova amb un email diferent
4. Revisa la carpeta de spam
5. Comprova els logs de SendGrid Dashboard

---

Amb aquesta configuració, els emails professionals arribaran perfectament! 🚀