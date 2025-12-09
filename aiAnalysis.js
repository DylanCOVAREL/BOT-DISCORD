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
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('✅ Google Gemini AI initialisé (gemini-1.5-flash)');
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
        
        // Prompt ultra-simplifié pour réduire les erreurs API
        const prompt = `Action: ${stockName} (${symbol})
Prix: $${stockData.c}
Variation: ${changePercent}%

Recommande en 1 phrase courte avec: **ACHETER**, **VENDRE**, **CONSERVER** ou **SURVEILLER** suivi de la raison.
Exemple: "**ACHETER** - Tendance haussière forte"`;

        // Timeout de 10 secondes pour éviter les blocages
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout API Gemini')), 10000)
        );
        
        const resultPromise = model.generateContent(prompt);
        const result = await Promise.race([resultPromise, timeoutPromise]);
        
        const response = await result.response;
        const analysis = response.text().trim();
        
        // Vérifier que la réponse contient bien une recommandation
        if (!analysis || analysis.length < 10) {
            throw new Error('Réponse IA vide ou invalide');
        }
        
        return {
            enabled: true,
            analysis: analysis
        };
        
    } catch (error) {
        console.error(`❌ Erreur analyse IA pour ${symbol}:`, error.message);
        console.error(`❌ Détails erreur:`, error);
        
        // FALLBACK : Analyse simple basée sur la variation
        const changePercent = parseFloat(((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2));
        let fallbackAnalysis = '';
        
        if (changePercent > 5) {
            fallbackAnalysis = '**ACHETER** - Forte hausse en cours (+' + changePercent + '%)';
        } else if (changePercent > 2) {
            fallbackAnalysis = '**CONSERVER** - Tendance haussière modérée (+' + changePercent + '%)';
        } else if (changePercent < -5) {
            fallbackAnalysis = '**VENDRE** - Forte baisse détectée (' + changePercent + '%)';
        } else if (changePercent < -2) {
            fallbackAnalysis = '**SURVEILLER** - Tendance baissière (' + changePercent + '%)';
        } else {
            fallbackAnalysis = '**CONSERVER** - Stabilité du cours (' + changePercent + '%)';
        }
        
        console.log(`ℹ️ Utilisation analyse fallback pour ${symbol}: ${fallbackAnalysis}`);
        
        return {
            enabled: false,
            analysis: fallbackAnalysis
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
