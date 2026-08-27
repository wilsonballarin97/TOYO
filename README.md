# TOYO · Travel on your own

App per organizzare i viaggi (itinerario, prenotazioni, spese divise, documenti,
decisioni del gruppo). Funziona anche offline ed è installabile come app sulla
schermata Home (PWA).

## Struttura

```
index.html            l'app intera (HTML + CSS + JS in un solo file)
manifest.webmanifest   metadati per l'installazione come app
sw.js                   service worker: cache offline + aggiornamenti automatici
icon-192.png            icona
icon-512.png            icona
icon-512-maskable.png   icona "maskable" (Android la ritaglia in un cerchio)
```

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub (es. `TOYO`) e carica **tutti** questi file
   nella radice del repository (non in una sottocartella), oppure clona il
   repo vuoto e copiaceli dentro:

   ```bash
   git init
   git add .
   git commit -m "Prima pubblicazione TOYO"
   git branch -M main
   git remote add origin https://github.com/TUO-UTENTE/TOYO.git
   git push -u origin main
   ```

2. Su GitHub: **Settings → Pages → Build and deployment → Source**, scegli
   `Deploy from a branch`, branch `main`, cartella `/ (root)`. Salva.

3. Dopo un minuto l'app è online su
   `https://TUO-UTENTE.github.io/TOYO/` (i percorsi nel codice sono relativi
   apposta per funzionare in una sottocartella come questa).

## Aggiornare l'app dopo la prima pubblicazione

Ogni volta che modifichi `index.html` (o le icone/manifest) e fai push su
`main`, GitHub Pages ripubblica da solo. Ricordati però di **cambiare
`CACHE_VERSION` in `sw.js`**: è quello che dice al telefono di chi ha già
installato l'app "c'è una versione nuova, scaricala", altrimenti il service
worker continua a servire la versione salvata in cache.

## Nota su Supabase

La chiave già scritta in `index.html` (`sb_publishable_...`) è quella
**pubblica**: è normale che sia visibile nel codice, la vedono tutti quelli
che usano l'app. A proteggere davvero i dati sono le regole di Row Level
Security impostate lato Supabase — quelle sì vanno controllate lì, non qui.
Non aggiungere mai la chiave `service_role` / `secret` in questo file.
