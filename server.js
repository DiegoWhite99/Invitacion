// Servidor sin dependencias: sirve la invitación y guarda las confirmaciones.
// Uso: node server.js   (PORT opcional)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DB = path.join(__dirname, "rsvps.json");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const PUBLIC = ["index.html", "style.css", "app.js", "guests.js", "admin.html", "robot.js"];

const read = () => { try { return JSON.parse(fs.readFileSync(DB, "utf8")); } catch { return {}; } };
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type" };

http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");

  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }

  if (url.pathname === "/api/rsvp" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 1e4) req.destroy(); });
    req.on("end", () => {
      try {
        const { id, name, answer } = JSON.parse(body);
        if (!id || !["yes", "no"].includes(answer)) throw new Error("bad");
        const db = read();
        db[id] = { name: String(name).slice(0, 80), answer, at: new Date().toISOString() };
        fs.writeFileSync(DB, JSON.stringify(db, null, 2));
        res.writeHead(200, { ...cors, "content-type": "application/json" }); res.end('{"ok":true}');
      } catch { res.writeHead(400, cors); res.end(); }
    });
    return;
  }

  if (url.pathname === "/api/rsvps") {
    res.writeHead(200, { ...cors, "content-type": "application/json" });
    return res.end(JSON.stringify(read(), null, 2));
  }

  const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  if (!PUBLIC.includes(file)) { res.writeHead(404); return res.end("No encontrado"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "text/plain" });
  fs.createReadStream(path.join(__dirname, file)).pipe(res);
}).listen(PORT, () => console.log(`Invitación en http://localhost:${PORT}  (confirmaciones: /api/rsvps)`));
