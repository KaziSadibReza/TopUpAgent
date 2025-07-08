import puppeteer from "puppeteer";

const PlayerID = "8000000000";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto("https://shop.garena.my/?app=100067&channel=202953");
  await page.waitForSelector(
    'input[placeholder="Please enter player ID here"]'
  );
  await page.type(
    'input[placeholder="Please enter player ID here"]',
    PlayerID,
    { delay: 100 }
  );
  await browser.close();
})();
