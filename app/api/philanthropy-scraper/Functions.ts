import puppeteer, { Browser, Page, executablePath } from "puppeteer";

interface JobData {
  title: string;
  company: string;
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

export interface QueryParams {
  Keywords?: string | string[]; // Keyword for job search (e.g., "job", "engineer", multiple keywords allowed)
  radialtown?: string; // Town or region (e.g., "United States")
  LocationId?: string; // Location ID (e.g., "200")
  RadialLocation?: string; // Radius for location search (e.g., "100")
  CountryCode?: string; // Country code (e.g., "", or "US")
  EmploymentType?: string | string[]; // Employment type (e.g., "67" for full-time, "68" for part-time)
}

const SCRAPING_CONFIG: ScrapingConfig = {
  headless: false,
  timeout: 60000,
  maxJobs: 5, // Limiting to 10 jobs for this example
  viewport: { width: 1280, height: 800 },
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
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
  );
  const width =
    SCRAPING_CONFIG.viewport.width + Math.floor(Math.random() * 100) - 50;
  const height =
    SCRAPING_CONFIG.viewport.height + Math.floor(Math.random() * 100) - 50;
  await page.setViewport({ width, height });
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    window.chrome = {
      runtime: {},
      loadTimes: () => {},
      csi: () => {},
      app: {},
    };
  });
  return page;
};

// Utility to construct the URL with query parameters
const constructUrl = (baseUrl: string, params: QueryParams): string => {
  const url = new URL(baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((val) => url.searchParams.append(key, val));
      } else {
        url.searchParams.set(key, value);
      }
    }
  });
  return url.toString();
};

const navigateToJobsPage = async (page: Page, url: string): Promise<void> => {
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: SCRAPING_CONFIG.timeout,
  });
  await page.waitForFunction(
    () =>
      document.querySelector(
        ".search-jobs .container.js-container #main .wrapper .grid .grid-item.seven-twelfths.lap-seven-twelfths.palm-one-whole #listing"
      ) !== null,
    { timeout: 30000 } // Increased timeout to 30 seconds
  );
  await simulateMouseMovement(page);

  // Handle dynamic loading with scrolling
  let previousHeight;
  do {
    previousHeight = await page.evaluate("document.body.scrollHeight");
    await page.evaluate("window.scrollBy(0, 500)");
    await new Promise((resolve) =>
      setTimeout(resolve, SCRAPING_CONFIG.scrollDelay)
    );
  } while (
    ((await page.evaluate("document.body.scrollHeight")) as number) >
    previousHeight
  );

  await page.screenshot({ path: "jobs-page.png" }); // Debug screenshot
};

const extractJobLinks = async (
  page: Page,
  maxJobs: number
): Promise<string[]> => {
  const jobLinks: string[] = [];
  const seenJobIds = new Set<string>();
  let pageNumber = 1;

  while (jobLinks.length < maxJobs) {
    await page.waitForSelector(
      ".search-jobs .container.js-container #main .wrapper .grid .grid-item.seven-twelfths.lap-seven-twelfths.palm-one-whole #listing",
      { timeout: 30000 }
    );

    const newLinks = await page.evaluate(() => {
      const jobs = Array.from(
        document.querySelectorAll(
          "#listing li.lister__item .lister__details.js-clickable .lister__header a"
        )
      );
      return jobs
        .map((job) => ({
          href: job.getAttribute("href"),
        }))
        .filter((item): item is { href: string } => item.href !== null);
    });

    console.log(`Found ${newLinks.length} new links on page ${pageNumber}`);

    for (const { href } of newLinks) {
      // Extract jobId from href, ignoring query params (e.g., /job/48965/chief-executive-officer/?LinkSource=PremiumListing)
      let jobId = "";
      if (href) {
        // Remove query params
        const path = href.split("?")[0];
        // Split by '/' and get the numeric ID after '/job/'
        const match = path.match(/\/job\/(\d+)/);
        if (match && match[1]) {
          jobId = match[1];
        }
      }
      if (jobId && !seenJobIds.has(jobId)) {
        seenJobIds.add(jobId);
        jobLinks.push(href);
        console.log(`Picked job URL ${jobLinks.length} of ${maxJobs}: ${href}`);
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

    // Navigate to next page (second-to-last li with title="Next page" rel="next")
    const nextPageLi = await page.$$(".paginator__items .paginator__item");
    if (nextPageLi.length > 1) {
      const secondToLastLi = nextPageLi[nextPageLi.length - 2];
      const nextPageLink = await secondToLastLi.$(
        "a[title='Next page'][rel='next']"
      );
      if (nextPageLink) {
        await simulateMouseMovement(page);
        await nextPageLink.click();
        await page.waitForFunction(
          () =>
            document.querySelectorAll(
              ".search-jobs .container.js-container #main .wrapper .grid .grid-item.seven-twelfths.lap-seven-twelfths.palm-one-whole #listing li"
            ).length > 0,
          { timeout: 30000 }
        );
        pageNumber++;
        console.log(`Navigated to page ${pageNumber}`);
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            randomDelay(SCRAPING_CONFIG.minDelay, SCRAPING_CONFIG.maxDelay)
          )
        );
      } else {
        console.log("No 'Next page' link found, stopping pagination.");
        break;
      }
    } else {
      console.log("Insufficient pagination items, stopping pagination.");
      break;
    }
  }

  console.log(`Collected ${jobLinks.length} apply links.`);
  return jobLinks.slice(0, maxJobs);
};

const extractJobDetails = async (
  page: Page,
  applyLink: string
): Promise<JobData | null> => {
  try {
    await page.goto(`https://jobs.philanthropy.com${applyLink}`, {
      waitUntil: "domcontentloaded",
      timeout: SCRAPING_CONFIG.timeout,
    });
    await page.waitForSelector(".job-details__social-share", {
      timeout: 15000,
    });

    const jobDetails = await page.evaluate(() => {
      const titleElement = document.querySelector(
        "body #site-container #main .mds-wrapper .mds-grid-row .mds-grid-col-12.mds-grid-col-lg-8.mds-grid-col-xl-9 .mds-surface.mds-margin-bottom-b5 .mds-surface__inner.mds-border-bottom   h1"
      );
      const extractingCompanyName = document.querySelector(
        "body #site-container #main .mds-wrapper .mds-grid-row .mds-grid-col-12.mds-grid-col-lg-8.mds-grid-col-xl-9 .mds-surface.mds-margin-bottom-b5 .mds-surface__inner.mds-border-bottom  .mds-grid-row .mds-grid-col-12 dl "
      );
      const companyElement =
        extractingCompanyName &&
        extractingCompanyName.children &&
        extractingCompanyName.children.length > 1
          ? extractingCompanyName.children[1]
          : null;

      const locationElement =
        extractingCompanyName &&
        extractingCompanyName.children &&
        extractingCompanyName.children.length > 1
          ? extractingCompanyName.children[3]
          : null;

      const descriptionElement = document.querySelector(
        "body #site-container #main .mds-wrapper .mds-grid-row .mds-grid-col-12.mds-grid-col-lg-8.mds-grid-col-xl-9 .mds-surface.mds-margin-bottom-b5 .mds-surface__inner .mds-prose "
      );

      return {
        title: titleElement?.textContent?.trim() || "",
        company: companyElement?.textContent?.trim() || "",
        jobType: ["On-Site"],
        description: descriptionElement?.innerHTML || "",
        location: locationElement?.textContent?.trim() || "",
        applyLink: window.location.href,
      };
    });

    await new Promise((resolve) =>
      setTimeout(
        resolve,
        randomDelay(
          SCRAPING_CONFIG.visitDelay,
          SCRAPING_CONFIG.visitDelay + 3000
        )
      )
    );
    return jobDetails;
  } catch (error) {
    console.error(`Error extracting details for ${applyLink}:`, error);
    return null;
  }
};

export const scrapePhilanthropyJobs = async (
  params: QueryParams = {}
): Promise<JobData[]> => {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await setupPage(browser);

    const baseUrl = "https://jobs.philanthropy.com/searchjobs/";
    const url = constructUrl(baseUrl, params);
    console.log(`Navigating to URL: ${url}`);
    await navigateToJobsPage(page, url);

    const jobLinks = await extractJobLinks(page, SCRAPING_CONFIG.maxJobs);
    console.log(`Starting to visit ${jobLinks.length} collected links.`);
    const allJobs: JobData[] = [];

    for (const link of jobLinks) {
      console.log(`Visiting ${link.trim()}`);
      const jobDetails = await extractJobDetails(page, link.trim());
      if (jobDetails) allJobs.push(jobDetails);
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
      `Failed to scrape Philanthropy jobs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) await browser.close();
  }
};
