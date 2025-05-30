# BudgetME


[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.4.5-purple.svg)](https://vitejs.dev/)

BudgetME è un'applicazione web moderna per la gestione del budget personale, sviluppata con React e ispirata al design di iOS.

## Caratteristiche

- 💰 Gestione di conti multipli
- 🔄 Trasferimenti tra conti (con saldo aggiornato in tempo reale e gestione di data/ora)
- 📊 Tracciamento entrate e uscite
- 🔄 Transazioni ricorrenti
- 📱 Design responsive in stile iOS
- 🌓 Supporto per la modalità scura
- 🔍 Ricerca avanzata delle transazioni
- 📈 Visualizzazione del bilancio mensile
- 🏷️ Categorizzazione delle spese

## Tecnologie Utilizzate

- React
- Vite
- CSS3 (con animazioni e transizioni)
- LocalStorage per la persistenza dei dati
- Firebase (per autenticazione e salvataggio dati, se configurato)
- gh-pages (per deploy su GitHub Pages)

## Installazione

1. Clona il repository:
```bash
git clone https://github.com/tuousername/budgetme.git
cd budgetme
```

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia il server di sviluppo:
```bash
npm run dev
```

4. Per buildare il progetto:
```bash
npm run build
```

## Utilizzo

1. Crea un nuovo conto con il saldo iniziale
2. Aggiungi transazioni (entrate, uscite o trasferimenti tra conti)
3. Categorizza le tue spese
4. Imposta transazioni ricorrenti
5. Monitora il tuo bilancio mensile
6. Usa la ricerca avanzata per trovare transazioni specifiche
7. I trasferimenti tra conti generano automaticamente una doppia transazione (uscita e entrata) e vengono aggiornati/modificati in modo sincronizzato
8. Il saldo attuale dei conti considera solo le transazioni fino alla data e ora attuale

## Deploy su GitHub Pages

Per pubblicare il sito su GitHub Pages:

1. Assicurati che il campo `homepage` in `package.json` sia impostato correttamente:
   ```json
   "homepage": "https://tuousername.github.io/budgetme"
   ```
2. Esegui:
   ```bash
   npm run deploy
   ```
   Questo comando builda il progetto e pubblica la cartella `dist` sul branch `gh-pages`.
3. Attendi qualche minuto e aggiorna la pagina pubblicata. Se non vedi le modifiche, svuota la cache del browser o forzane il refresh con `Ctrl+F5`.

## Contribuire

Le pull request sono benvenute. Per modifiche importanti, apri prima un issue per discutere cosa vorresti cambiare.

## Licenza

[MIT](https://choosealicense.com/licenses/mit/)

## Autore

Il tuo nome - [@tuousername](https://github.com/tuousername) 