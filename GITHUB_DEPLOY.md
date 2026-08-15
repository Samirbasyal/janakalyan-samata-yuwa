# GitHub + Vercel मा deploy गर्ने पूरा प्रक्रिया

> यो गाइडले: (१) project लाई GitHub मा पठाउने, (२) hosted database (Neon) बनाउने,
> (३) Vercel मा deploy गर्ने — सबै step-by-step देखाउँछ।

---

## भाग १ — GitHub मा पठाउने

### १.१ GitHub account + repository बनाउने
1. [github.com](https://github.com) मा जानुहोस् → **Sign up** (नयाँ भए) वा **Sign in**
2. माथि दायाँ **`+`** → **New repository**
3. Repository name: `janakalyan-samata-yuwa`
4. **Public** छान्नुहोस् (Private पनि हुन्छ, तर deploy सजिलो Public मा)
5. **"Add a README" ✅ unchecked राख्नुहोस्** (हाम्रो project मा README छ)
6. **Create repository** थिच्नुहोस्
7. अब page मा **remote URL** देखिन्छ, जस्तै:
   `https://github.com/YOUR_USERNAME/janakalyan-samata-yuwa.git`
   — यो कपी गरेर राख्नुहोस्

### १.२ VS Code मा git commands
VS Code मा project folder खोलेर **Terminal** (`Ctrl + ~`) मा:

```bash
git init
git add .
git commit -m "Janakalyan Samata Yuwa Club website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/janakalyan-samata-yuwa.git
git push -u origin main
```

> `YOUR_USERNAME` को ठाउँमा आफ्नो GitHub username राख्नुहोस्।
> पहिलो पटक push गर्दा GitHub ले **username + password** माग्छ — password को ठाउँमा **Personal Access Token** हाल्नुपर्छ:
> GitHub → Settings → Developer settings → Personal access tokens → Generate new token (repo scope tick गरेर) → त्यो token कपी गरेर paste गर्नुहोस्।

Push सफल भयो भने GitHub मा सबै files देखिन्छन्। ✅

> ⚠️ `.env` file **GitHub मा जाँदैन** (gitignore मा छ) — secret सुरक्षित रहन्छ। यो ठिकै हो।

---

## भाग २ — Hosted Database (Neon — free PostgreSQL)

Production मा PGlite (local database) चल्दैन — **online PostgreSQL** चाहिन्छ। Neon सबैभन्दा सजिलो:

1. [neon.tech](https://neon.tech) मा **Sign up** (GitHub बाट पनि हुन्छ)
2. **Create a project** → name: `janakalyan` → Region: `Singapore` वा `Mumbai` (नजिकको) → Create
3. Project खुलेपछि **Connection string** देखिन्छ, जस्तै:
   ```
   postgresql://user:password@ep-xxxx.region.aws.neon.tech/janakalyan?sslmode=require
   ```
4. **यो URL कपी गरेर राख्नुहोस्** — यही `DATABASE_URL` हुनेछ
5. Neon को **SQL Editor** खोल्नुहोस् (बायाँ मेनु) — यहाँ पछि tables बनाउन सकिन्छ

---

## भाग ३ — Vercel मा Deploy (free, सबैभन्दा सजिलो)

1. [vercel.com](https://vercel.com) मा जानुहोस् → **Sign up** → **Continue with GitHub** (GitHub सँग जोड्नुहोस्)
2. **Add New Project** → `janakalyan-samata-yuwa` repository **Import** गर्नुहोस्
3. **Environment Variables** section मा यी ५ वटा राख्नुहोस्:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon को connection string (माथिको) |
   | `BETTER_AUTH_SECRET` | जुनसुकै random लामो string (जस्तै `v3r9x-2k8p-7m4q-9z1w-5t6y-8u3i-4o7p`) |
   | `BETTER_AUTH_URL` | Deploy पछि आउने तपाईंको site URL (पहिला खाली छोडे पनि हुन्छ, पछि भर्ने) |
   | `SMTP_HOST` | `smtp.gmail.com` (वा Brevo: `smtp-relay.brevo.com`) |
   | `SMTP_USER` | तपाईंको Gmail (वा Brevo login email) |
   | `SMTP_PASS` | Gmail App Password (वा Brevo SMTP key) |
   | `SMTP_FROM` | `Janakalyan Samata Yuwa Club <basyalsamir099@gmail.com>` |

4. **Deploy** थिच्नुहोस् — २-३ मिनेटमा site live हुन्छ
5. Deploy पछि site को URL देखिन्छ, जस्तै: `https://janakalyan-samata-yuwa.vercel.app`
6. **`BETTER_AUTH_URL`** मा त्यही URL राखेर **Redeploy** गर्नुहोस् (Deployments → ⋯ → Redeploy)

---

## भाग ४ — Production मा tables + first admin

Neon मा tables हाम्रो script ले बनाउँदैन (script local .env पढ्छ) — यी २ तरिकामा:

### तरिका A (सजिलो): Vercel मा एक पटक काम गर्ने command
Neon को **SQL Editor** खोलेर `scripts/init-db.mjs` भित्रका CREATE TABLE statements paste गर्नुहोस् (वा मलाई भन्नुहोस्, म तयार गरिदिन्छु)।

### तरिका B: First admin बनाउने (deploy पछि)
1. Site मा जानुहोस्: `https://<site-url>/sign-up` → account बनाउनुहोस् (`basyalsamir099@gmail.com` / `samir@12`)
2. Neon को **SQL Editor** मा यो चलाउनुहोस् (email आफ्नो अनुसार):
   ```sql
   UPDATE "user" SET role = 'admin', "emailVerified" = true WHERE email = 'basyalsamir099@gmail.com';
   ```
3. Site मा फेरि login गर्नुहोस् → admin panel खुल्छ ✅

---

## भाग ५ — फेरि update गर्ने (अब देखि)

Code परिवर्तन गरेपछि:

```bash
git add .
git commit -m "update message"
git push
```

Vercel ले **आफै deploy** गर्छ — केही गर्नु पर्दैन। 🎉

---

## महत्त्वपूर्ण नोट
- **Email code** production मा पनि चल्नको लागि `SMTP_*` variables **अनिवार्य** छन् — नभए code कतै देखिँदैन (dev मा जस्तो स्क्रिनमा देखाउने सुविधा production मा छैन)
- `BETTER_AUTH_SECRET` production मा नयाँ random बनाउनुहोस्
- PGlite (local) dev को लागि मात्र — production सधैं Neon/Supabase जस्तो hosted DB प्रयोग गर्नुहोस्
