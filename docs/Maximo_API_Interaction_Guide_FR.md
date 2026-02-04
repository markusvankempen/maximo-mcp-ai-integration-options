# Guide d'Interaction API Maximo et Flux de Travail IA

**Auteur :** Markus van Kempen  
**Date :** 3 février 2026

---

## Introduction

Ce document est un guide complet destiné aux développeurs, intégrateurs et administrateurs Maximo qui souhaitent exploiter le **développement assisté par IA** pour interagir avec l'API REST Maximo. Il couvre :
*   La localisation et la compréhension de la documentation API
*   La génération de code (appels API, scripts, SQL) à partir du langage naturel
*   Les tests, simulations et affinements du code via l'IA conversationnelle
*   La création d'applications UI personnalisées

**Public cible** : Développeurs Maximo, spécialistes de l'intégration et toute personne travaillant avec l'API REST OSLC de Maximo.

---

## 1. Prérequis

Avant d'utiliser ce guide, assurez-vous d'avoir :
*   **Accès à une instance Maximo** : Une instance Maximo en cours d'exécution avec l'API REST activée.
*   **Clé API** : Une clé API Maximo valide avec les permissions appropriées. Créez-la via *Sécurité > Clés API* dans Maximo.
*   **Node.js** (v18+) : Requis pour exécuter le serveur proxy local.
*   **IDE IA** (Optionnel mais recommandé) : Cursor, Windsurf, Antigravity ou VS Code avec Copilot.

---

## 2. Documentation et Ressources

Pour interagir efficacement avec Maximo, nous utilisons les ressources clés suivantes :

### A. Documentation Swagger/OpenAPI
L'interface Swagger fournit une documentation API interactive.

*   **Modèle d'URL** : `https://[VOTRE_HÔTE_MAXIMO]/maximo/oslc/oas/api.html`
*   **Utilisation** : Parcourir les structures d'objets, essayer des requêtes et visualiser les schémas de réponse.

### B. Commandes de Récupération du Schéma
Automatiser la récupération de la définition OpenAPI complète pour l'analyse hors ligne ou le contexte IA.

```bash
curl -X GET "https://[VOTRE_HÔTE_MAXIMO]/maximo/api/oas/api.json" \
     -H "apikey: [VOTRE_CLÉ_API]" \
     -H "Content-Type: application/json" \
     -o maximo_openapi.json
```

### C. Exemples de Requêtes API
Modèle standard pour les requêtes API authentifiées.

```bash
curl -X GET "https://[VOTRE_HÔTE_MAXIMO]/maximo/api/os/mxwo?oslc.pageSize=10&lean=1" \
     -H "apikey: [VOTRE_CLÉ_API]" \
     -H "Content-Type: application/json"
```

### D. Références Externes
*   [API REST IBM Maximo Manage](https://developer.ibm.com/apis/catalog/maximo--maximo-manage-rest-api/Introduction) — Documentation officielle IBM.

---

## 3. Référence de la Syntaxe de Requête OSLC

L'API Maximo utilise les paramètres de requête **OSLC (Open Services for Lifecycle Collaboration)**. La compréhension de ceux-ci est essentielle.

| Paramètre | Description | Exemple |
| :--- | :--- | :--- |
| `oslc.where` | Filtrer les enregistrements selon une condition | `status="APPR"` |
| `oslc.select` | Spécifier les champs à retourner | `wonum,description,status` |
| `oslc.orderBy` | Trier les résultats ; préfixe `-` pour ordre décroissant | `-reportdate` |
| `oslc.pageSize` | Limiter le nombre d'enregistrements retournés | `10` |
| `lean` | Retourner un JSON simplifié (sans métadonnées) | `1` |

**Combinaison de Conditions (`oslc.where`) :**
*   **ET** : `status="APPR" and siteid="BEDFORD"`
*   **OU** : `status="APPR" or status="INPRG"`
*   **Comparaison** : `wopriority<=2` ou `reportdate>="2026-01-01"`
*   **LIKE** : `description like "%pompe%"` (recherche avec caractère générique)

---

## 4. Démonstration de la Génération de Code à partir du Langage Naturel et Interface IA

Cette section explique comment l'**éditeur IA démontre la génération de code** à partir d'instructions textuelles simples.

### 4.1 Le Flux de Travail
L'IA fait le pont entre les exigences métier et l'implémentation technique :

1.  **Traitement du Langage Naturel** : L'éditeur interprète des instructions de haut niveau (par ex., « Trouver toutes les pompes qui ont échoué le mois dernier ») et les associe à des artefacts Maximo spécifiques.
2.  **Interface Contextuelle** : En référençant la définition API Swagger, l'IA maintient une « conscience du schéma ». Elle sait qu'un « Bon de Travail » correspond à `MXWO` et que « Priorité 1 » se traduit par `wopriority=1`.
3.  **Avantages** : Cela élimine la recherche manuelle des noms de colonnes et des points de terminaison API.

![Interface IDE IA](Antigravity-Cursor-VSCode.png)

### 4.2 Applicabilité Universelle
Bien que ce guide fasse référence à des outils spécifiques, le flux de travail de base est **générique** et indépendant de la plateforme :
*   **Assistants IA** : Antigravity, Cursor, Windsurf, VS Code Copilot ou tout environnement de codage piloté par LLM.
*   **Langages** : Python, JavaScript, Java, Go ou tout langage avec support HTTP.

---

## 5. Génération de Différents Types de Code (Scripts, SQL, API) selon le Contexte Métier

L'IA génère divers artefacts de code selon le contexte de l'utilisateur.

### A. Appels API REST OSLC
*   **Contexte** : Applications Web, Intégrations, Tests (Postman/Curl).
*   **Processus IA** : Associe les règles métier aux paramètres de requête OSLC.
*   **Exemple de Prompt** : « Obtenir les bons de travail approuvés du site BEDFORD »
*   **Exemple de Sortie** :
    ```http
    GET /maximo/api/os/mxwo?oslc.where=status="APPR" and siteid="BEDFORD"&oslc.select=wonum,description&lean=1
    ```

### B. Scripts Python/Node.js
*   **Contexte** : Automatisation backend, migration de données, traitement par lots.
*   **Processus IA** : Génère des scripts complets avec authentification, gestion des erreurs et logique d'itération.
*   **Exemple de Prompt** : « Écrire un script pour récupérer tous les bons de travail priorité 1 et afficher leurs descriptions »
*   **Exemple de Sortie** :
    ```python
    import requests

    url = "https://[VOTRE_HÔTE_MAXIMO]/maximo/api/os/mxwo"
    headers = {"apikey": "[VOTRE_CLÉ_API]"}
    params = {"oslc.where": "wopriority=1", "oslc.select": "wonum,description", "lean": 1}

    response = requests.get(url, headers=headers, params=params)
    for wo in response.json().get('member', []):
        print(f"{wo['wonum']}: {wo.get('description', 'N/A')}")
    ```

### C. Requêtes SQL
*   **Contexte** : Inspection directe de la base de données, rapports BIRT/Cognos, optimisation des performances.
*   **Processus IA** : Traduit la demande logique en SQL ANSI.
*   **Exemple de Prompt** : « Obtenir les bons de travail en retard »
*   **Exemple de Sortie** :
    ```sql
    SELECT wonum, description, status, targcompdate
    FROM workorder
    WHERE status NOT IN ('COMP', 'CLOSE', 'CAN')
      AND targcompdate < CURRENT_DATE;
    ```

---

## 6. Exécution des Tests, Simulations et Affinement via Interaction IA

Le flux de travail va au-delà de la génération pour inclure la validation et l'affinement.

### 6.1 Exécution et Test
*   **Validation Immédiate** : L'IA peut exécuter des opérations « sûres » (requêtes GET, requêtes SELECT) immédiatement.
*   **Correction d'Erreurs** : Si un appel API échoue (par ex., 400 Bad Request), l'IA analyse l'erreur et corrige automatiquement la requête.

### 6.2 Simulation UI
*   **Vérification Visuelle** : Au lieu de visualiser du JSON brut, l'IA peut rendre les données dans un tableau **Carbon Design System**.
*   **Avantage** : Les parties prenantes peuvent « voir » le résultat de l'appel API dans un format convivial.

### 6.3 Affinement Conversationnel
Les utilisateurs peuvent affiner la sortie avec des prompts de suivi :

| Tour | Prompt Utilisateur | Action IA |
| :--- | :--- | :--- |
| 1 | « Obtenir les bons de travail » | Génère une requête de base |
| 2 | « Ajouter la date de rapport » | Ajoute `reportdate` à `oslc.select` |
| 3 | « Trier par plus récent d'abord » | Ajoute `oslc.orderBy="-reportdate"` |
| 4 | « Afficher uniquement priorité 1 » | Ajoute `wopriority=1` à `oslc.where` |

---

## 7. Exemple de Tâche Détaillée

### Tâche : « Afficher les 5 derniers bons de travail avec statut En Cours »

#### Étape 1 : Demande Utilisateur
> « Se connecter à Maximo et me montrer les 5 derniers bons de travail actuellement En Cours. »

#### Étape 2 : Analyse du Contexte (IA)
*   **Objet Cible** : `MXWO` (Bon de Travail)
*   **Condition** : `status` = 'INPRG'
*   **Tri** : Par `statusdate` décroissant
*   **Pagination** : Limiter à 5 enregistrements

#### Étape 3 : Artefacts Générés

**A. Appel API REST OSLC**
```bash
curl -X GET "https://[VOTRE_HÔTE_MAXIMO]/maximo/api/os/mxwo?oslc.where=status=%22INPRG%22&oslc.orderBy=-statusdate&oslc.pageSize=5&lean=1" \
     -H "apikey: [VOTRE_CLÉ_API]" \
     -H "Content-Type: application/json"
```

**B. Requête SQL**
```sql
SELECT wonum, description, status, statusdate
FROM workorder 
WHERE status = 'INPRG' 
ORDER BY statusdate DESC 
FETCH FIRST 5 ROWS ONLY;
```

**C. Script Python**
```python
import requests

url = "https://[VOTRE_HÔTE_MAXIMO]/maximo/api/os/mxwo"
headers = {"apikey": "[VOTRE_CLÉ_API]", "Content-Type": "application/json"}
params = {
    "oslc.where": 'status="INPRG"',
    "oslc.orderBy": "-statusdate",
    "oslc.pageSize": "5",
    "lean": "1"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    for wo in response.json().get('member', []):
        print(f"BT: {wo.get('wonum')} - {wo.get('description')}")
else:
    print(f"Erreur: {response.status_code} - {response.text}")
```

#### Étape 4 : Exécution et Vérification
L'IA exécute la commande et peut rendre le résultat JSON dans un tableau visuel.

---

## 8. Erreurs Courantes et Dépannage

| Erreur | Cause | Solution |
| :--- | :--- | :--- |
| `400 Bad Request` | Nom de champ invalide ou erreur de syntaxe dans `oslc.where` | Vérifier les noms de champs par rapport au schéma. Vérifier les guillemets non échappés. |
| `401 Unauthorized` | Clé API invalide ou manquante | S'assurer que l'en-tête `apikey` est correct et dispose des permissions appropriées. |
| `403 Forbidden` | La clé API n'a pas les permissions pour la Structure d'Objet | Demander l'accès à votre administrateur Maximo. |
| `404 Not Found` | Nom de Structure d'Objet incorrect (par ex., `mxwr` au lieu de `mxwo`) | Vérifier le nom de la Structure d'Objet dans Swagger. |
| `500 Internal Server Error` | Problème côté serveur | Vérifier les journaux Maximo ; peut indiquer un délai d'attente ou un problème de configuration. |
| Erreur CORS (Navigateur) | Le navigateur bloque les requêtes cross-origin | Utiliser un serveur proxy local (voir Section 10). |

---

## 9. Création d'une Application UI Personnalisée

Nous pouvons aller au-delà des scripts en créant des applications frontend complètes.

### Aperçu
Le fichier `index.html` sert de modèle pour transformer les réponses JSON brutes de l'API en tableaux de bord interactifs.

### Prompts IA pour la Génération d'UI

**Prompt 1 : Structure de Base**
> « Créer une application HTML mono-fichier pour visualiser les données de Bons de Travail Maximo. Utiliser Tailwind CSS via CDN pour le style et JavaScript Vanilla pour la logique. »

**Prompt 2 : Design Avancé**
> « Améliorer le design avec un thème sombre et des effets de glassmorphisme. Implémenter une vue Maître-Détail où cliquer sur une carte de bon de travail à gauche met à jour un panneau de détail à droite. »

**Prompt 3 : Affinage des Détails**
> « Ajouter des Icônes Lucide pour les indicateurs visuels. Inclure une entrée de recherche/filtre et des contrôles de pagination. »

### Exemple Carbon Design System
Pour un look and feel natif Maximo, utiliser IBM Carbon Design System.

![Exemple UI Carbon](WorkOrderCarbonAPI.png)

---

## 10. Implémentation du Serveur Proxy Local

Pour contourner les restrictions CORS lors de la connexion à l'API Maximo depuis un navigateur, utiliser un serveur proxy Node.js.

### Architecture de l'Application
*   **`server.js`** : Serveur Express.js qui proxy `/maximo/*` vers l'hôte Maximo réel.
*   **`index.html`** : Application frontend récupérant des données en direct via le proxy local.

### Exécution de l'Application
```bash
# Installer les dépendances
npm install

# Démarrer le serveur
node server.js
```

Ouvrir votre navigateur à : [http://localhost:3002/](http://localhost:3002/)

### Aperçu de l'Interface
![Application Maximo Localhost](MaxUIAPIv1.png)

---

## 11. Meilleures Pratiques de Sécurité

*   **Ne jamais coder en dur les clés API** dans le JavaScript côté client. Utiliser des variables d'environnement ou des proxys côté serveur.
*   **Utiliser des clés en lecture seule** pour le développement afin d'éviter les modifications accidentelles de données.
*   **HTTPS uniquement** : Toujours utiliser HTTPS lors de la communication avec l'API Maximo.
*   **Limiter la portée** : Demander des clés API avec accès uniquement aux Structures d'Objets nécessaires.
*   **Rotation des clés** : Faire tourner périodiquement les clés API et révoquer celles inutilisées.

---

## 12. Archivage et Conservation des Connaissances

Pour s'assurer que ces flux de travail soient réutilisables :
1.  **Sauvegarder les Requêtes Réussies** : Stocker les chaînes de requête OSLC fonctionnelles dans la documentation du projet.
2.  **Mettre à Jour les Exemples** : Ajouter de nouveaux cas d'utilisation à votre bibliothèque d'exemples API.
3.  **Cache du Schéma** : Conserver une copie locale de la définition OpenAPI pour un chargement plus rapide du contexte IA.
