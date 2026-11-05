# Erzeugt seitenlinie.html: eine einzelne Datei mit allen Skripten und Schriften (zum Offline-Öffnen am PC)
import re,pathlib,base64
root=pathlib.Path(__file__).parent
html=(root/'index.html').read_text()
for name in ['world.js','engine.js','matchsim.js','atmo.js','comps.js','natcups.js','contracts.js','transfers.js','market.js','tactics.js','ui.js','calendar.js','live.js','view3d.js','stats.js','talk.js','room.js','crew.js']:
    js=(root/name).read_text().replace('</script>','<\\/script>')
    html=html.replace(f'<script src="{name}"></script>',f'<script>\n{js}\n</script>')
def font(m):
    data=base64.b64encode((root/m.group(1)).read_bytes()).decode()
    return f"url('data:font/woff;base64,{data}')"
html=re.sub(r"url\('(fonts/[^']+\.woff)'\)",font,html)
html=re.sub(r'<link rel="preload"[^>]*>\n','',html)
(root.parent/'seitenlinie.html').write_text(html)
print('ok',len(html))
