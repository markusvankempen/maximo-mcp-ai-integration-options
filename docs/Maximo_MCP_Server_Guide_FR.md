# Guide Complet Maximo MCP : Développement Piloté par IA

**Auteur :** Markus van Kempen  
**Courriel :** mvankempen@ca.ibm.com | markus.van.kempen@gmail.com  
**Date :** 3 février 2026

---

## 1. Introduction

Ce guide complet détaille comment exploiter le **Serveur Model Context Protocol (MCP) Maximo** pour transformer le développement Maximo. Contrairement aux méthodes traditionnelles qui reposent sur une documentation statique, le serveur MCP permet aux assistants IA d'interagir activement avec votre environnement Maximo, permettant l'introspection des schémas, l'interrogation de données en direct et la génération intelligente de code.

### 1.1 Qu'est-ce que le Model Context Protocol (MCP) ?
MCP est un standard ouvert qui permet aux modèles IA de communiquer avec des systèmes externes via un ensemble défini d'« outils ». Dans ce contexte, le fichier `maximo-mcp-server.js` agit comme un pont, exposant les capacités Maximo à tout IDE IA compatible MCP.

### 1.2 Avantages Clés
*   **Connaissance Automatisée du Schéma** : L'IA ne s'appuie plus sur des données d'entraînement génériques. Elle **inspecte** votre configuration Maximo spécifique pour comprendre les Structures d'Objets disponibles et leurs champs.
*   **Validation des Données en Direct** : Les requêtes peuvent être exécutées immédiatement pour vérifier leur exactitude, éliminant le cycle « code-déploiement-débogage ».
*   **Génération de Code Multi-Format** : Générez des appels API OSLC, des scripts Python ou des requêtes SQL à partir de la même demande en langage naturel.

### 1.3 Pourquoi Utiliser un Serveur MCP vs. une Approche Directe ?

Vous pourriez vous demander : « Pourquoi ne pas simplement coller la documentation Swagger dans le chat, ou fournir des exemples d'API directement ? » Voici pourquoi l'approche MCP est supérieure :

| Aspect | Approche Directe (Contexte Manuel) | Approche Serveur MCP |
| :--- | :--- | :--- |
| **Taille du Contexte** | Limitée par la fenêtre de tokens ; les grands schémas sont tronqués | Schéma chargé côté serveur ; l'IA interroge des parties spécifiques à la demande |
| **Fraîcheur des Données** | Statique ; les docs copiées-collées deviennent obsolètes | **Dynamique** ; reflète toujours la configuration Maximo actuelle |
| **Validation** | L'IA devine ; erreurs trouvées à l'exécution | L'IA peut **tester les requêtes en direct** et auto-corriger avant que vous ne les voyiez |
| **Sécurité** | Les clés API peuvent être collées dans le chat (risqué) | Clés stockées en config locale ; **jamais envoyées au fournisseur LLM** |
| **Effort** | Copier/coller manuel pour chaque session | **Zéro effort** après la configuration initiale ; le contexte est automatique |
| **Cohérence** | Varie selon ce que vous pensez à inclure | Interface d'outils standardisée ; mêmes capacités à chaque fois |

**Exemple : Trouver le bon nom de champ**

*   **Approche Directe** : Vous collez un extrait de schéma de 500 lignes et demandez « Quel est le champ pour la priorité des bons de travail ? » L'IA scanne le texte et *espère* qu'il est complet.
*   **Approche MCP** : L'IA appelle `get_schema_details(objectStructure: "MXWO")`, reçoit la liste de champs faisant autorité directement depuis la spec OpenAPI, et répond avec `wopriority` — garanti correct.

**Conclusion** : Le serveur MCP transforme l'IA d'un « devineur intelligent » en un « assistant connecté » avec un accès direct à votre environnement Maximo.

---

## 2. Prérequis et Installation

### 2.1 Prérequis
Avant de configurer le serveur MCP, assurez-vous que les éléments suivants sont en place :
*   **Node.js** : Version 18 ou supérieure installée localement (`node --version`).
*   **Clé API Maximo** : Une clé API valide avec au moins un accès en lecture seule aux Structures d'Objets souhaitées (par ex., `MXWO`, `MXASSET`).
*   **Schéma OpenAPI (Recommandé)** : Un fichier local `maximo_openapi.json` pour des recherches de schéma plus rapides.

### 2.2 Installation des Dépendances

Naviguez vers le répertoire du projet et installez les packages Node.js requis :

```bash
cd /chemin/vers/Maximo-MCP-EDF

# Installer les dépendances
npm install
```

Le fichier `maximo-mcp-server.js` nécessite les packages suivants (définis dans `package.json`) :
*   `@modelcontextprotocol/sdk` — Le SDK MCP pour Node.js
*   `zod` — Bibliothèque de validation de schéma

---

## 3. Configuration du Serveur MCP dans Votre IDE

### 3.1 Configuration pour Antigravity (Google)

Antigravity utilise un fichier de paramètres situé dans le répertoire `.gemini` de votre projet.

**Étape 1 : Créer le fichier de paramètres**
```bash
mkdir -p .gemini
touch .gemini/settings.json
```

**Étape 2 : Ajouter la configuration MCP**

Éditez `.gemini/settings.json` et ajoutez :

```json
{
  "mcpServers": {
    "maximo": {
      "command": "node",
      "args": [
        "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"
      ],
      "env": {
        "MAXIMO_URL": "https://[VOTRE_HÔTE_MAXIMO]/maximo/api",
        "MAXIMO_API_KEY": "[VOTRE_CLÉ_API]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  }
}
```

**Étape 3 : Redémarrer Antigravity**

Fermez et rouvrez votre session Antigravity. Le serveur MCP sera disponible comme « maximo » dans votre liste d'outils.

---

### 3.2 Configuration pour Cursor

Cursor utilise un fichier de configuration MCP global.

**Étape 1 : Localiser le fichier de paramètres**
*   **macOS** : `~/.cursor/mcp.json`
*   **Windows** : `%USERPROFILE%\.cursor\mcp.json`
*   **Linux** : `~/.cursor/mcp.json`

**Étape 2 : Créer ou éditer le fichier**

```bash
# macOS/Linux
mkdir -p ~/.cursor
nano ~/.cursor/mcp.json
```

**Étape 3 : Ajouter la configuration MCP**

```json
{
  "mcpServers": {
    "maximo": {
      "command": "node",
      "args": [
        "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"
      ],
      "env": {
        "MAXIMO_URL": "https://[VOTRE_HÔTE_MAXIMO]/maximo/api",
        "MAXIMO_API_KEY": "[VOTRE_CLÉ_API]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  }
}
```

**Étape 4 : Redémarrer Cursor**

Redémarrez Cursor pour que les modifications prennent effet.

---

### 3.3 Configuration pour VS Code (avec Copilot/Continue)

Pour VS Code avec des extensions compatibles MCP comme **Continue**, utilisez les paramètres de l'extension.

**Étape 1 : Ouvrir les Paramètres VS Code**

Appuyez sur `Cmd+Shift+P` (macOS) ou `Ctrl+Shift+P` (Windows/Linux) et recherchez « Continue: Open Settings ».

**Étape 2 : Ajouter la Configuration du Serveur MCP**

Dans le fichier de configuration Continue (`~/.continue/config.json`), ajoutez :

```json
{
  "mcpServers": [
    {
      "name": "maximo",
      "command": "node",
      "args": ["/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo-mcp-server.js"],
      "env": {
        "MAXIMO_URL": "https://[VOTRE_HÔTE_MAXIMO]/maximo/api",
        "MAXIMO_API_KEY": "[VOTRE_CLÉ_API]",
        "MAXIMO_OPENAPI_PATH": "/Users/markusvankempen/projects/Maximo-MCP-EDF/maximo_openapi.json"
      }
    }
  ]
}
```

---

### 3.4 Référence des Variables d'Environnement

Le fichier `maximo-mcp-server.js` lit les variables d'environnement suivantes :

| Variable | Requis | Description | Défaut |
| :--- | :--- | :--- | :--- |
| `MAXIMO_URL` | Oui | URL de base pour l'API REST Maximo | (aucun - doit être défini) |
| `MAXIMO_API_KEY` | Oui | Clé API pour l'authentification | (aucun - doit être défini) |
| `MAXIMO_OPENAPI_PATH` | Non | Chemin vers le fichier de schéma OpenAPI local | `./maximo_openapi.json` |

---

### 3.5 Vérification de la Configuration

Après la configuration, vérifiez que le serveur MCP fonctionne :

**Méthode 1 : Demander à l'IA**
> « Le serveur MCP Maximo est-il connecté ? »

L'IA devrait répondre en appelant `get_instance_details` et en confirmant la connectivité.

**Méthode 2 : Exécuter Manuellement**

Testez le serveur directement depuis la ligne de commande :

```bash
node /chemin/vers/Maximo-MCP-EDF/maximo-mcp-server.js
```

Vous devriez voir une sortie comme :
```
Loading OpenAPI spec from /chemin/vers/maximo_openapi.json...
Loaded OpenAPI spec. Components: 1247
Maximo MCP Server running on stdio
```

![Configuration MCP](MCPConfig.png)

> **Avantage Clé** : Une fois configuré, la configuration MCP gère automatiquement la **Connaissance du Schéma** et la **Connectivité API**. Vous n'avez pas besoin de fournir manuellement les fichiers Swagger ou la documentation API à l'IA ; le serveur MCP récupère ce contexte de manière proactive pour chaque requête.

---

## 4. Outils MCP Disponibles

Le Serveur MCP Maximo expose les outils suivants à l'agent IA :

| Nom de l'Outil | Description | Exemple de Cas d'Usage |
| :--- | :--- | :--- |
| `list_object_structures` | Recherche les APIs Maximo disponibles par nom ou description. | « Quelles APIs sont disponibles pour les Actifs ? » |
| `get_schema_details` | Récupère les définitions de champs détaillées (type, longueur, titre) pour une Structure d'Objet spécifique. | « Quels champs sont sur l'objet MXWO ? » |
| `query_maximo` | Exécute une requête REST OSLC en direct contre l'instance Maximo. | « Obtenir les 5 derniers bons de travail approuvés. » |
| `get_instance_details` | Vérifie la connectivité du serveur et récupère des méta-informations comme la date du dernier bon de travail. | « Le serveur Maximo est-il accessible ? » |
| `render_carbon_table` | Génère un tableau HTML interactif (Carbon Design System) à partir des résultats de requête. | « Montrez-moi un tableau des bons de travail ouverts. » |
| `render_carbon_details` | Génère une vue HTML détaillée pour un seul enregistrement. | « Montrez-moi les détails du bon de travail 1001. » |

---

## 5. Génération de Code à partir du Langage Naturel

Le serveur MCP agit comme les « yeux et oreilles » de l'IA, lui permettant de traduire le langage naturel vague en opérations techniques précises en inspectant la configuration Maximo réelle.

### 5.1 Le Flux de Travail
1.  **Demande Utilisateur** : « Trouver toutes les pompes qui ont échoué le mois dernier. »
2.  **Découverte du Schéma** : L'IA appelle `list_object_structures` pour trouver les APIs pertinentes (par ex., `MXASSET`, `MXWO`).
3.  **Mapping des Champs** : Elle appelle `get_schema_details` pour comprendre la structure des données (par ex., confirmer `assetnum`, `description`, `failurecode`).
4.  **Génération de Code** : Elle génère la requête ou le bloc de code correct.

### 5.2 L'Interface Assistée par IA
L'IA ne devine pas simplement ; elle **vérifie**. En ayant accès au schéma en direct, l'Interface IA peut :
*   **Auto-compléter** les noms de champs basés sur la structure d'objet réelle.
*   **Valider** qu'une relation spécifique existe avant de la suggérer.
*   **Contextualiser** les réponses, distinguant entre un « Bon de Travail » (`MXWO`) et une « Demande de Service » (`MXSR`).

![Interface IDE IA](Antigravity-Cursor-VSCode.png)

---

## 6. Génération de Code Multi-Format (Scripts, SQL, API)

L'une des fonctionnalités les plus puissantes de l'intégration MCP est la capacité de générer du **code contextuel** dans plusieurs formats, assurant l'alignement avec la Structure de Données Cible.

### A. Appels API REST OSLC
*   **Contexte** : Applications Web, Intégrations (Postman/Curl).
*   **Processus** : L'IA vérifie `get_schema_details` pour identifier les paramètres de requête OSLC corrects.
*   **Exemple de Prompt** : « Obtenir les bons de travail approuvés avec leurs numéros d'actifs. »
*   **Exemple de Sortie** :
    ```http
    GET /maximo/api/os/mxwo?oslc.where=status="APPR"&oslc.select=wonum,description,assetnum,reportdate&lean=1
    ```

### B. Scripts Python/Node.js
*   **Contexte** : Automatisation, Migration de Données, Traitement par Lots.
*   **Processus** : L'IA construit des scripts robustes utilisant des bibliothèques comme `requests` ou `axios`, injectant les noms de champs corrects et la logique de gestion des erreurs dérivée du schéma.
*   **Exemple de Prompt** : « Écrire un script Python pour récupérer tous les bons de travail de cette année et les exporter en CSV. »
*   **Exemple de Sortie** (Python) :
    ```python
    import requests
    import csv

    MAXIMO_URL = "https://votre-hote/maximo/api/os/mxwo"
    headers = {"apikey": "VOTRE_CLÉ_API"}

    # L'IA sait que 'reportdate' est le champ correct grâce à l'introspection du schéma
    params = {
        'oslc.where': 'reportdate>="2026-01-01"',
        'oslc.select': 'wonum,description,status,reportdate',
        'lean': 1
    }

    response = requests.get(MAXIMO_URL, params=params, headers=headers)
    data = response.json().get('member', [])

    with open('bons_de_travail.csv', 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['wonum', 'description', 'status', 'reportdate'])
        writer.writeheader()
        writer.writerows(data)
    
    print(f"Exporté {len(data)} bons de travail.")
    ```

### C. Requêtes SQL
*   **Contexte** : Analytique, Rapports BIRT, Administration de Base de Données.
*   **Processus** : En comprenant les capacités de la Structure d'Objet sous-jacente, l'IA peut inférer le schéma de base de données et générer du SQL ANSI.
*   **Exemple de Prompt** : « Écrire du SQL pour trouver les bons de travail en retard. »
*   **Exemple de Sortie** :
    ```sql
    -- L'IA infère les noms de tables à partir des tables de support de la Structure d'Objet
    SELECT wonum, description, status, targcompdate
    FROM workorder 
    WHERE status NOT IN ('COMP', 'CLOSE', 'CAN')
      AND targcompdate < CURRENT_DATE;
    ```

---

## 7. Exécution, Simulation et Affinement

Le serveur MCP fait le pont entre *écrire* du code et *l'exécuter*. Il permet une boucle interactive d'exécution, de visualisation et d'affinement.

### 7.1 Exécution et Test
*   **Outil** : `query_maximo`
*   **Action** : L'IA peut exécuter la requête générée immédiatement pour vérifier qu'elle retourne des résultats.
*   **Avantage** : « Échouer Vite. » Si la requête retourne une erreur 400 (par ex., champ invalide), l'IA voit le message d'erreur et auto-corrige le code *avant* de vous le montrer.

### 7.2 Simulation (Génération d'UI)
*   **Outil** : `render_carbon_table` / `render_carbon_details`
*   **Action** : Au lieu de montrer du JSON brut, l'IA rend les données dans un tableau HTML **Carbon Design System** avec tri et filtrage.
*   **Avantage** : Les parties prenantes peuvent inspecter visuellement la structure des données et la qualité du contenu (par ex., « Oh, le champ description est vide pour ces enregistrements ») sans avoir besoin d'un frontend déployé.

![Exemple UI Carbon](WorkOrderCarbonAPI.png)

### 7.3 Affinement Conversationnel
Parce que l'IA a du contexte, vous pouvez affiner la sortie de manière conversationnelle :

| Tour | Prompt Utilisateur | Réponse IA |
| :--- | :--- | :--- |
| 1 | « Donnez-moi les bons de travail. » | Appelle `query_maximo` et affiche une liste. |
| 2 | « C'est trop désordonné. Trier par plus récent d'abord. » | Ajoute `oslc.orderBy="-reportdate"`. Réexécute la requête. |
| 3 | « Ajouter la colonne ID du site. » | Vérifie le schéma, trouve `siteid`, ajoute à `oslc.select`. Met à jour le tableau. |
| 4 | « Filtrer uniquement pour le site BEDFORD. » | Ajoute `siteid="BEDFORD"` à `oslc.where`. Réexécute. |

---

## 8. Parcours Pratique : Création d'un Tableau de Bord Personnalisé

Parcourons un cas d'usage typique du début à la fin.

**Objectif** : Construire un tableau de bord HTML simple montrant les 10 derniers bons de travail haute priorité.

### Étape 1 : Découvrir l'API
> **Utilisateur** : « Quelle est l'API pour les bons de travail ? »

**IA** : Appelle `list_object_structures(filter: "work order")` et répond :
> « La Structure d'Objet principale pour les Bons de Travail est **MXWO**. »

### Étape 2 : Comprendre le Schéma
> **Utilisateur** : « Quels champs sont disponibles sur MXWO pour la priorité et les dates ? »

**IA** : Appelle `get_schema_details(objectStructure: "MXWO")` et répond :
> « Les champs clés incluent : `wopriority` (entier), `reportdate` (datetime), `targstartdate` (datetime), `status` (chaîne). »

### Étape 3 : Interroger les Données en Direct
> **Utilisateur** : « Montrez-moi les 10 premiers bons de travail priorité 1, triés par date de rapport. »

**IA** : Appelle `query_maximo` avec la requête construite et affiche les résultats.

### Étape 4 : Générer l'UI
> **Utilisateur** : « Maintenant, construisez-moi une page HTML avec thème sombre pour afficher ces données. »

**IA** : Génère un fichier `index.html` complet utilisant Tailwind CSS avec mode sombre, récupérant depuis l'API Maximo via le serveur proxy local.

---

## 9. Sécurité et Meilleures Pratiques

*   **Exécution Locale** : Le serveur MCP s'exécute localement sur votre machine. Votre Clé API est stockée dans votre configuration locale et n'est pas envoyée aux serveurs du fournisseur LLM ; seuls les *résultats* des requêtes le sont.
*   **Accès en Lecture Seule** : Pour le développement, il est recommandé d'utiliser une Clé API avec des permissions limitées (par ex., Lecture Seule) pour éviter les modifications accidentelles de données pendant l'expérimentation IA.
*   **Mise en Cache du Schéma** : Le serveur utilise un fichier local `maximo_openapi.json` pour accélérer les recherches de schéma et réduire la charge sur le serveur Maximo.
*   **Variables d'Environnement** : Ne jamais coder en dur les clés API. Utilisez des variables d'environnement dans la configuration MCP comme montré.

---

## 10. Résumé

| Fonctionnalité | Sans MCP | Avec Maximo MCP |
| :--- | :--- | :--- |
| **Connaissance** | Statique (Coupure des Données d'Entraînement) | **Dynamique (Accès au Schéma en Direct)** |
| **Validation** | Deviner et Vérifier | **Inspecter et Vérifier** |
| **Sortie** | Extraits de Code | **Requêtes Exécutées et UIs Visuelles** |
| **Affinement** | Débogage manuel | **Auto-correction Conversationnelle** |

Ce flux de travail transforme l'IDE d'un éditeur de texte en un **centre de commande Maximo**, réduisant significativement le temps de développement et les erreurs.
