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
            ...profile.data
        };
    } catch (error) {
        console.error(`Erreur lors de la récupération des données pour ${symbol}:`, error.message);
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
    
    // Initialiser Google Gemini AI (GRATUIT)
    const geminiEnabled = initializeGemini(process.env.GEMINI_API_KEY);
    if (geminiEnabled) {
        sendLog('🤖 Google Gemini AI activé (100% gratuit)', 'success');
    }
    
    // 🔥 ALERTES AUTOMATIQUES TOUTES LES 30 MINUTES 🔥
    console.log('🤖 Système d\'alertes automatiques activé - Envoi toutes les 30 minutes');
    sendLog('🤖 Système d\'alertes automatiques activé - Cycle toutes les 30 minutes', 'info');
    setInterval(async () => {
        await sendAutomaticAlerts();
    }, 1800000); // 30 minutes
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
    
    sendLog('🧪 Cycle de test lancé manuellement', 'info');
    
    // Lancer immédiatement le cycle d'alertes
    await sendAutomaticAlerts();
    
    await interaction.followUp('✅ Cycle d\'analyse terminé! Consultez le canal des alertes.');
}

async function sendAutomaticAlerts() {
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
            
            // Récupérer uniquement les données actuelles (1 appel API)
            const stockData = await getStockData(stock.symbol);
            if (!stockData || !stockData.c) {
                console.log(`⚠️ Pas de données pour ${stock.symbol}`);
                continue; // Passer à l'action suivante
            }
            
            // Calcul simplifié sans données historiques pour économiser les appels API
            const changePercent = ((stockData.c - stockData.pc) / stockData.pc * 100).toFixed(2);
            const emoji = changePercent >= 0 ? '📈' : '📉';
            
            // Analyse avec Google Gemini AI (GRATUIT)
            const aiAnalysis = await analyzeWithAI(stockData, stock.symbol, stock.name);
            
            // Analyse simplifiée basée sur le changement de prix
            let signal = '🟡 Neutre';
            let recommendation = aiAnalysis.enabled ? aiAnalysis.analysis : '➡️ **SURVEILLER** - Analyser plus en détail avant d\'agir';
            let color = '#FFD700';
            
            if (changePercent > 3) {
                signal = '🟢 Achat Fort';
                color = '#00ff00';
            } else if (changePercent > 1) {
                signal = '🟢 Achat';
                color = '#90EE90';
            } else if (changePercent < -3) {
                signal = '🔴 Vente';
                color = '#ff0000';
            } else if (changePercent < -1) {
                signal = '🟠 Attention';
                color = '#FFA500';
            }
            
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`${emoji} ${stock.name} (${stock.symbol})`)
                .setDescription(`Analyse automatique • ${stockData.name || stock.symbol}`)
                .addFields(
                    { name: '💰 Prix Actuel', value: `$${stockData.c}`, inline: true },
                    { name: '📊 Variation 24h', value: `${changePercent}%`, inline: true },
                    { name: '🎯 Signal', value: signal, inline: true },
                    { name: '📈 Plus Haut (jour)', value: `$${stockData.h}`, inline: true },
                    { name: '📉 Plus Bas (jour)', value: `$${stockData.l}`, inline: true },
                    { name: '🔒 Clôture Préc.', value: `$${stockData.pc}`, inline: true },
                    { name: aiAnalysis.enabled ? '🤖 Analyse IA Gemini' : '💡 Recommandation', value: recommendation }
                )
                .setTimestamp()
                .setFooter({ text: aiAnalysis.enabled ? '🤖 Analyse IA Google Gemini • Gratuit' : '🤖 Alerte automatique • Cycle toutes les 30 minutes' });
            
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
