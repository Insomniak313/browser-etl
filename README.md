# 📦 Browser ETL

Une librairie JavaScript légère et extensible pour exécuter des pipelines **Extract → Transform → Load** directement dans le navigateur, sans backend.

## 🚀 Installation

```bash
npm install browser-etl
```

## 📖 Utilisation rapide

```javascript
import { etl } from 'browser-etl';

// Exemple simple : récupérer des données d'API et les afficher dans un tableau
etl()
  .extract.api('https://api.example.com/users')
  .filter(user => user.age > 18)
  .load.table('#users-table')
  .run();
```

## 🎯 Fonctionnalités principales

### 🔍 Extracteurs (Sources de données)
- **API REST** : Récupération de données depuis des APIs
- **HTML** : Extraction de données depuis le DOM
- **CSV** : Parsing de fichiers CSV
- **localStorage** : Accès aux données stockées localement
- **IndexedDB** : Accès aux bases de données IndexedDB
- **Fichiers** : Upload et traitement de fichiers

### 🔄 Transformateurs
- **Filtrage** : Filtrer les données selon des critères
- **Mapping** : Transformer les données
- **Joins** : Joindre des datasets (nested/parallel)
- **Enrichissement** : Enrichir avec des APIs tierces

### 📊 Loaders (Destinations)
- **Graphiques** : Génération de graphiques avec Chart.js
- **Tableaux** : Affichage dans des tableaux HTML
- **Fichiers** : Téléchargement de fichiers
- **APIs** : Envoi vers des APIs externes

## 💡 Exemples d'utilisation

### Exemple complet : Dashboard météo

```javascript
import { etl } from 'browser-etl';

etl()
  .extract.api('https://api.example.com/users')
  .join.api('https://api.weather.com', {
    key: 'city',
    mode: 'nested'
  })
  .join.api('https://api.images.com', {
    key: 'weather',
    mode: 'nested'
  })
  .transform(data => data.filter(u => u.age > 18))
  .load.chart('bar', { 
    x: 'city', 
    y: 'temperature',
    title: 'Température par ville'
  })
  .run();
```

### Extraction depuis HTML

```javascript
etl()
  .extract.html('.product-item', 'https://shop.example.com')
  .map(item => ({
    name: item.text,
    price: parseFloat(item.getAttribute('data-price'))
  }))
  .filter(product => product.price > 100)
  .load.table('#products-table')
  .run();
```

### Traitement de fichiers CSV

```javascript
// Avec un fichier uploadé
const fileInput = document.getElementById('csv-file');
const file = fileInput.files[0];

etl()
  .extract.file(file, 'csv')
  .map(row => ({
    ...row,
    total: parseFloat(row.price) * parseInt(row.quantity)
  }))
  .load.file('processed-data.csv', 'csv')
  .run();
```

### Enrichissement avec IA

```javascript
etl()
  .extract.api('https://api.example.com/products')
  .enrich(async (product) => {
    const aiResponse = await fetch('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ text: product.description })
    });
    const analysis = await aiResponse.json();
    return { ...product, sentiment: analysis.sentiment };
  })
  .load.chart('pie', {
    x: 'sentiment',
    y: 'count'
  })
  .run();
```

## ⚙️ Configuration avancée

```javascript
import { etl } from 'browser-etl';

const pipeline = etl({
  enableCache: true,
  cacheDuration: 300000, // 5 minutes
  enableParallel: true,
  maxParallel: 10,
  enableStreaming: true,
  batchSize: 1000,
  enableErrorRecovery: true,
  maxRetries: 3
});
```

## 🔌 Système de plugins

```javascript
import { PluginManager } from 'browser-etl';

class CustomExtractor {
  name = 'custom';
  
  async extract(config) {
    // Implémentation personnalisée
  }
  
  supports(config) {
    return config.type === 'custom';
  }
}

const plugin = {
  name: 'custom-plugin',
  version: '1.0.0',
  async initialize() {},
  async cleanup() {},
  getExtractors() { return [new CustomExtractor()]; },
  getTransformers() { return []; },
  getLoaders() { return []; }
};

const pluginManager = new PluginManager();
await pluginManager.registerPlugin(plugin);
```

## 🧪 Tests

```bash
npm test
npm run test:coverage
```

## 📚 API Reference

### ETL Pipeline

```javascript
const pipeline = etl(config)
  .extract.api(url, options)
  .extract.html(selector, url)
  .extract.csv(data, options)
  .extract.localStorage(key)
  .extract.indexedDB(storeName, query)
  .extract.file(file, type)
  .transform(fn)
  .filter(fn)
  .map(fn)
  .join.api(url, config)
  .join.data(data, config)
  .enrich(fn)
  .load.chart(type, config)
  .load.table(container, config)
  .load.file(filename, format)
  .load.api(url, options)
  .run();
```

## 🏗️ Architecture

La librairie suit les principes **SOLID** :

- **Single Responsibility** : Chaque module a une responsabilité unique
- **Open/Closed** : Extensible via plugins sans modification du cœur
- **Liskov Substitution** : Tous les extracteurs/loaders respectent la même interface
- **Interface Segregation** : Interfaces minimales pour éviter les dépendances inutiles
- **Dependency Inversion** : Dépendance d'abstractions, pas d'implémentations

## 🚀 Performance

- **Streams** : Support des streams pour les gros datasets
- **Cache** : Cache local pour limiter les appels réseau
- **Parallélisme** : Traitement parallèle contrôlé
- **Batching** : Traitement par lots pour optimiser les performances

## 📄 Licence

MIT

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez lire notre guide de contribution et soumettre des pull requests.

## 📞 Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
