import puppeteer from "puppeteer";

const PlayerID = "3974978674";

const RedimensionCode = "UPBD-H-S-01100816 1664-4194-3263-6626";

// Code mapping for packages
const codeMapping = {
  // BDMB codes
  "BDMB-T-S": "25 Diamond",
  "BDMB-U-S": "50 Diamond",
  "BDMB-J-S": "115 Diamond",
  "BDMB-I-S": "240 Diamond",
  "BDMB-K-S": "610 Diamond",
  "BDMB-L-S": "1240 Diamond",
  "BDMB-M-S": "2530 Diamond",
  "BDMB-Q-S": "Weekly Membership",
  "BDMB-S-S": "Monthly Membership",
  // UPBD codes
  "UPBD-Q-S": "25 Diamond",
  "UPBD-R-S": "50 Diamond",
  "UPBD-G-S": "115 Diamond",
  "UPBD-F-S": "240 Diamond",
  "UPBD-H-S": "610 Diamond",
  "UPBD-I-S": "1240 Diamond",
  "UPBD-J-S": "2530 Diamond",
  "UPBD-N-S": "Weekly Membership",
  "UPBD-P-S": "Monthly Membership",
};

// Function to get package name from redimension code
function getPackageFromCode(code) {
  const codePrefix = code.split("-").slice(0, 3).join("-"); // Get BDMB-J-S part
  return codeMapping[codePrefix];
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
    ],
  });
  const page = await browser.newPage();

  // Set user agent to mimic a real browser
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
  );

  // Set viewport
  await page.setViewport({ width: 1366, height: 768 });

  // Add extra headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });

  // Hide webdriver property
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  await page.goto("https://shop.garena.my/?app=100067&channel=202953");
  await page.waitForSelector(
    'input[placeholder="Please enter player ID here"]'
  );

  // Type the Player ID into the input field
  await page.type(
    'input[placeholder="Please enter player ID here"]',
    PlayerID,
    { delay: 100 }
  );

  // Click the Login button
  await page.click('button[type="submit"]');

  // Wait for the username to appear and extract it
  await page.waitForSelector(".line-clamp-2.text-sm\\/none.font-bold", {
    timeout: 10000,
  });
  const username = await page.$eval(
    ".line-clamp-2.text-sm\\/none.font-bold",
    (el) => {
      return el.innerText;
    }
  );
  console.log("Username:", username);

  await page.waitForSelector(
    "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full",
    { timeout: 10000 }
  );

  await page.click(
    "button.inline-flex.items-center.justify-center.gap-1\\.5.rounded-md.border.py-1.text-center.leading-none.transition-colors.border-primary-red.bg-primary-red.text-white.hover\\:bg-primary-red-hover.hover\\:border-primary-red-hover.px-5.text-base.font-bold.h-11.w-full"
  );
  await Promise.all([page.waitForNavigation()]);

  // Get the package name from the redimension code
  const packageName = getPackageFromCode(RedimensionCode);
  console.log("Package to select:", packageName);

  // Wait for the package selection buttons to load
  await page.waitForSelector(".payment-denom-button", { timeout: 10000 });

  // Click the correct package button
  const packageButton = await page.evaluateHandle((packageName) => {
    const buttons = document.querySelectorAll(".payment-denom-button");
    for (let button of buttons) {
      const nameDiv = button.querySelector("div");
      if (nameDiv && nameDiv.textContent.trim() === packageName) {
        return button;
      }
    }
    return null;
  }, packageName);

  if (packageButton) {
    await packageButton.click();
    console.log(`Clicked on ${packageName} package`);
    await page.waitForNavigation({ waitUntil: "networkidle2" });
  } else {
    console.log(`Package ${packageName} not found`);
    return;
  }

  // Wait for payment channel selection page
  await page.waitForSelector("#VOUCHER_panel", { timeout: 10000 });

  // Expand the VOUCHER panel first
  await page.click('button[data-target="#VOUCHER_panel"]');
  await page.waitForSelector("#VOUCHER_panel.show", { timeout: 5000 });

  // Determine which payment method to use based on code type
  const codeType = RedimensionCode.split("-")[0]; // Get BDMB or UPBD

  if (codeType === "BDMB") {
    // Click UniPin Voucher
    await page.click("#pc_div_659");
    console.log("Selected UniPin Voucher for BDMB code");
  } else if (codeType === "UPBD") {
    // Click UP Gift Card
    await page.click("#pc_div_670");
    console.log("Selected UP Gift Card for UPBD code");
  } else {
    console.log("Unknown code type:", codeType);
    return;
  }

  // Wait for the voucher form to load instead of navigation
  await page.waitForSelector(
    "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial",
    { timeout: 15000 }
  );

  // Fill the serial field with the complete RedimensionCode
  await page.type(
    "input.form-control.text-center.unipin-voucher-textbox.profile-reload-serial1.autotab-serial",
    RedimensionCode,
    { delay: 100 }
  );

  // Click the Confirm button
  await page.click('input[type="submit"][value="Confirm"]');
  console.log("Clicked Confirm button");

  // Wait for the next page to load
  try {
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    // Check if there's an error message
    const errorElement = await page.$(".title-case-0");
    if (errorElement) {
      const errorText = await page.evaluate(
        (el) => el.textContent,
        errorElement
      );
      console.log("ERROR:", errorText);

      // Check if it's a consumed voucher error
      if (errorText.includes("Consumed Voucher")) {
        console.log("ERROR: The voucher code has already been used/consumed!");
        console.log("Please use a different voucher code.");
      }
    } else {
      console.log("Transaction completed successfully!");
    }
  } catch (error) {
    console.log("Navigation error:", error.message);
  }

  await browser.close();
})();
