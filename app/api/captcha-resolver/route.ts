// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page } from "puppeteer";

// const BROWSER_CONFIG = {
//   headless: false,
//   slowMo: 150,
//   devtools: true,
//   args: [
//     "--no-sandbox",
//     "--disable-setuid-sandbox",
//     "--disable-dev-shm-usage",
//     "--disable-blink-features=AutomationControlled",
//     "--disable-features=VizDisplayCompositor",
//     "--disable-web-security",
//     "--disable-features=site-per-process",
//     "--start-maximized",
//     "--disable-extensions",
//     "--no-first-run",
//     "--disable-default-apps",
//     "--disable-popup-blocking",
//     "--disable-background-networking",
//     "--disable-background-timer-throttling",
//     "--disable-backgrounding-occluded-windows",
//     "--disable-renderer-backgrounding",
//     "--disable-component-update",
//     "--disable-client-side-phishing-detection",
//     "--disable-sync",
//     "--metrics-recording-only",
//     "--disable-default-apps",
//     "--mute-audio",
//     "--no-zygote",
//     "--no-pings",
//     "--enable-automation",
//     "--password-store=basic",
//     "--use-mock-keychain",
//     "--disable-ipc-flooding-protection",
//     "--disable-site-isolation-trials",
//     "--disable-notifications",
//     "--disable-translate",
//     "--hide-scrollbars",
//     "--disable-hang-monitor",
//     "--disable-infobars",
//     "--ignore-certifcate-errors",
//     "--ignore-certifcate-errors-spki-list",
//     "--window-position=0,0",
//     "--window-size=1920,1080",
//     "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//   ],
//   timeout: 180000,
// };

// async function launchBrowser(): Promise<Browser> {
//   try {
//     return await puppeteer.launch(BROWSER_CONFIG);
//   } catch (error) {
//     throw new Error(
//       `Failed to launch browser: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// }

// async function setupStealthPage(browser: Browser): Promise<Page> {
//   const page = await browser.newPage();

//   await page.setViewport({ width: 1920, height: 1080 });

//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );

//   await page.setExtraHTTPHeaders({
//     Accept:
//       "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//     "Accept-Language": "en-US,en;q=0.9",
//     "Accept-Encoding": "gzip, deflate, br",
//     "Cache-Control": "no-cache",
//     Pragma: "no-cache",
//     "sec-ch-ua":
//       '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": '"Windows"',
//     "Sec-Fetch-Dest": "document",
//     "Sec-Fetch-Mode": "navigate",
//     "Sec-Fetch-Site": "none",
//     "Sec-Fetch-User": "?1",
//     "Upgrade-Insecure-Requests": "1",
//     DNT: "1",
//     Connection: "keep-alive",
//   });

//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", {
//       get: () => undefined,
//     });

//     Object.defineProperty(navigator, "plugins", {
//       get: () => [
//         {
//           name: "Chrome PDF Plugin",
//           filename: "internal-pdf-viewer",
//           description: "Portable Document Format",
//           length: 1,
//         },
//         {
//           name: "Chrome PDF Viewer",
//           filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
//           description: "",
//           length: 1,
//         },
//         {
//           name: "Native Client",
//           filename: "internal-nacl-plugin",
//           description: "",
//           length: 2,
//         },
//       ],
//     });

//     Object.defineProperty(navigator, "languages", {
//       get: () => ["en-US", "en"],
//     });

//     Object.defineProperty(navigator, "platform", {
//       get: () => "Win32",
//     });

//     Object.defineProperty(navigator, "hardwareConcurrency", {
//       get: () => 8,
//     });

//     Object.defineProperty(navigator, "deviceMemory", {
//       get: () => 8,
//     });

//     Object.defineProperty(navigator, "maxTouchPoints", {
//       get: () => 0,
//     });

//     (window as any).chrome = {
//       runtime: {},
//       loadTimes: function () {
//         return {
//           requestTime: Date.now() * 0.001,
//           startLoadTime: Date.now() * 0.001,
//           commitLoadTime: Date.now() * 0.001,
//           finishDocumentLoadTime: Date.now() * 0.001,
//           finishLoadTime: Date.now() * 0.001,
//           firstPaintTime: Date.now() * 0.001,
//           firstPaintAfterLoadTime: 0,
//           navigationType: "Other",
//         };
//       },
//       csi: function () {
//         return {
//           onloadT: Date.now(),
//           startE: Date.now(),
//           tran: 15,
//         };
//       },
//     };

//     const originalQuery = window.navigator.permissions.query;
//     window.navigator.permissions.query = (parameters: any) =>
//       parameters.name === "notifications"
//         ? Promise.resolve({ state: (Notification as any).permission })
//         : originalQuery(parameters);

//     delete (window as any).process;
//     delete (window as any).Buffer;
//     delete (window as any).require;
//     delete (window as any).global;

//     const originalConsole = window.console.debug;
//     window.console.debug = function (...args: any[]) {
//       if (
//         args.length > 0 &&
//         typeof args[0] === "string" &&
//         args[0].includes("puppeteer")
//       ) {
//         return;
//       }
//       return originalConsole.apply(this, args);
//     };
//   });

//   return page;
// }

// async function humanDelay(
//   min: number = 1000,
//   max: number = 3000
// ): Promise<void> {
//   const delay = Math.floor(Math.random() * (max - min + 1)) + min;
//   console.log(`⏳ Waiting ${delay}ms...`);
//   await new Promise((resolve) => setTimeout(resolve, delay));
// }

// async function detectCloudflareChallenge(page: Page): Promise<{
//   isChallenge: boolean;
//   challengeType: string;
//   rayId: string | null;
//   pageTitle: string;
//   pageUrl: string;
// }> {
//   try {
//     const detection = await page.evaluate(() => {
//       const bodyText = document.body?.innerText?.toLowerCase() || "";
//       const html = document.documentElement.innerHTML.toLowerCase();
//       const title = document.title.toLowerCase();
//       const url = window.location.href.toLowerCase();

//       // Extract Ray ID
//       const rayIdMatch =
//         bodyText.match(/ray id[^\w]*([a-f0-9]+)/i) ||
//         bodyText.match(/your ray id[^\w]*([a-f0-9]+)/i) ||
//         html.match(/data-ray="([^"]+)"/i);
//       const rayId = rayIdMatch ? rayIdMatch[1] : null;

//       // Specific detection patterns
//       const detectionPatterns = {
//         // Title-based detection
//         titleIndicators: [
//           title.includes("additional verification required"),
//           title.includes("just a moment"),
//           title.includes("attention required"),
//           title.includes("checking your browser"),
//           title.includes("please wait"),
//         ],

//         // Text-based detection
//         textIndicators: [
//           bodyText.includes("additional verification required"),
//           bodyText.includes("verify you are human"),
//           bodyText.includes("checking your browser"),
//           bodyText.includes("please wait"),
//           bodyText.includes("verifying you are human"),
//           bodyText.includes("ddos protection"),
//           bodyText.includes("cloudflare"),
//           bodyText.includes("just a moment"),
//           bodyText.includes("enable javascript and cookies"),
//           bodyText.includes("browser check"),
//           bodyText.includes("ray id"),
//           bodyText.includes("troubleshooting cloudflare"),
//         ],

//         // Element-based detection
//         elementIndicators: [
//           !!document.querySelector("[data-ray]"),
//           !!document.querySelector(".cf-browser-verification"),
//           !!document.querySelector(".cf-im-under-attack"),
//           !!document.querySelector("#cf-wrapper"),
//           !!document.querySelector(".cf-error-overview"),
//           !!document.querySelector(".cf-challenge-running"),
//           !!document.querySelector(".cf-checking-browser"),
//           !!document.querySelector("#challenge-form"),
//           !!document.querySelector(".challenge-form"),
//           !!document.querySelector('input[type="checkbox"]'),
//         ],

//         // Cloudflare-specific elements
//         cloudflareElements: [
//           !!document.querySelector(".cf-turnstile"),
//           !!document.querySelector("[data-sitekey]"),
//           !!document.querySelector('iframe[src*="challenges.cloudflare.com"]'),
//           !!document.querySelector('iframe[src*="cloudflare.com"]'),
//           !!document.querySelector(".h-captcha"),
//           !!document.querySelector(".g-recaptcha"),
//         ],

//         // Form indicators
//         formIndicators: [
//           !!document.querySelector('form[action*="cdn-cgi"]'),
//           !!document.querySelector('form[action*="__cf_chl_f_tk"]'),
//           !!document.querySelector('input[name="cf_captcha_kind"]'),
//           !!document.querySelector('input[name="cf_chl_jschl_tk"]'),
//         ],

//         // URL indicators
//         urlIndicators: [
//           url.includes("cdn-cgi"),
//           url.includes("challenge"),
//           url.includes("captcha"),
//         ],
//       };

//       // Calculate confidence score
//       const allIndicators = Object.values(detectionPatterns).flat();
//       const trueIndicators = allIndicators.filter(Boolean);
//       const confidence = trueIndicators.length / allIndicators.length;

//       // Determine challenge type
//       let challengeType = "unknown";
//       if (detectionPatterns.cloudflareElements.some(Boolean)) {
//         challengeType = "turnstile-captcha";
//       } else if (detectionPatterns.formIndicators.some(Boolean)) {
//         challengeType = "javascript-challenge";
//       } else if (detectionPatterns.textIndicators.some(Boolean)) {
//         challengeType = "browser-verification";
//       }

//       const isChallenge =
//         confidence > 0.05 ||
//         detectionPatterns.titleIndicators.some(Boolean) ||
//         detectionPatterns.textIndicators.some(Boolean) ||
//         detectionPatterns.cloudflareElements.some(Boolean);

//       return {
//         isChallenge,
//         challengeType,
//         confidence,
//         rayId,
//         title: document.title,
//         url: window.location.href,
//         indicators: detectionPatterns,
//       };
//     });

//     console.log(`🔍 CHALLENGE DETECTION RESULTS:`);
//     console.log(
//       `   - Challenge Detected: ${detection.isChallenge ? "✅ YES" : "❌ NO"}`
//     );
//     console.log(`   - Challenge Type: ${detection.challengeType}`);
//     console.log(`   - Confidence: ${(detection.confidence * 100).toFixed(1)}%`);
//     console.log(`   - Ray ID: ${detection.rayId || "Not found"}`);
//     console.log(`   - Page Title: "${detection.title}"`);
//     console.log(`   - Current URL: ${detection.url}`);

//     return {
//       isChallenge: detection.isChallenge,
//       challengeType: detection.challengeType,
//       rayId: detection.rayId,
//       pageTitle: detection.title,
//       pageUrl: detection.url,
//     };
//   } catch (error) {
//     console.log("❌ Error in challenge detection:", error);
//     return {
//       isChallenge: false,
//       challengeType: "unknown",
//       rayId: null,
//       pageTitle: "",
//       pageUrl: "",
//     };
//   }
// }

// async function solveTurnstileChallenge(page: Page): Promise<boolean> {
//   console.log("🎯 Attempting to solve Turnstile/CAPTCHA challenge...");

//   try {
//     // Wait for page to be fully loaded
//     await page.waitForLoadState("domcontentloaded");
//     await humanDelay(3000, 5000);

//     // Log current page state
//     const pageInfo = await page.evaluate(() => ({
//       title: document.title,
//       url: window.location.href,
//       bodyText: document.body?.innerText?.substring(0, 200) || "",
//       hasCheckbox: !!document.querySelector('input[type="checkbox"]'),
//       hasTurnstile: !!document.querySelector(".cf-turnstile"),
//       hasIframe: !!document.querySelector("iframe"),
//     }));

//     console.log("📄 Current page state:", pageInfo);

//     // Enhanced selector list for various challenge elements
//     const challengeSelectors = [
//       // Turnstile/Cloudflare specific
//       ".cf-turnstile",
//       '.cf-turnstile input[type="checkbox"]',
//       'iframe[src*="challenges.cloudflare.com"]',
//       'iframe[src*="cloudflare.com"]',

//       // General verification elements
//       'input[type="checkbox"]',
//       'input[type="checkbox"]:not([disabled])',
//       ".cb-i",
//       ".checkbox",

//       // Challenge form elements
//       '#challenge-form input[type="checkbox"]',
//       '.challenge-form input[type="checkbox"]',
//       '[id*="challenge"] input[type="checkbox"]',
//       '[class*="challenge"] input[type="checkbox"]',

//       // Submit buttons
//       'button[type="submit"]:not([disabled])',
//       'input[type="submit"]:not([disabled])',
//       ".verify-button",
//       ".verification-button",

//       // Other CAPTCHA types
//       ".h-captcha",
//       ".g-recaptcha",
//       "[data-sitekey]",
//     ];

//     // Method 1: Try direct clicking on visible elements
//     console.log("🖱️ Method 1: Attempting direct element clicking...");

//     for (const selector of challengeSelectors) {
//       try {
//         console.log(`   Checking selector: ${selector}`);
//         const elements = await page.$$(selector);

//         if (elements.length > 0) {
//           console.log(`   Found ${elements.length} element(s) for ${selector}`);

//           for (let i = 0; i < elements.length; i++) {
//             const element = elements[i];
//             const isVisible = await element.isVisible();
//             const boundingBox = await element.boundingBox();

//             console.log(
//               `   Element ${
//                 i + 1
//               }: visible=${isVisible}, boundingBox=${!!boundingBox}`
//             );

//             if (isVisible && boundingBox) {
//               console.log(`   ✅ Clicking visible element: ${selector}`);

//               // Human-like click with slight randomization
//               const clickX =
//                 boundingBox.x +
//                 boundingBox.width / 2 +
//                 (Math.random() - 0.5) * 10;
//               const clickY =
//                 boundingBox.y +
//                 boundingBox.height / 2 +
//                 (Math.random() - 0.5) * 10;

//               await page.mouse.click(clickX, clickY, {
//                 delay: Math.random() * 100 + 100,
//                 button: "left",
//               });

//               console.log(
//                 `   📍 Clicked at coordinates: (${clickX.toFixed(
//                   1
//                 )}, ${clickY.toFixed(1)})`
//               );
//               await humanDelay(3000, 6000);

//               // Check if challenge is solved
//               const challengeCheck = await detectCloudflareChallenge(page);
//               if (!challengeCheck.isChallenge) {
//                 console.log("   ✅ Challenge solved with direct click!");
//                 return true;
//               } else {
//                 console.log(
//                   "   ⏳ Challenge still present, trying next element..."
//                 );
//               }
//             }
//           }
//         }
//       } catch (error) {
//         console.log(`   ❌ Error with selector ${selector}:`, error);
//       }
//     }

//     // Method 2: Enhanced keyboard navigation
//     console.log("⌨️ Method 2: Attempting keyboard navigation...");

//     // Reset focus to body first
//     await page.evaluate(() => {
//       document.body.focus();
//     });

//     for (let tabCount = 1; tabCount <= 20; tabCount++) {
//       await page.keyboard.press("Tab");
//       await humanDelay(300, 600);

//       // Check what element is currently focused
//       const focusedElement = await page.evaluate(() => {
//         const el = document.activeElement;
//         if (!el) return null;

//         return {
//           tagName: el.tagName,
//           type: (el as HTMLInputElement).type || null,
//           className: el.className,
//           id: el.id,
//           disabled: (el as HTMLInputElement).disabled || false,
//           visible: el.offsetParent !== null,
//           text: el.textContent?.substring(0, 50) || "",
//           outerHTML: el.outerHTML.substring(0, 200),
//         };
//       });

//       console.log(`   Tab ${tabCount}: Focused element:`, focusedElement);

//       if (
//         focusedElement &&
//         (focusedElement.type === "checkbox" ||
//           focusedElement.type === "submit" ||
//           focusedElement.tagName === "BUTTON" ||
//           focusedElement.className.includes("turnstile") ||
//           focusedElement.className.includes("captcha")) &&
//         !focusedElement.disabled &&
//         focusedElement.visible
//       ) {
//         console.log(
//           `   ✅ Found interactive element at tab ${tabCount}, pressing Space/Enter...`
//         );

//         // Try both Space and Enter
//         await page.keyboard.press("Space");
//         await humanDelay(1000, 2000);

//         await page.keyboard.press("Enter");
//         await humanDelay(3000, 6000);

//         const challengeCheck = await detectCloudflareChallenge(page);
//         if (!challengeCheck.isChallenge) {
//           console.log("   ✅ Challenge solved with keyboard navigation!");
//           return true;
//         }
//       }
//     }

//     // Method 3: Try iframe interaction
//     console.log("🖼️ Method 3: Attempting iframe interaction...");

//     const iframes = await page.$$("iframe");
//     console.log(`   Found ${iframes.length} iframe(s)`);

//     for (let i = 0; i < iframes.length; i++) {
//       try {
//         const iframe = iframes[i];
//         const frame = await iframe.contentFrame();

//         if (frame) {
//           console.log(`   Processing iframe ${i + 1}...`);

//           // Wait for iframe content
//           await frame.waitForLoadState("domcontentloaded", { timeout: 10000 });
//           await humanDelay(2000, 3000);

//           // Try to interact with iframe content
//           const frameElements = await frame.$$(
//             'input[type="checkbox"], button, .cb-i, [role="checkbox"]'
//           );

//           for (const frameElement of frameElements) {
//             const isVisible = await frameElement.isVisible();
//             if (isVisible) {
//               console.log(`   ✅ Clicking element in iframe ${i + 1}...`);
//               await frameElement.click({ delay: Math.random() * 100 + 100 });
//               await humanDelay(4000, 7000);

//               const challengeCheck = await detectCloudflareChallenge(page);
//               if (!challengeCheck.isChallenge) {
//                 console.log("   ✅ Challenge solved with iframe interaction!");
//                 return true;
//               }
//             }
//           }
//         }
//       } catch (error) {
//         console.log(`   ❌ Error with iframe ${i + 1}:`, error);
//       }
//     }

//     console.log("❌ All solving methods failed");
//     return false;
//   } catch (error) {
//     console.log("❌ Error in Turnstile solving:", error);
//     return false;
//   }
// }

// async function waitForPageToLoad(
//   page: Page,
//   timeout: number = 30000
// ): Promise<void> {
//   console.log("⏳ Waiting for page to fully load...");

//   try {
//     await Promise.race([
//       page.waitForLoadState("networkidle", { timeout }),
//       page.waitForLoadState("domcontentloaded", { timeout }),
//       new Promise((_, reject) =>
//         setTimeout(() => reject(new Error("Load timeout")), timeout)
//       ),
//     ]);
//     console.log("✅ Page loaded successfully");
//   } catch (error) {
//     console.log("⚠️ Page load timeout, but continuing...");
//   }
// }

// async function attemptCloudflareSolve(page: Page): Promise<boolean> {
//   console.log("🛡️ Starting Cloudflare challenge resolution process...");

//   const maxAttempts = 15;
//   let attempts = 0;

//   while (attempts < maxAttempts) {
//     attempts++;
//     console.log(`\n🔄 === ATTEMPT ${attempts}/${maxAttempts} ===`);

//     try {
//       // Wait for page stability
//       await waitForPageToLoad(page, 15000);
//       await humanDelay(2000, 4000);

//       // Detect current challenge state
//       const challengeStatus = await detectCloudflareChallenge(page);

//       if (!challengeStatus.isChallenge) {
//         console.log("✅ SUCCESS: No challenge detected - page is accessible!");
//         return true;
//       }

//       console.log(`📋 Challenge detected: ${challengeStatus.challengeType}`);

//       // Add human-like behavior before solving
//       console.log("🖱️ Simulating human behavior...");
//       await page.mouse.move(
//         Math.random() * 1000 + 200,
//         Math.random() * 600 + 200
//       );
//       await humanDelay(1000, 2000);

//       // Attempt to solve the challenge
//       const solved = await solveTurnstileChallenge(page);

//       if (solved) {
//         console.log("🎉 CHALLENGE SOLVED! Waiting for page to load...");

//         // Wait longer for the page to fully load after solving
//         await humanDelay(5000, 8000);
//         await waitForPageToLoad(page, 20000);

//         // Verify the challenge is actually solved
//         const finalCheck = await detectCloudflareChallenge(page);
//         if (!finalCheck.isChallenge) {
//           console.log("✅ FINAL VERIFICATION: Challenge completely resolved!");
//           return true;
//         } else {
//           console.log(
//             "⚠️ Challenge appeared to be solved but verification failed"
//           );
//         }
//       }

//       // If not solved and we have more attempts, reload the page
//       if (attempts < maxAttempts) {
//         console.log(
//           `❌ Attempt ${attempts} failed. Reloading page for fresh attempt...`
//         );
//         await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
//         await humanDelay(3000, 5000);
//       }
//     } catch (error) {
//       console.log(`❌ Error in attempt ${attempts}:`, error);

//       // Try to recover by reloading
//       if (attempts < maxAttempts - 1) {
//         try {
//           console.log("🔄 Attempting to recover by reloading...");
//           await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
//           await humanDelay(3000, 5000);
//         } catch (reloadError) {
//           console.log("❌ Failed to reload page:", reloadError);
//         }
//       }
//     }
//   }

//   console.log(
//     "❌ FAILED: Maximum attempts reached without solving the challenge"
//   );
//   return false;
// }

// async function scrapeWithCloudflareSolve(url: string): Promise<{
//   success: boolean;
//   challengeSolved: boolean;
//   cookies: any[];
//   userAgent: string;
//   html: string;
//   title: string;
//   finalUrl: string;
//   executionTime: number;
// }> {
//   const startTime = Date.now();
//   const browser = await launchBrowser();
//   let page: Page | null = null;

//   try {
//     page = await setupStealthPage(browser);
//     const userAgent = await browser.userAgent();

//     console.log(`🚀 STARTING NAVIGATION TO: ${url}`);
//     console.log(`🕐 Start time: ${new Date().toISOString()}`);

//     // Navigate with extended timeout
//     await page.goto(url, {
//       waitUntil: "domcontentloaded",
//       timeout: 60000,
//     });

//     await humanDelay(3000, 5000);

//     // Initial challenge detection
//     let challengeSolved = true;
//     const initialCheck = await detectCloudflareChallenge(page);

//     if (initialCheck.isChallenge) {
//       console.log("🛡️ CLOUDFLARE CHALLENGE DETECTED!");
//       console.log(`Challenge Type: ${initialCheck.challengeType}`);
//       console.log(`Ray ID: ${initialCheck.rayId}`);

//       challengeSolved = await attemptCloudflareSolve(page);

//       if (challengeSolved) {
//         console.log("🎉 CHALLENGE SUCCESSFULLY RESOLVED!");
//         console.log("⏳ Allowing extra time for page to fully load...");
//         await humanDelay(5000, 8000);
//         await waitForPageToLoad(page, 20000);
//       } else {
//         console.log("❌ CHALLENGE RESOLUTION FAILED");
//       }
//     } else {
//       console.log("✅ NO CLOUDFLARE CHALLENGE DETECTED");
//     }

//     // Capture final page state
//     const [cookies, html, title, finalUrl] = await Promise.all([
//       page.cookies(),
//       page.content(),
//       page.title(),
//       page.url(),
//     ]);

//     const executionTime = (Date.now() - startTime) / 1000;

//     console.log(`\n📊 FINAL RESULTS:`);
//     console.log(`   📄 Final page title: "${title}"`);
//     console.log(`   🌐 Final URL: ${finalUrl}`);
//     console.log(`   🍪 Cookies captured: ${cookies.length}`);
//     console.log(`   📝 HTML content length: ${html.length} characters`);
//     console.log(`   ⏱️ Total execution time: ${executionTime.toFixed(2)}s`);
//     console.log(`   🕐 End time: ${new Date().toISOString()}`);

//     // Validate that we have actual content
//     const hasContent =
//       html.length > 1000 &&
//       !html.toLowerCase().includes("checking your browser") &&
//       !html.toLowerCase().includes("additional verification required");

//     return {
//       success: hasContent,
//       challengeSolved,
//       cookies,
//       userAgent,
//       html,
//       title,
//       finalUrl,
//       executionTime,
//     };
//   } finally {
//     if (page) {
//       console.log("🧹 Cleaning up browser resources...");
//       await humanDelay(2000, 3000); // Keep browser open longer to see results
//       await page.close();
//     }
//     await browser.close();
//   }
// }

// export async function POST(request: NextRequest): Promise<NextResponse> {
//   let targetUrl: string;

//   try {
//     const body = await request.json();
//     targetUrl =
//       body.url ||
//       "https://pk.indeed.com/jobs?l=ISLAMABAD&from=mobRdr&utm_source=%2Fm%2F&utm_medium=redir&utm_campaign=dt&vjk=f17128600acd7679";
//   } catch {
//     targetUrl =
//       "https://pk.indeed.com/jobs?l=ISLAMABAD&from=mobRdr&utm_source=%2Fm%2F&utm_medium=redir&utm_campaign=dt&vjk=f17128600acd7679";
//   }

//   try {
//     console.log("🎯 ENHANCED CLOUDFLARE CHALLENGE SOLVER STARTING...");
//     console.log(`Target URL: ${targetUrl}`);

//     const result = await scrapeWithCloudflareSolve(targetUrl);

//     return NextResponse.json({
//       success: result.success,
//       challengeSolved: result.challengeSolved,
//       executionTime: `${result.executionTime}s`,
//       data: {
//         cookies: result.cookies,
//         userAgent: result.userAgent,
//         html: result.html,
//         title: result.title,
//         finalUrl: result.finalUrl,
//         timestamp: new Date().toISOString(),
//         contentLength: result.html.length,
//         cookieCount: result.cookies.length,
//       },
//       debug: {
//         hadChallenge: result.challengeSolved !== undefined,
//         solvedSuccessfully: result.challengeSolved,
//         finalContentValid: result.success,
//       },
//     });
//   } catch (error) {
//     console.error("💥 [ENHANCED CLOUDFLARE SOLVER] CRITICAL ERROR:", error);

//     return NextResponse.json(
//       {
//         success: false,
//         challengeSolved: false,
//         error: "Failed to solve Cloudflare challenge",
//         details: error instanceof Error ? error.message : "Unknown error",
//         timestamp: new Date().toISOString(),
//       },
//       { status: 500 }
//     );
//   }
// }


const url = 'https://pk.indeed.com/jobs?l=ISLAMABAD&from=mobRdr&utm_source=%2Fm%2F&utm_medium=redir&utm_campaign=dt&vjk=f17128600acd7679'
import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: Request) {
  try {
 

    // Step 1: Launch Puppeteer browser in non-headless mode
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 },
    });

    const page = await browser.newPage();

    // Step 2: Navigate to Google (or another page with a search bar)
    await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });

    // Step 3: Locate the search bar, move mouse, click, type URL, and press Enter
    const searchBarSelector = 'input[name="q"]'; // Google's search input
    const searchBar = await page.$(searchBarSelector);
    if (!searchBar) {
      await browser.close();
      return NextResponse.json({ error: 'Search bar not found' }, { status: 400 });
    }

    // Get the search bar's bounding box for mouse positioning
    const box = await searchBar.boundingBox();
    if (!box) {
      await browser.close();
      return NextResponse.json({ error: 'Search bar bounding box not found' }, { status: 400 });
    }

    // Move mouse to the center of the search bar and click
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);

    // Type the URL and press Enter
    await page.keyboard.type(url);
    await page.keyboard.press('Enter');

    // Wait for navigation or page load
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {
      // Google may not navigate if the URL is entered in the search bar
    });

    // Wait to observe the action
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Close the browser
    await browser.close();

    return NextResponse.json({ message: 'URL processed in search bar' });
  } catch (error) {
    console.error('Puppeteer error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}