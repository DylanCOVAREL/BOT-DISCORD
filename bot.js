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
        .setDescription('🧪 Lance immédiatement un cycle d\'analyse (pour tests)')
].map(command => command.toJSON());

// Fonction pour récupérer le taux de change USD/EUR en temps réel
async function getUSDtoEURRate() {
    try {
        const quote = await yahooFinance.quote('EURUSD=X');
        return quote.regularMarketPrice; // Taux EUR/USD actuel
    } catch (error) {
        console.error('Erreur récupération taux EUR/USD:', error.message);
        return 0.92; // Fallback si l'API échoue
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
            name: quote.longName || quote.shortName || symbol
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
    console.log('🤖 Système d\'alertes automatiques activé - Envoi toutes les heures');
    sendLog('🤖 Système d\'alertes automatiques activé - Cycle toutes les heures', 'info');
    
    // Première analyse immédiate au démarrage
    await sendAutomaticAlerts();
    
    // Puis toutes les heures
    setInterval(async () => {
        await sendAutomaticAlerts();
    }, 3600000); // 1 heure = 3600000
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
        }
    } catch (error) {
        console.error(`Erreur commande ${commandName}:`, error);
        await interaction.editReply('❌ Une erreur est survenue lors du traitement de votre commande.');
    }
});

async function handleTest(interaction) {
    await interaction.editReply('🧪 **Test lancé!** Envoi du cycle d\'analyse en cours...');
    
    sendLog('🧪 Cycle de test lancé manuellement (bypass mode nuit)', 'info');
    
    // Lancer immédiatement le cycle d'alertes (force l'exécution même la nuit)
    await sendAutomaticAlerts(true);
    
    await interaction.followUp('✅ Cycle d\'analyse terminé! Consultez le canal des alertes.');
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
    
    // Récupérer le taux USD/EUR une seule fois pour tout le cycle
    const usdToEurRate = await getUSDtoEURRate();
    console.log(`💱 Taux USD/EUR: ${usdToEurRate}`);
    
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
            
            // Analyse avec IA (optionnel pour contexte supplémentaire)
            const aiAnalysis = await analyzeWithAI(stockData, stock.symbol, stock.name);
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
            
            // Conversion USD vers EUR avec taux en temps réel
            const priceEUR = (stockData.c * usdToEurRate).toFixed(2);
            
            const fields = [
                { name: '💰 Prix Actuel', value: `$${stockData.c} (${priceEUR}€)`, inline: true },
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
