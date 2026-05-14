const { spawn } = require("child_process")
const path = require("path")

const nextBin = path.join(__dirname, "node_modules", "next", "dist", "bin", "next")
const port = process.env.PORT || "3000"

const child = spawn(process.execPath, [nextBin, "start"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
  },
})

child.on("exit", (code) => process.exit(code || 0))
child.on("error", (err) => {
  console.error("Gagal jalankan Next.js:", err.message)
  process.exit(1)
})

process.on("SIGTERM", () => child.kill("SIGTERM"))
process.on("SIGINT", () => child.kill("SIGINT"))
