// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page, executablePath } from "puppeteer";

import { NextRequest, NextResponse } from "next/server";

// interface JobData {
//   title: string;
//   company: string;
//   location: string;
//   jobType: string[];
//   description: string;
//   applyLink: string;
// }

// interface ScrapingConfig {
//   headless: boolean;
//   timeout: number;
//   maxJobs: number;
//   maxPages: number;
//   viewport: {
//     width: number;
//     height: number;
//   };
// }

// const SCRAPING_CONFIG: ScrapingConfig = {
//   headless: false,
//   timeout: 60000,
//   maxJobs: 10,
//   maxPages: 2,
//   viewport: { width: 1366, height: 768 },
// };

// const validateSearchParams = (searchParams: URLSearchParams) => {
//   const q = searchParams.get("q")?.trim();
//   const l = searchParams.get("l")?.trim() || "United States";
//   const from = searchParams.get("from")?.trim() || "fromtoday";
//   const jt = searchParams.get("jt")?.trim() || "fulltime";
//   const remotejob = searchParams.get("remotejob")?.trim() || "1";
//   const radius = searchParams.get("radius")?.trim() || "25";
//   const sort = searchParams.get("sort")?.trim() || "date";

//   if (!q || q.length < 2) {
//     throw new Error("Job title (q) must be at least 2 characters long");
//   }

//   if (
//     q.length > 100 ||
//     l.length > 100 ||
//     from.length > 50 ||
//     jt.length > 50 ||
//     remotejob.length > 50 ||
//     radius.length > 50 ||maxAttempts
//     sort.length > 50
//   ) {
//     throw new Error("Search parameters too long");
//   }

//   if (!["fromtoday", "lastweek", "lastmonth"].includes(from)) {
//     throw new Error(
//       "Invalid time posted (from). Use fromtoday, lastweek, or lastmonth."
//     );
//   }
//   if (
//     !["fulltime", "parttime", "contract", "temporary", "internship"].includes(
//       jt
//     )
//   ) {
//     throw new Error(
//       "Invalid job type (jt). Use fulltime, parttime, contract, temporary, or internship."
//     );
//   }
//   if (!["0", "1"].includes(remotejob)) {
//     throw new Error("Invalid remote filter (remotejob). Use 0 or 1.");
//   }
//   if (!/^\d+$/.test(radius)) {
//     throw new Error("Invalid radius. Use a number (e.g., 25).");
//   }
//   if (!["date", "relevance"].includes(sort)) {
//     throw new Error("Invalid sort order (sort). Use date or relevance.");
//   }

//   return { q, l, from, jt, remotejob, radius, sort };
// };

// const createBrowser = async (): Promise<Browser> => {
//   const browser = await puppeteer.launch({
//     headless: SCRAPING_CONFIG.headless,
//     executablePath: executablePath(),
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//       "--window-size=1366,768",
//     ],
//     defaultViewport: null,
//   });
//   return browser;
// };

// const setupPage = async (browser: Browser): Promise<Page> => {
//   const page = await browser.newPage();
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
//   );
//   await page.setExtraHTTPHeaders({
//     "Accept-Language": "en-US,en;q=0.9",
//     Accept:
//       "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
//   });
//   return page;
// };

// const simulateHumanBehavior = async (page: Page): Promise<void> => {
//   const { width, height } = SCRAPING_CONFIG.viewport;
//   const x = Math.random() * width;
//   const y = Math.random() * height;
//   await page.mouse.move(x, y, { steps: 10 });
//   await page.evaluate(() => window.scrollBy(0, Math.random() * 500));
//   await new Promise((resolve) =>
//     setTimeout(resolve, 1000 + Math.random() * 2000)
//   );
// };

// const handleVerification = async (page: Page, attempt = 1): Promise<void> => {
//   try {
//     const maxAttempts = 5;
//     const checkbox = await page
//       .waitForSelector('.cb-lb input[type="checkbox"]', { timeout: 10000 })
//       .catch(() => null);
//     if (checkbox) {
//       console.log(
//         `Attempt ${attempt}: Verification checkbox detected, simulating human behavior...`
//       );
//       await simulateHumanBehavior(page);
//       await checkbox.click();
//       await page.waitForFunction(
//         () =>
//           !document.querySelector('.cb-lb input[type="checkbox"]') ||
//           document.querySelector("#success") ||
//           document.querySelector("#fail") ||
//           document.querySelector("#timeout") ||
//           document.querySelector("#expired"),
//         { timeout: 30000 }
//       );
//       const success =
//         !(await page.$('.cb-lb input[type="checkbox"]')) ||
//         (await page.$("#success"));
//       if (success) {
//         console.log("Verification successful.");
//         await new Promise((resolve) => setTimeout(resolve, 3000));
//       } else {
//         throw new Error("Verification failed or timed out.");
//       }
//     } else if (attempt < maxAttempts) {
//       console.log(
//         `Attempt ${attempt} failed: No checkbox found, retrying in 5 seconds...`
//       );
//       await new Promise((resolve) => setTimeout(resolve, 5000));
//       await handleVerification(page, attempt + 1);
//     } else {
//       console.log(
//         "Max verification attempts reached, proceeding without verification."
//       );
//     }
//   } catch (error) {
//     console.error("Verification error:", error);
//     await page
//       .screenshot({ path: `verification_error_attempt_${attempt}.png` })
//       .catch(() => {});
//     throw new Error(
//       `Failed to handle verification: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   }
// };

// // [Rest of the functions (buildIndeedUrl, scrollJobList, extractJobLinks, extractJobDetails, scrapeIndeedJobs, GET) remain the same as in the previous version]
// const buildIndeedUrl = (
//   q: string,
//   l: string,
//   from: string,
//   jt: string,
//   remotejob: string,
//   radius: string,
//   sort: string
// ): string => {
//   const baseUrl = "https://www.indeed.com/jobs";
//   const params = new URLSearchParams({
//     q,
//     l,
//     from,
//     jt,
//     remotejob,
//     radius,
//     sort,
//   });
//   return `${baseUrl}?${params.toString()}`;
// };

// const scrollJobList = async (page: Page): Promise<void> => {
//   try {
//     await page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 });

//     let previousJobCount = 0;
//     let sameCount = 0;
//     const maxSameCount = 3;

//     while (sameCount < maxSameCount) {
//       const jobCount = await page.evaluate(() => {
//         const jobList = document.querySelector("#mosaic-provider-jobcards ul");
//         return jobList ? jobList.querySelectorAll("li").length : 0;
//       });

//       if (jobCount === previousJobCount) {
//         sameCount++;
//       } else {
//         sameCount = 0;
//       }

//       previousJobCount = jobCount;

//       await page.evaluate(() => {
//         const jobList = document.querySelector("#mosaic-provider-jobcards ul");
//         if (jobList) {
//           jobList.scrollIntoView({ behavior: "smooth", block: "end" });
//           window.scrollBy(0, window.innerHeight);
//         }
//       });

//       await new Promise((resolve) =>
//         setTimeout(resolve, 2000 + Math.random() * 2000)
//       );
//       await simulateHumanBehavior(page);
//     }

//     console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
//   } catch (error) {
//     console.error("Error scrolling job list:", error);
//   }
// };

// const extractJobLinks = async (page: Page): Promise<string[]> => {
//   try {
//     await page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 });

//     const links = await page.evaluate(() => {
//       const jobCards = Array.from(
//         document.querySelectorAll("#mosaic-provider-jobcards a.tapItem")
//       );
//       return jobCards
//         .map((card) => {
//           const href = card.getAttribute("href") || "";
//           return href.startsWith("/") ? `https://www.indeed.com${href}` : href;
//         })
//         .filter((link) => link);
//     });

//     return links;
//   } catch (error) {
//     console.error("Error extracting job links:", error);
//     return [];
//   }
// };

// const extractJobDetails = async (
//   page: Page,
//   applyLink: string
// ): Promise<JobData | null> => {
//   try {
//     await page.goto(applyLink, {
//       waitUntil: "domcontentloaded",
//       timeout: 30000,
//     });

//     await handleVerification(page);

//     await page.waitForSelector("#jobDescriptionText", { timeout: 15000 });

//     const jobDetails = await page.evaluate(() => {
//       const titleElement = document.querySelector(
//         "h1.jobsearch-JobInfoHeader-title"
//       );
//       const companyElement = document.querySelector(
//         ".jobsearch-CompanyInfoContainer a, .jobsearch-CompanyInfoContainer div[data-company-name]"
//       );
//       const locationElement = document.querySelector(
//         ".jobsearch-JobInfoHeader-subtitle div:not([class])"
//       );
//       const jobTypeElements = document.querySelectorAll(
//         ".jobsearch-JobMetadataHeader-item, .jobsearch-JobMetadataHeader-itemWithIcon"
//       );
//       const descriptionElement = document.querySelector("#jobDescriptionText");

//       const title = titleElement?.textContent?.trim() || "";
//       const company = companyElement?.textContent?.trim() || "";
//       const location = locationElement?.textContent?.trim() || "";
//       const jobType = Array.from(jobTypeElements)
//         .map((el) => el.textContent?.trim() || "")
//         .filter(Boolean);
//       const description = descriptionElement
//         ? descriptionElement.outerHTML
//         : "";

//       return { title, company, location, jobType, description };
//     });

//     if (!jobDetails.description) {
//       console.warn(`No description found for ${applyLink}`);
//     }

//     return {
//       title: jobDetails.title,
//       company: jobDetails.company,
//       location: jobDetails.location,
//       jobType: jobDetails.jobType,
//       description: jobDetails.description,
//       applyLink,
//     };
//   } catch (error) {
//     console.error(`Error extracting details for ${applyLink}:`, error);
//     await page
//       .screenshot({ path: `job_error_${applyLink.split("/").pop()}.png` })
//       .catch(() => {});
//     return null;
//   }
// };

// const scrapeIndeedJobs = async (
//   q: string,
//   l: string,
//   from: string,
//   jt: string,
//   remotejob: string,
//   radius: string,
//   sort: string
// ): Promise<JobData[]> => {
//   let browser: Browser | null = null;

//   try {
//     browser = await createBrowser();
//     const page = await setupPage(browser);

//     const url = buildIndeedUrl(q, l, from, jt, remotejob, radius, sort);

//     await page.goto(url, {
//       waitUntil: "domcontentloaded",
//       timeout: 30000,
//     });

//     await handleVerification(page);

//     let allLinks: string[] = [];
//     const seenLinks = new Set<string>();

//     for (let pageNum = 0; pageNum < SCRAPING_CONFIG.maxPages; pageNum++) {
//       console.log(`Scraping page ${pageNum + 1}...`);

//       await scrollJobList(page);

//       let links = await extractJobLinks(page);

//       links = links.filter((link) => {
//         if (seenLinks.has(link)) return false;
//         seenLinks.add(link);
//         return true;
//       });

//       allLinks = allLinks.concat(links);

//       const nextButton = await page.$(
//         'a[data-testid="pagination-page-next"]:not([disabled])'
//       );

//       if (!nextButton || allLinks.length >= SCRAPING_CONFIG.maxJobs) {
//         console.log("No more pages or max jobs reached.");
//         break;
//       }

//       try {
//         await simulateHumanBehavior(page);
//         await Promise.all([
//           page.click('a[data-testid="pagination-page-next"]'),
//           page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 }),
//         ]);
//         await new Promise((resolve) =>
//           setTimeout(resolve, 3000 + Math.random() * 2000)
//         );
//       } catch (error) {
//         console.error("Error clicking next button:", error);
//         break;
//       }
//     }

//     const allJobs: JobData[] = [];
//     for (const link of allLinks.slice(0, SCRAPING_CONFIG.maxJobs)) {
//       console.log(`Fetching details for ${link}`);
//       const jobDetails = await extractJobDetails(page, link);
//       if (jobDetails) {
//         allJobs.push(jobDetails);
//       }
//       await new Promise((resolve) =>
//         setTimeout(resolve, 2000 + Math.random() * 2000)
//       );
//     }

//     return allJobs;
//   } catch (error) {
//     console.error("Scraping error:", error);
//     throw new Error(
//       `Failed to scrape Indeed jobs: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

// export const GET = async (request: NextRequest): Promise<NextResponse> => {
//   const startTime = Date.now();

//   try {
//     const { searchParams } = new URL(request.url);
//     const { q, l, from, jt, remotejob, radius, sort } =
//       validateSearchParams(searchParams);

//     const jobs = await scrapeIndeedJobs(
//       q,
//       l,
//       from,
//       jt,
//       remotejob,
//       radius,
//       sort
//     );

//     const responseData = {
//       success: true,
//       data: jobs,
//       metadata: {
//         totalJobs: jobs.length,
//         searchQuery: { q, l, from, jt, remotejob, radius, sort },
//         scrapedAt: new Date().toISOString(),
//         processingTime: `${Date.now() - startTime}ms`,
//       },
//     };

//     return NextResponse.json(responseData, {
//       status: 200,
//       headers: {
//         "Cache-Control": "no-cache, no-store, must-revalidate",
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (error) {
//     console.error("API Error:", error);
//     const errorMessage =
//       error instanceof Error ? error.message : "Internal server error";
//     return NextResponse.json(
//       {
//         success: false,
//         error: errorMessage,
//         timestamp: new Date().toISOString(),
//       },
//       {
//         status:
//           error instanceof Error && error.message.includes("must be at least")
//             ? 400
//             : 500,
//       }
//     );
//   }
// };

// export const runtime = "nodejs";

// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page, executablePath } from "puppeteer";

// interface JobData {
//   title: string;
//   company: string;
//   location: string;
//   jobType: string[];
//   description: string;
//   applyLink: string;
// }

// interface ScrapingConfig {
//   headless: boolean;
//   timeout: number;
//   maxJobs: number;
//   maxPages: number;
//   viewport: {
//     width: number;
//     height: number;
//   };
// }

// const SCRAPING_CONFIG: ScrapingConfig = {
//   headless: false,
//   timeout: 60000,
//   maxJobs: 10,
//   maxPages: 2,
//   viewport: { width: 1366, height: 768 },
// };

// const USER_AGENTS = [
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
// ];

// const validateSearchParams = (searchParams: URLSearchParams) => {
//   const q = searchParams.get("q")?.trim();
//   const l = searchParams.get("l")?.trim() || "United States";
//   const from = searchParams.get("from")?.trim() || "fromtoday";
//   const jt = searchParams.get("jt")?.trim() || "fulltime";
//   const remotejob = searchParams.get("remotejob")?.trim() || "1";
//   const radius = searchParams.get("radius")?.trim() || "25";
//   const sort = searchParams.get("sort")?.trim() || "date";

//   if (!q || q.length < 2) {
//     throw new Error("Job title (q) must be at least 2 characters long");
//   }

//   if (
//     q.length > 100 ||
//     l.length > 100 ||
//     from.length > 50 ||
//     jt.length > 50 ||
//     remotejob.length > 50 ||
//     radius.length > 50 ||
//     sort.length > 50
//   ) {
//     throw new Error("Search parameters too long");
//   }

//   if (!["fromtoday", "lastweek", "lastmonth"].includes(from)) {
//     throw new Error(
//       "Invalid time posted (from). Use fromtoday, lastweek, or lastmonth."
//     );
//   }
//   if (
//     !["fulltime", "parttime", "contract", "temporary", "internship"].includes(
//       jt
//     )
//   ) {
//     throw new Error(
//       "Invalid job type (jt). Use fulltime, parttime, contract, temporary, or internship."
//     );
//   }
//   if (!["0", "1"].includes(remotejob)) {
//     throw new Error("Invalid remote filter (remotejob). Use 0 or 1.");
//   }
//   if (!/^\d+$/.test(radius)) {
//     throw new Error("Invalid radius. Use a number (e.g., 25).");
//   }
//   if (!["date", "relevance"].includes(sort)) {
//     throw new Error("Invalid sort order (sort). Use date or relevance.");
//   }

//   return { q, l, from, jt, remotejob, radius, sort };
// };

// const getRandomUserAgent = (): string => {
//   return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
// };

// const createBrowser = async (): Promise<Browser> => {
//   const browser = await puppeteer.launch({
//     headless: SCRAPING_CONFIG.headless,
//     executablePath: executablePath(),
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--no-first-run",
//       "--no-zygote",
//       "--disable-gpu",
//       "--disable-blink-features=AutomationControlled",
//       "--disable-features=VizDisplayCompositor",
//       "--disable-extensions",
//       "--disable-background-timer-throttling",
//       "--disable-backgrounding-occluded-windows",
//       "--disable-renderer-backgrounding",
//       "--disable-background-networking",
//       "--disable-ipc-flooding-protection",
//       "--window-size=1366,768",
//     ],
//     defaultViewport: null,
//   });
//   return browser;
// };

// const setupPage = async (browser: Browser): Promise<Page> => {
//   const page = await browser.newPage();

//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, 'webdriver', {
//       get: () => undefined,
//     });

//     (window).chrome = {
//       runtime: {},
//     };

//     Object.defineProperty(navigator, 'plugins', {
//       get: () => [1, 2, 3, 4, 5],
//     });

//     Object.defineProperty(navigator, 'languages', {
//       get: () => ['en-US', 'en'],
//     });

//     const originalQuery = window.navigator.permissions.query;
//     return window.navigator.permissions.query = (parameters) => (
//       parameters.name === 'notifications' ?
//         originalQuery({ name: 'notifications' }) :
//         originalQuery(parameters)
//     );
//   });

//   await page.setUserAgent(getRandomUserAgent());

//   await page.setExtraHTTPHeaders({
//     "Accept-Language": "en-US,en;q=0.9",
//     "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
//     "Accept-Encoding": "gzip, deflate, br",
//     "Accept-Charset": "UTF-8",
//     "Connection": "keep-alive",
//     "Upgrade-Insecure-Requests": "1",
//     "Sec-Fetch-Dest": "document",
//     "Sec-Fetch-Mode": "navigate",
//     "Sec-Fetch-Site": "none",
//     "Cache-Control": "max-age=0"
//   });

//   await page.setViewport({
//     width: 1366 + Math.floor(Math.random() * 100),
//     height: 768 + Math.floor(Math.random() * 100)
//   });

//   return page;
// };

// const simulateHumanBehavior = async (page: Page): Promise<void> => {
//   const actions = [
//     async () => {
//       const viewport = await page.viewport();
//       const width = viewport?.width || 1366;
//       const height = viewport?.height || 768;
//       const x = Math.random() * (width || 1366);
//       const y = Math.random() * (height || 768);
//       await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 5) + 10 });
//     },
//     async () => {
//       await page.evaluate(() => {
//         const scrollAmount = Math.random() * 300 + 100;
//         window.scrollBy(0, scrollAmount);
//       });
//     },
//     async () => {
//       await page.keyboard.press('Tab');
//     },
//     async () => {
//       const viewport = await page.viewport();
//       const width = viewport?.width || 1366;
//       await page.mouse.move(Math.random() * (width || 1366), Math.random() * 100, { steps: 15 });
//     }
//   ];

//   const randomAction = actions[Math.floor(Math.random() * actions.length)];
//   await randomAction();

//   await new Promise(resolve =>
//     setTimeout(resolve, Math.random() * 3000 + 1000)
//   );
// };

// const handleVerification = async (page: Page, attempt = 1): Promise<void> => {
//   const maxAttempts = 5; // Define maxAttempts within the function scope
//   try {
//     const maxAttempts = 5;
//     const checkbox = await page
//       .waitForSelector('.cb-lb input[type="checkbox"]', { timeout: 5000 })
//       .catch(() => null);

//     if (checkbox) {
//       console.log(`Attempt ${attempt}: Verification detected, applying advanced human simulation...`);

//       await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

//       await page.mouse.move(Math.random() * 200 + 100, Math.random() * 200 + 100, { steps: 20 });
//       await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

//       const box = await checkbox.boundingBox();
//       if (box) {
//         const x = box.x + box.width / 2 + (Math.random() - 0.5) * 5;
//         const y = box.y + box.height / 2 + (Math.random() - 0.5) * 5;
//         await page.mouse.move(x, y, { steps: 15 });
//         await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
//         await page.mouse.click(x, y, { delay: Math.random() * 100 + 50 });
//       }

//       await page.waitForFunction(
//         () =>
//           !document.querySelector('.cb-lb input[type="checkbox"]') ||
//           document.querySelector("#success") ||
//           document.querySelector("#fail") ||
//           document.querySelector("#timeout") ||
//           document.querySelector("#expired"),
//         { timeout: 45000 }
//       );

//       const success = !(await page.$('.cb-lb input[type="checkbox"]')) || (await page.$("#success"));

//       if (success) {
//         console.log("Verification successful.");
//         await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 2000));
//       } else {
//         throw new Error("Verification failed or timed out.");
//       }
//     } else if (attempt < maxAttempts) {
//       console.log(`Attempt ${attempt} failed: No checkbox found, retrying...`);
//       await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 3000));
//       await handleVerification(page, attempt + 1);
//     } else {
//       console.log("Max verification attempts reached, proceeding...");
//     }
//   } catch (error) {
//     console.error("Verification error:", error);
//     if (attempt < maxAttempts) {
//       await new Promise(resolve => setTimeout(resolve, Math.random() * 5000 + 5000));
//       await handleVerification(page, attempt + 1);
//     }
//   }
// };

// const buildIndeedUrl = (
//   q: string,
//   l: string,
//   from: string,
//   jt: string,
//   remotejob: string,
//   radius: string,
//   sort: string
// ): string => {
//   const baseUrl = "https://www.indeed.com/jobs";
//   const params = new URLSearchParams({
//     q,
//     l,
//     from,
//     jt,
//     remotejob,
//     radius,
//     sort,
//   });
//   return `${baseUrl}?${params.toString()}`;
// };

// const scrollJobList = async (page: Page): Promise<void> => {
//   try {
//     await page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 });

//     let previousJobCount = 0;
//     let sameCount = 0;
//     const maxSameCount = 3;

//     while (sameCount < maxSameCount) {
//       const jobCount = await page.evaluate(() => {
//         const jobList = document.querySelector("#mosaic-provider-jobcards ul");
//         return jobList ? jobList.querySelectorAll("li").length : 0;
//       });

//       if (jobCount === previousJobCount) {
//         sameCount++;
//       } else {
//         sameCount = 0;
//       }

//       previousJobCount = jobCount;

//       await page.evaluate(() => {
//         const scrollAmount = Math.random() * 200 + 100;
//         window.scrollBy(0, scrollAmount);
//       });

//       await simulateHumanBehavior(page);
//       await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 2000));
//     }

//     console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
//   } catch (error) {
//     console.error("Error scrolling job list:", error);
//   }
// };

// const extractJobLinks = async (page: Page): Promise<string[]> => {
//   try {
//     await page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 });

//     const links = await page.evaluate(() => {
//       const jobCards = Array.from(
//         document.querySelectorAll("#mosaic-provider-jobcards a.tapItem")
//       );
//       return jobCards
//         .map((card) => {
//           const href = card.getAttribute("href") || "";
//           return href.startsWith("/") ? `https://www.indeed.com${href}` : href;
//         })
//         .filter((link) => link);
//     });

//     return links;
//   } catch (error) {
//     console.error("Error extracting job links:", error);
//     return [];
//   }
// };

// const extractJobDetails = async (
//   page: Page,
//   applyLink: string
// ): Promise<JobData | null> => {
//   try {
//     await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

//     await page.goto(applyLink, {
//       waitUntil: "domcontentloaded",
//       timeout: 30000,
//     });

//     await simulateHumanBehavior(page);
//     await handleVerification(page);

//     await page.waitForSelector("#jobDescriptionText", { timeout: 15000 });

//     const jobDetails = await page.evaluate(() => {
//       const titleElement = document.querySelector(
//         "h1.jobsearch-JobInfoHeader-title"
//       );
//       const companyElement = document.querySelector(
//         ".jobsearch-CompanyInfoContainer a, .jobsearch-CompanyInfoContainer div[data-company-name]"
//       );
//       const locationElement = document.querySelector(
//         ".jobsearch-JobInfoHeader-subtitle div:not([class])"
//       );
//       const jobTypeElements = document.querySelectorAll(
//         ".jobsearch-JobMetadataHeader-item, .jobsearch-JobMetadataHeader-itemWithIcon"
//       );
//       const descriptionElement = document.querySelector("#jobDescriptionText");

//       const title = titleElement?.textContent?.trim() || "";
//       const company = companyElement?.textContent?.trim() || "";
//       const location = locationElement?.textContent?.trim() || "";
//       const jobType = Array.from(jobTypeElements)
//         .map((el) => el.textContent?.trim() || "")
//         .filter(Boolean);
//       const description = descriptionElement
//         ? descriptionElement.outerHTML
//         : "";

//       return { title, company, location, jobType, description };
//     });

//     if (!jobDetails.description) {
//       console.warn(`No description found for ${applyLink}`);
//     }

//     return {
//       title: jobDetails.title,
//       company: jobDetails.company,
//       location: jobDetails.location,
//       jobType: jobDetails.jobType,
//       description: jobDetails.description,
//       applyLink,
//     };
//   } catch (error) {
//     console.error(`Error extracting details for ${applyLink}:`, error);
//     return null;
//   }
// };

// const scrapeIndeedJobs = async (
//   q: string,
//   l: string,
//   from: string,
//   jt: string,
//   remotejob: string,
//   radius: string,
//   sort: string
// ): Promise<JobData[]> => {
//   let browser: Browser | null = null;

//   try {
//     browser = await createBrowser();
//     const page = await setupPage(browser);

//     const url = buildIndeedUrl(q, l, from, jt, remotejob, radius, sort);

//     await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

//     await page.goto(url, {
//       waitUntil: "domcontentloaded",
//       timeout: 30000,
//     });

//     await simulateHumanBehavior(page);
//     await handleVerification(page);

//     let allLinks: string[] = [];
//     const seenLinks = new Set<string>();

//     for (let pageNum = 0; pageNum < SCRAPING_CONFIG.maxPages; pageNum++) {
//       console.log(`Scraping page ${pageNum + 1}...`);

//       await scrollJobList(page);

//       let links = await extractJobLinks(page);

//       links = links.filter((link) => {
//         if (seenLinks.has(link)) return false;
//         seenLinks.add(link);
//         return true;
//       });

//       allLinks = allLinks.concat(links);

//       const nextButton = await page.$(
//         'a[data-testid="pagination-page-next"]:not([disabled])'
//       );

//       if (!nextButton || allLinks.length >= SCRAPING_CONFIG.maxJobs) {
//         console.log("No more pages or max jobs reached.");
//         break;
//       }

//       try {
//         await simulateHumanBehavior(page);
//         await Promise.all([
//           page.click('a[data-testid="pagination-page-next"]'),
//           page.waitForSelector("#mosaic-provider-jobcards", { timeout: 15000 }),
//         ]);
//         await new Promise(resolve =>
//           setTimeout(resolve, Math.random() * 3000 + 3000)
//         );
//       } catch (error) {
//         console.error("Error clicking next button:", error);
//         break;
//       }
//     }

//     const allJobs: JobData[] = [];
//     for (const link of allLinks.slice(0, SCRAPING_CONFIG.maxJobs)) {
//       console.log(`Fetching details for ${link}`);
//       const jobDetails = await extractJobDetails(page, link);
//       if (jobDetails) {
//         allJobs.push(jobDetails);
//       }
//       await new Promise(resolve =>
//         setTimeout(resolve, Math.random() * 3000 + 2000)
//       );
//     }

//     return allJobs;
//   } catch (error) {
//     console.error("Scraping error:", error);
//     throw new Error(
//       `Failed to scrape Indeed jobs: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   } finally {
//     if (browser) {
//       await browser.close();
//     }
//   }
// };

// export const GET = async (request: NextRequest): Promise<NextResponse> => {
//   const startTime = Date.now();

//   try {
//     const { searchParams } = new URL(request.url);
//     const { q, l, from, jt, remotejob, radius, sort } =
//       validateSearchParams(searchParams);

//     const jobs = await scrapeIndeedJobs(
//       q,
//       l,
//       from,
//       jt,
//       remotejob,
//       radius,
//       sort
//     );

//     const responseData = {
//       success: true,
//       data: jobs,
//       metadata: {
//         totalJobs: jobs.length,
//         searchQuery: { q, l, from, jt, remotejob, radius, sort },
//         scrapedAt: new Date().toISOString(),
//         processingTime: `${Date.now() - startTime}ms`,
//       },
//     };

//     return NextResponse.json(responseData, {
//       status: 200,
//       headers: {
//         "Cache-Control": "no-cache, no-store, must-revalidate",
//         "Content-Type": "application/json",
//       },
//     });
//   } catch (error) {
//     console.error("API Error:", error);
//     const errorMessage =
//       error instanceof Error ? error.message : "Internal server error";
//     return NextResponse.json(
//       {
//         success: false,
//         error: errorMessage,
//         timestamp: new Date().toISOString(),
//       },
//       {
//         status:
//           error instanceof Error && error.message.includes("must be at least")
//             ? 400
//             : 500,
//       }
//     );
//   }
// };

// export const runtime = "nodejs";

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);
    console.log(searchParams);
    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};
