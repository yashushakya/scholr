require("dotenv").config()
const puppeteer = require("puppeteer-core")

;(async () => {
  console.log("CHROME_PATH =", process.env.CHROME_PATH)
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  console.log("Launched OK:", await browser.version())
  await browser.close()
})().catch((e) => console.error("FAILED:", e.message))