const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({
    suppressNotices: ['yahooSurvey']
});

async function testYahoo() {
    try {
        console.log('Test données historiques MCD:');
        
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 180); // 6 mois
        
        const historicalData = await yahooFinance.historical('MCD', {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        });
        
        console.log('Nombre de jours reçus:', historicalData ? historicalData.length : 0);
        if (historicalData && historicalData.length > 0) {
            console.log('Premier jour:', historicalData[0]);
            console.log('Dernier jour:', historicalData[historicalData.length - 1]);
        }
        
        console.log('\nTest ATH (5 ans):');
        const startDate5y = new Date();
        startDate5y.setFullYear(startDate5y.getFullYear() - 5);
        
        const historical5y = await yahooFinance.historical('MCD', {
            period1: startDate5y,
            period2: endDate,
            interval: '1wk'
        });
        
        console.log('Nombre de semaines reçues:', historical5y ? historical5y.length : 0);
        if (historical5y && historical5y.length > 0) {
            const maxPrice = Math.max(...historical5y.map(d => d.high));
            console.log('ATH trouvé:', maxPrice);
        }
        
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error('Stack:', error.stack);
    }
}

testYahoo();
