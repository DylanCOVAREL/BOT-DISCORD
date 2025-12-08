/**
 * Module d'analyse technique et prédictions IA pour le trading
 */

/**
 * Calcule les indicateurs techniques (RSI, MACD, Moyennes Mobiles)
 */
function calculateIndicators(historicalData) {
    if (!historicalData || !historicalData.c || historicalData.c.length === 0) {
        return {
            rsi: 50,
            macd: 0,
            signal: 0,
            sma20: 0,
            sma50: 0,
            ema12: 0,
            ema26: 0
        };
    }

    const closes = historicalData.c;
    
    // RSI (Relative Strength Index)
    const rsi = calculateRSI(closes, 14);
    
    // MACD (Moving Average Convergence Divergence)
    const ema12 = calculateEMA(closes, 12);
    const ema26 = calculateEMA(closes, 26);
    const macd = ema12 - ema26;
    
    // Moyennes mobiles
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    
    return {
        rsi,
        macd,
        signal: calculateEMA([macd], 9),
        sma20,
        sma50,
        ema12,
        ema26
    };
}

/**
 * Calcule le RSI (Relative Strength Index)
 */
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) {
            gains += change;
        } else {
            losses -= change;
        }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
}

/**
 * Calcule la moyenne mobile simple (SMA)
 */
function calculateSMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

/**
 * Calcule la moyenne mobile exponentielle (EMA)
 */
function calculateEMA(prices, period) {
    if (prices.length === 0) return 0;
    if (prices.length < period) return calculateSMA(prices, prices.length);
    
    const multiplier = 2 / (period + 1);
    let ema = calculateSMA(prices.slice(0, period), period);
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] - ema) * multiplier + ema;
    }
    
    return ema;
}

/**
 * Analyse une action et génère une recommandation
 */
function analyzeStock(stockData, historicalData, indicators) {
    const currentPrice = stockData.c;
    const { rsi, macd, sma20, sma50 } = indicators;
    
    let score = 5; // Score neutre sur 10
    let signals = [];
    let recommendation = '';
    
    // Analyse RSI
    if (rsi < 30) {
        score += 2;
        signals.push('📉 RSI indique survente (opportunité d\'achat)');
    } else if (rsi > 70) {
        score -= 2;
        signals.push('📈 RSI indique surachat (prudence)');
    } else if (rsi >= 40 && rsi <= 60) {
        signals.push('➡️ RSI neutre');
    }
    
    // Analyse MACD
    if (macd > 0) {
        score += 1.5;
        signals.push('✅ MACD positif (momentum haussier)');
    } else {
        score -= 1;
        signals.push('⚠️ MACD négatif (momentum baissier)');
    }
    
    // Analyse des moyennes mobiles
    if (currentPrice > sma20 && sma20 > sma50) {
        score += 1.5;
        signals.push('🚀 Tendance haussière confirmée');
    } else if (currentPrice < sma20 && sma20 < sma50) {
        score -= 1.5;
        signals.push('📉 Tendance baissière');
    }
    
    // Génération de la recommandation
    if (score >= 7) {
        recommendation = '🟢 **ACHETER** - Signaux techniques favorables';
    } else if (score >= 5.5) {
        recommendation = '🟡 **CONSERVER/ACHETER** - Signaux modérément positifs';
    } else if (score >= 4) {
        recommendation = '🟠 **ATTENDRE** - Signaux mitigés, prudence recommandée';
    } else {
        recommendation = '🔴 **ÉVITER/VENDRE** - Signaux techniques défavorables';
    }
    
    return {
        score: Math.max(0, Math.min(10, score)),
        signal: score >= 6 ? '🟢 Achat' : score >= 4 ? '🟡 Neutre' : '🔴 Vente',
        recommendation,
        details: signals.join('\n')
    };
}

/**
 * Prédit la tendance future d'une action (simulation IA)
 */
function predictTrend(historicalData, currentData) {
    if (!historicalData || !historicalData.c) {
        return {
            shortTerm: 'Données insuffisantes',
            mediumTerm: 'Données insuffisantes',
            confidence: 0,
            volatility: 'Inconnue',
            trend: 'Indéterminée',
            advice: 'Impossible de générer une prédiction',
            risks: 'N/A',
            entryPoints: 'N/A'
        };
    }
    
    const closes = historicalData.c;
    const currentPrice = currentData.c;
    
    // Calcul de la volatilité
    const returns = [];
    for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i-1]) / closes[i-1]);
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100;
    
    // Calcul de la tendance
    const recentPrices = closes.slice(-30);
    const priceChange = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    
    // Prédiction simple basée sur la tendance et la volatilité
    const trendFactor = priceChange > 0 ? 1.02 : 0.98;
    const shortTermPrediction = currentPrice * trendFactor;
    const mediumTermPrediction = currentPrice * Math.pow(trendFactor, 4);
    
    // Calcul de confiance (basé sur la cohérence de la tendance)
    let consistency = 0;
    for (let i = 1; i < recentPrices.length; i++) {
        if ((recentPrices[i] > recentPrices[i-1] && priceChange > 0) ||
            (recentPrices[i] < recentPrices[i-1] && priceChange < 0)) {
            consistency++;
        }
    }
    const confidence = Math.round((consistency / (recentPrices.length - 1)) * 100);
    
    // Génération des conseils
    let advice = '';
    let risks = '';
    let entryPoints = '';
    
    if (priceChange > 0.05) {
        advice = '📈 **Tendance haussière détectée**. Position longue recommandée avec prise de bénéfices progressive.';
        risks = '⚠️ Risque de correction après forte hausse. Utilisez des stop-loss.';
        entryPoints = `💰 Point d'entrée idéal: $${(currentPrice * 0.97).toFixed(2)} (lors d'un petit repli)`;
    } else if (priceChange < -0.05) {
        advice = '📉 **Tendance baissière**. Attendre une stabilisation avant d\'entrer en position.';
        risks = '⚠️ Momentum négatif. Risque de baisse continue.';
        entryPoints = `💰 Attendre un support autour de: $${(currentPrice * 0.95).toFixed(2)}`;
    } else {
        advice = '➡️ **Consolidation**. Opportunité d\'achat sur support, vente sur résistance.';
        risks = '⚠️ Marché indécis, risque de fausse cassure.';
        entryPoints = `💰 Zone d'achat: $${(currentPrice * 0.98).toFixed(2)} - $${(currentPrice * 0.99).toFixed(2)}`;
    }
    
    return {
        shortTerm: `$${shortTermPrediction.toFixed(2)} (${((shortTermPrediction - currentPrice) / currentPrice * 100).toFixed(1)}%)`,
        mediumTerm: `$${mediumTermPrediction.toFixed(2)} (${((mediumTermPrediction - currentPrice) / currentPrice * 100).toFixed(1)}%)`,
        confidence: confidence,
        volatility: volatility > 3 ? '🔴 Élevée' : volatility > 1.5 ? '🟡 Moyenne' : '🟢 Faible',
        trend: priceChange > 0.05 ? '📈 Haussière' : priceChange < -0.05 ? '📉 Baissière' : '➡️ Latérale',
        advice,
        risks,
        entryPoints
    };
}

module.exports = {
    calculateIndicators,
    analyzeStock,
    predictTrend,
    calculateRSI,
    calculateSMA,
    calculateEMA
};
