// // app/api/scrape-jobs/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import puppeteer, { Browser, Page } from "puppeteer";

import { NextResponse } from "next/server";

// interface JobData {
//   title: string;
//   company: string;
//   jobType: string[];
//   description: string;
//   location: string;
//   applyLink: string;
// }

// interface ScrapeJobsRequest {
//   maxJobs?: number;
//   headless?: boolean;
// }

// class HumanLikeIndeedScraper {
//   private browser: Browser | null = null;
//   private page: Page | null = null;

//   async initialize(headless: boolean = true): Promise<void> {
//     try {
//       this.browser = await puppeteer.launch({
//         headless,
//         args: [
//           "--no-sandbox",
//           "--disable-setuid-sandbox",
//           "--disable-dev-shm-usage",
//           "--disable-accelerated-2d-canvas",
//           "--no-first-run",
//           "--no-zygote",
//           "--disable-gpu",
//           "--disable-blink-features=AutomationControlled",
//           "--disable-features=VizDisplayCompositor",
//           "--disable-extensions",
//           "--disable-plugins",
//           "--disable-images",
//           "--window-size=1366,768",
//           "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//           "--accept-lang=en-US,en;q=0.9",
//           "--disable-background-timer-throttling",
//           "--disable-backgrounding-occluded-windows",
//           "--disable-renderer-backgrounding",
//         ],
//         defaultViewport: null,
//         ignoreDefaultArgs: ["--enable-automation"],
//       });

//       this.page = await this.browser.newPage();

//       await this.page.evaluateOnNewDocument(() => {
//         Object.defineProperty(navigator, "webdriver", {
//           get: () => undefined,
//         });

//         Object.defineProperty(navigator, "plugins", {
//           get: () => [1, 2, 3, 4, 5],
//         });

//         Object.defineProperty(navigator, "languages", {
//           get: () => ["en-US", "en"],
//         });

//         window.chrome = {
//           runtime: {},
//         };

//         Object.defineProperty(navigator, "permissions", {
//           get: () => ({
//             query: () => Promise.resolve({ state: "granted" }),
//           }),
//         });
//       });

//       const userAgents = [
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
//         "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
//         "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
//       ];

//       const randomUserAgent =
//         userAgents[Math.floor(Math.random() * userAgents.length)];
//       await this.page.setUserAgent(randomUserAgent);

//       await this.page.setViewport({
//         width: 1366 + Math.floor(Math.random() * 100),
//         height: 768 + Math.floor(Math.random() * 100),
//       });

//       await this.page.setExtraHTTPHeaders({
//         Accept:
//           "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
//         "Accept-Language": "en-US,en;q=0.9",
//         "Accept-Encoding": "gzip, deflate, br",
//         DNT: "1",
//         Connection: "keep-alive",
//         "Upgrade-Insecure-Requests": "1",
//       });
//     } catch (error) {
//       throw new Error(`Browser initialization failed: ${error}`);
//     }
//   }

//   private async humanDelay(
//     min: number = 1000,
//     max: number = 3000
//   ): Promise<void> {
//     const delay = Math.floor(Math.random() * (max - min + 1)) + min;
//     await new Promise((resolve) => setTimeout(resolve, delay));
//   }

//   private async humanMouseMovement(): Promise<void> {
//     if (!this.page) return;

//     const viewport = this.page.viewport();
//     if (!viewport) return;

//     // More realistic mouse movements - slower and more natural
//     for (let i = 0; i < Math.floor(Math.random() * 3) + 2; i++) {
//       const x = Math.floor(Math.random() * viewport.width);
//       const y = Math.floor(Math.random() * viewport.height);

//       // Slower, more human-like mouse movement
//       await this.page.mouse.move(x, y, {
//         steps: Math.floor(Math.random() * 15) + 10,
//       });
//       await this.humanDelay(200, 800);

//       // Occasionally pause like a human would
//       if (Math.random() > 0.8) {
//         await this.humanDelay(500, 1200);
//       }
//     }
//   }

//   private async humanScroll(): Promise<void> {
//     if (!this.page) return;

//     const scrolls = Math.floor(Math.random() * 3) + 1;

//     for (let i = 0; i < scrolls; i++) {
//       const scrollDistance = Math.floor(Math.random() * 500) + 200;

//       await this.page.evaluate((distance) => {
//         window.scrollBy(0, distance);
//       }, scrollDistance);

//       await this.humanDelay(500, 1500);
//     }
//   }

//   private async simulateHumanBehavior(): Promise<void> {
//     await Promise.all([this.humanMouseMovement(), this.humanDelay(300, 800)]);

//     // More frequent human-like actions
//     if (Math.random() > 0.5) {
//       await this.humanScroll();
//     }

//     // Simulate reading pauses
//     if (Math.random() > 0.7) {
//       await this.humanDelay(500, 1500);
//     }
//   }

//   async scrapeJobUrls(maxJobs: number = 20): Promise<string[]> {
//     if (!this.page) throw new Error("Page not initialized");

//     const targetUrl =
//       "https://www.google.com/search?q=indeed+jobs+last+3+days&udm=8&jbr=sep:0&sei=6Ow_aK2-I6vi7M8Pu_-K4Ag#vhid=vt%3D20/docid%3DwNBR55SS8bTX40x5AAAAAA%3D%3D&vssid=jobs-detail-viewer";

//     try {
//       console.log("Navigating to Google Jobs...");

//       await this.page.goto("https://www.google.com", {
//         waitUntil: "networkidle2",
//         timeout: 30000,
//       });

//       await this.simulateHumanBehavior();
//       await this.humanDelay(6000, 8000);

//       await this.page.goto(targetUrl, {
//         waitUntil: "networkidle2",
//         timeout: 30000,
//       });

//       await this.simulateHumanBehavior();

//       console.log("Waiting for job results to load...");
//       await this.page.waitForSelector('div[data-id="jobs-detail-viewer"]', {
//         timeout: 20000,
//       });

//       const jobUrls: string[] = [];
//       let previousJobCount = 0;
//       let scrollAttempts = 0;
//       const maxScrollAttempts = 8;

//       while (jobUrls.length < maxJobs && scrollAttempts < maxScrollAttempts) {
//         await this.simulateHumanBehavior();

//         const currentUrls = await this.page.evaluate(() => {
//           // Primary selector: Look for job links in the specific DOM structure
//           let jobElements = document.querySelectorAll(
//             'div[jsname="iTtkOe"] div[data-hveid="CCUQDA"] .EimVGf .L5NwLd div div div a'
//           );

//           // Fallback selectors if primary doesn't work
//           if (jobElements.length === 0) {
//             jobElements = document.querySelectorAll(
//               'div[jsname="iTtkOe"] div[data-hveid] .EimVGf .L5NwLd a'
//             );
//           }

//           if (jobElements.length === 0) {
//             jobElements = document.querySelectorAll(
//               'div[jsname="iTtkOe"] a[href*="indeed.com"]'
//             );
//           }

//           console.log(`Found ${jobElements.length} job link elements`);

//           return Array.from(jobElements)
//             .map((element) => {
//               const href = element.getAttribute("href");
//               if (!href) return null;

//               // Handle Google redirect URLs
//               if (href.startsWith("/url?q=")) {
//                 try {
//                   const urlParams = new URLSearchParams(href.substring(6));
//                   const actualUrl = urlParams.get("q");
//                   return actualUrl ? decodeURIComponent(actualUrl) : null;
//                 } catch (e) {
//                   console.error("Error parsing redirect URL:", href);
//                   return null;
//                 }
//               }

//               // Handle direct URLs
//               if (href.startsWith("http")) {
//                 return href;
//               }

//               // Handle relative URLs
//               return `https://www.google.com${href}`;
//             })
//             .filter(Boolean) as string[];
//         });

//         console.log(`Extracted ${currentUrls.length} job URLs in this batch`);

//         currentUrls.forEach((url) => {
//           if (!jobUrls.includes(url) && jobUrls.length < maxJobs) {
//             jobUrls.push(url);
//           }
//         });

//         console.log(`Found ${jobUrls.length} job URLs so far...`);

//         if (jobUrls.length === previousJobCount) {
//           scrollAttempts++;
//         } else {
//           scrollAttempts = 0;
//           previousJobCount = jobUrls.length;
//         }

//         await this.page.evaluate(() => {
//           const infinityScrolling =
//             document.querySelector("infinity-scrolling");
//           if (infinityScrolling) {
//             infinityScrolling.scrollIntoView({
//               behavior: "smooth",
//               block: "end",
//             });
//           } else {
//             window.scrollBy(0, window.innerHeight * 0.8);
//           }
//         });

//         await this.humanDelay(2000, 4000);

//         if (Math.random() > 0.8) {
//           await this.simulateHumanBehavior();
//         }
//       }

//       console.log(`Successfully collected ${jobUrls.length} job URLs`);
//       return jobUrls.slice(0, maxJobs);
//     } catch (error) {
//       throw new Error(`Failed to scrape job URLs: ${error}`);
//     }
//   }

//   async scrapeJobDetails(jobUrl: string): Promise<JobData | null> {
//     if (!this.page || (await this.page.isClosed())) {
//       throw new Error("Page is not initialized or has been closed");
//     }

//     try {
//       console.log(`   🌐 Navigating to job page...`);
//       await this.humanDelay(800, 2000);

//       // Try-catch for navigation to handle potential frame detachment
//       try {
//         await this.page.goto(jobUrl, {
//           waitUntil: "networkidle0",
//           timeout: 60000, // Increased timeout
//         });
//       } catch (navError) {
//         console.error(`Navigation failed for ${jobUrl}:`, navError);
//         // Retry once with a different wait condition
//         await this.page.goto(jobUrl, { waitUntil: "load", timeout: 60000 });
//       }

//       console.log(`   ⏳ Waiting for page to fully load...`);
//       await this.page.waitForFunction(
//         () => document.readyState === "complete",
//         {
//           timeout: 15000,
//         }
//       );

//       await this.page.waitForTimeout(2000);
//       console.log(`   ⏱️  Waiting exactly 5 seconds for full page render...`);
//       await new Promise((resolve) => setTimeout(resolve, 5000));

//       console.log(`   🤖 Simulating human reading behavior...`);
//       await this.simulateHumanBehavior();
//       await this.humanDelay(1000, 2500);

//       console.log(`   📊 Starting data extraction...`);
//       const jobData = await this.page.evaluate(() => {
//         // ... (existing evaluate logic) ...
//       });

//       if (jobData?.title && jobData?.company) {
//         console.log(
//           `✓ Successfully scraped: ${jobData.title} at ${jobData.company}`
//         );
//         return jobData;
//       }
//       return null;
//     } catch (error) {
//       console.error(`Failed to scrape job details for ${jobUrl}:`, error);
//       return null;
//     }
//   }

//   async scrapeAllJobs(maxJobs: number = 20): Promise<JobData[]> {
//     try {
//       console.log(`Starting to scrape ${maxJobs} jobs...`);

//       // Step 1: Collect ALL job URLs first
//       console.log("📋 Step 1: Collecting all job URLs...");
//       const jobUrls = await this.scrapeJobUrls(maxJobs);
//       console.log(`✓ Collected ${jobUrls.length} job URLs total`);

//       // Step 2: Visit each URL and scrape details
//       console.log("🔍 Step 2: Visiting each job URL to scrape details...");
//       const jobsData: JobData[] = [];

//       for (let i = 0; i < jobUrls.length; i++) {
//         const url = jobUrls[i];
//         console.log(
//           `\n📄 Processing job ${i + 1}/${jobUrls.length}: ${url.substring(
//             0,
//             80
//           )}...`
//         );

//         try {
//           const jobData = await this.scrapeJobDetails(url);
//           if (jobData && jobData.title && jobData.company) {
//             jobsData.push(jobData);
//             console.log(`✅ Success: "${jobData.title}" at ${jobData.company}`);
//           } else {
//             console.log(`❌ Failed to extract complete job data`);
//           }

//           // Human-like delay between each job visit (3-8 seconds)
//           const delayTime = Math.floor(Math.random() * 5000) + 3000;
//           console.log(`⏱️  Waiting ${delayTime / 1000}s before next job...`);
//           await this.humanDelay(delayTime, delayTime);

//           // Random additional human behavior (40% chance)
//           if (Math.random() > 0.6) {
//             console.log("🤖 Simulating human behavior...");
//             await this.simulateHumanBehavior();
//           }
//         } catch (error) {
//           console.error(`❌ Failed to scrape job at ${url}:`, error);
//           continue;
//         }
//       }

//       console.log(
//         `\n🎉 Successfully scraped ${jobsData.length} complete job records`
//       );
//       return jobsData;
//     } catch (error) {
//       throw new Error(`Failed to scrape jobs: ${error}`);
//     }
//   }

//   async cleanup(): Promise<void> {
//     try {
//       if (this.page) {
//         await this.page.close();
//         this.page = null;
//       }
//       if (this.browser) {
//         await this.browser.close();
//         this.browser = null;
//       }
//     } catch (error) {
//       console.error("Cleanup error:", error);
//     }
//   }
// }

// export async function POST(request: NextRequest): Promise<NextResponse> {
//   const scraper = new HumanLikeIndeedScraper();

//   try {
//     const maxJobs = 20;
//     const headless = false;

//     if (maxJobs < 1 || maxJobs > 50) {
//       return NextResponse.json(
//         { error: "maxJobs must be between 1 and 50 for stability" },
//         { status: 400 }
//       );
//     }

//     console.log(`🚀 Starting human-like scraping for ${maxJobs} jobs...`);

//     await scraper.initialize(headless);
//     const jobsData = await scraper.scrapeAllJobs(maxJobs);

//     return NextResponse.json({
//       success: true,
//       data: jobsData,
//       totalJobs: jobsData.length,
//       message: `Successfully scraped ${jobsData.length} jobs using human-like behavior`,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     console.error("❌ Scraping error:", error);
//     return NextResponse.json(
//       {
//         error: "Failed to scrape jobs",
//         message: error instanceof Error ? error.message : "Unknown error",
//         timestamp: new Date().toISOString(),
//       },
//       { status: 500 }
//     );
//   } finally {
//     await scraper.cleanup();
//   }
// }

export async function GET() {
  return NextResponse.json({
    message: "Human-Like Indeed Job Scraper API",
    version: "2.0",
    features: [
      "Anti-CAPTCHA human behavior simulation",
      "Random delays and mouse movements",
      "Multiple fallback selectors",
      "Stealth mode browsing",
    ],
    endpoints: {
      POST: "/api/scrape-jobs",
      description: "Scrape Indeed jobs with human-like behavior",
      parameters: {
        maxJobs: "number (1-50, default: 20)",
        headless: "boolean (default: true)",
      },
    },
  });
}
