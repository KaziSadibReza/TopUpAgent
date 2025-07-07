import puppeteer from "puppeteer";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://shop.garena.my/?app=100067&channel=202953");
  await browser.close();
})();
