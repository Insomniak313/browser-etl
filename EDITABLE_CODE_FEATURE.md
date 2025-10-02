# 📝 Fonctionnalité : Code Éditable en Mode WYSIWYG

## 🎯 Description

Cette fonctionnalité permet aux utilisateurs d'éditer directement le code affiché dans les exemples en mode WYSIWYG (What You See Is What You Get). Les utilisateurs peuvent modifier le code directement dans l'interface et voir les changements appliqués en temps réel.

## ✨ Fonctionnalités

### 🔧 Édition de Code
- **Bouton d'édition** : Chaque bloc de code dispose d'un bouton "✏️ Edit"
- **Zone de texte** : Remplacement du code statique par une zone de texte éditable
- **Sauvegarde** : Bouton "💾 Save" pour sauvegarder les modifications
- **Annulation** : Bouton "❌ Cancel" pour annuler les modifications

### 🎨 Interface Utilisateur
- **Indicateurs visuels** : Bordures colorées pour indiquer l'état d'édition
- **Transitions fluides** : Animations CSS pour une expérience utilisateur agréable
- **Messages de confirmation** : Notifications temporaires pour confirmer les actions

### 💾 Gestion des Données
- **Stockage local** : Les modifications sont stockées en mémoire pendant la session
- **Code original** : Préservation du code original pour restauration
- **Code actuel** : Suivi des modifications en cours

## 🚀 Utilisation

### 1. Édition du Code
```html
<div class="code-block editable" data-demo="demoId">
    <div class="code-edit-controls">
        <button class="code-edit-btn" onclick="editCode(this)">✏️ Edit</button>
    </div>
    <div class="code-content">
        // Code à éditer ici
    </div>
</div>
```

### 2. Structure CSS
```css
.code-block {
    position: relative;
    border: 2px solid transparent;
    transition: border-color 0.3s ease;
}

.code-block.editable {
    border-color: #667eea;
    cursor: text;
}

.code-block.editing {
    border-color: #43e97b;
    background: #1a202c;
}
```

### 3. Fonctions JavaScript
```javascript
// Fonction d'édition
window.editCode = function(button) {
    // Logique d'édition
};

// Fonction de sauvegarde
window.saveCode = function(button) {
    // Logique de sauvegarde
};

// Fonction d'annulation
window.cancelEdit = function(button) {
    // Logique d'annulation
};
```

## 📁 Fichiers Modifiés

### 1. `examples/demo.html`
- ✅ Ajout des styles CSS pour l'édition
- ✅ Modification des blocs de code pour les rendre éditable
- ✅ Ajout des fonctions JavaScript d'édition
- ✅ Intégration avec les fonctions de démonstration

### 2. `examples/basic-usage.html`
- ✅ Ajout des styles CSS pour l'édition
- ✅ Modification des blocs de code pour les rendre éditable
- ✅ Ajout des fonctions JavaScript d'édition
- ✅ Intégration avec les fonctions de démonstration

### 3. `examples/advanced-pipeline.html`
- ✅ Ajout des styles CSS pour l'édition
- ✅ Modification des blocs de code pour les rendre éditable
- ✅ Ajout des fonctions JavaScript d'édition
- ✅ Intégration avec les fonctions de démonstration

### 4. `test-editable-code.html` (Nouveau)
- ✅ Fichier de test complet pour valider la fonctionnalité
- ✅ Tests avec différents types de code (JavaScript, ETL, fonctions)
- ✅ Interface de test interactive

## 🧪 Tests

### Test 1: Code JavaScript Simple
```javascript
const message = "Hello, World!";
console.log(message);
alert(message);
```

### Test 2: Pipeline ETL
```javascript
etl()
  .extract.api('https://jsonplaceholder.typicode.com/users')
  .filter(user => user.id <= 3)
  .map(user => ({
    name: user.name,
    email: user.email,
    city: user.address.city
  }))
  .load.table('#test-table')
  .run();
```

### Test 3: Code avec Fonctions
```javascript
function calculateSum(a, b) {
    return a + b;
}

function calculateProduct(a, b) {
    return a * b;
}

const result1 = calculateSum(5, 3);
const result2 = calculateProduct(4, 7);
```

## 🎨 Styles CSS

### Classes Principales
- `.code-block` : Bloc de code de base
- `.code-block.editable` : Bloc de code éditable
- `.code-block.editing` : Bloc de code en cours d'édition
- `.code-edit-controls` : Contrôles d'édition
- `.code-edit-btn` : Boutons d'édition
- `.code-textarea` : Zone de texte pour l'édition

### Couleurs
- **Bordure éditable** : `#667eea` (bleu)
- **Bordure hover** : `#4facfe` (bleu clair)
- **Bordure édition** : `#43e97b` (vert)
- **Bouton sauvegarde** : `rgba(67, 233, 123, 0.8)` (vert)
- **Bouton annulation** : `rgba(250, 112, 154, 0.8)` (rouge)

## 🔧 Fonctionnalités Techniques

### Gestion d'État
```javascript
let editedCodeBlocks = {}; // Stockage des modifications

editedCodeBlocks[demoId] = {
    original: "code original",
    current: "code modifié"
};
```

### Sauvegarde des Modifications
- Les modifications sont stockées en mémoire
- Le code original est préservé
- Possibilité de restauration

### Interface Utilisateur
- Transitions CSS fluides
- Indicateurs visuels clairs
- Messages de confirmation

## 🚀 Avantages

1. **Expérience Utilisateur** : Édition directe sans quitter la page
2. **Apprentissage Interactif** : Modification et test du code en temps réel
3. **Flexibilité** : Possibilité d'expérimenter avec différents paramètres
4. **Accessibilité** : Interface intuitive et facile à utiliser

## 🔮 Améliorations Futures

1. **Syntax Highlighting** : Ajout de la coloration syntaxique
2. **Auto-complétion** : Suggestions de code intelligentes
3. **Validation** : Vérification de la syntaxe en temps réel
4. **Sauvegarde Persistante** : Stockage des modifications dans localStorage
5. **Partage** : Export des modifications vers des liens partageables

## 📝 Notes d'Implémentation

- La fonctionnalité utilise `eval()` pour l'exécution du code modifié (à des fins de démonstration)
- En production, il faudrait implémenter un parser plus sécurisé
- Les modifications sont temporaires et ne persistent pas après rechargement de la page
- Compatible avec tous les navigateurs modernes supportant ES6+

## 🎯 Conclusion

Cette fonctionnalité transforme les exemples statiques en environnements d'apprentissage interactifs, permettant aux utilisateurs d'expérimenter directement avec le code et de comprendre les concepts ETL de manière pratique et engageante.