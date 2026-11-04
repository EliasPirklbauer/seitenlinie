# Erzeugt seitenlinie.html: eine einzelne Datei mit allen Skripten (zum Offline-Öffnen am PC)
import re,pathlib
root=pathlib.Path(__file__).parent
html=(root/'index.html').read_text()
for name in ['world.js','engine.js','comps.js','ui.js']:
    js=(root/name).read_text().replace('</script>','<\\/script>')
    html=html.replace(f'<script src="{name}"></script>',f'<script>\n{js}\n</script>')
(root.parent/'seitenlinie.html').write_text(html)
print('ok',len(html))
