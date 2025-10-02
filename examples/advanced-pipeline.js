/**
 * Exemple avancé d'utilisation de Browser ETL
 * Ce fichier montre des cas d'usage complexes avec la librairie
 */

import { etl, PluginManager } from 'browser-etl';

// ============================================================================
// EXEMPLE 1: Dashboard météo avec enrichissement
// ============================================================================

async function weatherDashboard() {
  console.log('🌤️ Création du dashboard météo...');
  
  try {
    const result = await etl({
      enableCache: true,
      cacheDuration: 300000, // 5 minutes
      enableParallel: true,
      maxParallel: 5
    })
      .extract.api('https://api.example.com/cities')
      .join.api('https://api.weather.com/current', {
        key: 'city',
        mode: 'nested',
        type: 'inner'
      })
      .join.api('https://api.weather.com/forecast', {
        key: 'city',
        mode: 'nested',
        type: 'left'
      })
      .enrich(async (city) => {
        // Enrichissement avec données démographiques
        const response = await fetch(`https://api.demographics.com/city/${city.id}`);
        const demographics = await response.json();
        return { ...city, population: demographics.population };
      })
      .transform(data => data.filter(city => city.population > 100000))
      .map(city => ({
        ...city,
        weatherScore: calculateWeatherScore(city.current, city.forecast),
        riskLevel: assessWeatherRisk(city.current, city.forecast)
      }))
      .load.chart('bar', {
        x: 'city',
        y: 'weatherScore',
        title: 'Score météo par ville',
        backgroundColor: 'rgba(54, 162, 235, 0.2)'
      })
      .run();

    console.log('✅ Dashboard météo créé avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de la création du dashboard:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLE 2: Analyse de sentiment avec IA
// ============================================================================

async function sentimentAnalysis() {
  console.log('🤖 Analyse de sentiment en cours...');
  
  try {
    const result = await etl({
      enableStreaming: true,
      batchSize: 50,
      enableErrorRecovery: true,
      maxRetries: 3
    })
      .extract.api('https://api.example.com/reviews')
      .filter(review => review.text && review.text.length > 10)
      .enrich(async (review) => {
        // Appel à une API d'IA pour l'analyse de sentiment
        const aiResponse = await fetch('/api/ai/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: review.text })
        });
        
        if (!aiResponse.ok) {
          throw new Error(`Erreur API IA: ${aiResponse.status}`);
        }
        
        const analysis = await aiResponse.json();
        return {
          ...review,
          sentiment: analysis.sentiment,
          confidence: analysis.confidence,
          keywords: analysis.keywords
        };
      })
      .map(review => ({
        ...review,
        sentimentScore: mapSentimentToScore(review.sentiment),
        category: categorizeReview(review.sentiment, review.confidence)
      }))
      .load.chart('pie', {
        x: 'sentiment',
        y: 'count',
        title: 'Distribution des sentiments',
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',  // Négatif
          'rgba(54, 162, 235, 0.2)',  // Neutre
          'rgba(75, 192, 192, 0.2)'    // Positif
        ]
      })
      .run();

    console.log('✅ Analyse de sentiment terminée');
    return result;
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse de sentiment:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLE 3: Pipeline de données financières
// ============================================================================

async function financialDataPipeline() {
  console.log('💰 Pipeline de données financières...');
  
  try {
    const result = await etl({
      enableCache: true,
      cacheDuration: 60000, // 1 minute pour les données financières
      enableParallel: true,
      maxParallel: 3
    })
      .extract.api('https://api.finance.com/stocks')
      .join.api('https://api.finance.com/prices', {
        key: 'symbol',
        mode: 'nested'
      })
      .join.api('https://api.finance.com/analysts', {
        key: 'symbol',
        mode: 'nested'
      })
      .transform(data => data.filter(stock => stock.price > 10))
      .map(stock => ({
        ...stock,
        marketCap: stock.price * stock.shares,
        peRatio: stock.price / stock.earnings,
        recommendation: stock.analysts?.recommendation || 'HOLD',
        riskLevel: calculateRiskLevel(stock)
      }))
      .filter(stock => stock.peRatio > 0 && stock.peRatio < 50)
      .load.table('#stocks-table', {
        sortable: true,
        searchable: true,
        pagination: true,
        pageSize: 20
      })
      .run();

    console.log('✅ Pipeline financier terminé');
    return result;
  } catch (error) {
    console.error('❌ Erreur dans le pipeline financier:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLE 4: Plugin personnalisé
// ============================================================================

class CustomDataExtractor {
  name = 'custom-data';
  
  async extract(config) {
    const { source, format } = config;
    
    switch (source) {
      case 'local-file':
        return await this.extractFromLocalFile(format);
      case 'web-scraping':
        return await this.extractFromWebScraping(format);
      default:
        throw new Error(`Source non supportée: ${source}`);
    }
  }
  
  async extractFromLocalFile(format) {
    // Simulation d'extraction depuis un fichier local
    return [
      { id: 1, name: 'Donnée locale 1', value: 100 },
      { id: 2, name: 'Donnée locale 2', value: 200 }
    ];
  }
  
  async extractFromWebScraping(format) {
    // Simulation de web scraping
    return [
      { id: 1, name: 'Donnée web 1', value: 150 },
      { id: 2, name: 'Donnée web 2', value: 250 }
    ];
  }
  
  supports(config) {
    return config && config.source && ['local-file', 'web-scraping'].includes(config.source);
  }
}

class CustomTransformer {
  name = 'custom-transform';
  
  async transform(data, config) {
    const { operation, params } = config;
    
    switch (operation) {
      case 'normalize':
        return this.normalizeData(data, params);
      case 'aggregate':
        return this.aggregateData(data, params);
      default:
        throw new Error(`Opération non supportée: ${operation}`);
    }
  }
  
  normalizeData(data, params) {
    const { field, min, max } = params;
    return data.map(item => ({
      ...item,
      [field]: (item[field] - min) / (max - min)
    }));
  }
  
  aggregateData(data, params) {
    const { groupBy, aggregate } = params;
    const groups = {};
    
    data.forEach(item => {
      const key = item[groupBy];
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return Object.entries(groups).map(([key, items]) => ({
      [groupBy]: key,
      count: items.length,
      ...this.calculateAggregates(items, aggregate)
    }));
  }
  
  calculateAggregates(items, aggregate) {
    const result = {};
    aggregate.forEach(field => {
      const values = items.map(item => item[field]).filter(v => v != null);
      result[`${field}_avg`] = values.reduce((a, b) => a + b, 0) / values.length;
      result[`${field}_min`] = Math.min(...values);
      result[`${field}_max`] = Math.max(...values);
    });
    return result;
  }
  
  supports(config) {
    return config && config.operation && ['normalize', 'aggregate'].includes(config.operation);
  }
}

async function customPluginExample() {
  console.log('🔌 Exemple de plugin personnalisé...');
  
  const plugin = {
    name: 'custom-data-plugin',
    version: '1.0.0',
    
    async initialize() {
      console.log('Plugin personnalisé initialisé');
    },
    
    async cleanup() {
      console.log('Plugin personnalisé nettoyé');
    },
    
    getExtractors() {
      return [new CustomDataExtractor()];
    },
    
    getTransformers() {
      return [new CustomTransformer()];
    },
    
    getLoaders() {
      return [];
    }
  };
  
  const pluginManager = new PluginManager();
  await pluginManager.registerPlugin(plugin);
  
  try {
    const result = await etl()
      .extract('custom-data', { source: 'local-file', format: 'json' })
      .transform('custom-transform', {
        operation: 'normalize',
        params: { field: 'value', min: 0, max: 300 }
      })
      .load.table('#custom-table')
      .run();

    console.log('✅ Plugin personnalisé exécuté avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur avec le plugin personnalisé:', error);
    throw error;
  }
}

// ============================================================================
// EXEMPLE 5: Pipeline avec gestion d'erreurs avancée
// ============================================================================

async function robustPipeline() {
  console.log('🛡️ Pipeline robuste avec gestion d\'erreurs...');
  
  try {
    const result = await etl({
      enableErrorRecovery: true,
      maxRetries: 5,
      enableCache: true,
      cacheDuration: 300000
    })
      .extract.api('https://api.example.com/data')
      .transform(data => {
        // Transformation qui peut échouer
        if (!Array.isArray(data)) {
          throw new Error('Données invalides: attendu un tableau');
        }
        return data.map(item => ({
          ...item,
          processed: true,
          timestamp: new Date().toISOString()
        }));
      })
      .filter(item => item.processed)
      .load.file('processed-data.json', 'json')
      .run();

    console.log('✅ Pipeline robuste terminé avec succès');
    return result;
  } catch (error) {
    console.error('❌ Erreur dans le pipeline robuste:', error);
    
    // Fallback: utiliser des données de démonstration
    console.log('🔄 Utilisation des données de démonstration...');
    
    const fallbackResult = await etl()
      .extract.localStorage('demo-data')
      .load.table('#fallback-table')
      .run();
    
    return fallbackResult;
  }
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

function calculateWeatherScore(current, forecast) {
  const currentScore = (current.temperature - 20) / 30; // Score basé sur la température
  const forecastScore = forecast.reduce((sum, day) => sum + day.score, 0) / forecast.length;
  return Math.round((currentScore + forecastScore) * 50 + 50); // Score de 0 à 100
}

function assessWeatherRisk(current, forecast) {
  const riskFactors = [
    current.temperature > 35 || current.temperature < -10,
    current.windSpeed > 50,
    forecast.some(day => day.precipitation > 20)
  ];
  
  const riskCount = riskFactors.filter(Boolean).length;
  return ['Low', 'Medium', 'High'][riskCount] || 'Low';
}

function mapSentimentToScore(sentiment) {
  const scores = { 'positive': 1, 'neutral': 0, 'negative': -1 };
  return scores[sentiment] || 0;
}

function categorizeReview(sentiment, confidence) {
  if (confidence > 0.8) {
    return `Strong ${sentiment}`;
  } else if (confidence > 0.6) {
    return `Moderate ${sentiment}`;
  } else {
    return `Weak ${sentiment}`;
  }
}

function calculateRiskLevel(stock) {
  const volatility = stock.price * 0.1; // Simulation de volatilité
  if (volatility > 50) return 'High';
  if (volatility > 20) return 'Medium';
  return 'Low';
}

// ============================================================================
// Exécution des exemples
// ============================================================================

async function runAllExamples() {
  console.log('🚀 Démarrage de tous les exemples...');
  
  try {
    // Exécuter tous les exemples en parallèle
    const results = await Promise.allSettled([
      weatherDashboard(),
      sentimentAnalysis(),
      financialDataPipeline(),
      customPluginExample(),
      robustPipeline()
    ]);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ Exemple ${index + 1} terminé avec succès`);
      } else {
        console.error(`❌ Exemple ${index + 1} a échoué:`, result.reason);
      }
    });
    
    console.log('🎉 Tous les exemples ont été traités');
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

// Exporter les fonctions pour utilisation dans d'autres modules
export {
  weatherDashboard,
  sentimentAnalysis,
  financialDataPipeline,
  customPluginExample,
  robustPipeline,
  runAllExamples
};

// Exécuter automatiquement si ce fichier est exécuté directement
if (typeof window !== 'undefined') {
  // Dans un navigateur
  window.runAllExamples = runAllExamples;
} else if (typeof module !== 'undefined' && module.exports) {
  // Dans Node.js
  module.exports = {
    weatherDashboard,
    sentimentAnalysis,
    financialDataPipeline,
    customPluginExample,
    robustPipeline,
    runAllExamples
  };
}