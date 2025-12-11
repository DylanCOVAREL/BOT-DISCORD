/**
 * Module d'analyse IA avec Groq (100% GRATUIT - Llama 3.3 70B)
 */

const Groq = require('groq-sdk');

let groq = null;

// Initialiser Groq
function initializeGemini(apiKey) {
    if (!apiKey) {
        console.log('⚠️ Pas de clé Groq configurée - Mode IA désactivé');
        return false;
    }
    
    try {
        groq = new Groq({ apiKey: apiKey });
        console.log('✅ Groq AI initialisé (Llama 3.3 70B)');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation Groq:', error.message);
        return false;
    }
}

/**
 * Analyse IA d'une action avec Groq - Llama 3.3 70B
 */
async function analyzeWithAI(stockData, symbol, stockName, trendData, volatilityData, distanceFromATH, priceForAI, currency, retryCount = 0) {
    if (!groq) {
        // Fallback automatique si Groq n'est pas configuré
        const changePercent = parseFloat(((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2));
        let fallback = '';
        
        if (changePercent > 3) {
            fallback = '**ACHETER** - Forte hausse (+' + changePercent + '%)';
        } else if (changePercent > 1) {
            fallback = '**CONSERVER** - Tendance positive (+' + changePercent + '%)';
        } else if (changePercent < -3) {
            fallback = '**VENDRE** - Forte baisse (' + changePercent + '%)';
        } else if (changePercent < -1) {
            fallback = '**SURVEILLER** - Baisse modérée (' + changePercent + '%)';
        } else {
            fallback = '**CONSERVER** - Prix stable (' + changePercent + '%)';
        }
        
        return {
            enabled: false,
            analysis: fallback
        };
    }
    
    try {
        const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
        
        // Construire le message avec le bon format de prix selon la devise
        let priceInfo;
        if (currency === 'EUR') {
            priceInfo = `Prix actuel: ${priceForAI}€`;
        } else if (currency === 'USD') {
            priceInfo = `Prix actuel: $${stockData.c.toFixed(2)} (${priceForAI}€)`;
        } else {
            priceInfo = `Prix actuel: ${stockData.c.toFixed(2)} ${currency}`;
        }
        
        const prompt = `Action: ${stockName} (${symbol})
${priceInfo}
Variation 24h: ${changePercent}%
Tendance 6 mois: ${trendData.trend} (score: ${trendData.score}/2)
Volatilité: ${volatilityData.level} (${volatilityData.volatility})
Distance du plus haut historique (ATH): ${distanceFromATH}%

En tant qu'expert trader, analyse ces données et donne UN SEUL conseil précis avec timing.
Ton conseil doit être varié selon le contexte:
- Si tendance baissière + volatilité élevée → "Attends la stabilisation dans 1-2 semaines"
- Si proche ATH + tendance neutre → "Évite d'acheter maintenant, risque de correction"
- Si loin ATH + tendance haussière → "Achète maintenant, opportunité intéressante"
- Si volatilité très élevée → "Patiente 3-5 jours, trop risqué pour l'instant"
- Si tendance baissière forte → "Vends rapidement ou attends le rebond"

Réponds en 1 phrase courte avec le prix en EUROS.`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert trader prudent. Analyse TOUTES les données (tendance 6 mois, volatilité, distance ATH) pour donner un conseil varié et précis avec timing. Ne recommande PAS toujours d'acheter. Sois critique et mentionne les risques. Utilise TOUJOURS le prix en EUROS dans ta réponse."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.8,
            max_tokens: 150
        });
        
        const analysis = completion.choices[0]?.message?.content?.trim();
        
        if (!analysis || analysis.length < 10) {
            throw new Error('Réponse vide');
        }
        
        console.log(`✅ Analyse IA Groq réussie pour ${symbol}`);
        
        return {
            enabled: true,
            analysis: analysis
        };
        
    } catch (error) {
        console.error(`❌ Erreur IA Groq ${symbol} (tentative ${retryCount + 1}/3):`, error.message);
        
        // Retry automatique (max 3 fois)
        if (retryCount < 2) {
            console.log(`🔄 Nouvelle tentative Groq pour ${symbol}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return analyzeWithAI(stockData, symbol, stockName, trendData, volatilityData, distanceFromATH, priceForAI, currency, retryCount + 1);
        }
        
        // Après 3 échecs : analyse de fallback basique
        const changePercent = parseFloat(((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2));
        let fallback = '';
        
        if (changePercent > 3) {
            fallback = '**ACHETER** - Forte hausse (+' + changePercent + '%)';
        } else if (changePercent > 1) {
            fallback = '**CONSERVER** - Tendance positive (+' + changePercent + '%)';
        } else if (changePercent < -3) {
            fallback = '**VENDRE** - Forte baisse (' + changePercent + '%)';
        } else if (changePercent < -1) {
            fallback = '**SURVEILLER** - Baisse modérée (' + changePercent + '%)';
        } else {
            fallback = '**CONSERVER** - Prix stable (' + changePercent + '%)';
        }
        
        console.log(`⚠️ Utilisation analyse automatique pour ${symbol}: ${fallback}`);
        
        return {
            enabled: false,
            analysis: fallback
        };
    }
}

// Fonctions non utilisées actuellement (pour évolution future)
async function deepAnalysisWithAI() { return null; }
async function predictWithAI() { return null; }

module.exports = {
    initializeGemini,
    analyzeWithAI,
    deepAnalysisWithAI,
    predictWithAI
};
