# Tests QA pour l'application Douane

Ce répertoire contient des scripts de test pour valider le bon fonctionnement de l'application Douane, en particulier la page Conformité et l'analyse des documents.

## Structure des tests

Les tests sont organisés en plusieurs catégories :

- **API** : Tests des endpoints de l'API backend
- **Conformité** : Tests spécifiques aux fonctionnalités de la page Conformité
- **DB** : Tests de la structure de la base de données
- **E2E** : Tests end-to-end simulant l'interaction utilisateur
- **Integration** : Tests d'intégration entre le frontend et le backend

## Prérequis

- Node.js v14+
- PostgreSQL (accessible via les variables d'environnement)
- L'application backend doit être en cours d'exécution pour les tests API et d'intégration
- L'application frontend doit être en cours d'exécution pour les tests E2E

## Installation

```bash
cd QA
npm install
```

## Configuration

### Préparation de l'environnement de test

Avant d'exécuter les tests, il est recommandé de préparer l'environnement avec le script de configuration :

```bash
node setup-tests.js
```

Ce script vérifie la connexion à la base de données et crée les tables et colonnes nécessaires si elles n'existent pas.

### Variables d'environnement

Les tests utilisent les variables d'environnement suivantes :

- `DB_USER` : Utilisateur PostgreSQL (défaut: postgres)
- `DB_HOST` : Hôte PostgreSQL (défaut: localhost)
- `DB_NAME` : Nom de la base de données (défaut: douane)
- `DB_PASSWORD` : Mot de passe PostgreSQL (défaut: postgres)
- `DB_PORT` : Port PostgreSQL (défaut: 5434)
- `API_URL` : URL de l'API backend (défaut: http://localhost:3000)
- `FRONTEND_URL` : URL du frontend (défaut: http://localhost:3001)

## Exécution des tests

### Tous les tests avec rapport HTML

```bash
node run-tests.js
```

Cette commande exécute tous les tests et génère un rapport HTML dans le dossier `reports`.

### Tous les tests sans rapport

```bash
npm test
```

### Tests API uniquement

```bash
npm run test:api
```

### Tests de la page Conformité uniquement

```bash
npm run test:conformite
```

### Tests end-to-end uniquement

```bash
npm run test:e2e
```

## Détail des tests

### Tests API

- Récupération des lots
- Récupération des matières premières pour un lot
- Analyse d'un document
- Récupération d'une analyse spécifique

### Tests Conformité

- Analyse de documents pour chaque type (bon de livraison, bulletin d'analyse, certificat, facture)
- Vérification des champs attendus dans les analyses
- Test de la fonction formatAnalyseData

### Tests DB

- Vérification de l'existence des tables d'analyses
- Vérification de la structure des tables d'analyses
- Vérification des contraintes de clé étrangère
- Vérification des index

### Tests E2E

- Navigation vers la page Conformité
- Sélection d'un lot
- Analyse d'un document
- Affichage des résultats d'analyse pour chaque type de document

### Tests d'intégration

- Flux complet d'analyse de document
- Cohérence des données entre le frontend et le backend

## Fonctionnalités avancées

### Vérification de disponibilité

Les tests API et end-to-end vérifient automatiquement la disponibilité des services avant de s'exécuter. Si un service n'est pas disponible, les tests correspondants seront ignorés avec un avertissement.

### Rapport de test

Le script `run-tests.js` génère un rapport HTML complet dans le dossier `reports` avec les statistiques suivantes :
- Nombre de tests réussis, échoués et en attente
- Durée totale des tests
- Détails de chaque test avec les messages d'erreur

### Configuration globale

Le fichier `setup-global.js` est exécuté automatiquement avant tous les tests pour préparer l'environnement.

## Ajout de nouveaux tests

Pour ajouter de nouveaux tests, créez un fichier avec l'extension `.test.js` dans le répertoire correspondant à la catégorie de test.

## Bonnes pratiques

- Exécutez les tests après chaque modification importante du code
- Assurez-vous que tous les tests passent avant de déployer en production
- Utilisez les tests pour valider les corrections de bugs
