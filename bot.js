const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const yahooFinance = require('yahoo-finance2').default;
const { initializeGemini, analyzeWithAI } = require('./aiAnalysis');

dotenv.config();

// Keep-Alive pour Glitch.com (empêche la mise en veille)
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  if (req.method === 'HEAD' || req.method === 'GET') {
    res.end('🤖 Bot Trading Discord is alive!');
  } else {
    res.end();
  }
}).listen(3000);
console.log('🌐 Serveur HTTP actif sur le port 3000 (Keep-Alive Glitch)');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Configuration
const ALERT_CHANNEL_ID = process.env.ALERT_CHANNEL_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

// Rate limiting pour la commande /stock (1 utilisation par utilisateur toutes les 30 secondes)
const cooldowns = new Map();
const COOLDOWN_TIME = 30000; // 30 secondes en millisecondes

// Fonction pour envoyer des logs dans Discord
async function sendLog(message, type = 'info') {
    if (!LOG_CHANNEL_ID) return; // Logs désactivés si pas configuré
    
    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (!logChannel) return;
    
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        start: '🚀',
        stop: '🛑'
    };
    
    const colors = {
        info: '#3498db',
        success: '#00ff00',
        error: '#ff0000',
        warning: '#FFA500',
        start: '#9b59b6',
        stop: '#95a5a6'
    };
    
    const embed = new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setDescription(`${emojis[type] || 'ℹ️'} ${message}`)
        .setTimestamp();
    
    try {
        // Si c'est une erreur critique et qu'on a un admin, le mentionner
        if (type === 'error' && ADMIN_USER_ID) {
            await logChannel.send({ 
                content: `<@${ADMIN_USER_ID}> ⚠️ **ALERTE ERREUR**`,
                embeds: [embed] 
            });
        } else {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Erreur envoi log:', error.message);
    }
}

// Commandes Slash
const commands = [
    new SlashCommandBuilder()
        .setName('test')
        .setDescription('🧪 Lance immédiatement un cycle d\'analyse (pour tests)'),
    new SlashCommandBuilder()
        .setName('stock')
        .setDescription('📊 Analyse une action spécifique')
        .addStringOption(option =>
            option.setName('symbol')
                .setDescription('Symbole de l\'action (ex: NVDA, TSLA, AI.PA)')
                .setRequired(true))
].map(command => command.toJSON());

// Fonction pour récupérer le taux de change EUR/USD en temps réel
async function getEURtoUSDRate() {
    try {
        const forexQuote = await yahooFinance.quote('EURUSD=X');
        let rate = forexQuote.regularMarketPrice;
        
        console.log(`💱 Taux EURUSD=X récupéré: ${rate}`);
        
        // Le taux EUR/USD réel (décembre 2024) devrait être entre 1.02 et 1.08
        if (rate >= 1.02 && rate <= 1.08) {
            console.log(`✅ Taux EUR/USD validé: ${rate}`);
            sendLog(`💱 Taux EUR/USD: ${rate.toFixed(4)} (1 EUR = ${rate.toFixed(4)} USD) ✅`, 'success');
            return rate;
        } else {
            // Taux invalide, utiliser le fallback
            console.log(`❌ Taux EURUSD=X aberrant: ${rate} (attendu: 1.02-1.08)`);
            sendLog(`❌ Taux EURUSD=X invalide: ${rate.toFixed(4)} → Utilisation taux fixe 1.0383`, 'error');
            return 1.0383; // Taux EUR/USD du 20 décembre 2024
        }
    } catch (error) {
        console.error('❌ Erreur récupération taux EUR/USD:', error.message);
        sendLog(`⚠️ Erreur API → Utilisation taux fixe 1.0383 (20/12/2024)`, 'warning');
        return 1.0383;
    }
}

// Fonction pour récupérer les données de marché
async function getStockData(symbol) {
    try {
        const quote = await yahooFinance.quote(symbol);
        
        return {
            c: quote.regularMarketPrice,           // Prix actuel
            pc: quote.regularMarketPreviousClose,  // Prix de clôture précédent
            h: quote.regularMarketDayHigh,         // Plus haut du jour
            l: quote.regularMarketDayLow,          // Plus bas du jour
            name: quote.longName || quote.shortName || symbol,
            currency: quote.currency || 'USD'      // Devise du prix (EUR, USD, GBP, etc.)
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer le prix maximum historique (All-Time High)
async function getAllTimeHigh(symbol) {
    try {
        // Récupérer 5 ans de données historiques
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);
        
        const historicalData = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1wk' // Données hebdomadaires pour réduire la charge
        });
        
        if (historicalData && historicalData.length > 0) {
            const maxPrice = Math.max(...historicalData.map(d => d.high));
            console.log(`✅ ATH trouvé pour ${symbol}: $${maxPrice.toFixed(2)}`);
            return maxPrice;
        }
        
        console.log(`⚠️ Pas de données ATH pour ${symbol}`);
        return null;
    } catch (error) {
        console.error(`❌ Erreur récupération ATH pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer les données historiques
async function getHistoricalData(symbol, days = 30) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        const historicalData = await yahooFinance.historical(symbol, {
            period1: startDate,
            period2: endDate,
            interval: '1d' // Données quotidiennes
        });
        
        if (historicalData && historicalData.length > 0) {
            // Convertir au format compatible avec les fonctions existantes
            return {
                c: historicalData.map(d => d.close),
                h: historicalData.map(d => d.high),
                l: historicalData.map(d => d.low),
                o: historicalData.map(d => d.open),
                t: historicalData.map(d => Math.floor(d.date.getTime() / 1000)),
                s: 'ok'
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Erreur historique pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour calculer la tendance sur 6 mois
function calculateTrend(historicalData) {
    if (!historicalData || !historicalData.c || historicalData.c.length < 30) {
        return { trend: 'Données insuffisantes', emoji: '❓', score: 0 };
    }
    
    const prices = historicalData.c;
    const firstMonth = prices.slice(0, 30).reduce((a, b) => a + b, 0) / 30; // Moyenne 1er mois
    const lastMonth = prices.slice(-30).reduce((a, b) => a + b, 0) / 30; // Moyenne dernier mois
    
    const changePercent = ((lastMonth - firstMonth) / firstMonth) * 100;
    
    if (changePercent > 15) {
        return { trend: 'Très Haussière', emoji: '🚀', score: 2 };
    } else if (changePercent > 5) {
        return { trend: 'Haussière', emoji: '📈', score: 1 };
    } else if (changePercent < -15) {
        return { trend: 'Très Baissière', emoji: '💥', score: -2 };
    } else if (changePercent < -5) {
        return { trend: 'Baissière', emoji: '📉', score: -1 };
    } else {
        return { trend: 'Neutre/Latérale', emoji: '➡️', score: 0 };
    }
}

// Fonction pour calculer la volatilité (écart-type des variations)
function calculateVolatility(historicalData) {
    if (!historicalData || !historicalData.c || historicalData.c.length < 30) {
        return { volatility: 'Inconnue', emoji: '❓', level: 'N/A', score: 0 };
    }
    
    const prices = historicalData.c;
    const returns = [];
    
    // Calculer les variations quotidiennes en %
    for (let i = 1; i < prices.length; i++) {
        const dailyReturn = ((prices[i] - prices[i-1]) / prices[i-1]) * 100;
        returns.push(dailyReturn);
    }
    
    // Calculer l'écart-type (volatilité)
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    
    let level, emoji;
    if (stdDev < 1.5) {
        level = 'Très Faible';
        emoji = '🟢';
    } else if (stdDev < 2.5) {
        level = 'Faible';
        emoji = '🔵';
    } else if (stdDev < 3.5) {
        level = 'Moyenne';
        emoji = '🟡';
    } else if (stdDev < 5) {
        level = 'Élevée';
        emoji = '🟠';
    } else {
        level = 'Très Élevée';
        emoji = '🔴';
    }
    
    return { 
        volatility: `${stdDev.toFixed(2)}%`, 
        emoji, 
        level,
        score: stdDev 
    };
}

// Fonction pour générer une recommandation intelligente
function getSmartRecommendation(trendData, volatilityData, distanceFromATH, currentPrice) {
    let score = 0;
    
    // Score basé sur la tendance (60% du poids)
    score += trendData.score * 3;
    
    // Score basé sur la distance du ATH (30% du poids)
    if (distanceFromATH < -40) {
        score += 2; // Très loin du ATH = opportunité
    } else if (distanceFromATH < -25) {
        score += 1;
    } else if (distanceFromATH > -5) {
        score -= 2; // Proche du ATH = risque
    } else if (distanceFromATH > -15) {
        score -= 1;
    }
    
    // Pénalité pour volatilité élevée (10% du poids)
    if (volatilityData.score > 4) {
        score -= 1;
    }
    
    // Générer la recommandation
    let recommendation, emoji, color;
    
    if (score >= 5) {
        recommendation = '🟢 ACHETER FORT';
        emoji = '💰';
        color = '#00ff00';
    } else if (score >= 2) {
        recommendation = '🔵 ACHETER';
        emoji = '✅';
        color = '#4169E1';
    } else if (score >= -2) {
        recommendation = '🟡 ATTENDRE';
        emoji = '⏳';
        color = '#FFD700';
    } else if (score >= -5) {
        recommendation = '🟠 ÉVITER';
        emoji = '⚠️';
        color = '#FFA500';
    } else {
        recommendation = '🔴 VENDRE';
        emoji = '❌';
        color = '#ff0000';
    }
    
    return { recommendation, emoji, color, score };
}

client.once('ready', async () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    sendLog(`Bot connecté en tant que **${client.user.tag}**`, 'start');
    
    // Mise à jour du statut
    client.user.setActivity('les marchés 📈', { type: 'WATCHING' });
    
    // Enregistrement des commandes slash
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    
    (async () => {
        try {
            console.log('📝 Enregistrement des commandes slash...');
            await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands }
            );
            console.log('✅ Commandes slash enregistrées!');
            sendLog('Commandes slash enregistrées avec succès', 'success');
        } catch (error) {
            console.error('❌ Erreur enregistrement:', error);
            sendLog(`Erreur enregistrement commandes: ${error.message}`, 'error');
        }
    })();
    
    // Initialiser Groq AI (GRATUIT)
    const geminiEnabled = initializeGemini(process.env.GEMINI_API_KEY);
    if (geminiEnabled) {
        sendLog('🤖 Groq AI activé - Llama 3.3 70B (100% gratuit)', 'success');
    }
    
    // 🔥 ALERTES AUTOMATIQUES TOUTES LES HEURES 🔥
    console.log('🤖 Système d\'alertes automatiques activé - Envoi toutes les heures pile');
    sendLog('🤖 Système d\'alertes automatiques activé - Cycle à chaque heure pile', 'info');
    
    // Première analyse immédiate au démarrage
    await sendAutomaticAlerts();
    
    // Calculer le délai jusqu'à la prochaine heure pile
    const now = new Date();
    const minutesUntilNextHour = 60 - now.getMinutes();
    const secondsUntilNextHour = 60 - now.getSeconds();
    const msUntilNextHour = (minutesUntilNextHour - 1) * 60000 + secondsUntilNextHour * 1000;
    
    console.log(`⏰ Prochain cycle dans ${minutesUntilNextHour} minutes (à ${now.getHours() + 1}h00)`);
    sendLog(`⏰ Prochain cycle programmé à ${(now.getHours() + 1) % 24}h00`, 'info');
    
    // Attendre jusqu'à la prochaine heure pile, puis lancer un cycle toutes les heures
    setTimeout(() => {
        sendAutomaticAlerts(); // Premier cycle à l'heure pile
        
        // Puis toutes les heures exactement
        setInterval(async () => {
            await sendAutomaticAlerts();
        }, 3600000); // 1 heure = 3600000
    }, msUntilNextHour);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        await interaction.deferReply();

        switch (commandName) {
            case 'test':
                await handleTest(interaction);
                break;
            case 'stock':
                await handleStock(interaction);
                break;
        }
    } catch (error) {
        console.error(`Erreur commande ${commandName}:`, error);
        await interaction.editReply('❌ Une erreur est survenue lors du traitement de votre commande.');
    }
});

async function handleTest(interaction) {
    const userId = interaction.user.id;
    
    // Vérifier le cooldown (sauf pour l'admin)
    if (userId !== ADMIN_USER_ID) {
        const now = Date.now();
        const cooldownExpiration = cooldowns.get(userId);
        
        if (cooldownExpiration && now < cooldownExpiration) {
            const timeLeft = Math.round((cooldownExpiration - now) / 1000);
            await interaction.editReply(`⏳ Vous devez attendre encore **${timeLeft} secondes** avant d'utiliser cette commande.`);
            return;
        }
        
        // Définir le nouveau cooldown
        cooldowns.set(userId, now + COOLDOWN_TIME);
        
        // Nettoyer le cooldown après expiration
        setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);
    }
    
    await interaction.editReply('🧪 **Test lancé!** Envoi du cycle d\'analyse en cours...');
    
    sendLog('🧪 Cycle de test lancé manuellement (bypass mode nuit)', 'info');
    
    // Lancer immédiatement le cycle d'alertes (force l'exécution même la nuit)
    await sendAutomaticAlerts(true);
    
    await interaction.followUp('✅ Cycle d\'analyse terminé! Consultez le canal des alertes.');
}

async function handleStock(interaction) {
    const userId = interaction.user.id;
    const symbol = interaction.options.getString('symbol').toUpperCase();
    
    // Vérifier le cooldown (sauf pour l'admin)
    if (userId !== ADMIN_USER_ID) {
        const now = Date.now();
        const cooldownExpiration = cooldowns.get(userId);
        
        if (cooldownExpiration && now < cooldownExpiration) {
            const timeLeft = Math.round((cooldownExpiration - now) / 1000);
            await interaction.editReply(`⏳ Vous devez attendre encore **${timeLeft} secondes** avant d'utiliser cette commande.`);
            return;
        }
        
        // Définir le nouveau cooldown
        cooldowns.set(userId, now + COOLDOWN_TIME);
        
        // Nettoyer le cooldown après expiration
        setTimeout(() => cooldowns.delete(userId), COOLDOWN_TIME);
    }
    
    await interaction.editReply(`📊 Analyse de **${symbol}** en cours...`);
    
    try {
        // Récupérer le taux EUR/USD (ex: 1.05 = 1 EUR = 1.05 USD)
        const eurToUsdRate = await getEURtoUSDRate();
        
        // Récupérer les données de l'action
        const [stockData, ath, historicalData] = await Promise.all([
            getStockData(symbol),
            getAllTimeHigh(symbol),
            getHistoricalData(symbol, 180)
        ]);
        
        if (!stockData || !stockData.c) {
            await interaction.editReply(`❌ Impossible de trouver l'action **${symbol}**. Vérifiez le symbole (ex: NVDA, TSLA, AAPL, AI.PA)`);
            return;
        }
        
        // Calculs techniques
        const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
        const emoji = changePercent >= 0 ? '📈' : '📉';
        
        const trendData = calculateTrend(historicalData);
        const volatilityData = calculateVolatility(historicalData);
        const distanceFromATH = ath ? (((stockData.c - ath) / ath) * 100).toFixed(2) : -50;
        
        const smartReco = getSmartRecommendation(trendData, volatilityData, parseFloat(distanceFromATH), stockData.c);
        
        // Gestion de la devise
        const currency = stockData.currency;
        let priceDisplay, priceForAI;
        
        console.log(`💱 Conversion pour ${symbol}: Prix brut = ${stockData.c} ${currency}, Taux EUR/USD = ${eurToUsdRate}`);
        sendLog(`🔍 **${symbol}** - Prix API: **${stockData.c.toFixed(2)} ${currency}** | Taux: ${eurToUsdRate.toFixed(4)}`, 'info');
        
        if (currency === 'EUR') {
            // Si prix en EUR, convertir en USD : EUR * eurToUsdRate
            const priceInUSD = (stockData.c * eurToUsdRate).toFixed(2);
            priceDisplay = `${stockData.c.toFixed(2)}€ ($${priceInUSD})`;
            priceForAI = stockData.c.toFixed(2);
            console.log(`   → Affichage EUR: ${priceDisplay}`);
            sendLog(`✅ Affichage **${symbol}**: ${priceDisplay}`, 'success');
        } else if (currency === 'USD') {
            // Si prix en USD, convertir en EUR : USD / eurToUsdRate
            const priceInEUR = (stockData.c / eurToUsdRate).toFixed(2);
            priceDisplay = `$${stockData.c.toFixed(2)} (${priceInEUR}€)`;
            priceForAI = priceInEUR;
            console.log(`   → Affichage USD: ${priceDisplay}`);
            sendLog(`✅ Affichage **${symbol}**: ${priceDisplay}`, 'success');
        } else {
            priceDisplay = `${stockData.c.toFixed(2)} ${currency}`;
            priceForAI = stockData.c.toFixed(2);
            console.log(`   → Autre devise: ${priceDisplay}`);
            sendLog(`✅ Affichage **${symbol}**: ${priceDisplay}`, 'success');
        }
        
        // Analyse IA
        const aiAnalysis = await analyzeWithAI(stockData, symbol, stockData.name, trendData, volatilityData, distanceFromATH, priceForAI, currency);
        
        // Signal 24h
        let signal = '⚪ Stable';
        if (changePercent > 5) signal = '🚀 Très Haussier';
        else if (changePercent > 2) signal = '📈 Haussier';
        else if (changePercent > 0.5) signal = '➕ Légèrement Positif';
        else if (changePercent < -5) signal = '💥 Très Baissier';
        else if (changePercent < -2) signal = '📉 Baissier';
        else if (changePercent < -0.5) signal = '➖ Légèrement Négatif';
        
        const color = smartReco.color;
        
        const fields = [
            { name: '💰 Prix Actuel', value: priceDisplay, inline: true },
            { name: '📊 Variation 24h', value: `${changePercent}%`, inline: true },
            { name: '🎯 Signal 24h', value: signal, inline: true },
            { name: `${trendData.emoji} Tendance 6 mois`, value: trendData.trend, inline: true },
            { name: `${volatilityData.emoji} Volatilité`, value: `${volatilityData.level} (${volatilityData.volatility})`, inline: true },
            { name: '🏆 Distance ATH', value: ath ? `${distanceFromATH}%` : 'N/A', inline: true }
        ];
        
        if (aiAnalysis.enabled && aiAnalysis.analysis) {
            fields.push({ 
                name: '🤖 Conseil IA Timing', 
                value: aiAnalysis.analysis
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`${emoji} ${stockData.name} (${symbol})`)
            .addFields(fields)
            .setTimestamp()
            .setFooter({ text: '📊 Analyse Technique 6 mois • 🤖 IA Groq' });
        
        await interaction.editReply({ content: '✅ Analyse terminée:', embeds: [embed] });
        
    } catch (error) {
        console.error(`❌ Erreur analyse ${symbol}:`, error);
        await interaction.editReply(`❌ Erreur lors de l'analyse de **${symbol}**: ${error.message}`);
    }
}

async function sendAutomaticAlerts(forceRun = false) {
    // Vérifier l'heure (fuseau horaire local)
    const now = new Date();
    const hour = now.getHours();
    
    // Bloquer les alertes automatiques entre 22h et 6h (sauf si forceRun = true pour /test)
    if (!forceRun && (hour >= 22 || hour < 6)) {
        console.log(`🌙 Mode nuit activé (${hour}h) - Alertes automatiques désactivées jusqu'à 7h`);
        sendLog(`🌙 Alertes automatiques ignorées (${hour}h) - Mode nuit actif`, 'info');
        return;
    }
    
    const channel = client.channels.cache.get(ALERT_CHANNEL_ID);
    
    if (!channel) {
        console.error('❌ Canal d\'alertes introuvable. Vérifiez ALERT_CHANNEL_ID dans .env');
        return;
    }
    
    // Vos actions personnalisées à surveiller
    const stocksToWatch = [
        { symbol: 'URTH', name: 'iShares MSCI World ETF' },  // Equivalent Core MSCI World
        { symbol: 'MCD', name: 'McDonald\'s' },
        { symbol: 'TTWO', name: 'Take-Two Interactive' },
        { symbol: 'NVDA', name: 'NVIDIA' },
        { symbol: 'TSLA', name: 'Tesla' },
        { symbol: 'AMZN', name: 'Amazon' },
        { symbol: 'AI.PA', name: 'Air Liquide' }
    ];
    
    console.log(`\n📊 ========== CYCLE D'ANALYSE AUTOMATIQUE ==========`);
    sendLog('📊 Début du cycle d\'analyse automatique', 'info');
    
    // Récupérer le taux EUR/USD une seule fois pour tout le cycle
    const eurToUsdRate = await getEURtoUSDRate();
    console.log(`💱 Taux EUR/USD: ${eurToUsdRate} (1 EUR = ${eurToUsdRate} USD)`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Analyser TOUTES les actions de votre liste
    for (const stock of stocksToWatch) {
        try {
            console.log(`📊 Analyse de ${stock.name} (${stock.symbol})...`);
            
            // Récupérer les données actuelles + ATH + historique 6 mois
            const [stockData, ath, historicalData] = await Promise.all([
                getStockData(stock.symbol),
                getAllTimeHigh(stock.symbol),
                getHistoricalData(stock.symbol, 180) // 6 mois = 180 jours
            ]);
            
            if (!stockData || !stockData.c) {
                console.log(`⚠️ Pas de données pour ${stock.symbol}`);
                continue; // Passer à l'action suivante
            }
            
            // Calcul de la variation 24h
            const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
            const emoji = changePercent >= 0 ? '📈' : '📉';
            
            // Analyse technique sur 6 mois
            const trendData = calculateTrend(historicalData);
            const volatilityData = calculateVolatility(historicalData);
            console.log(`📈 Tendance 6 mois: ${trendData.trend}, Volatilité: ${volatilityData.level}`);
            
            // Calcul de la distance par rapport au ATH
            const distanceFromATH = ath ? (((stockData.c - ath) / ath) * 100).toFixed(2) : -50;
            
            // Générer la recommandation intelligente
            const smartReco = getSmartRecommendation(trendData, volatilityData, parseFloat(distanceFromATH), stockData.c);
            console.log(`💡 Recommandation: ${smartReco.recommendation}`);
            
            // Récupérer la devise du prix depuis Yahoo Finance
            const currency = stockData.currency; // EUR, USD, GBP, etc.
            console.log(`💱 Conversion pour ${stock.symbol}: Prix brut = ${stockData.c} ${currency}, Taux EUR/USD = ${eurToUsdRate}`);
            sendLog(`🔍 **${stock.symbol}** - Prix API: **${stockData.c.toFixed(2)} ${currency}**`, 'info');
            
            // Convertir le prix pour l'affichage
            let priceDisplay, priceForAI;
            if (currency === 'EUR') {
                // Si prix en EUR, convertir en USD : EUR * eurToUsdRate
                const priceInUSD = (stockData.c * eurToUsdRate).toFixed(2);
                priceDisplay = `${stockData.c.toFixed(2)}€ ($${priceInUSD})`;
                priceForAI = stockData.c.toFixed(2);
                console.log(`   → Affichage EUR: ${priceDisplay}`);
                sendLog(`💶 **${stock.symbol}**: ${priceDisplay}`, 'info');
            } else if (currency === 'USD') {
                // Si prix en USD, convertir en EUR : USD / eurToUsdRate
                const priceInEUR = (stockData.c / eurToUsdRate).toFixed(2);
                priceDisplay = `$${stockData.c.toFixed(2)} (${priceInEUR}€)`;
                priceForAI = priceInEUR;
                console.log(`   → Affichage USD: ${priceDisplay}`);
                sendLog(`💵 **${stock.symbol}**: ${priceDisplay}`, 'info');
            } else {
                // Autre devise (GBP, JPY, etc.) : afficher telle quelle
                priceDisplay = `${stockData.c.toFixed(2)} ${currency}`;
                priceForAI = stockData.c.toFixed(2);
                console.log(`   → Autre devise: ${priceDisplay}`);
                sendLog(`💴 **${stock.symbol}**: ${priceDisplay}`, 'info');
            }
            
            // Analyse avec IA avec contexte complet (optionnel pour conseil timing)
            const aiAnalysis = await analyzeWithAI(stockData, stock.symbol, stock.name, trendData, volatilityData, distanceFromATH, priceForAI, currency);
            console.log(`🤖 IA activée: ${aiAnalysis.enabled}`);
            
            // Définir signal et couleur basés sur variation 24h
            let signal = '⚪ Stable';
            if (changePercent > 5) {
                signal = '🚀 Très Haussier';
            } else if (changePercent > 2) {
                signal = '📈 Haussier';
            } else if (changePercent > 0.5) {
                signal = '➕ Légèrement Positif';
            } else if (changePercent < -5) {
                signal = '💥 Très Baissier';
            } else if (changePercent < -2) {
                signal = '📉 Baissier';
            } else if (changePercent < -0.5) {
                signal = '➖ Légèrement Négatif';
            }
            
            // Utiliser la couleur de la recommandation intelligente
            const color = smartReco.color;
            
            const fields = [
                { name: '💰 Prix Actuel', value: priceDisplay, inline: true },
                { name: '📊 Variation 24h', value: `${changePercent}%`, inline: true },
                { name: '🎯 Signal 24h', value: signal, inline: true },
                { name: `${trendData.emoji} Tendance 6 mois`, value: trendData.trend, inline: true },
                { name: `${volatilityData.emoji} Volatilité`, value: `${volatilityData.level} (${volatilityData.volatility})`, inline: true },
                { name: '🏆 Distance ATH', value: ath ? `${distanceFromATH}%` : 'N/A', inline: true }
            ];
            
            // Ajouter l'analyse IA si disponible
            if (aiAnalysis.enabled && aiAnalysis.analysis) {
                fields.push({ 
                    name: '🤖 Conseil IA Timing', 
                    value: aiAnalysis.analysis
                });
            }
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} ${stock.name} (${stock.symbol})`)
                .addFields(fields)
                .setTimestamp()
                .setFooter({ text: '📊 Analyse Technique 6 mois • 🤖 IA Groq' });
            
            await channel.send({ embeds: [embed] });
            console.log(`✅ Alerte envoyée pour ${stock.symbol}`);
            successCount++;
            
            // Pause de 0 seconde entre chaque action pour ne pas spam
            await new Promise(resolve => setTimeout(resolve, 0));
            
        } catch (error) {
            console.error(`❌ Erreur pour ${stock.symbol}:`, error.message);
            sendLog(`❌ Erreur analyse ${stock.symbol}: ${error.message}`, 'error');
            errorCount++;
        }
    }
    
    console.log(`✅ ========== CYCLE TERMINÉ ==========\n`);
    sendLog(`✅ Cycle terminé: ${successCount} succès, ${errorCount} erreurs`, successCount > 0 ? 'success' : 'warning');
}

client.login(process.env.DISCORD_TOKEN);
