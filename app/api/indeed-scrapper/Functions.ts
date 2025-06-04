import puppeteer, { Browser, Page, executablePath } from "puppeteer";

interface JobData {
  title: string;
  company: string;
  jobType: string[];
  description: string;
  location: string;
  applyLink: string;
}

interface ScrapingConfig {
  headless: boolean;
  timeout: number;
  maxJobs: number;
  viewport: { width: number; height: number };
  scrollDelay: number;
  visitDelay: number;
  minDelay: number;
  maxDelay: number;
}

const SCRAPING_CONFIG: ScrapingConfig = {
  headless: false,
  timeout: 60000,
  maxJobs: 30,
  viewport: { width: 1680, height: 1050 },
  scrollDelay: 2000,
  visitDelay: 2000,
  minDelay: 3000, // Minimum delay for human-like pauses (3 seconds)
  maxDelay: 8000, // Maximum delay for human-like pauses (8 seconds)
};

// Utility to generate a random delay between min and max
const randomDelay = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Utility to simulate mouse movements
const simulateMouseMovement = async (page: Page): Promise<void> => {
  const x = Math.floor(Math.random() * SCRAPING_CONFIG.viewport.width);
  const y = Math.floor(Math.random() * SCRAPING_CONFIG.viewport.height);
  await page.mouse.move(x, y, { steps: 10 });
  await new Promise((resolve) => setTimeout(resolve, randomDelay(500, 1500)));
};

const createBrowser = async (): Promise<Browser> => {
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
      "--disable-blink-features=AutomationControlled", // Avoid detection
    ],
    defaultViewport: null,
  });
};

const setupPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  // Use a realistic user-agent
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );

  // Slightly vary the viewport to avoid detection
  const width =
    SCRAPING_CONFIG.viewport.width + Math.floor(Math.random() * 100) - 50;
  const height =
    SCRAPING_CONFIG.viewport.height + Math.floor(Math.random() * 100) - 50;
  await page.setViewport({ width, height });

  // Bypass common headless detection
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };
  });

  return page;
};

const navigateToJobsPage = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: SCRAPING_CONFIG.timeout,
  });
  await page.waitForSelector(
    `body #main #cnt #rcnt #w7tRq #center_col #res #search div #rso div .MjjYud div .iYivne.Ww4FFb.vt6azd div .ZNyqGc div div[data-id="jobs-detail-viewer"] div infinity-scrolling div[jsname="iTtkOe"] `,

    { timeout: 25000 }
  );

  // Simulate human behavior: random mouse movement
  await simulateMouseMovement(page);
};

const wiseScroll = async (page: Page): Promise<number> => {
  await page.waitForSelector(
    `body #main #cnt #rcnt #w7tRq #center_col #res #search div #rso div .MjjYud div .iYivne.Ww4FFb.vt6azd div .ZNyqGc div div[data-id="jobs-detail-viewer"] div infinity-scrolling`,
    { timeout: 15000 }
  );

  let previousJobCount = 0;
  let sameCount = 0;
  const maxSameCount = 5;
  const scrollStep = 500;

  while (sameCount < maxSameCount) {
    const jobCount = await page.evaluate(() => {
      const jobList = document.querySelector(
        `body #main #cnt #rcnt #w7tRq #center_col #res #search div #rso div .MjjYud div .iYivne.Ww4FFb.vt6azd div .ZNyqGc div div[data-id="jobs-detail-viewer"] div infinity-scrolling div[jsname="iTtkOe"] div[data-hveid="CCUQDA"] `
      );
      return jobList ? jobList.querySelectorAll(".EimVGf").length : 0;
    });

    if (jobCount === previousJobCount) {
      sameCount++;
    } else {
      sameCount = 0;
    }

    previousJobCount = jobCount;

    // Simulate human scrolling: sometimes scroll up a bit, then down
    if (Math.random() > 0.7) {
      await page.evaluate((step) => window.scrollBy(0, -step), scrollStep / 2);
      await new Promise((resolve) =>
        setTimeout(resolve, randomDelay(500, 1500))
      );
    }
    await page.evaluate((step) => window.scrollBy(0, step), scrollStep);
    await simulateMouseMovement(page);

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        randomDelay(
          SCRAPING_CONFIG.scrollDelay,
          SCRAPING_CONFIG.scrollDelay + 2000
        )
      )
    );
  }

  console.log(
    `Scrolled job list, loaded ${previousJobCount} jobs on this page`
  );
  return previousJobCount;
};

const extractJobLinks = async (
  page: Page,
  maxJobs: number
): Promise<string[]> => {
  const jobLinks: string[] = [];
  const seenJobIds = new Set<string>();

  while (jobLinks.length < maxJobs) {
    // Scroll to load all jobs on the current page
    await wiseScroll(page);

    // Extract job links from the current page
    const newLinks = await page.evaluate(() => {
      const jobs = Array.from(
        document.querySelectorAll(
          `body #main #cnt #rcnt #w7tRq #center_col #res #search div #rso div .MjjYud div .iYivne.Ww4FFb.vt6azd div .ZNyqGc div div[data-id="jobs-detail-viewer"] div infinity-scrolling div[jsname="iTtkOe"] div[data-hveid="CCUQDA"] `
        )
      );
      return jobs
        .map((div) => {
          const shareUrl = div.getAttribute("data-share-url");
          return shareUrl ? { shareUrl } : null;
        })
        .filter((item): item is { shareUrl: string } => item !== null);
    });

    console.log(`Found ${newLinks.length} new links on page `);

    const getJobIdFromUrl = (url: string): string | null => {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("htidocid");
    };

    for (const { shareUrl } of newLinks) {
      const jobId = getJobIdFromUrl(shareUrl);

      if (jobId && !seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        jobLinks.push(shareUrl);
        console.log(
          `Picked job URL ${jobLinks.length} of ${maxJobs}: ${shareUrl}`
        );

        if (jobLinks.length === maxJobs) {
          console.log(
            `Reached maxJobs (${maxJobs}), stopping link collection.`
          );
          break;
        }
      }
    }

    if (jobLinks.length === maxJobs) {
      break;
    }

    // Simulate human clicking
    await simulateMouseMovement(page);
    await page.waitForFunction(
      () =>
        document.querySelectorAll(
          "#__next .bg-page-bg main .MuiContainer-root .MuiBox-root.css-k008qs section article"
        ).length > 0,
      { timeout: 15000 }
    );
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
      )
    );
  }

  console.log(`Collected ${jobLinks.length} apply links.`);

  // Fix URLs: Prepend the base URL if necessary
  return jobLinks
    .map((link) =>`${link}`
    )
    .slice(0, maxJobs);
};

const extractJobDetails = async (
  page: Page,
  applyLink: string
): Promise<JobData | null> => {
  try {
    // Navigate to the job detail page with a human-like delay
    await page.goto(applyLink, {
      waitUntil: "domcontentloaded",
      timeout: SCRAPING_CONFIG.timeout,
    });
    await page.waitForSelector(
      "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root",
      { timeout: 15000 }
    );

    // Simulate human behavior on the job detail page
    await simulateMouseMovement(page);
    await page.evaluate(() => window.scrollBy(0, 500)); // Scroll a bit
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
      )
    );

    const jobDetails = await page.evaluate(() => {
      const titleElement = document.querySelector(
        "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root .MuiPaper-root h1.MuiTypography-h2"
      );
      const companyElement = document.querySelector(
        "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root .MuiPaper-root .max-xs\\:flex-col-reverse .decoration-none .max-xs\\:items-start h2.MuiTypography-body2"
      );

      // Extract job type (first div)
      const jobTypeContainer = document.querySelector(
        "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root header .max-xs\\:flex-col-reverse.max-xs\\:flex-nowrap div.row.flex:nth-child(1) p.MuiTypography-root"
      );
      let jobType = jobTypeContainer?.textContent?.trim() || "";
      // Normalize job type to match expected values: "On-site" -> "onsite"
      jobType = jobType.toLowerCase().replace("on-site", "onsite");

      // Extract location (fifth div)
      const locationContainer = document.querySelector(
        "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root header .max-xs\\:flex-col-reverse.max-xs\\:flex-nowrap div.row.flex:nth-child(5) p.MuiTypography-root"
      );
      const location = locationContainer?.textContent?.trim() || "";

      const descriptionElement = document.querySelector(
        "#__next .bg-page-bg main .MuiContainer-root .MuiPaper-root .relative.z-\\[1\\] .mb-2 .MuiTypography-body1"
      );

      return {
        title: titleElement?.textContent?.trim() || "",
        company: companyElement?.textContent?.trim() || "",
        jobType: jobType ? [jobType] : [], // Convert to array
        description: descriptionElement?.innerHTML || "",
        location: location,
      };
    });

    // Add applyLink to the job details after evaluation
    const finalJobDetails = {
      ...jobDetails,
      applyLink: applyLink,
    };

    // Add a random delay before leaving the page
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        randomDelay(
          SCRAPING_CONFIG.visitDelay,
          SCRAPING_CONFIG.visitDelay + 3000
        )
      )
    );
    return finalJobDetails;
  } catch (error) {
    console.error(`Error extracting details for ${applyLink}:`, error);
    return null;
  }
};

export const scrapeNployJobs = async (): Promise<JobData[]> => {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await setupPage(browser);

    const url =
      "https://www.google.com/search?q=indeed+jobs+last+3+days&ibp=htl;jobs";
    await navigateToJobsPage(page, url);

    const jobLinks = await extractJobLinks(page, SCRAPING_CONFIG.maxJobs);
    console.log(`Starting to visit ${jobLinks.length} collected links.`);
    const allJobs: JobData[] = [];

    for (const link of jobLinks) {
      console.log(`Visiting ${link}`);
      const jobDetails = await extractJobDetails(page, link);
      if (jobDetails) allJobs.push(jobDetails);
      // Add a longer random delay between visits to avoid rate limiting
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
        )
      );
    }

    return allJobs;
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape Nploy jobs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) await browser.close();
  }
};
