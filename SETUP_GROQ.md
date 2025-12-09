# 🚀 Configuration Groq AI (100% Gratuit)

Groq remplace Google Gemini avec **Llama 3.1 70B** - Ultra rapide et gratuit !

## ✅ Avantages de Groq

- 🚀 **Ultra rapide** : Réponses en <1 seconde
- 💯 **100% gratuit** : Pas de carte bancaire requise
- 🔥 **Llama 3.1 70B** : Meilleur modèle open-source
- ⚡ **14 400 req/jour** : Largement suffisant

## 📋 Étapes de configuration

### 1️⃣ Créer un compte Groq

1. Allez sur https://console.groq.com
2. Cliquez sur **"Sign Up"**
3. Créez un compte (email + mot de passe)

### 2️⃣ Obtenir votre clé API

1. Une fois connecté, allez dans **"API Keys"** : https://console.groq.com/keys
2. Cliquez sur **"Create API Key"**
3. Donnez-lui un nom : `Bot-Trading-Discord`
4. Copiez la clé (format : `gsk_...`)

### 3️⃣ Configurer le bot

1. Ouvrez le fichier `.env`
2. Remplacez la ligne `GEMINI_API_KEY` par votre clé Groq :

```env
GEMINI_API_KEY=gsk_votre_clé_groq_ici
```

### 4️⃣ Installer les dépendances

```powershell
npm install
```

### 5️⃣ Lancer le bot

```powershell
node bot.js
```

Vous devriez voir :
```
✅ Groq AI initialisé (Llama 3.1 70B)
🤖 Groq AI activé - Llama 3.1 70B (100% gratuit)
```

### 6️⃣ Tester

Sur Discord, tapez `/test` pour déclencher une analyse immédiate.

---

## 🔥 Performances Groq vs Gemini

| Feature | Groq (Llama 3.1) | Gemini Pro |
|---------|------------------|------------|
| Vitesse | ⚡ <1s | 🐢 2-5s |
| Gratuit | ✅ 14 400/jour | ⚠️ Instable |
| Qualité | 🔥 Excellent | ✅ Bon |
| Stabilité | ✅ 99.9% | ❌ Erreurs fréquentes |

---

## 🆘 Problèmes ?

Si vous voyez `❌ Erreur IA` :
1. Vérifiez que votre clé commence par `gsk_`
2. Vérifiez qu'elle est bien dans le `.env`
3. Relancez le bot avec `node bot.js`

**Groq est bien plus stable que Gemini !** 🚀
