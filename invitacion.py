#!/usr/bin/env python3
"""Herramientas en Python para la invitación (solo librería estándar).

  python3 invitacion.py serve [puerto]   Sirve la web y guarda las confirmaciones (API /api/rsvp)
  python3 invitacion.py links <url_base> Genera links.txt con el link y mensaje de cada invitado
  python3 invitacion.py resumen          Muestra quién confirmó (lee rsvps.json)
  python3 invitacion.py bump             Actualiza la versión de los archivos (úsalo antes de cada push)
  python3 invitacion.py voces            Genera los audios de SMIDY en voices/ (requiere: pip install edge-tts)
"""
import asyncio
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
DB = ROOT / "rsvps.json"
PUBLIC = {"index.html", "style.css", "app.js", "guests.js", "robot.js", "narracion.js", "sfx.js", "music.js", "tilt.js", "admin.html"}
TYPES_EXTRA = {".mp3": "audio/mpeg", ".json": "application/json"}
# Voz de SMIDY: neuronal en español, sin retoques; la web sube un poco el tono al reproducir (ver PRESETS en robot.js).
# Sube este número cuando cambies mensajes: así los links nuevos nunca muestran una versión vieja en caché.
LINK_V = 4
VOICE, PITCH, RATE = "es-MX-DaliaNeural", "+0Hz", "+0%"
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8"}


def load_guests():
    """Lee guests.js (comparte la misma lista que la web) sin duplicar datos."""
    text = (ROOT / "guests.js").read_text(encoding="utf-8")
    guests = []
    for block in re.finditer(r"\{\s*id:[^}]*\}", text):
        b = block[0]
        field = lambda k: (re.search(rf'\b{k}:\s*"([^"]*)"', b) or [None, ""])[1]
        guests.append({"id": field("id"), "name": field("name"), "g": field("g"), "rel": field("rel"), "msg": field("msg"), "tail": field("tail"), "first": field("first"), "plural": "plural: true" in b})
    return guests


def load_rsvps():
    try:
        return json.loads(DB.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body=b"", ctype="application/json"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/rsvps":
            return self._send(200, json.dumps(load_rsvps(), ensure_ascii=False, indent=2).encode())
        name = "index.html" if path == "/" else path.lstrip("/")
        if name not in PUBLIC and not re.fullmatch(r"voices/[\w.]+\.(mp3|json)", name):
            return self._send(404, b"No encontrado", "text/plain")
        self._send(200, (ROOT / name).read_bytes(), {**TYPES, **TYPES_EXTRA}.get(Path(name).suffix, "text/plain"))

    def do_POST(self):
        if self.path != "/api/rsvp":
            return self._send(404)
        try:
            size = min(int(self.headers.get("Content-Length", 0)), 10_000)
            data = json.loads(self.rfile.read(size))
            if not data.get("id") or data.get("answer") not in ("yes", "no"):
                raise ValueError
        except ValueError:
            return self._send(400)
        db = load_rsvps()
        db[data["id"]] = {
            "name": str(data.get("name", ""))[:80],
            "answer": data["answer"],
            "at": datetime.now(timezone.utc).isoformat(),
        }
        DB.write_text(json.dumps(db, ensure_ascii=False, indent=2), encoding="utf-8")
        self._send(200, b'{"ok":true}')

    def log_message(self, fmt, *args):
        pass


def cmd_serve(port=3000):
    print(f"Invitación en http://localhost:{port}  (confirmaciones: /api/rsvps)")
    ThreadingHTTPServer(("", port), Handler).serve_forever()


def cmd_links(base):
    base = base.rstrip("/") + "/index.html"
    lines = []
    for g in load_guests():
        saludo = "Queridos" if g["plural"] else "Querida" if g["g"] == "f" else "Querido"
        lines.append(f"{g['name']} ({g['rel']})\n{saludo} {g['first'] or g['name'].split()[0]}, {'tienen' if g['plural'] else 'tienes'} una invitación especial 🎓✉️ {base}?i={g['id']}&v={LINK_V}\n")
    (ROOT / "links.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"links.txt generado con {len(lines)} invitados")


def cmd_bump():
    """Cambia ?v=... en index.html para que los celulares no usen archivos viejos en caché."""
    import time
    f = ROOT / "index.html"
    html = re.sub(r'((?:src|href)="(?!https?:)[\w./-]+\.(?:js|css))(?:\?v=\d+)?"', lambda m: f'{m[1]}?v={int(time.time())}"', f.read_text(encoding="utf-8"))
    f.write_text(html, encoding="utf-8")
    print("versión de archivos actualizada")


def cmd_resumen():
    db = load_rsvps()
    guests = load_guests()
    label = {"yes": "✔ asiste", "no": "✘ no asiste"}
    for g in guests:
        r = db.get(g["id"])
        print(f"{g['name']:<28} {label[r['answer']] if r else '… pendiente'}")
    yes = sum(1 for r in db.values() if r["answer"] == "yes")
    print(f"\nConfirmados: {yes} · Respondieron: {len(db)} · Total: {len(guests)}")


def cmd_voces():
    try:
        import edge_tts
    except ImportError:
        sys.exit("Falta edge-tts:  pip install edge-tts")

    narr = json.loads(re.search(r"window\.NARR\s*=\s*(\{.*?\})\s*;", (ROOT / "narracion.js").read_text(encoding="utf-8"), re.S)[1])
    place = re.search(r'place:\s*"([^"]*)"', (ROOT / "app.js").read_text(encoding="utf-8"))[1]
    where = "El lugar te lo confirma Diego muy pronto." if place == "Por confirmar" else f"Será en {place}."

    narr_pl = {**narr, **json.loads(re.search(r"NARR_PL\s*=\s*(\{.*?\})\s*;", (ROOT / "narracion.js").read_text(encoding="utf-8"), re.S)[1])}
    texts = set()
    for g in load_guests():
        src = narr_pl if g["plural"] else narr
        vals = {"first": g["first"] or g["name"].split()[0], "saludo": "Queridos" if g["plural"] else "Querida" if g["g"] == "f" else "Querido", "msg": g["msg"], "tail": g["tail"] or src["tail"], "where": where}
        for k, tpl in src.items():
            if k == "tail":
                continue
            texts.add(re.sub(r"\{(\w+)\}", lambda m: vals[m[1]], tpl))

    out = ROOT / "voices"
    out.mkdir(exist_ok=True)
    manifest = {}
    todo = []
    for t in sorted(texts):
        f = out / (hashlib.sha1(t.encode()).hexdigest()[:12] + ".mp3")
        manifest[t] = f"voices/{f.name}"
        if not f.exists():
            todo.append((t, f))

    async def run():
        sem = asyncio.Semaphore(4)

        async def one(t, f):
            async with sem:
                await edge_tts.Communicate(t, VOICE, rate=RATE, pitch=PITCH).save(str(f))

        await asyncio.gather(*(one(t, f) for t, f in todo))

    asyncio.run(run())
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(manifest)} audios en voices/ ({len(todo)} nuevos)")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["serve"]:
        cmd_serve(int(args[1]) if len(args) > 1 else 3000)
    elif args[:1] == ["links"] and len(args) > 1:
        cmd_links(args[1])
    elif args[:1] == ["bump"]:
        cmd_bump()
    elif args[:1] == ["voces"]:
        cmd_voces()
    elif args[:1] == ["resumen"]:
        cmd_resumen()
    else:
        print(__doc__)
