// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page, executablePath } from "puppeteer";

import { NextRequest, NextResponse } from "next/server";

// interface JobData {
//   title: string;
//   company: string;
//   location: string;
//   jobType: string[] | "";
//   description: string;
//   applyLink: string;
// }

// interface ScrapingConfig {
//   headless: "new" | boolean;
//   timeout: number;
//   maxJobs: number;
//   viewport: { width: number; height: number };
//   scrollDelay: number;
//   visitDelay: number;
//   minDelay: number;
//   maxDelay: number;
// }

// const SCRAPING_CONFIG: ScrapingConfig = {
//   headless: false,
//   timeout: 60000,
//   maxJobs: 5,
//   viewport: { width: 1680, height: 1050 },
//   scrollDelay: 2000,
//   visitDelay: 2000,
//   minDelay: 3000, // Minimum delay for human-like pauses (3 seconds)
//   maxDelay: 8000, // Maximum delay for human-like pauses (8 seconds)
// };

// // Utility to generate a random delay between min and max
// const randomDelay = (min: number, max: number): number => {
//   return Math.floor(Math.random() * (max - min + 1)) + min;
// };

// // Utility to simulate mouse movements
// const simulateMouseMovement = async (page: Page): Promise<void> => {
//   const x = Math.floor(Math.random() * SCRAPING_CONFIG.viewport.width);
//   const y = Math.floor(Math.random() * SCRAPING_CONFIG.viewport.height);
//   await page.mouse.move(x, y, { steps: 10 });
//   await new Promise((resolve) => setTimeout(resolve, randomDelay(500, 1500)));
// };

// const validateSearchParams = (
//   searchParams: URLSearchParams
// ): {
//   q: string;
//   l?: string;
//   radius?: string;
//   jobType?: string;
//   employmentType?: string;
//   datePosted?: string;
//   sortBy?: string;
// } => {
//   const q = searchParams.get("q")?.trim() || "software engineer";
//   const l = searchParams.get("l")?.trim();
//   const radius = searchParams.get("radius")?.trim();
//   const jobType = searchParams.get("jobType")?.trim();
//   const employmentType = searchParams.get("employmentType")?.trim();
//   const datePosted = searchParams.get("datePosted")?.trim();
//   const sortBy = searchParams.get("sortBy")?.trim();

//   if (q.length > 100) throw new Error("Query too long");
//   if (l && l.length > 100) throw new Error("Location too long");
//   if (
//     radius &&
//     (isNaN(Number(radius)) || Number(radius) < 0 || Number(radius) > 500)
//   )
//     throw new Error("Radius must be 0-500 miles");
//   if (
//     jobType &&
//     !["fulltime", "parttime", "contract", "internship"].includes(jobType)
//   )
//     throw new Error("Invalid jobType");
//   if (
//     employmentType &&
//     !["full_time", "part_time", "contract", "intern"].includes(employmentType)
//   )
//     throw new Error("Invalid employmentType");
//   if (datePosted && !["today", "last3days", "last7days"].includes(datePosted))
//     throw new Error("Invalid datePosted");
//   if (sortBy && !["relevance", "date", "salary"].includes(sortBy))
//     throw new Error("Invalid sortBy");

//   return { q, l, radius, jobType, employmentType, datePosted, sortBy };
// };

// const createBrowser = async (): Promise<Browser> => {
//   return puppeteer.launch({
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
//       "--disable-blink-features=AutomationControlled", // Avoid detection
//     ],
//     defaultViewport: null,
//   });
// };

// const setupPage = async (browser: Browser): Promise<Page> => {
//   const page = await browser.newPage();

//   // Use a realistic user-agent
//   await page.setUserAgent(
//     "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
//   );

//   // Slightly vary the viewport to avoid detection
//   const width =
//     SCRAPING_CONFIG.viewport.width + Math.floor(Math.random() * 100) - 50;
//   const height =
//     SCRAPING_CONFIG.viewport.height + Math.floor(Math.random() * 100) - 50;
//   await page.setViewport({ width, height });

//   // Bypass common headless detection
//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", { get: () => false });
//     Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
//     Object.defineProperty(navigator, "languages", {
//       get: () => ["en-US", "en"],
//     });
//     window.chrome = { runtime: {} };
//   });

//   return page;
// };

// const buildGlassdoorUrl = (
//   params: ReturnType<typeof validateSearchParams>
// ): string => {
//   const baseUrl = "https://www.glassdoor.com/Job";
//   const query = params.q.replace(/\s+/g, "-").toLowerCase();
//   const queryLength = params.q.length;
//   let url = `${baseUrl}/${query}-jobs-SRCH_KO0,${queryLength}.htm`;

//   const searchParams = new URLSearchParams();
//   if (params.l) {
//     const location = params.l.replace(/\s+/g, "-").toLowerCase();
//     url = `${baseUrl}/${location}-${query}-jobs-SRCH_IL.0,${
//       location.length
//     }_KO${location.length + 1},${location.length + 1 + queryLength}.htm`;
//   }
//   if (params.radius) searchParams.set("radius", params.radius);
//   if (params.jobType) searchParams.set("jobType", params.jobType);
//   if (params.employmentType)
//     searchParams.set("employmentType", params.employmentType);
//   if (params.datePosted) {
//     const fromAgeMap: Record<string, string> = {
//       today: "1",
//       last3days: "3",
//       last7days: "7",
//     };
//     searchParams.set("fromAge", fromAgeMap[params.datePosted]);
//   }
//   if (params.sortBy) searchParams.set("sortBy", params.sortBy);

//   const queryString = searchParams.toString();
//   return queryString ? `${url}?${queryString}` : url;
// };

// const navigateToJobsPage = async (page: Page, url: string): Promise<void> => {
//   await page.goto(url, {
//     waitUntil: "domcontentloaded",
//     timeout: SCRAPING_CONFIG.timeout,
//   });
//   await page.waitForSelector(".TwoColumnLayout_columnLeft__oyj9i#left-column", {
//     timeout: 15000,
//   });

//   // Simulate human behavior: random mouse movement
//   await simulateMouseMovement(page);

//   const seeMore = await page.$(
//     ".SimilarJobs_seeMoreJobs__t0df_ .standalone-link_AnchorItem__iwMWV"
//   );
//   if (seeMore) {
//     const href = await page.evaluate((el) => el.getAttribute("href"), seeMore);
//     if (href) {
//       // Simulate a click with a delay
//       await seeMore.click();
//       await new Promise((resolve) =>
//         setTimeout(
//           resolve,
//           randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
//         )
//       );
//       await page.goto(`https://www.glassdoor.com${href}`, {
//         waitUntil: "domcontentloaded",
//         timeout: SCRAPING_CONFIG.timeout,
//       });
//       await page.waitForSelector(
//         ".TwoColumnLayout_columnLeft__oyj9i#left-column",
//         { timeout: 15000 }
//       );
//     }
//   }

//   // Simulate more human behavior after navigation
//   await simulateMouseMovement(page);
// };

// const wiseScroll = async (page: Page): Promise<void> => {
//   await page.waitForSelector(".JobsList_jobsList__lqjTr", { timeout: 15000 });

//   let previousJobCount = 0;
//   let sameCount = 0;
//   const maxSameCount = 5;
//   const scrollStep = 500;

//   while (sameCount < maxSameCount) {
//     const jobCount = await page.evaluate(() => {
//       const jobList = document.querySelector(".JobsList_jobsList__lqjTr");
//       return jobList
//         ? jobList.querySelectorAll("li.JobsList_jobListItem__wjTHv").length
//         : 0;
//     });

//     if (jobCount === previousJobCount) {
//       sameCount++;
//     } else {
//       sameCount = 0;
//     }

//     previousJobCount = jobCount;

//     // Simulate human scrolling: sometimes scroll up a bit, then down
//     if (Math.random() > 0.7) {
//       await page.evaluate((step) => window.scrollBy(0, -step), scrollStep / 2);
//       await new Promise((resolve) =>
//         setTimeout(resolve, randomDelay(500, 1500))
//       );
//     }
//     await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
//     await simulateMouseMovement(page);

//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(
//           SCRAPING_CONFIG.scrollDelay,
//           SCRAPING_CONFIG.scrollDelay + 2000
//         )
//       )
//     );
//   }

//   console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
// };

// const extractJobLinks = async (
//   page: Page,
//   maxJobs: number
// ): Promise<string[]> => {
//   const jobLinks: string[] = [];
//   const seenJobIds = new Set<string>();

//   while (jobLinks.length < maxJobs) {
//     await wiseScroll(page);

//     const newLinks = await page.evaluate(() => {
//       const jobs = Array.from(
//         document.querySelectorAll(
//           "ul.JobsList_jobsList__lqjTr[aria-label='Jobs List'] li.JobsList_jobListItem__wjTHv .JobCard_jobCardWrapper__vX29z .JobCard_jobCardContainer__arQlW .jobCard.JobCard_jobCardContent__JQ5Rq.JobCardWrapper_easyApplyLabelNoWrap__PtpgT div a.JobCard_jobTitle__GLyJ1[data-test='job-title']"
//         )
//       );
//       return jobs
//         .map((job) => ({
//           href: job.getAttribute("href"),
//           jobId: job
//             .closest("li.JobsList_jobListItem__wjTHv")
//             ?.getAttribute("data-jobid"),
//         }))
//         .filter(
//           (item): item is { href: string; jobId: string } =>
//             item.href !== null && item.jobId !== null
//         );
//     });

//     console.log(`Found ${newLinks.length} new links in this iteration.`);

//     for (const { href, jobId } of newLinks) {
//       if (!seenJobIds.has(jobId)) {
//         seenJobIds.add(jobId);
//         jobLinks.push(href);
//         console.log(`Picked job URL ${jobLinks.length} of ${maxJobs}: ${href}`);
//         if (jobLinks.length === maxJobs) {
//           console.log(
//             `Reached maxJobs (${maxJobs}), stopping link collection.`
//           );
//           break;
//         }
//       }
//     }

//     if (jobLinks.length === maxJobs) {
//       break;
//     }

//     const loadMoreButton = await page.$(
//       ".JobsList_buttonWrapper__ticwb .button_Button__MlD2g.button-base_Button__knLaX[data-role-variant='primary']"
//     );
//     if (!loadMoreButton) {
//       console.log(
//         "No 'Load More Jobs' button found, proceeding with collected links."
//       );
//       break;
//     }

//     // Simulate human clicking
//     await simulateMouseMovement(page);
//     await loadMoreButton.click();
//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
//       )
//     );
//     await page.waitForFunction(
//       () =>
//         document.querySelectorAll(
//           ".JobsList_jobsList__lqjTr li.JobsList_jobListItem__wjTHv"
//         ).length > 0,
//       { timeout: 15000 }
//     );
//   }

//   console.log(`Collected ${jobLinks.length} apply links.`);

//   // Fix URLs: If the href is already absolute, use it; otherwise, prepend the base URL
//   return jobLinks
//     .map((link) =>
//       link.startsWith("https://www.glassdoor.com")
//         ? link
//         : `https://www.glassdoor.com${link}`
//     )
//     .slice(0, maxJobs);
// };

// const extractJobDetails = async (
//   page: Page,
//   applyLink: string
// ): Promise<JobData | null> => {
//   try {
//     // Navigate to the job detail page with a human-like delay
//     await page.goto(applyLink, {
//       waitUntil: "domcontentloaded",
//       timeout: SCRAPING_CONFIG.timeout,
//     });
//     await page.waitForSelector(".JobDetails_jobDetailsContainer__y9P3L", {
//       timeout: 15000,
//     });

//     // Simulate human behavior on the job detail page
//     await simulateMouseMovement(page);
//     await page.evaluate(() => window.scrollBy(0, 500)); // Scroll a bit
//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
//       )
//     );

//     const jobDetails = await page.evaluate(() => {
//       const companyElement = document.querySelector(
//         ".JobDetails_employerAndJobTitle__nSJrW .EmployerProfile_profileContainer__63w3R .EmployerProfile_employerNameHeading__bXBYr h4"
//       );
//       const titleElement = document.querySelector(
//         ".JobDetails_employerAndJobTitle__nSJrW .heading_Heading__BqX5J.heading_Level1__soLZs"
//       );
//       const locationElement = document.querySelector(
//         ".JobDetails_locationAndPay__XGFmY [data-test='location']"
//       );
//       const descriptionElement = document.querySelector(
//         ".JobDetails_jobDescription__uW_fK.JobDetails_blurDescription__vN7nh div"
//       );

//       const jobTypeElement = document.querySelector(
//         ".JobDetails_jobDescriptionSnippet__l1tnl div:nth-child(2)"
//       );
//       const jobType =
//         jobTypeElement?.textContent
//           ?.match(/Skills:\s*(.+)/i)?.[1]
//           ?.split(/,\s*/) || "";

//       return {
//         title: titleElement?.textContent?.trim() || "",
//         company: companyElement?.textContent?.trim() || "",
//         location: locationElement?.textContent?.trim() || "",
//         jobType: jobType.length > 0 ? jobType : "",
//         description: descriptionElement?.innerHTML || "",
//         applyLink,
//       };
//     });

//     // Add a random delay before leaving the page
//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(
//           SCRAPING_CONFIG.visitDelay,
//           SCRAPING_CONFIG.visitDelay + 3000
//         )
//       )
//     );
//     return jobDetails;
//   } catch (error) {
//     console.error(`Error extracting details for ${applyLink}:`, error);
//     return null;
//   }
// };

// const scrapeGlassdoorJobs = async (
//   params: ReturnType<typeof validateSearchParams>
// ): Promise<JobData[]> => {
//   let browser: Browser | null = null;

//   try {
//     browser = await createBrowser();
//     const page = await setupPage(browser);

//     const url = buildGlassdoorUrl(params);
//     await navigateToJobsPage(page, url);

//     const jobLinks = await extractJobLinks(page, SCRAPING_CONFIG.maxJobs);
//     console.log(`Starting to visit ${jobLinks.length} collected links.`);
//     const allJobs: JobData[] = [];

//     for (const link of jobLinks) {
//       console.log(`Visiting ${link}`);
//       const jobDetails = await extractJobDetails(page, link);
//       if (jobDetails) allJobs.push(jobDetails);
//       // Add a longer random delay between visits to avoid rate limiting
//       await new Promise((resolve) =>
//         setTimeout(
//           resolve,
//           randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
//         )
//       );
//     }

//     return allJobs;
//   } catch (error) {
//     console.error("Scraping error:", error);
//     throw new Error(
//       `Failed to scrape Glassdoor jobs: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   } finally {
//     if (browser) await browser.close();
//   }
// };

// export const GET = async (request: NextRequest): Promise<NextResponse> => {
//   try {
//     const { searchParams } = new URL(request.url);
//     const params = validateSearchParams(searchParams);

//     const jobs = await scrapeGlassdoorJobs(params);

//     return NextResponse.json(
//       {
//         success: true,
//         data: jobs,
//         metadata: {
//           totalJobs: jobs.length,
//           searchParams: params,
//           scrapedAt: new Date().toISOString(),
//         },
//       },
//       {
//         status: 200,
//         headers: { "Content-Type": "application/json" },
//       }
//     );
//   } catch (error) {
//     const errorMessage =
//       error instanceof Error ? error.message : "Internal server error";
//     return NextResponse.json(
//       {
//         success: false,
//         error: errorMessage,
//         timestamp: new Date().toISOString(),
//       },
//       { status: 500 }
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
//   jobType: string[] | "";
//   description: string;
//   applyLink: string;
// }

// interface ScrapingConfig {
//   headless: "new" | boolean;
//   timeout: number;
//   maxJobs: number;
//   viewport: { width: number; height: number };
//   scrollDelay: number;
//   visitDelay: number;
//   minDelay: number;
//   maxDelay: number;
// }

// const SCRAPING_CONFIG: ScrapingConfig = {
//   headless: false,
//   timeout: 90000,
//   maxJobs: 5,
//   viewport: { width: 1920, height: 1080 },
//   scrollDelay: 3000,
//   visitDelay: 4000,
//   minDelay: 5000,
//   maxDelay: 12000,
// };

// const USER_AGENTS = [
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
// ];

// const randomDelay = (min: number, max: number): number => {
//   const variance = Math.random() * 0.3 + 0.85;
//   return Math.floor((Math.random() * (max - min + 1) + min) * variance);
// };

// const humanTyping = async (
//   page: Page,
//   selector: string,
//   text: string
// ): Promise<void> => {
//   await page.focus(selector);
//   await page.evaluate(() => document.execCommand("selectall", false));

//   for (const char of text) {
//     await page.keyboard.type(char, { delay: randomDelay(50, 150) });
//     if (Math.random() < 0.1) {
//       await new Promise((resolve) =>
//         setTimeout(resolve, randomDelay(100, 300))
//       );
//     }
//   }
// };

// const simulateHumanBehavior = async (page: Page): Promise<void> => {
//   const actions = [
//     async () => {
//       const x =
//         Math.floor(Math.random() * SCRAPING_CONFIG.viewport.width * 0.8) + 100;
//       const y =
//         Math.floor(Math.random() * SCRAPING_CONFIG.viewport.height * 0.8) + 100;
//       await page.mouse.move(x, y, { steps: randomDelay(10, 25) });
//     },
//     async () => {
//       await page.evaluate(() => {
//         window.scrollBy(0, Math.floor(Math.random() * 200) - 100);
//       });
//     },
//     async () => {
//       if (Math.random() < 0.3) {
//         await page.mouse.click(
//           Math.floor(Math.random() * SCRAPING_CONFIG.viewport.width),
//           Math.floor(Math.random() * SCRAPING_CONFIG.viewport.height),
//           { delay: randomDelay(50, 150) }
//         );
//       }
//     },
//     async () => {
//       const keys = ["Tab", "ArrowDown", "ArrowUp", "PageDown"];
//       if (Math.random() < 0.2) {
//         await page.keyboard.press(
//           keys[Math.floor(Math.random() * keys.length)]
//         );
//       }
//     },
//   ];

//   const numActions = Math.floor(Math.random() * 3) + 1;
//   for (let i = 0; i < numActions; i++) {
//     await actions[Math.floor(Math.random() * actions.length)]();
//     await new Promise((resolve) => setTimeout(resolve, randomDelay(200, 800)));
//   }
// };

// const addRandomPauses = async (): Promise<void> => {
//   await new Promise((resolve) =>
//     setTimeout(
//       resolve,
//       randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
//     )
//   );
// };

// const validateSearchParams = (searchParams: URLSearchParams) => {
//   const q = searchParams.get("q")?.trim() || "software engineer";
//   const l = searchParams.get("l")?.trim();
//   const radius = searchParams.get("radius")?.trim();
//   const jobType = searchParams.get("jobType")?.trim();
//   const employmentType = searchParams.get("employmentType")?.trim();
//   const datePosted = searchParams.get("datePosted")?.trim();
//   const sortBy = searchParams.get("sortBy")?.trim();

//   if (q.length > 100) throw new Error("Query too long");
//   if (l && l.length > 100) throw new Error("Location too long");
//   if (
//     radius &&
//     (isNaN(Number(radius)) || Number(radius) < 0 || Number(radius) > 500)
//   )
//     throw new Error("Radius must be 0-500 miles");
//   if (
//     jobType &&
//     !["fulltime", "parttime", "contract", "internship"].includes(jobType)
//   )
//     throw new Error("Invalid jobType");
//   if (
//     employmentType &&
//     !["full_time", "part_time", "contract", "intern"].includes(employmentType)
//   )
//     throw new Error("Invalid employmentType");
//   if (datePosted && !["today", "last3days", "last7days"].includes(datePosted))
//     throw new Error("Invalid datePosted");
//   if (sortBy && !["relevance", "date", "salary"].includes(sortBy))
//     throw new Error("Invalid sortBy");

//   return { q, l, radius, jobType, employmentType, datePosted, sortBy };
// };

// const createBrowser = async (): Promise<Browser> => {
//   return puppeteer.launch({
//     headless: SCRAPING_CONFIG.headless,
//     executablePath: executablePath(),
//     args: [
//       "--no-sandbox",
//       "--disable-setuid-sandbox",
//       "--disable-dev-shm-usage",
//       "--disable-accelerated-2d-canvas",
//       "--disable-gpu",
//       "--disable-background-timer-throttling",
//       "--disable-backgrounding-occluded-windows",
//       "--disable-renderer-backgrounding",
//       "--disable-web-security",
//       "--disable-features=TranslateUI,VizDisplayCompositor",
//       "--disable-blink-features=AutomationControlled",
//       "--disable-default-apps",
//       "--no-first-run",
//       "--no-default-browser-check",
//       "--disable-extensions-http-throttling",
//       "--disable-component-extensions-with-background-pages",
//       "--user-data-dir=/tmp/chrome-user-data",
//       "--remote-debugging-port=0",
//     ],
//     ignoreDefaultArgs: ["--enable-automation"],
//     defaultViewport: null,
//     slowMo: randomDelay(50, 150),
//   });
// };

// const setupPage = async (browser: Browser): Promise<Page> => {
//   const page = await browser.newPage();

//   const randomUserAgent =
//     USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
//   await page.setUserAgent(randomUserAgent);

//   const width =
//     SCRAPING_CONFIG.viewport.width + Math.floor(Math.random() * 200) - 100;
//   const height =
//     SCRAPING_CONFIG.viewport.height + Math.floor(Math.random() * 200) - 100;
//   await page.setViewport({ width, height });

//   await page.evaluateOnNewDocument(() => {
//     Object.defineProperty(navigator, "webdriver", { get: () => undefined });
//     Object.defineProperty(navigator, "plugins", {
//       get: () =>
//         Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, i) => ({
//           name: `plugin${i}`,
//         })),
//     });
//     Object.defineProperty(navigator, "languages", {
//       get: () => ["en-US", "en"],
//     });
//     Object.defineProperty(navigator, "platform", { get: () => "Win32" });
//     Object.defineProperty(navigator, "hardwareConcurrency", { get: () => 8 });
//     Object.defineProperty(navigator, "deviceMemory", { get: () => 8 });

//     window.chrome = {
//       runtime: {},
//       loadTimes: () => ({}),
//       csi: () => ({}),
//     };

//     Object.defineProperty(screen, "width", { get: () => 1920 });
//     Object.defineProperty(screen, "height", { get: () => 1080 });
//     Object.defineProperty(screen, "availWidth", { get: () => 1920 });
//     Object.defineProperty(screen, "availHeight", { get: () => 1040 });

//     const originalQuery = window.navigator.permissions.query;
//     window.navigator.permissions.query = (parameters) =>
//       parameters.name === "notifications"
//         ? Promise.resolve({ state: Notification.permission })
//         : originalQuery(parameters);

//     ["height", "width"].forEach((property) => {
//       window.outerHeight = 1040;
//       window.outerWidth = 1920;
//     });
//   });

//   await page.setExtraHTTPHeaders({
//     Accept:
//       "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
//     "Accept-Language": "en-US,en;q=0.9",
//     "Accept-Encoding": "gzip, deflate, br",
//     Connection: "keep-alive",
//     "Upgrade-Insecure-Requests": "1",
//     "Sec-Fetch-Dest": "document",
//     "Sec-Fetch-Mode": "navigate",
//     "Sec-Fetch-Site": "none",
//   });

//   return page;
// };

// const buildGlassdoorUrl = (
//   params: ReturnType<typeof validateSearchParams>
// ): string => {
//   const baseUrl = "https://www.glassdoor.com/Job";
//   const query = params.q.replace(/\s+/g, "-").toLowerCase();
//   const queryLength = params.q.length;
//   let url = `${baseUrl}/${query}-jobs-SRCH_KO0,${queryLength}.htm`;

//   const searchParams = new URLSearchParams();
//   if (params.l) {
//     const location = params.l.replace(/\s+/g, "-").toLowerCase();
//     url = `${baseUrl}/${location}-${query}-jobs-SRCH_IL.0,${
//       location.length
//     }_KO${location.length + 1},${location.length + 1 + queryLength}.htm`;
//   }
//   if (params.radius) searchParams.set("radius", params.radius);
//   if (params.jobType) searchParams.set("jobType", params.jobType);
//   if (params.employmentType)
//     searchParams.set("employmentType", params.employmentType);
//   if (params.datePosted) {
//     const fromAgeMap: Record<string, string> = {
//       today: "1",
//       last3days: "3",
//       last7days: "7",
//     };
//     searchParams.set("fromAge", fromAgeMap[params.datePosted]);
//   }
//   if (params.sortBy) searchParams.set("sortBy", params.sortBy);

//   const queryString = searchParams.toString();
//   return queryString ? `${url}?${queryString}` : url;
// };

// const navigateToJobsPage = async (page: Page, url: string): Promise<void> => {
//   await page.goto(url, {
//     waitUntil: ["networkidle2", "domcontentloaded"],
//     timeout: SCRAPING_CONFIG.timeout,
//   });

//   await addRandomPauses();
//   await simulateHumanBehavior(page);

//   try {
//     await page.waitForSelector(
//       ".TwoColumnLayout_columnLeft__oyj9i#left-column",
//       {
//         timeout: 20000,
//       }
//     );
//   } catch (error) {
//     console.log("Main selector not found, trying alternative approach...");
//     await simulateHumanBehavior(page);
//     await addRandomPauses();
//   }

//   const seeMore = await page.$(
//     ".SimilarJobs_seeMoreJobs__t0df_ .standalone-link_AnchorItem__iwMWV"
//   );
//   if (seeMore) {
//     await simulateHumanBehavior(page);
//     const href = await page.evaluate((el) => el.getAttribute("href"), seeMore);
//     if (href) {
//       await seeMore.click();
//       await addRandomPauses();
//       await page.goto(`https://www.glassdoor.com${href}`, {
//         waitUntil: ["networkidle2", "domcontentloaded"],
//         timeout: SCRAPING_CONFIG.timeout,
//       });
//       await simulateHumanBehavior(page);
//     }
//   }
// };

// const wiseScroll = async (page: Page): Promise<void> => {
//   await page.waitForSelector(".JobsList_jobsList__lqjTr", { timeout: 20000 });
//   await simulateHumanBehavior(page);

//   let previousJobCount = 0;
//   let sameCount = 0;
//   const maxSameCount = 8;
//   const scrollVariations = [300, 400, 500, 600, 700];

//   while (sameCount < maxSameCount) {
//     const jobCount = await page.evaluate(() => {
//       const jobList = document.querySelector(".JobsList_jobsList__lqjTr");
//       return jobList
//         ? jobList.querySelectorAll("li.JobsList_jobListItem__wjTHv").length
//         : 0;
//     });

//     if (jobCount === previousJobCount) {
//       sameCount++;
//     } else {
//       sameCount = 0;
//     }

//     previousJobCount = jobCount;

//     const scrollStep =
//       scrollVariations[Math.floor(Math.random() * scrollVariations.length)];

//     if (Math.random() > 0.6) {
//       await page.evaluate((step) => window.scrollBy(0, -step), scrollStep / 3);
//       await new Promise((resolve) =>
//         setTimeout(resolve, randomDelay(300, 800))
//       );
//     }

//     await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
//     await simulateHumanBehavior(page);

//     if (Math.random() < 0.3) {
//       await page.mouse.wheel({ deltaY: randomDelay(100, 300) });
//     }

//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(
//           SCRAPING_CONFIG.scrollDelay,
//           SCRAPING_CONFIG.scrollDelay + 3000
//         )
//       )
//     );
//   }

//   console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
// };

// const extractJobLinks = async (
//   page: Page,
//   maxJobs: number
// ): Promise<string[]> => {
//   const jobLinks: string[] = [];
//   const seenJobIds = new Set<string>();

//   while (jobLinks.length < maxJobs) {
//     await wiseScroll(page);
//     await simulateHumanBehavior(page);

//     const newLinks = await page.evaluate(() => {
//       const jobs = Array.from(
//         document.querySelectorAll(
//           "ul.JobsList_jobsList__lqjTr[aria-label='Jobs List'] li.JobsList_jobListItem__wjTHv .JobCard_jobCardWrapper__vX29z .JobCard_jobCardContainer__arQlW .jobCard.JobCard_jobCardContent__JQ5Rq.JobCardWrapper_easyApplyLabelNoWrap__PtpgT div a.JobCard_jobTitle__GLyJ1[data-test='job-title']"
//         )
//       );
//       return jobs
//         .map((job) => ({
//           href: job.getAttribute("href"),
//           jobId: job
//             .closest("li.JobsList_jobListItem__wjTHv")
//             ?.getAttribute("data-jobid"),
//         }))
//         .filter(
//           (item): item is { href: string; jobId: string } =>
//             item.href !== null && item.jobId !== null
//         );
//     });

//     console.log(`Found ${newLinks.length} new links in this iteration.`);

//     for (const { href, jobId } of newLinks) {
//       if (!seenJobIds.has(jobId)) {
//         seenJobIds.add(jobId);
//         jobLinks.push(href);
//         console.log(`Picked job URL ${jobLinks.length} of ${maxJobs}: ${href}`);
//         if (jobLinks.length === maxJobs) {
//           console.log(
//             `Reached maxJobs (${maxJobs}), stopping link collection.`
//           );
//           break;
//         }
//       }
//     }

//     if (jobLinks.length === maxJobs) break;

//     const loadMoreButton = await page.$(
//       ".JobsList_buttonWrapper__ticwb .button_Button__MlD2g.button-base_Button__knLaX[data-role-variant='primary']"
//     );
//     if (!loadMoreButton) {
//       console.log(
//         "No 'Load More Jobs' button found, proceeding with collected links."
//       );
//       break;
//     }

//     await simulateHumanBehavior(page);
//     await loadMoreButton.click();
//     await addRandomPauses();

//     await page.waitForFunction(
//       () =>
//         document.querySelectorAll(
//           ".JobsList_jobsList__lqjTr li.JobsList_jobListItem__wjTHv"
//         ).length > 0,
//       { timeout: 20000 }
//     );
//   }

//   console.log(`Collected ${jobLinks.length} apply links.`);

//   return jobLinks
//     .map((link) =>
//       link.startsWith("https://www.glassdoor.com")
//         ? link
//         : `https://www.glassdoor.com${link}`
//     )
//     .slice(0, maxJobs);
// };

// const extractJobDetails = async (
//   page: Page,
//   applyLink: string
// ): Promise<JobData | null> => {
//   try {
//     await page.goto(applyLink, {
//       waitUntil: ["networkidle2", "domcontentloaded"],
//       timeout: SCRAPING_CONFIG.timeout,
//     });

//     await simulateHumanBehavior(page);
//     await addRandomPauses();

//     try {
//       await page.waitForSelector(".JobDetails_jobDetailsContainer__y9P3L", {
//         timeout: 20000,
//       });
//     } catch (error) {
//       console.log(
//         "Job details container not found, attempting to extract anyway..."
//       );
//     }

//     await simulateHumanBehavior(page);
//     await page.evaluate(() =>
//       window.scrollBy(0, Math.floor(Math.random() * 800) + 200)
//     );
//     await new Promise((resolve) =>
//       setTimeout(resolve, randomDelay(1000, 3000))
//     );

//     const jobDetails = await page.evaluate(() => {
//       const companyElement = document.querySelector(
//         ".JobDetails_employerAndJobTitle__nSJrW .EmployerProfile_profileContainer__63w3R .EmployerProfile_employerNameHeading__bXBYr h4"
//       );
//       const titleElement = document.querySelector(
//         ".JobDetails_employerAndJobTitle__nSJrW .heading_Heading__BqX5J.heading_Level1__soLZs"
//       );
//       const locationElement = document.querySelector(
//         ".JobDetails_locationAndPay__XGFmY [data-test='location']"
//       );
//       const descriptionElement = document.querySelector(
//         ".JobDetails_jobDescription__uW_fK.JobDetails_blurDescription__vN7nh div"
//       );

//       const jobTypeElement = document.querySelector(
//         ".JobDetails_jobDescriptionSnippet__l1tnl div:nth-child(2)"
//       );
//       const jobType =
//         jobTypeElement?.textContent
//           ?.match(/Skills:\s*(.+)/i)?.[1]
//           ?.split(/,\s*/) || "";

//       return {
//         title: titleElement?.textContent?.trim() || "",
//         company: companyElement?.textContent?.trim() || "",
//         location: locationElement?.textContent?.trim() || "",
//         jobType: jobType.length > 0 ? jobType : "",
//         description: descriptionElement?.innerHTML || "",
//         applyLink,
//       };
//     });

//     await simulateHumanBehavior(page);
//     await new Promise((resolve) =>
//       setTimeout(
//         resolve,
//         randomDelay(
//           SCRAPING_CONFIG.visitDelay,
//           SCRAPING_CONFIG.visitDelay + 4000
//         )
//       )
//     );

//     return jobDetails;
//   } catch (error) {
//     console.error(`Error extracting details for ${applyLink}:`, error);
//     return null;
//   }
// };

// const scrapeGlassdoorJobs = async (
//   params: ReturnType<typeof validateSearchParams>
// ): Promise<JobData[]> => {
//   let browser: Browser | null = null;

//   try {
//     browser = await createBrowser();
//     const page = await setupPage(browser);

//     const url = buildGlassdoorUrl(params);
//     await navigateToJobsPage(page, url);

//     const jobLinks = await extractJobLinks(page, SCRAPING_CONFIG.maxJobs);
//     console.log(`Starting to visit ${jobLinks.length} collected links.`);
//     const allJobs: JobData[] = [];

//     for (const link of jobLinks) {
//       console.log(`Visiting ${link}`);
//       const jobDetails = await extractJobDetails(page, link);
//       if (jobDetails) allJobs.push(jobDetails);

//       await addRandomPauses();

//       if (Math.random() < 0.3) {
//         await new Promise((resolve) =>
//           setTimeout(resolve, randomDelay(2000, 5000))
//         );
//       }
//     }

//     return allJobs;
//   } catch (error) {
//     console.error("Scraping error:", error);
//     throw new Error(
//       `Failed to scrape Glassdoor jobs: ${
//         error instanceof Error ? error.message : "Unknown error"
//       }`
//     );
//   } finally {
//     if (browser) await browser.close();
//   }
// };

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);
    console.log(searchParams)
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

// export const runtime = "nodejs";
