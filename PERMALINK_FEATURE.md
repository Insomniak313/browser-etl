# 🔗 Permalink Sharing Feature

Cette fonctionnalité permet de générer des liens permanents (permalinks) pour partager du contenu HTML en utilisant la librairie [htmlpreview.github.com](https://github.com/htmlpreview/htmlpreview.github.com).

## 🎯 Objectif

Au lieu de pointer directement vers le permalink GitHub, les liens utilisent maintenant la librairie htmlpreview.github.com avec le permalink en paramètre, permettant un rendu HTML propre et accessible publiquement.

## 🚀 Utilisation

### Import des utilitaires

```typescript
import { 
  generatePermalink, 
  createHtmlPermalink, 
  createDemoPermalink, 
  copyPermalinkToClipboard, 
  createShareButton 
} from 'browser-etl';
```

### Génération d'un permalink basique

```typescript
const result = await generatePermalink({
  repository: 'https://github.com/user/repo',
  branch: 'main',
  filePath: 'examples/demo.html'
});

if (result.success) {
  console.log('Permalink URL:', result.previewUrl);
  // https://htmlpreview.github.io/?https://raw.githubusercontent.com/user/repo/main/examples/demo.html
}
```

### Génération avec paramètres de requête

```typescript
const result = await generatePermalink({
  repository: 'https://github.com/user/repo',
  branch: 'main',
  filePath: 'examples/demo.html',
  queryParams: {
    timestamp: new Date().toISOString(),
    data: JSON.stringify(results)
  }
});
```

### Création d'un bouton de partage

```typescript
const container = document.getElementById('share-container');
const button = createShareButton(container, {
  repository: 'https://github.com/user/repo',
  branch: 'main',
  filePath: 'examples/demo.html'
}, 'Partager');
```

### Copie dans le presse-papiers

```typescript
const success = await copyPermalinkToClipboard('https://htmlpreview.github.io/?...');
if (success) {
  console.log('Lien copié dans le presse-papiers');
}
```

## 📁 Structure des fichiers

```
src/
├── utils/
│   └── permalink.ts          # Utilitaires de permalink
├── types/
│   └── index.ts              # Types PermalinkOptions et PermalinkResult
└── index.ts                  # Exports des utilitaires

examples/
├── demo.html                 # Démo avec boutons de partage
├── basic-usage.html          # Exemple basique avec partage
├── advanced-pipeline.html    # Pipeline avancé avec permalink
└── advanced-pipeline.js      # Logique du pipeline avancé
```

## 🔧 Fonctionnalités

### ✅ Fonctionnalités implémentées

- **Génération de permalinks** : Création d'URLs htmlpreview.github.com
- **Validation des URLs** : Vérification des URLs GitHub valides
- **Paramètres de requête** : Support des paramètres additionnels
- **Copie dans le presse-papiers** : Fonctionnalité de copie automatique
- **Boutons de partage** : Création automatique de boutons interactifs
- **Gestion d'erreurs** : Gestion robuste des erreurs
- **Types TypeScript** : Support complet des types

### 🎨 Interface utilisateur

- Boutons de partage intégrés dans les démos
- Messages de confirmation lors de la copie
- Fallback pour navigateurs sans support clipboard API
- Design cohérent avec le style existant

## 📝 Exemples d'utilisation

### Dans une application ETL

```typescript
// Après avoir exécuté un pipeline ETL
const pipeline = new ETLPipeline();
const results = await pipeline.run();

// Générer un permalink pour partager les résultats
const permalink = await generatePermalink({
  repository: 'https://github.com/user/repo',
  branch: 'main',
  filePath: 'results/dashboard.html',
  queryParams: {
    data: JSON.stringify(results),
    timestamp: new Date().toISOString()
  }
});

// Copier le lien dans le presse-papiers
await copyPermalinkToClipboard(permalink.previewUrl);
```

### Dans une démo interactive

```html
<button onclick="shareDemo()">🔗 Partager cette démo</button>

<script>
async function shareDemo() {
  const result = await generatePermalink({
    repository: 'https://github.com/user/repo',
    branch: 'main',
    filePath: 'examples/demo.html'
  });
  
  if (result.success) {
    await copyPermalinkToClipboard(result.previewUrl);
    alert('Lien copié dans le presse-papiers!');
  }
}
</script>
```

## 🔗 Format des URLs

### URL GitHub raw
```
https://raw.githubusercontent.com/user/repo/branch/path/to/file.html
```

### URL htmlpreview.github.com
```
https://htmlpreview.github.io/?https://raw.githubusercontent.com/user/repo/branch/path/to/file.html
```

### URL avec paramètres
```
https://htmlpreview.github.io/?https://raw.githubusercontent.com/user/repo/branch/path/to/file.html&param1=value1&param2=value2
```

## 🛡️ Sécurité et bonnes pratiques

- **Validation des URLs** : Vérification que l'URL GitHub est valide
- **Échappement des paramètres** : Encodage correct des paramètres de requête
- **Gestion d'erreurs** : Retour d'erreurs explicites en cas d'échec
- **Fallback** : Support des navigateurs sans Clipboard API
- **Types TypeScript** : Validation des types à la compilation

## 🧪 Tests

Pour tester la fonctionnalité :

1. Ouvrir `examples/demo.html` dans un navigateur
2. Cliquer sur les boutons "🔗 Share" dans chaque section
3. Vérifier que le permalink est généré et copié
4. Tester l'URL générée dans un nouvel onglet

## 📚 Références

- [htmlpreview.github.com](https://github.com/htmlpreview/htmlpreview.github.com)
- [GitHub Raw URLs](https://docs.github.com/en/repositories/working-with-files/managing-files/viewing-a-file)
- [Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API)