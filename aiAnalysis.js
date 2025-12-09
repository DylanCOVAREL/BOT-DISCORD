/**
 * Module d'analyse IA avec Groq (100% GRATUIT - Llama 3.1 70B)
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
        console.log('✅ Groq AI initialisé (Llama 3.1 70B)');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation Groq:', error.message);
        return false;
    }
}

/**
 * Analyse IA d'une action avec Groq - Llama 3.1 70B
 */
async function analyzeWithAI(stockData, symbol, stockName, retryCount = 0) {
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
        
        const prompt = `Action: ${stockName} (${symbol})
Prix: $${stockData.c}
Variation: ${changePercent}%

Recommande en 1 phrase courte avec: **ACHETER**, **VENDRE**, **CONSERVER** ou **SURVEILLER** suivi de la raison.
Exemple: "**ACHETER** - Tendance haussière forte"`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es un expert trader. Réponds en 1 phrase courte et directe avec une action en gras (**ACHETER**, **VENDRE**, **CONSERVER**, **SURVEILLER**) suivie d'une raison brève."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.1-70b-versatile",
            temperature: 0.5,
            max_tokens: 100
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
            return analyzeWithAI(stockData, symbol, stockName, retryCount + 1);
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
