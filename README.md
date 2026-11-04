# Seitenlinie als App installieren

Damit sich das Spiel installieren lässt, muss es **einmal** unter einer https-Webadresse liegen. Danach läuft es auf jedem Gerät ohne Internet. Updates holt sich die App automatisch, sobald du online bist, und fragt mit „Aktualisieren“ nach.

## Inhalt des Ordners
| Datei | Zweck |
|---|---|
| `index.html` | Das Spiel |
| `manifest.webmanifest` | Name, Symbol und Vollbild-Modus der App |
| `sw.js` | Service Worker: speichert das Spiel auf dem Gerät, damit es offline startet |
| `icons/` | App-Symbole |

## Kostenlos online stellen – Variante GitHub Pages
1. Kostenloses Konto auf github.com anlegen.
2. Neues Repository erstellen, z. B. `seitenlinie`, auf **Public** stellen.
3. „Add file → Upload files“ wählen und **alle Dateien samt Ordner `icons`** hochladen, dann „Commit changes“.
4. Settings → Pages → Source: „Deploy from a branch“, Branch `main`, Ordner `/ (root)` → Save.
5. Nach 1–2 Minuten ist das Spiel unter `https://DEINNAME.github.io/seitenlinie/` erreichbar.

## Kostenlos online stellen – Variante Netlify Drop
1. app.netlify.com/drop öffnen und den entpackten Ordner ins Fenster ziehen.
2. Mit einem kostenlosen Konto die Seite übernehmen („Claim“), sonst wird sie nach einer Stunde gelöscht.

## Installieren
- **iPhone/iPad:** Adresse in **Safari** öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.
- **Android:** In Chrome öffnen → Hinweis „App installieren“ oder Menü ⋮ → „App installieren“.
- **PC/Mac:** In Chrome oder Edge öffnen → Installieren-Symbol rechts in der Adressleiste.

Öffne die App nach der Installation einmal mit Internet, danach geht alles offline.

## Spielstand zwischen Geräten
Jedes Gerät hat einen eigenen Speicher. Zum Wechseln: Menü → **Exportieren** → teilen, als Datei sichern oder Text kopieren → auf dem anderen Gerät Menü → **Importieren**.
