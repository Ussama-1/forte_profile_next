// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page, executablePath } from "puppeteer";
// import { connectMongoDB } from "../lib/dbConnection";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]/auth";
// import CareerProfile from "../models/CareerProfile";
// import ForteProfile from "../models/ForteProfile";
// import Priority from "../models/Priority";
// import { OpenAI } from "openai";

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY!,
// });

// type EmploymentType = "FULLTIME" | "PARTTIME" | "CONTRACTS" | "THIRD_PARTY";
// type WorkplaceType = "Remote" | "On-Site" | "Hybrid";

// interface DiceSearchParamsStrict {
//   jobTitle: string;
//   location: string;
//   latitude: string;
//   longitude: string;
//   radius: string;
//   locationPrecision: "City";
//   adminDistrictCode: string;
//   countryCode: string;
//   employmentTypes: EmploymentType[];
//   postedDate: "ONE" | "THREE" | "SEVEN" | "THIRTY";
//   workplaceTypes: WorkplaceType[];
// }

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
//   maxJobs: 23, // Updated to 23 as requested
//   maxPages: 5,
//   viewport: { width: 1680, height: 1050 },
// };

// const validateSearchParams = (
//   searchParams: URLSearchParams
// ): { q: string; l: string; sort: string } => {
//   const q = searchParams.get("q")?.trim() || "software engineer";
//   const l = searchParams.get("l")?.trim() || "United States";
//   const sort = searchParams.get("sort")?.trim() || "date";

//   if (q.length > 100 || l.length > 100 || sort.length > 50) {
//     throw new Error("Search parameters too long");
//   }

//   if (!["date", "relevance"].includes(sort)) {
//     throw new Error("Invalid sort order. Use 'date' or 'relevance'.");
//   }

//   return { q, l, sort };
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
//       "--window-size=1680,1050",
//     ],
//     defaultViewport: null,
//   });
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
//   await new Promise((resolve) =>
//     setTimeout(resolve, 1000 + Math.random() * 2000)
//   );
// };

// const buildDiceUrl = (data: DiceSearchParamsStrict): string => {
//   const baseUrl = "https://www.dice.com/jobs";

//   const params = new URLSearchParams({
//     // ✅ REQUIRED: Job title or keywords
//     // Example: 'senior software engineer'
//     q: data.jobTitle,

//     // ✅ REQUIRED: Human-readable location
//     // Example: 'New York, NY, USA'
//     location: data.location,

//     // ✅ REQUIRED: Latitude for geo-based search
//     // Example: '40.7127753'
//     latitude: data.latitude,

//     // ✅ REQUIRED: Longitude for geo-based search
//     // Example: '-74.0059728'
//     longitude: data.longitude,

//     // ✅ REQUIRED: Search radius in miles
//     // Example: '75'
//     radius: data.radius,

//     // ✅ REQUIRED: Location precision level
//     // Example: 'City'
//     locationPrecision: data.locationPrecision,

//     // ✅ REQUIRED: State or province abbreviation
//     // Example: 'NY'
//     adminDistrictCode: data.adminDistrictCode,

//     // ✅ REQUIRED: Country code (2-letter ISO)
//     // Example: 'US'
//     countryCode: data.countryCode,

//     // ✅ REQUIRED: Employment types (multiple allowed, joined with '|')
//     // Example: 'FULLTIME|PARTTIME|CONTRACTS|THIRD_PARTY'
//     // Valid options:
//     //   - 'FULLTIME'
//     //   - 'PARTTIME'
//     //   - 'CONTRACTS'
//     //   - 'THIRD_PARTY'
//     "filters.employmentType": data.employmentTypes.join("|"),

//     // ✅ REQUIRED: Posted date filter
//     // Example: 'ONE' (last 24 hours)
//     // Valid options:
//     //   - 'ONE' (1 day)
//     //   - 'THREE' (3 days)
//     //   - 'SEVEN' (7 days)
//     //   - 'THIRTY' (30 days)
//     "filters.postedDate": data.postedDate,

//     // ✅ REQUIRED: Workplace types (multiple allowed, joined with '|')
//     // Example: 'Remote|On-Site|Hybrid'
//     // Valid options:
//     //   - 'Remote'
//     //   - 'On-Site'
//     //   - 'Hybrid'
//     "filters.workplaceTypes": data.workplaceTypes.join("|"),
//   });

//   return `${baseUrl}?${params.toString()}`;
// };

// const wiseScroll = async (page: Page): Promise<void> => {
//   await page.waitForSelector("[data-testid='job-search-results-container']", {
//     timeout: 15000,
//   });

//   let previousJobCount = 0;
//   let sameCount = 0;
//   const maxSameCount = 5; // Increased to ensure more scrolling attempts
//   const scrollStep = 1000; // Increased scroll step to load more jobs

//   while (sameCount < maxSameCount) {
//     const jobCount = await page.evaluate(() => {
//       const jobList = document.querySelector(
//         "[data-testid='job-search-results-container'] .flex.flex-col.gap-4.divide-y.divide-zinc-100.sm\\:divide-none"
//       );
//       return jobList ? jobList.querySelectorAll("div[data-id]").length : 0;
//     });

//     if (jobCount === previousJobCount) {
//       sameCount++;
//     } else {
//       sameCount = 0;
//     }

//     previousJobCount = jobCount;

//     await page.evaluate((step) => {
//       window.scrollBy(0, step);
//     }, scrollStep);

//     await simulateHumanBehavior(page);
//     await new Promise((resolve) => setTimeout(resolve, 3000)); // Increased delay to ensure jobs load
//   }

//   console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
// };

// const extractJobLinks = async (page: Page): Promise<string[]> => {
//   await page.waitForSelector("[data-testid='job-search-results-container']", {
//     timeout: 15000,
//   });

//   const links = await page.evaluate(() => {
//     const jobCards = Array.from(
//       document.querySelectorAll(
//         "[data-testid='job-search-results-container'] .flex.flex-col.gap-4.divide-y.divide-zinc-100.sm\\:divide-none div[data-id][data-job-guid] .flex.flex-col.gap-6.overflow-hidden.rounded-lg.border.bg-surface-primary.p-6.relative.mx-auto.h-full.w-full.border-transparent.shadow-none.transition.duration-300.ease-in-out.sm\\:border-zinc-100.sm\\:shadow a[data-testid='job-search-job-card-link']"
//       )
//     );
//     return jobCards
//       .map((card) => card.getAttribute("href"))
//       .filter((link): link is string => link !== null);
//   });

//   return [...new Set(links)];
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
//     await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
//     await page.waitForSelector("#jobDescription", { timeout: 15000 });

//     const jobDetails = await page.evaluate(() => {
//       const titleElement = document.querySelector("h1[data-cy='jobTitle']");
//       const companyElement = document.querySelector(
//         "a[data-cy='companyNameLink']"
//       );
//       const locationElement = document.querySelector("li[data-cy='location']");
//       const jobTypeElement = document.querySelector(
//         ".container.lg\\:grid.lg\\:grid-cols-12.lg\\:gap-6 .lg\\:col-span-8 .job-overview_jobOverview__ZHVdb .job-overview_jobDetails__kBakg .job-overview_detailContainer__TpXMD .job-overview_chipContainer__E4zOO span"
//       );
//       const descriptionElement = document.querySelector(
//         "[data-testid='jobDescriptionHtml']"
//       );

//       return {
//         title: titleElement?.textContent?.trim() || "",
//         company: companyElement?.textContent?.trim() || "",
//         location: locationElement?.textContent?.trim() || "",
//         jobType: jobTypeElement
//           ? [jobTypeElement.textContent?.trim() || ""]
//           : [],
//         description: descriptionElement?.innerHTML || "",
//       };
//     });

//     if (!jobDetails.description) {
//       console.warn(`No description found for ${applyLink}`);
//     }

//     return {
//       ...jobDetails,
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

// const scrapeDiceJobs = async (
//   data: DiceSearchParamsStrict
// ): Promise<JobData[]> => {
//   let browser: Browser | null = null;

//   try {
//     browser = await createBrowser();
//     const page = await setupPage(browser);

//     const url = buildDiceUrl(data);
//     await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

//     let allLinks: string[] = [];
//     const seenLinks = new Set<string>();

//     for (let pageNum = 0; pageNum < SCRAPING_CONFIG.maxPages; pageNum++) {
//       console.log(`Scraping page ${pageNum + 1}...`);
//       await wiseScroll(page);

//       const links = await extractJobLinks(page);
//       links.forEach((link) => {
//         if (!seenLinks.has(link)) {
//           seenLinks.add(link);
//           allLinks.push(link);
//         }
//       });

//       console.log(`Total links collected so far: ${allLinks.length}`);

//       if (allLinks.length >= SCRAPING_CONFIG.maxJobs) {
//         console.log("Reached max jobs limit.");
//         break;
//       }

//       const nextButton = await page.$(
//         '[role="navigation"][aria-label="Pagination"] span[aria-label="Next"][class*="focus-visible:outline"]'
//       );

//       if (!nextButton) {
//         console.log("No more pages available.");
//         break;
//       }

//       try {
//         await simulateHumanBehavior(page);
//         await nextButton.click();
//         await page.waitForNavigation({
//           waitUntil: "domcontentloaded",
//           timeout: 15000,
//         });
//         await new Promise((resolve) =>
//           setTimeout(resolve, 3000 + Math.random() * 2000)
//         );
//       } catch (error) {
//         console.error("Error navigating to next page:", error);
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
//     }

//     console.log(`Total jobs scraped: ${allJobs.length}`);
//     return allJobs;
//   } catch (error) {
//     console.error("Scraping error:", error);
//     throw new Error(
//       `Failed to scrape Dice jobs: ${
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

//     await connectMongoDB();
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Unauthorized access. Please log in.",
//         },
//         { status: 401 }
//       );
//     }

//     const careerProfile = await CareerProfile.find({
//       userId: session?.user?.id,
//     });
//     const forteprofile = await ForteProfile.find({ userId: session?.user?.id });
//     const priority = await Priority.find({ userId: session?.user?.id });
//     const completion = await openai.chat.completions.create({
//       model: "gpt-4o",
//       messages: [
//         {
//           role: "system",
//           content: ` You are provided with the following user inputs:
//                   Forte Profile
//                   Career Profile
//                   Priority Profile
//                   dice.com Search Parameters (optional)

//                   Your task is divided into two clear steps:
//                   Step 1: Generate Job Title for dice.com Search
//                   Analyze the Forte Profile, Career Profile, Priority Profile, and (if present) the job title included in the search parameters.
//                   Based on this holistic understanding, output one concise and relevant job title.
//                   This job title must be highly optimized for dice.com's job search bar, meaning it should reflect roles that best align with the candidate’s strengths, goals, and preferences.

//                   Step 2: Generate Optimized dice.com Search Parameters
//                   Using the same inputs—Forte Profile, Career Profile, Priority Profile, and (if present) existing search parameters—provide a corrected and fully populated set of dice.com job search parameters. Your output should fill in or correct the following fields:
//                   if there is no city or country provided then you will automatically optamzie it for example someone says city name not country name then you will add the country automatically same as if some one give country name but not city name then you will pick the famous city of that country autmoatically
//                   const params = new URLSearchParams({
//                         // ✅ REQUIRED: Job title or keywords
//                         // Example: 'senior software engineer'
//                         q: "// only give me one optamize job title based on the provided data. dont use and between the job title only give one optamize title i.e: AI Engineer  not like :(AI Engineer and Full-Stack Developer)",

//                         // ✅ REQUIRED: Human-readable location
//                         // Example: 'New York, NY, USA'
//                         location: "",

//                         // ✅ REQUIRED: Latitude for geo-based search
//                         // Example: '40.7127753'
//                         latitude: "",

//                         // ✅ REQUIRED: Longitude for geo-based search
//                         // Example: '-74.0059728'
//                         longitude: "",

//                         // ✅ REQUIRED: Search radius in miles
//                         // Example: enum:10 | 30 | 50 | 75
//                         radius: "",

//                         // ✅ REQUIRED: Location precision level
//                         // Example: 'City'
//                         locationPrecision: "",

//                         // ✅ REQUIRED: State or province abbreviation
//                         // Example: 'NY'
//                         adminDistrictCode: "",

//                         // ✅ REQUIRED: Country code (2-letter ISO)
//                         // Example: 'US'
//                         countryCode: "",

//                         // ✅ REQUIRED: Employment types (multiple allowed, joined with '|')
//                         // Example: 'FULLTIME|PARTTIME|CONTRACTS|THIRD_PARTY'
//                         // Valid options:
//                         //   - 'FULLTIME'
//                         //   - 'PARTTIME'
//                         //   - 'CONTRACTS'
//                         //   - 'THIRD_PARTY'
//                         "filters.employmentType": "",

//                         // ✅ REQUIRED: Posted date filter
//                         // Example: 'ONE' (last 24 hours)
//                         // Valid options:
//                         //   - 'ONE' (1 day)
//                         //   - 'THREE' (3 days)
//                         //   - 'SEVEN' (7 days)
//                         //   - 'THIRTY' (30 days)
//                         "filters.postedDate": "",

//                         // Example: 'Remote|On-Site|Hybrid'
//                         // Valid options:
//                         //   - 'Remote'
//                         //   - 'On-Site'
//                         //   - 'Hybrid'
//                         "filters.workplaceTypes": "",
//                     });

//                   Final Output Format
//                   Return your results as a JSON object in the following structure always give response in strict following formate:
//                     type EmploymentType = "FULLTIME" | "PARTTIME" | "CONTRACTS" | "THIRD_PARTY";
//                     type WorkplaceType = "Remote" | "On-Site" | "Hybrid";

//                     interface DiceSearchParamsStrict {
//                     jobTitle: string;
//                     location: string;
//                     latitude: string;
//                     longitude: string;
//                     radius: string;
//                     locationPrecision: "City";
//                     adminDistrictCode: string;
//                     countryCode: string;
//                     employmentTypes: EmploymentType[];
//                     postedDate: "ONE" | "THREE" | "SEVEN" | "THIRTY";
//                     workplaceTypes: WorkplaceType[];
//                     }

//                     If the output deviates in any way — including use of single quotes, additional keys, missing keys, different order, or incorrect capitalization — fix it immediately.

//           `,
//         },
//         {
//           role: "user",
//           content: `
//           Here is my job search input data:
//           careerProfile : ${careerProfile}
//                     forteprofile:${forteprofile}
//                     priority:${priority}
//                     search params:${searchParams.toString()}
//           `,
//         },
//       ],
//       response_format: { type: "json_object" as const },
//     });
//     const rawResponse = completion.choices[0].message.content;

//     if (!rawResponse) {
//       throw new Error("Invalid response from OpenAI: rawResponse is null");
//     }

//     let parsedResponse: DiceSearchParamsStrict;

//     try {
//       parsedResponse = JSON.parse(rawResponse);

//       console.log(parsedResponse);
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : "Unknown error";
//       throw new Error("Failed to parse rawResponse: " + errorMessage);
//     }

//     const jobs = await scrapeDiceJobs(parsedResponse);

//     const responseData = {
//       success: true,
//       data: jobs,
//       metadata: {
//         totalJobs: jobs.length,
//         searchQuery: { parsedResponse },
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
//       { status: 500 }
//     );
//   }
// };

// export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, Page, executablePath } from "puppeteer";
import { connectMongoDB } from "../lib/dbConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { OpenAI } from "openai";
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type EmploymentType = "FULLTIME" | "PARTTIME" | "CONTRACTS" | "THIRD_PARTY";
type WorkplaceType = "Remote" | "On-Site" | "Hybrid";

interface DiceSearchParamsStrict {
  jobTitle: string;
  location: string;
  latitude: string;
  longitude: string;
  radius: string;
  locationPrecision: "City";
  adminDistrictCode: string;
  countryCode: string;
  employmentTypes: EmploymentType[];
  postedDate: "ONE" | "THREE" | "SEVEN" | "THIRTY";
  workplaceTypes: WorkplaceType[];
}

interface JobData {
  title: string;
  company: string;
  location: string;
  jobType: string[];
  description: string;
  applyLink: string;
}

interface ScrapingConfig {
  headless: boolean;
  timeout: number;
  maxJobs: number;
  maxPages: number;
  viewport: {
    width: number;
    height: number;
  };
}

const SCRAPING_CONFIG: ScrapingConfig = {
  headless: true,
  timeout: 60000,
  maxJobs: 30,
  maxPages: 10,
  viewport: { width: 1680, height: 1050 },
};

const getRandomUserAgent = (): string => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const getRandomViewport = () => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1680, height: 1050 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1366, height: 768 },
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
};

const humanDelay = (min = 800, max = 3000): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const createBrowser = async (): Promise<Browser> => {
  const viewport = getRandomViewport();

  return puppeteer.launch({
    headless: SCRAPING_CONFIG.headless,
    executablePath: executablePath(),
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-blink-features=AutomationControlled",
      "--disable-features=VizDisplayCompositor",
      "--disable-web-security",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--no-default-browser-check",
      "--disable-default-apps",
      "--disable-extensions-file-access-check",
      "--disable-extensions-http-throttling",
      "--disable-extensions-https-enforced",
      "--disable-sync",
      "--metrics-recording-only",
      "--no-report-upload",
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--disable-backgrounding-occluded-windows",
      "--disable-client-side-phishing-detection",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-features=TranslateUI,BlinkGenPropertyTrees",
      "--disable-hang-monitor",
      "--disable-popup-blocking",
      "--disable-prompt-on-repost",
      "--disable-background-networking",
      "--disable-sync",
      "--force-color-profile=srgb",
      "--disable-domain-reliability",
      "--disable-component-update",
      `--window-size=${viewport.width},${viewport.height}`,
    ],
    defaultViewport: null,
  });
};

const setupPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();
  const viewport = getRandomViewport();

  await page.setViewport(viewport);
  await page.setUserAgent(getRandomUserAgent());

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" },
        {
          name: "Chrome PDF Viewer",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
        },
        { name: "Native Client", filename: "internal-nacl-plugin" },
      ],
    });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    Object.defineProperty(navigator, "permissions", {
      get: () => ({
        query: () => Promise.resolve({ state: "granted" }),
      }),
    });

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return "Intel Inc.";
      if (parameter === 37446) return "Intel Iris OpenGL Engine";
      return getParameter.call(this, parameter);
    };

    interface Chrome {
      runtime: Record<string, unknown>;
      loadTimes(): Record<string, unknown>;
      csi(): Record<string, unknown>;
    }

    interface Window {
      chrome: Chrome;
    }

    (window as unknown as Window).chrome = {
      runtime: {},
      loadTimes: function () {
        return {};
      },
      csi: function () {
        return {};
      },
    };
  });

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    DNT: "1",
  });

  await page.evaluateOnNewDocument(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.innerHTML = `
      Math.random = (function() {
        const originalRandom = Math.random;
        let seed = ${Math.random()};
        return function() {
          seed = (seed * 9301 + 49297) % 233280;
          return seed / 233280;
        };
      })();
    `;
    document.head.appendChild(script);
  });

  return page;
};

const simulateHumanBehavior = async (page: Page): Promise<void> => {
  const { width, height } = (await page.viewport()) || {
    width: 1680,
    height: 1050,
  };

  const actions = [
    async () => {
      const x = Math.random() * (width - 100) + 50;
      const y = Math.random() * (height - 100) + 50;
      await page.mouse.move(x, y, {
        steps: Math.floor(Math.random() * 10) + 5,
      });
    },
    async () => {
      await page.mouse.move(Math.random() * width, Math.random() * height, {
        steps: Math.floor(Math.random() * 15) + 10,
      });
      await humanDelay(200, 800);
    },
    async () => {
      const scrollAmount = Math.random() > 0.5 ? 100 : -50;
      await page.mouse.wheel({ deltaY: scrollAmount });
    },
    async () => {
      await page.keyboard.press("Tab");
      await humanDelay(100, 300);
    },
  ];

  const numActions = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numActions; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();
    await humanDelay(300, 1500);
  }
};

const buildDiceUrl = (data: DiceSearchParamsStrict): string => {
  const baseUrl = "https://www.dice.com/jobs";

  const params = new URLSearchParams({
    q: data.jobTitle,
    location: data.location,
    latitude: data.latitude,
    longitude: data.longitude,
    radius: data.radius,
    locationPrecision: data.locationPrecision,
    adminDistrictCode: data.adminDistrictCode,
    countryCode: data.countryCode,
    "filters.employmentType": data.employmentTypes.join("|"),
    "filters.postedDate": data.postedDate,
    "filters.workplaceTypes": data.workplaceTypes.join("|"),
  });

  return `${baseUrl}?${params.toString()}`;
};

const wiseScroll = async (page: Page): Promise<void> => {
  await page.waitForSelector("[data-testid='job-search-results-container']", {
    timeout: 15000,
  });

  let previousJobCount = 0;
  let sameCount = 0;
  const maxSameCount = 5;

  while (sameCount < maxSameCount) {
    const jobCount = await page.evaluate(() => {
      const jobList = document.querySelector(
        "[data-testid='job-search-results-container'] .flex.flex-col.gap-4.divide-y.divide-zinc-100.sm\\:divide-none"
      );
      return jobList ? jobList.querySelectorAll("div[data-id]").length : 0;
    });

    if (jobCount === previousJobCount) {
      sameCount++;
    } else {
      sameCount = 0;
    }

    previousJobCount = jobCount;

    const scrollAmount = Math.floor(Math.random() * 500) + 800;
    await page.evaluate((amount) => {
      window.scrollBy({
        top: amount,
        left: 0,
        behavior: Math.random() > 0.7 ? "smooth" : "auto",
      });
    }, scrollAmount);

    await simulateHumanBehavior(page);
    await humanDelay(2000, 4000);

    if (Math.random() > 0.8) {
      await page.evaluate(() => {
        window.scrollBy(0, -Math.floor(Math.random() * 200) - 50);
      });
      await humanDelay(500, 1200);
    }
  }

  console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
};

const extractJobLinks = async (page: Page): Promise<string[]> => {
  await page.waitForSelector("[data-testid='job-search-results-container']", {
    timeout: 15000,
  });

  const links = await page.evaluate(() => {
    const jobCards = Array.from(
      document.querySelectorAll(
        "[data-testid='job-search-results-container'] .flex.flex-col.gap-4.divide-y.divide-zinc-100.sm\\:divide-none div[data-id][data-job-guid] .flex.flex-col.gap-6.overflow-hidden.rounded-lg.border.bg-surface-primary.p-6.relative.mx-auto.h-full.w-full.border-transparent.shadow-none.transition.duration-300.ease-in-out.sm\\:border-zinc-100.sm\\:shadow a[data-testid='job-search-job-card-link']"
      )
    );
    return jobCards
      .map((card) => card.getAttribute("href"))
      .filter((link): link is string => link !== null);
  });

  return [...new Set(links)];
};

const extractJobDetails = async (
  page: Page,
  applyLink: string
): Promise<JobData | null> => {
  try {
    await simulateHumanBehavior(page);
    await humanDelay(1000, 3000);

    await page.goto(applyLink, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    await humanDelay(3000, 8000);

    await simulateHumanBehavior(page);

    const randomScroll = Math.random() * 300 + 100;
    await page.evaluate((scroll) => {
      window.scrollBy(0, scroll);
    }, randomScroll);

    await humanDelay(2000, 4000);

    await page.waitForSelector("#jobDescription", { timeout: 15000 });

    const jobDetails = await page.evaluate(() => {
      const titleElement = document.querySelector("h1[data-cy='jobTitle']");
      const companyElement = document.querySelector(
        "a[data-cy='companyNameLink']"
      );
      const locationElement = document.querySelector("li[data-cy='location']");
      const jobTypeElement = document.querySelector(
        ".container.lg\\:grid.lg\\:grid-cols-12.lg\\:gap-6 .lg\\:col-span-8 .job-overview_jobOverview__ZHVdb .job-overview_jobDetails__kBakg .job-overview_detailContainer__TpXMD .job-overview_chipContainer__E4zOO span"
      );
      const descriptionElement = document.querySelector(
        "[data-testid='jobDescriptionHtml']"
      );

      return {
        title: titleElement?.textContent?.trim() || "",
        company: companyElement?.textContent?.trim() || "",
        location: locationElement?.textContent?.trim() || "",
        jobType: jobTypeElement
          ? [jobTypeElement.textContent?.trim() || ""]
          : [],
        description: descriptionElement?.innerHTML || "",
      };
    });

    if (!jobDetails.description) {
      console.warn(`No description found for ${applyLink}`);
    }

    await simulateHumanBehavior(page);
    await humanDelay(1000, 2500);

    return {
      ...jobDetails,
      applyLink,
    };
  } catch (error) {
    console.error(`Error extracting details for ${applyLink}:`, error);
    await page
      .screenshot({ path: `job_error_${applyLink.split("/").pop()}.png` })
      .catch(() => {});
    return null;
  }
};

const scrapeDiceJobs = async (
  data: DiceSearchParamsStrict
): Promise<JobData[]> => {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await setupPage(browser);

    await humanDelay(2000, 5000);

    const url = buildDiceUrl(data);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await humanDelay(3000, 6000);
    await simulateHumanBehavior(page);

    const allLinks: string[] = [];
    const seenLinks = new Set<string>();

    for (let pageNum = 0; pageNum < SCRAPING_CONFIG.maxPages; pageNum++) {
      console.log(`Scraping page ${pageNum + 1}...`);

      await simulateHumanBehavior(page);
      await wiseScroll(page);

      const links = await extractJobLinks(page);
      links.forEach((link) => {
        if (!seenLinks.has(link)) {
          seenLinks.add(link);
          allLinks.push(link);
        }
      });

      console.log(`Total links collected so far: ${allLinks.length}`);

      if (allLinks.length >= SCRAPING_CONFIG.maxJobs) {
        console.log("Reached max jobs limit.");
        break;
      }

      const nextButton = await page.$(
        '[role="navigation"][aria-label="Pagination"] span[aria-label="Next"][class*="focus-visible:outline"]'
      );

      if (!nextButton) {
        console.log("No more pages available.");
        break;
      }

      try {
        await simulateHumanBehavior(page);
        await humanDelay(2000, 4000);

        await nextButton.click();
        await page.waitForNavigation({
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });

        await humanDelay(3000, 6000);
        await simulateHumanBehavior(page);
      } catch (error) {
        console.error("Error navigating to next page:", error);
        break;
      }
    }

    const allJobs: JobData[] = [];
    const shuffledLinks = allLinks
      .slice(0, SCRAPING_CONFIG.maxJobs)
      .sort(() => Math.random() - 0.5);

    for (const link of shuffledLinks) {
      console.log(`Fetching details for ${link}`);
      const jobDetails = await extractJobDetails(page, link);
      if (jobDetails) {
        allJobs.push(jobDetails);
      }

      await humanDelay(2000, 5000);
    }

    console.log(`Total jobs scraped: ${allJobs.length}`);
    return allJobs;
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape Dice jobs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);

    await connectMongoDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized access. Please log in.",
        },
        { status: 401 }
      );
    }

    const careerProfile = await CareerProfile.find({
      userId: session?.user?.id,
    });
    const forteprofile = await ForteProfile.find({ userId: session?.user?.id });
    const priority = await Priority.find({ userId: session?.user?.id });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: ` You are provided with the following user inputs:
                  Forte Profile
                  Career Profile
                  Priority Profile
                  dice.com Search Parameters (optional)

                  Your task is divided into two clear steps:
                  Step 1: Generate Job Title for dice.com Search
                  Analyze the Forte Profile, Career Profile, Priority Profile, and (if present) the job title included in the search parameters.
                  Based on this holistic understanding, output one concise and relevant job title.
                  This job title must be highly optimized for dice.com's job search bar, meaning it should reflect roles that best align with the candidate's strengths, goals, and preferences.

                  Step 2: Generate Optimized dice.com Search Parameters
                  Using the same inputs—Forte Profile, Career Profile, Priority Profile, and (if present) existing search parameters—provide a corrected and fully populated set of dice.com job search parameters. Your output should fill in or correct the following fields:
                  if there is no city or country provided then you will automatically optamzie it for example someone says city name not country name then you will add the country automatically same as if some one give country name but not city name then you will pick the famous city of that country autmoatically
                  const params = new URLSearchParams({
                        // ✅ REQUIRED: Job title or keywords
                        // Example: 'senior software engineer'
                        q: "// only give me one optamize job title based on the provided data. dont use and between the job title only give one optamize title i.e: AI Engineer  not like :(AI Engineer and Full-Stack Developer)",

                        // ✅ REQUIRED: Human-readable location
                        // Example: 'New York, NY, USA'
                        location: "",

                        // ✅ REQUIRED: Latitude for geo-based search
                        // Example: '40.7127753'
                        latitude: "",

                        // ✅ REQUIRED: Longitude for geo-based search
                        // Example: '-74.0059728'
                        longitude: "",

                        // ✅ REQUIRED: Search radius in miles
                        // Example: enum:10 | 30 | 50 | 75
                        radius: "",

                        // ✅ REQUIRED: Location precision level
                        // Example: 'City'
                        locationPrecision: "",

                        // ✅ REQUIRED: State or province abbreviation
                        // Example: 'NY'
                        adminDistrictCode: "",

                        // ✅ REQUIRED: Country code (2-letter ISO)
                        // Example: 'US'
                        countryCode: "",

                        // ✅ REQUIRED: Employment types (multiple allowed, joined with '|')
                        // Example: 'FULLTIME|PARTTIME|CONTRACTS|THIRD_PARTY'
                        // Valid options:
                        //   - 'FULLTIME'
                        //   - 'PARTTIME'
                        //   - 'CONTRACTS'
                        //   - 'THIRD_PARTY'
                        "filters.employmentType": "",

                        // ✅ REQUIRED: Posted date filter
                        // Example: 'ONE' (last 24 hours)
                        // Valid options:
                        //   - 'ONE' (1 day)
                        //   - 'THREE' (3 days)
                        //   - 'SEVEN' (7 days)
                        //   - 'THIRTY' (30 days)
                        "filters.postedDate": "",

                        
                        // Example: 'Remote|On-Site|Hybrid'
                        // Valid options:
                        //   - 'Remote'
                        //   - 'On-Site'
                        //   - 'Hybrid'
                        "filters.workplaceTypes": "",
                    });


                  Final Output Format
                  Return your results as a JSON object in the following structure always give response in strict following formate:
                    type EmploymentType = "FULLTIME" | "PARTTIME" | "CONTRACTS" | "THIRD_PARTY";
                    type WorkplaceType = "Remote" | "On-Site" | "Hybrid";

                    interface DiceSearchParamsStrict {
                    jobTitle: string;
                    location: string;
                    latitude: string;
                    longitude: string;
                    radius: string;
                    locationPrecision: "City";
                    adminDistrictCode: string;
                    countryCode: string;
                    employmentTypes: EmploymentType[];
                    postedDate: "ONE" | "THREE" | "SEVEN" | "THIRTY";
                    workplaceTypes: WorkplaceType[];
                    }

                    If the output deviates in any way — including use of single quotes, additional keys, missing keys, different order, or incorrect capitalization — fix it immediately.
                            
          `,
        },
        {
          role: "user",
          content: `
          Here is my job search input data:
          careerProfile : ${careerProfile}
                    forteprofile:${forteprofile}
                    priority:${priority}
                    search params:${searchParams.toString()}
          `,
        },
      ],
      response_format: { type: "json_object" as const },
    });
    const rawResponse = completion.choices[0].message.content;

    if (!rawResponse) {
      throw new Error("Invalid response from OpenAI: rawResponse is null");
    }

    let parsedResponse: DiceSearchParamsStrict;

    try {
      parsedResponse = JSON.parse(rawResponse);

      console.log(parsedResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error("Failed to parse rawResponse: " + errorMessage);
    }

    const jobs = await scrapeDiceJobs(parsedResponse);

    const responseData = {
      success: true,
      data: jobs,
      metadata: {
        totalJobs: jobs.length,
        searchQuery: { parsedResponse },
        scrapedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
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
