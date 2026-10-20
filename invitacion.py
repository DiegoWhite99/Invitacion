#!/usr/bin/env python3
"""Herramientas en Python para la invitación (solo librería estándar).

  python3 invitacion.py serve [puerto]   Sirve la web y guarda las confirmaciones (API /api/rsvp)
  python3 invitacion.py links <url_base> Genera links.txt con el link y mensaje de cada invitado
  python3 invitacion.py resumen          Muestra quién confirmó (lee rsvps.json)
"""
import json
import re
import sys
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).parent
DB = ROOT / "rsvps.json"
PUBLIC = {"index.html", "style.css", "app.js", "guests.js", "robot.js", "admin.html"}
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8"}


def load_guests():
    """Lee guests.js (comparte la misma lista que la web) sin duplicar datos."""
    text = (ROOT / "guests.js").read_text(encoding="utf-8")
    guests = []
    for m in re.finditer(r"\{\s*id:\s*\"(\w+)\",\s*name:\s*\"([^\"]+)\",\s*g:\s*\"([fm])\",\s*rel:\s*\"([^\"]+)\"", text):
        guests.append({"id": m[1], "name": m[2], "g": m[3], "rel": m[4]})
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
        if name not in PUBLIC:
            return self._send(404, b"No encontrado", "text/plain")
        self._send(200, (ROOT / name).read_bytes(), TYPES.get(Path(name).suffix, "text/plain"))

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
        saludo = "Querida" if g["g"] == "f" else "Querido"
        lines.append(f"{g['name']} ({g['rel']})\n{saludo} {g['name'].split()[0]}, tienes una invitación especial 🎓✉️ {base}?i={g['id']}\n")
    (ROOT / "links.txt").write_text("\n".join(lines), encoding="utf-8")
    print(f"links.txt generado con {len(lines)} invitados")


def cmd_resumen():
    db = load_rsvps()
    guests = load_guests()
    label = {"yes": "✔ asiste", "no": "✘ no asiste"}
    for g in guests:
        r = db.get(g["id"])
        print(f"{g['name']:<28} {label[r['answer']] if r else '… pendiente'}")
    yes = sum(1 for r in db.values() if r["answer"] == "yes")
    print(f"\nConfirmados: {yes} · Respondieron: {len(db)} · Total: {len(guests)}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args[:1] == ["serve"]:
        cmd_serve(int(args[1]) if len(args) > 1 else 3000)
    elif args[:1] == ["links"] and len(args) > 1:
        cmd_links(args[1])
    elif args[:1] == ["resumen"]:
        cmd_resumen()
    else:
        print(__doc__)
