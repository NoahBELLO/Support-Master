# Application mobile Android — Capacitor

Ce document décrit comment générer un APK Android à partir de l'application Next.js **Support Master** via [Capacitor](https://capacitorjs.com/).

---

## Table des matières

1. [Principe et architecture](#1-principe-et-architecture)
2. [Prérequis communs](#2-prérequis-communs)
3. [Partie A — Build local avec Docker](#3-partie-a--build-local-avec-docker)
4. [Partie B — Build automatisé avec GitHub Actions](#4-partie-b--build-automatisé-avec-github-actions)
5. [Versionning automatique de l'APK](#5-versionning-automatique-de-lapk)
6. [Installer l'APK sur un appareil Android](#6-installer-lapk-sur-un-appareil-android)
7. [Comparaison des deux approches](#7-comparaison-des-deux-approches)

---

## 1. Principe et architecture

Capacitor enveloppe l'application web dans une **WebView Android native**. Il a besoin d'un export statique (fichiers HTML/CSS/JS) — pas d'un serveur Next.js tournant en continu.

Le pipeline de génération suit ces 6 étapes dans les deux approches :

```
next build (export statique)
       ↓
 npx cap add android       ← génère le projet Android natif
       ↓
 npx cap sync android      ← copie les assets web dans Android
       ↓
 Patch build.gradle        ← injecte versionCode / versionName
       ↓
 ./gradlew assembleDebug   ← compile l'APK
       ↓
 app-debug.apk             ← prêt à installer
```

### Structure du projet

```
Support-Master/
├── frontend/
│   ├── capacitor.config.json   ← configuration Capacitor
│   └── next.config.ts          ← gère BUILD_MODE=export
├── docker/
│   ├── Dockerfile              ← image Ubuntu + JDK 21 + Android SDK 34
│   └── docker-compose.yml      ← service android-builder
├── scripts/
│   ├── build-android.sh        ← point d'entrée (machine hôte)
│   └── docker-entrypoint.sh    ← exécuté à l'intérieur du conteneur
├── generated/                  ← APK généré (gitignore)
│   ├── builds/apk/app-debug.apk
│   └── source/android/
└── .github/workflows/
    └── build-android.yml       ← pipeline GitHub Actions
```

### Configuration Capacitor (`frontend/capacitor.config.json`)

```json
{
  "appId": "com.keyce.supportmaster",
  "appName": "SupportMaster",
  "webDir": "out",
  "server": {
    "androidScheme": "https"
  }
}
```

---

## 2. Prérequis communs

### Adaptation de Next.js pour Capacitor

`frontend/next.config.ts` bascule en mode export statique via la variable `BUILD_MODE` :

```ts
const isMobileBuild = process.env.BUILD_MODE === "export";

const nextConfig = {
  output: isMobileBuild ? "export" : "standalone",
  trailingSlash: isMobileBuild,
  images: { unoptimized: isMobileBuild },
};
```

> En mode `export`, Next.js génère un dossier `out/` de fichiers statiques que Capacitor embarque dans la WebView.

### `.gitignore` — fichiers exclus

```gitignore
# Build mobile (générés automatiquement)
generated/
frontend/out/
frontend/android/
```

---

## 3. Partie A — Build local avec Docker

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et démarré
- Aucune autre dépendance locale (JDK, Android SDK, etc.)

### Lancer le build

```bash
./scripts/build-android.sh
```

Ce script :
1. Vérifie que Docker est actif
2. Charge les variables du fichier `.env`
3. Lance le conteneur `android-builder` via `docker/docker-compose.yml`

### Ce qui se passe dans le conteneur (`docker-entrypoint.sh`)

| Étape | Action |
|---|---|
| 1 | `npm ci` — installe les dépendances Node.js |
| 2 | `BUILD_MODE=export npm run build` — génère `out/` |
| 3 | `npx cap add android` — crée le projet Android natif |
| 4 | `npx cap sync android` — synchronise les assets web |
| 5 | `./gradlew assembleDebug` — compile l'APK |
| 6 | Copie l'APK dans `generated/builds/apk/app-debug.apk` |

### Résultat attendu

```
══════════════════════════════════
   BUILD ANDROID TERMINÉ AVEC SUCCÈS
══════════════════════════════════
  APK    : generated/builds/apk/app-debug.apk
  Taille : ~8 Mo
  Source : generated/source/android/
══════════════════════════════════
```

> **Durée** : 20-30 min au premier build (téléchargement Android SDK ~1 Go), 2-5 min les suivants grâce au cache Gradle.

---

## 4. Partie B — Build automatisé avec GitHub Actions

### Déclencheur

Le workflow `.github/workflows/build-android.yml` se déclenche **uniquement sur un tag Git** de la forme `v*` :

```bash
git tag v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Il peut aussi être lancé manuellement depuis **GitHub → Actions → Run workflow**.

### Étapes du pipeline

| # | Étape | Description |
|---|---|---|
| 1 | Checkout | Récupère le code source |
| 2 | Node.js 22 | Configure Node avec cache npm |
| 3 | Java 21 | Requis par Gradle / Android SDK |
| 4 | Android SDK 34 | `platform-tools`, `build-tools;34.0.0` |
| 5 | Cache Gradle | Accélère les builds suivants |
| 6 | `npm ci` | Installe les dépendances frontend |
| 7 | `npm run build` | Export statique (`BUILD_MODE=export`) |
| 8 | `cap add/sync android` | Génère et synchronise le projet Android |
| 9 | **Patch build.gradle** | Injecte `versionCode` et `versionName` |
| 10 | `gradlew assembleDebug` | Compile l'APK avec les paramètres de version |
| 11 | Upload artifact | APK disponible 30 jours dans GitHub Actions |
| 12 | Résumé | Tableau récapitulatif affiché dans l'onglet Actions |

### Télécharger l'APK

1. Aller sur le dépôt GitHub → onglet **Actions**
2. Cliquer sur le workflow déclenché par le tag
3. Section **Artifacts** → cliquer sur `app-debug-<tag>-<run_number>`

---

## 5. Versionning automatique de l'APK

À chaque build, le workflow patche `android/app/build.gradle` (généré à la volée par Capacitor) avant la compilation :

```bash
# versionCode = numéro de build GitHub (entier croissant)
VERSION_CODE=${{ github.run_number }}

# versionName = tag sans le préfixe 'v' (ex: v1.2.3 → "1.2.3")
VERSION_NAME="${{ github.ref_name }}"
VERSION_NAME="${VERSION_NAME#v}"

sed -i "s/versionCode [0-9]*/versionCode ${VERSION_CODE}/" build.gradle
sed -i "s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" build.gradle
```

Ces valeurs sont également transmises à Gradle via `-P` :

```bash
./gradlew assembleDebug \
  -PversionCode=${VERSION_CODE} \
  -PversionName=${VERSION_NAME}
```

### Conventions de tags

| Tag | `versionName` dans l'APK | Usage conseillé |
|---|---|---|
| `v1.0.0` | `1.0.0` | Première version stable |
| `v1.1.0` | `1.1.0` | Nouvelle fonctionnalité |
| `v1.1.1` | `1.1.1` | Correctif |

---

## 6. Installer l'APK sur un appareil Android

### Méthode 1 — Câble USB (adb)

```bash
# Vérifier que l'appareil est détecté
adb devices

# Installer l'APK
adb install generated/builds/apk/app-debug.apk
```

> Prérequis : activer le **mode développeur** (Paramètres → À propos → appuyer 7 fois sur "Numéro de build") et le **débogage USB**.

### Méthode 2 — Transfert de fichier

Transférer `app-debug.apk` par email, Google Drive ou clé USB, puis l'ouvrir depuis le téléphone.

> Activer **"Installer des applications de sources inconnues"** dans Paramètres → Sécurité.

---

## 7. Comparaison des deux approches

| Critère | Docker local (Partie A) | GitHub Actions (Partie B) |
|---|---|---|
| **Déclencheur** | `./scripts/build-android.sh` | `git push origin vX.Y.Z` |
| **Installation requise** | Docker Desktop | Aucune |
| **Durée 1er build** | 20 à 30 min | 10 à 15 min |
| **Durée builds suivants** | 2 à 5 min (cache) | 3 à 7 min (cache) |
| **Coût** | Gratuit | Gratuit (2 000 min/mois) |
| **APK disponible** | `generated/builds/apk/` | Onglet Actions → Artifacts |
| **Fonctionne hors ligne** | ✅ Oui (après 1er build) | ❌ Non |
| **Visible par l'équipe** | ❌ Non | ✅ Oui |
| **Versionning automatique** | ❌ Manuel | ✅ Via tags Git |
| **Proche prod entreprise** | Moyen | ✅ Très proche |
