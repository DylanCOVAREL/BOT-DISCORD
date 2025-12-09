const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
const dotenv = require('dotenv');
const axios = require('axios');
const { initializeGemini, analyzeWithAI } = require('./aiAnalysis');

dotenv.config();

// Keep-Alive pour Glitch.com (empêche la mise en veille)
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200);
  res.end('🤖 Bot Trading Discord is alive!');
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
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
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

// Fonction pour récupérer les données de marché
async function getStockData(symbol) {
    try {
        const [quote, profile] = await Promise.all([
            axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`),
            axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`)
        ]);
        
        return {
            ...quote.data,
            ...profile.data,
            ath: profile.data.ath || quote.data.h // All-Time High
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer le prix maximum historique (All-Time High)
async function getAllTimeHigh(symbol) {
    try {
        // Récupérer 5 ans de données (max pour Finnhub gratuit)
        const to = Math.floor(Date.now() / 1000);
        const from = to - (1825 * 24 * 60 * 60); // 5 ans
        
        const response = await axios.get(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=W&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        );
        
        if (response.data && response.data.h && response.data.h.length > 0 && response.data.s === 'ok') {
            const maxPrice = Math.max(...response.data.h);
            console.log(`✅ ATH trouvé pour ${symbol}: $${maxPrice.toFixed(2)}`);
            return maxPrice;
        }
        
        console.log(`⚠️ Pas de données ATH pour ${symbol}, utilisation du plus haut du jour`);
        return null;
    } catch (error) {
        console.error(`❌ Erreur récupération ATH pour ${symbol}:`, error.message);
        return null;
    }
}

// Fonction pour récupérer les données historiques
async function getHistoricalData(symbol, days = 30) {
    try {
        const to = Math.floor(Date.now() / 1000);
        const from = to - (days * 24 * 60 * 60);
        
        const response = await axios.get(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        );
        
        return response.data;
    } catch (error) {
        console.error(`Erreur historique pour ${symbol}:`, error.message);
        return null;
    }
}

client.once('ready', () => {
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
        sendLog('🤖 Groq AI activé - Llama 3.1 70B (100% gratuit)', 'success');
    }
    
    // 🔥 ALERTES AUTOMATIQUES TOUTES LES HEURES 🔥
    console.log('🤖 Système d\'alertes automatiques activé - Envoi toutes les heures');
    sendLog('🤖 Système d\'alertes automatiques activé - Cycle toutes les heures', 'info');
    
    // Première analyse immédiate au démarrage
    await sendAutomaticAlerts();
    
    // Puis toutes les heures
    setInterval(async () => {
        await sendAutomaticAlerts();
    }, 3600000); // 1 heure
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
    
    // Bloquer les alertes automatiques entre 23h et 7h (sauf si forceRun = true pour /test)
    if (!forceRun && (hour >= 23 || hour < 7)) {
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
        { symbol: 'AMZN', name: 'Amazon' }
    ];
    
    console.log(`\n📊 ========== CYCLE D'ANALYSE AUTOMATIQUE ==========`);
    sendLog('📊 Début du cycle d\'analyse automatique', 'info');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Analyser TOUTES les actions de votre liste
    for (const stock of stocksToWatch) {
        try {
            console.log(`📊 Analyse de ${stock.name} (${stock.symbol})...`);
            
            // Récupérer les données actuelles + ATH
            const [stockData, ath] = await Promise.all([
                getStockData(stock.symbol),
                getAllTimeHigh(stock.symbol)
            ]);
            
            if (!stockData || !stockData.c) {
                console.log(`⚠️ Pas de données pour ${stock.symbol}`);
                continue; // Passer à l'action suivante
            }
            
            // Calcul simplifié sans données historiques pour économiser les appels API
            const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
            const emoji = changePercent >= 0 ? '📈' : '📉';
            
            // Calcul de la distance par rapport au ATH
            const distanceFromATH = ath ? (((stockData.c - ath) / ath) * 100).toFixed(2) : null;
            
            // Analyse avec Google Gemini AI (GRATUIT)
            const aiAnalysis = await analyzeWithAI(stockData, stock.symbol, stock.name);
            console.log(`🤖 IA activée: ${aiAnalysis.enabled}, Analyse: ${aiAnalysis.analysis.substring(0, 50)}...`);
            
            // Utiliser l'analyse IA
            const recommendation = aiAnalysis.analysis;
            
            // Analyse simplifiée basée sur le changement de prix
            let signal = '⚪ Stable';
            let color = '#FFD700';
            
            if (changePercent > 5) {
                signal = '🚀 Très Haussier';
                color = '#00ff00';
            } else if (changePercent > 2) {
                signal = '📈 Haussier';
                color = '#90EE90';
            } else if (changePercent > 0.5) {
                signal = '➕ Légèrement Positif';
                color = '#B8E6B8';
            } else if (changePercent < -5) {
                signal = '💥 Très Baissier';
                color = '#ff0000';
            } else if (changePercent < -2) {
                signal = '📉 Baissier';
                color = '#FFA500';
            } else if (changePercent < -0.5) {
                signal = '➖ Légèrement Négatif';
                color = '#FFD580';
            }
            
            const fields = [
                { name: '💰 Prix Actuel', value: `$${stockData.c}`, inline: true },
                { name: '📊 Variation 24h', value: `${changePercent}%`, inline: true },
                { name: '🎯 Signal', value: signal, inline: true }
            ];
            
            // Toujours afficher le ATH (ou le plus haut du jour si indisponible)
            if (ath && ath > stockData.h) {
                fields.push({ 
                    name: '🏆 Plus Haut Historique (5 ans)', 
                    value: `$${ath.toFixed(2)} (${distanceFromATH}%)`, 
                    inline: true 
                });
            } else {
                // Fallback: utiliser le plus haut du jour
                const dayHigh = stockData.h;
                const distanceFromDayHigh = (((stockData.c - dayHigh) / dayHigh) * 100).toFixed(2);
                fields.push({ 
                    name: '🏆 Plus Haut (5 ans)', 
                    value: ath ? `$${ath.toFixed(2)} (${distanceFromATH}%)` : `$${dayHigh.toFixed(2)} (${distanceFromDayHigh}%)`, 
                    inline: true 
                });
            }
            
            fields.push({ 
                name: '🤖 Recommandation IA', 
                value: recommendation 
            });
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} ${stock.name} (${stock.symbol})`)
                .setDescription(`Analyse automatique • ${stockData.name || stock.symbol}`)
                .addFields(fields)
                .setTimestamp()
                .setFooter({ text: '🤖 Analyse IA Groq • Gratuit' });
            
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
