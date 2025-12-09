/**
 * Module d'analyse IA avec Google Gemini (100% GRATUIT)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

// Initialiser Gemini
function initializeGemini(apiKey) {
    if (!apiKey) {
        console.log('⚠️ Pas de clé Gemini configurée - Mode IA désactivé');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✅ Google Gemini AI initialisé');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation Gemini:', error.message);
        return false;
    }
}

/**
 * Analyse IA d'une action avec Google Gemini
 */
async function analyzeWithAI(stockData, symbol, stockName) {
    if (!model) {
        return {
            enabled: false,
            analysis: '➡️ **SURVEILLER** - Analyser plus en détail avant d\'agir'
        };
    }
    
    try {
        const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
        
        const prompt = `Tu es un expert trader. Analyse cette action et donne UNE SEULE phrase de recommandation claire et directe.

**Action:** ${stockName} (${symbol})
**Prix actuel:** $${stockData.c}
**Variation 24h:** ${changePercent}%
**Clôture précédente:** $${stockData.pc}

IMPORTANT: Réponds en UNE SEULE PHRASE courte (max 100 caractères) avec:
- Le verbe d'action en gras: **ACHETER**, **VENDRE**, **CONSERVER** ou **SURVEILLER**
- Une raison très brève

Exemple: "**ACHETER** - Forte tendance haussière confirmée"
Exemple: "**SURVEILLER** - Volatilité importante, attendre confirmation"

Réponds UNIQUEMENT avec cette phrase, rien d'autre.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text().trim();
        
        return {
            enabled: true,
            analysis: analysis
        };
        
    } catch (error) {
        console.error(`❌ Erreur analyse IA pour ${symbol}:`, error.message);
        console.error(`❌ Détails erreur:`, error);
        
        // Message plus descriptif selon le type d'erreur
        let errorMsg = '➡️ **SURVEILLER** - ';
        if (error.message.includes('API key')) {
            errorMsg += 'Clé API Gemini invalide';
        } else if (error.message.includes('quota')) {
            errorMsg += 'Quota API dépassé, réessayez plus tard';
        } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
            errorMsg += 'Problème de connexion réseau';
        } else {
            errorMsg += `Erreur IA: ${error.message.substring(0, 50)}`;
        }
        
        return {
            enabled: false,
            analysis: errorMsg
        };
    }
}

/**
 * Analyse IA approfondie avec contexte de marché
 */
async function deepAnalysisWithAI(stockData, historicalData, symbol, stockName) {
    if (!model) {
        return null;
    }
    
    try {
        const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
        
        // Calculer volatilité simple
        const closes = historicalData?.c || [];
        let volatilityInfo = 'N/A';
        if (closes.length > 5) {
            const recentCloses = closes.slice(-5);
            const avgPrice = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
            const variance = recentCloses.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / recentCloses.length;
            const volatility = Math.sqrt(variance);
            volatilityInfo = `${((volatility / avgPrice) * 100).toFixed(2)}%`;
        }
        
        const prompt = `Analyse technique approfondie en tant qu'expert trader:

**${stockName} (${symbol})**
Prix: $${stockData.c} | Variation: ${changePercent}% | Volatilité: ${volatilityInfo}
Range jour: $${stockData.l} - $${stockData.h}

Fournis une analyse structurée:
1. **Tendance**: Haussière/Baissière/Latérale et pourquoi
2. **Signal**: Achat/Vente/Neutre avec niveau de conviction (1-5)
3. **Stratégie**: Point d'entrée optimal et stop-loss recommandé
4. **Horizon**: Court terme (1-7j) ou moyen terme (1 mois)
5. **Risque**: Faible/Moyen/Élevé

Maximum 6 lignes. Sois précis et chiffré quand possible.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text().trim();
        
    } catch (error) {
        console.error('❌ Erreur deep analysis:', error.message);
        return null;
    }
}

/**
 * Génère une prédiction de prix avec l'IA
 */
async function predictWithAI(stockData, historicalData, symbol) {
    if (!model) {
        return null;
    }
    
    try {
        const closes = historicalData?.c || [];
        if (closes.length < 10) return null;
        
        const recentPrices = closes.slice(-10).map(p => p.toFixed(2)).join(', ');
        const currentPrice = stockData.c;
        
        const prompt = `En tant qu'analyste quantitatif, prédis l'évolution de ${symbol}:

Prix actuel: $${currentPrice}
10 derniers jours: ${recentPrices}

Donne une prédiction concise:
- Prix estimé dans 7 jours (avec fourchette min-max)
- Prix estimé dans 30 jours (avec fourchette min-max)
- Niveau de confiance (%)
- Principal facteur de risque

Format court: 3-4 lignes maximum. Sois réaliste et prudent.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text().trim();
        
    } catch (error) {
        console.error('❌ Erreur prédiction IA:', error.message);
        return null;
    }
}

module.exports = {
    initializeGemini,
    analyzeWithAI,
    deepAnalysisWithAI,
    predictWithAI
};
