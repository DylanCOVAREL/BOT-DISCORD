# 🤖 Configuration Google Gemini AI (100% GRATUIT)

## 📝 Étapes pour obtenir votre clé API Gemini

### 1. Accéder à Google AI Studio
Allez sur : **https://makersuite.google.com/app/apikey**

### 2. Se connecter
- Connectez-vous avec votre compte Google (Gmail)

### 3. Créer une clé API
1. Cliquez sur **"Create API Key"** ou **"Get API Key"**
2. Sélectionnez un projet Google Cloud existant ou créez-en un nouveau
3. Votre clé API sera générée instantanément

### 4. Copier la clé
- La clé ressemble à : `AIzaSyBM_5LTvymph2jFoKtkxWfJzUDtcjDkqeM`
- **Copiez-la** immédiatement (vous ne pourrez peut-être pas la revoir)

### 5. Ajouter la clé dans votre fichier `.env`

Ouvrez le fichier `.env` et remplacez :
```env
GEMINI_API_KEY=votre_cle_gemini_ici
```

Par :
```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 6. Installer la dépendance

Dans le terminal PowerShell :
```powershell
npm install
```

### 7. Relancer le bot

```powershell
npm start
```

Vous devriez voir : `✅ Google Gemini AI initialisé`

## 💰 Limites Gratuites

Google Gemini est **100% GRATUIT** avec :
- ✅ **60 requêtes par minute**
- ✅ **1500 requêtes par jour**
- ✅ **Pas de carte bancaire requise**
- ✅ Largement suffisant pour votre bot

## 🎯 Ce que l'IA va faire

L'IA Google Gemini va maintenant :
- 📊 Analyser chaque action en profondeur
- 💡 Donner des recommandations personnalisées et contextuelles
- 🎯 Évaluer le niveau de risque
- 📈 Suggérer des stratégies d'entrée/sortie
- 🔮 Fournir des insights en langage naturel

## ⚠️ Important

- **Ne partagez JAMAIS votre clé API** publiquement
- Le fichier `.env` est déjà dans `.gitignore` (non partagé sur Git)
- En cas de problème, générez une nouvelle clé sur Google AI Studio

## 🔗 Liens Utiles

- **Google AI Studio** : https://makersuite.google.com/app/apikey
- **Documentation Gemini** : https://ai.google.dev/docs
- **Limites d'utilisation** : https://ai.google.dev/pricing

---

Une fois configuré, vos alertes Discord incluront de **vraies analyses IA** gratuites ! 🚀
