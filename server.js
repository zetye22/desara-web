const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")

// Jaga server tetap jalan walau ada error header streaming
process.on("uncaughtException", (err) => {
  if (err.code === "ERR_HTTP_HEADERS_SENT") return
  console.error("Uncaught exception:", err)
  process.exit(1)
})

const port = parseInt(process.env.PORT || "3000", 10)

// Paksa pakai hostname 0.0.0.0 — hindari Hostinger memaksa Unix socket
const app = next({ dev: false, hostname: "0.0.0.0", port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`)
  })
}).catch((err) => {
  console.error("Gagal start server:", err)
  process.exit(1)
})
