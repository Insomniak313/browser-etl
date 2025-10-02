# 📦 Browser ETL

A lightweight and extensible JavaScript library for executing **Extract → Transform → Load** pipelines directly in the browser, without a backend.

## 🚀 Installation

```bash
npm install browser-etl
```

## 📖 Quick Usage

```javascript
import { etl } from 'browser-etl';

// Simple example: fetch data from API and display in a table
etl()
  .extract.api('https://jsonplaceholder.typicode.com/users')
  .filter(user => user.id <= 5)
  .load.table('#users-table')
  .run();
```

## 🎯 Main Features

### 🔍 Extractors (Data Sources)
- **REST API** : Data retrieval from APIs
- **HTML** : Data extraction from DOM
- **CSV** : CSV file parsing
- **localStorage** : Access to locally stored data
- **IndexedDB** : Access to IndexedDB databases
- **Files** : Upload and file processing

### 🔄 Transformers
- **Filtering** : Filter data according to criteria
- **Mapping** : Transform data
- **Joins** : Join datasets (nested/parallel)
- **Enrichment** : Enrich with third-party APIs

### 📊 Loaders (Destinations)
- **Charts** : Chart generation with Chart.js
- **Tables** : Display in HTML tables
- **Files** : File downloads
- **APIs** : Send to external APIs

## 💡 Usage Examples

### Complete Example: Weather Dashboard

```javascript
import { etl } from 'browser-etl';

etl()
  .extract.api('https://jsonplaceholder.typicode.com/users')
  .join.api('https://restcountries.com/v3.1/all', {
    key: 'id',
    mode: 'nested'
  })
  .filter(user => user.id <= 5)
  .load.chart('bar', { 
    x: 'name', 
    y: 'id',
    title: 'Users by ID'
  })
  .run();
```

### HTML Extraction

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

### CSV File Processing

```javascript
// With an uploaded file
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

### AI Enrichment

```javascript
etl()
  .extract.api('https://jsonplaceholder.typicode.com/posts')
  .enrich(async (post) => {
    const response = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${post.id}`);
    const comments = await response.json();
    return { ...post, commentCount: comments.length };
  })
  .load.chart('pie', {
    x: 'userId',
    y: 'commentCount'
  })
  .run();
```

## ⚙️ Advanced Configuration

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

## 🔌 Plugin System

```javascript
import { PluginManager } from 'browser-etl';

class CustomExtractor {
  name = 'custom';
  
  async extract(config) {
    // Custom implementation
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

## 🧪 Testing

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

The library follows **SOLID** principles:

- **Single Responsibility** : Each module has a single responsibility
- **Open/Closed** : Extensible via plugins without modifying the core
- **Liskov Substitution** : All extractors/loaders respect the same interface
- **Interface Segregation** : Minimal interfaces to avoid unnecessary dependencies
- **Dependency Inversion** : Depend on abstractions, not implementations

## 🚀 Performance

- **Streams** : Stream support for large datasets
- **Cache** : Local cache to limit network calls
- **Parallelism** : Controlled parallel processing
- **Batching** : Batch processing to optimize performance

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contribution guide and submit pull requests.

## 📞 Support

For any questions or issues, please open an issue on GitHub.
