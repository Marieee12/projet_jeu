# Bubble Shooter – Projet JavaScript (Docker)

Ce projet est un jeu de type Bubble Shooter développé en JavaScript avec un rendu graphique via Canvas.  
Il a été réalisé dans un cadre pédagogique, avec l’objectif de ne pas faire uniquement un jeu, mais aussi de travailler comme sur un vrai projet de développement, en intégrant des notions de Docker, CI/CD, tests et monitoring.

## Principe du jeu

Le joueur lance des bulles colorées vers une grille située en haut de l’écran.

- Quand au moins trois bulles de la même couleur se touchent, elles disparaissent
- Le score augmente selon les bulles détruites
- Le joueur gagne quand la grille est entièrement vidée
- Le joueur perd selon les règles du niveau (blocage, coups limités, etc.)

## Stack technique

- JavaScript (ES Modules)
- HTML / CSS
- Canvas API
- Node.js
- Docker et Docker Compose
- GitHub et GitLab
- GitLab CI/CD
- Render
- Jest
- BetterStack

## Pour un·e développeur·se qui rejoint le projet

### Prérequis

Le projet est entièrement dockerisé.  
Il n’est pas nécessaire d’installer Node.js en local.

Pré-requis :
- Docker Desktop (inclus Docker Compose) sous mac et windows
- Docker Engine + Docker Compose sur Linux 
- Git

### Installation du projet

Cloner le dépôt :

git clone git@gitlab.com:shoto12/projet_jeu.git
cd projet_jeu


### Vérifier que Docker fonctionne 
Vérifier que Docker Desktop est bien installé et que Docker Compose est disponible

docker --version

docker compose version

### Docker et environnements (dev / prod)

Le projet utilise Docker Compose avec des profils afin de séparer l’environnement de développement et l’environnement de production.
Tout le projet se lance uniquement via Docker.

### Lancer le projet en mode développement

docker compose --profile dev up --build

### Le jeu est accessible à l’adresse suivante :

http://localhost:3010


### Arrêter le projet :

docker compose down

### Lancer le projet en mode production (local)

docker compose --profile prod up --build


### Différences avec le mode dev :
- pas de volume
-code figé dans l’image Docker
- configuration plus stable

-> Dans le cadre de l’exercice :
- permet d’expliquer clairement la notion de production
- aide à comprendre le déploiement

-> Dans la réalité :
Ce mode est surtout utilisé par la CI ou l’hébergeur

### Lancer les tests (Jest)
docker compose --profile dev run app npm run test

### Workflow Git (GitHub / GitLab)

Branches principales :

- dev pour le développement
- main pour la production

### CI / CD (GitLab + Docker + Render)
-> CI – Intégration continue
À chaque push ou Merge Request, GitLab lance une pipeline, l’image Docker est construite, 
les dépendances sont installées, les tests Jest sont exécutés.

-> CD – Déploiement continu
Un merge sur la branche main déclenche un déploiement automatique, reste tout de même à lancer manuellement sur Render.

### Architecture globale du code
/src
  /game        logique du jeu (grille, tirs, collisions)
  /levels      configuration des niveaux -> blue prints
  /ui          écrans, modales, affichage, dom variables
  /utils       helpers, logs, outils
  main.js      point d’entrée du jeu

/server
  server.js    serveur Node

/docker
  Dockerfile
  DockerfileProd
  docker-compose.yml

### Logique globale du jeu

Chargement de l’application
Initialisation du moteur de jeu
Chargement du niveau
Visée avec la souris
Tir d’une bulle
Collision avec la grille
Vérification des groupes de couleurs
Suppression des bulles
Mise à jour du score
Vérification victoire ou défaite
Niveau suivant ou fin de partie
Parcours joueur
Écran d’accueil
Lancement de la partie
Saisie du pseudo
Partie en cours
Victoire ou défaite
Score enregistré
Classement mis à jour

### Niveaux existants

Niveau 1 : découverte, peu de couleurs

Niveau 2 : plus de couleurs et plus de stratégie

Niveau 3 : difficulté intermédiaire avec obstacles et bonus

Les niveaux sont définis dans des fichiers blue prints et peuvent être étendus facilement.

### Monitoring et logs

- Le jeu envoie des logs pour suivre :
- le démarrage du jeu
- les tirs
- les scores enregistrés
- les victoires et défaites
- les erreurs
- Les logs sont centralisés avec BetterStack.

### Dans le cadre de l’exercice :

compréhension du monitoring
création d’alertes simples

Dans la réalité :

analyse des performances
suivi du comportement utilisateur
détection des bugs

### Améliorations possibles
Gameplay :
ajouter plus de niveaux
ajouter des bonus et malus
améliorer la progression de difficulté
améliorer les animations
ajouter plus de tests unitaires
ajouter des tests end-to-end
mieux séparer la logique et le rendu

Docker et DevOps :
ajouter un environnement staging
améliorer la gestion des variables d’environnement

Monitoring
créer des dashboards plus détaillés
analyser les comportements des joueurs
créer des alertes plus fines

