import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, Page, executablePath } from "puppeteer";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { OpenAI } from "openai";
import { connectMongoDB } from "../lib/dbConnection";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});
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

export interface QueryParams {
  category?: string;
}

const SCRAPING_CONFIG: ScrapingConfig = {
  headless: false,
  timeout: 60000,
  maxJobs: 10, // Limiting to 10 jobs for this example
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
      loadTimes: function () {},
      csi: function () {},
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
  await page.waitForSelector(
    "#eut-theme-wrapper #eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .post-3339 .eut-container h3 .wpjb-job-list",
    { timeout: 30000 }
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
    // @ts-ignore
    (await page.evaluate("document.body.scrollHeight")) > previousHeight
  );

  await page.screenshot({ path: "jobs-page.png" }); // Debug screenshot
};

const extractJobLinks = async (
  page: Page,
  maxJobs: number
): Promise<string[]> => {
  const jobLinks: string[] = [];
  const seenLinks = new Set<string>(); // Track full links instead of just IDs
  let pageNumber = 1;

  while (jobLinks.length < maxJobs) {
    await page.waitForSelector(
      "#eut-theme-wrapper #eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .post-3339 .eut-container h3 .wpjb-job-list",
      { timeout: 30000 }
    );

    const newLinks = await page.evaluate(() => {
      const jobs = Array.from(
        document.querySelectorAll(
          ".wpjb-job-list .wpjb-grid-row .wpjb-grid-col.wpjb-col-main.wpjb-col-title .wpjb-line-major a"
        )
      );
      return jobs
        .map((job) => ({
          href: job.getAttribute("href"),
        }))
        .filter((item): item is { href: string } => item.href !== null);
    });

    console.log(`Found ${newLinks.length} new links on page ${pageNumber}`);
    console.log("Links found:", newLinks); // Debug log to inspect hrefs

    for (const { href } of newLinks) {
      // Normalize href to full URL if relative
      const fullLink = href.startsWith("http")
        ? href
        : new URL(href, "https://www.foundationlist.org").toString();
      if (!seenLinks.has(fullLink)) {
        seenLinks.add(fullLink);
        jobLinks.push(fullLink);
        console.log(
          `Picked job URL ${jobLinks.length} of ${maxJobs}: ${fullLink}`
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

    // Navigate to next page (a tag with class "next page-numbers")
    const nextPageLink = await page.$(
      ".wpjb-paginate-links a.next.page-numbers"
    ); // Simplified selector
    if (nextPageLink) {
      await simulateMouseMovement(page);
      await nextPageLink.click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            "#eut-theme-wrapper #eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .post-3339 .eut-container h3 .wpjb-job-list .wpjb-grid-row"
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
      console.log("No 'next page' link found, stopping pagination.");
      await page.screenshot({ path: "pagination-page.png" }); // Debug screenshot
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
    await page.goto(applyLink, {
      waitUntil: "domcontentloaded",
      timeout: SCRAPING_CONFIG.timeout,
    });
    await page.waitForSelector(
      "#eut-theme-content #eut-post-title .eut-wrapper .eut-content.eut-align-center-center .eut-container .eut-title-content-wrapper h1",
      { timeout: 15000 }
    );
    await page.waitForSelector(
      "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-text-box .wpjb-text",
      { timeout: 15000 }
    );
    await page.waitForSelector(
      "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-grid.wpjb-grid-closed-top .wpjb-grid-row.wpjb-row-meta-_location .wpjb-grid-col.wpjb-col-60",
      { timeout: 15000 }
    );
    await page.waitForSelector(
      "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-grid.wpjb-grid-closed-top .wpjb-grid-row.wpjb-row-meta-_tag_type .wpjb-grid-col.wpjb-col-60",
      { timeout: 15000 }
    );

    const jobDetails = await page.evaluate(() => {
      const titleElement = document.querySelector(
        "#eut-theme-content #eut-post-title .eut-wrapper .eut-content.eut-align-center-center .eut-container .eut-title-content-wrapper h1"
      );
      const companyElement = document.querySelector(
        "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single div .wpjb-top-header  .wpjb-top-header-content div .wpjb-top-header-title"
      );
      const descriptionElement = document.querySelector(
        "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-text-box .wpjb-text"
      );
      const locationElement = document.querySelector(
        "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-grid.wpjb-grid-closed-top .wpjb-grid-row.wpjb-row-meta-_location .wpjb-grid-col.wpjb-col-60"
      );
      const jobTypeElement = document.querySelector(
        "#eut-theme-content .eut-single-wrapper #eut-content .eut-content-wrapper #eut-main-content .eut-main-content-wrapper .eut-single-post .wpjb.wpjb-job.wpjb-page-single .wpjb-grid.wpjb-grid-closed-top .wpjb-grid-row.wpjb-row-meta-_tag_type .wpjb-grid-col.wpjb-col-60"
      );

      return {
        title: titleElement?.textContent?.trim() || "",
        company: companyElement?.textContent?.trim() || "",
        jobType: jobTypeElement?.textContent?.trim()
          ? [jobTypeElement.textContent.trim()]
          : [],
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

export const scrapeFoundationListJobs = async (
  params: QueryParams = {}
): Promise<JobData[]> => {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await setupPage(browser);

    const baseUrl = "https://www.foundationlist.org/jobs/advanced-search/";
    const url = constructUrl(baseUrl, params);
    console.log(`Navigating to URL: ${url}`);
    await navigateToJobsPage(page, url);

    const jobLinks = await extractJobLinks(page, SCRAPING_CONFIG.maxJobs);
    console.log(`Starting to visit ${jobLinks.length} collected links.`);
    const allJobs: JobData[] = [];

    for (const link of jobLinks) {
      console.log(`Visiting ${link}`);
      const jobDetails = await extractJobDetails(page, link);
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
      `Failed to scrape Foundation List jobs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) await browser.close();
  }
};

export const categoryOptions = [
  { value: "64", label: "Accounting" },
  { value: "12", label: "Administration (Leadership)" },
  { value: "13", label: "Administrative / Support" },
  { value: "82", label: "Admissions / Enrollment" },
  { value: "87", label: "Advancement" },
  { value: "89", label: "Advising" },
  { value: "14", label: "Advocacy" },
  { value: "95", label: "Animal Welfare" },
  { value: "55", label: "Arts" },
  { value: "74", label: "Auditing" },
  { value: "137", label: "Behavioral & Mental Health" },
  { value: "135", label: "Biotechnology" },
  { value: "103", label: "Bookkeeping" },
  { value: "15", label: "Business Development" },
  { value: "57", label: "Campaigns" },
  { value: "67", label: "Case Management" },
  { value: "50", label: "Communications" },
  { value: "16", label: "Community Relations / Outreach" },
  { value: "76", label: "Conservation" },
  { value: "17", label: "Consulting" },
  { value: "106", label: "Contracts" },
  { value: "60", label: "Counseling" },
  { value: "56", label: "Creative / Design" },
  { value: "80", label: "Customer Service / Technical Service" },
  { value: "19", label: "Database / Data Analysis" },
  { value: "47", label: "Development / Fundraising" },
  { value: "145", label: "Disaster Relief & Emergency Services" },
  { value: "90", label: "Diversity, Equity, Inclusion" },
  { value: "72", label: "Driving / Labor" },
  { value: "46", label: "Education" },
  { value: "152", label: "Education: Academic Affairs & Curriculum" },
  { value: "93", label: "Education: Administration & Operations" },
  { value: "154", label: "Education: Admissions & Enrollment Management" },
  { value: "156", label: "Education: Career Services & Experiential Learning" },
  { value: "157", label: "Education: Continuing & Adult Education" },
  { value: "88", label: "Education: Faculty" },
  { value: "155", label: "Education: Financial Aid & Scholarships" },
  { value: "159", label: "Education: Governance" },
  { value: "160", label: "Education: Instructional Support & Technology" },
  { value: "151", label: "Education: K-12" },
  { value: "118", label: "Education: Leadership" },
  { value: "158", label: "Education: Policy & Advocacy" },
  { value: "161", label: "Education: Specialized & Alternative Education" },
  { value: "153", label: "Education: Student Affairs & Campus Life" },
  { value: "68", label: "Engineering / Architecture" },
  { value: "48", label: "Environmental / Sustainability" },
  { value: "22", label: "Events" },
  {
    value: "23",
    label: "Executive Leadership (CEO, E.D., VP, COO, CFO, CHRO)",
  },
  { value: "71", label: "Facilities" },
  { value: "24", label: "Finance" },
  { value: "25", label: "Foundation Relations / Engagement" },
  { value: "83", label: "Government" },
  { value: "107", label: "Grant Administration" },
  { value: "75", label: "Grant Management / Coordination" },
  { value: "28", label: "Grant Writing" },
  { value: "27", label: "Grantmaking" },
  { value: "78", label: "Healthcare Provider / Practitioner" },
  { value: "127", label: "Healthcare/Medical Administration" },
  { value: "128", label: "Healthcare/Medical Leadership" },
  { value: "126", label: "Healthcare/Medical: Allied" },
  { value: "124", label: "Healthcare/Medical: Billing, Coding & Collections" },
  { value: "130", label: "Healthcare/Medical: Finance" },
  {
    value: "132",
    label:
      "Healthcare/Medical: Health Information Technology (HIT) & Informatics",
  },
  { value: "134", label: "Healthcare/Medical: Home Health & Hospice" },
  { value: "136", label: "Healthcare/Medical: Laboratory & Diagnostics" },
  {
    value: "133",
    label: "Healthcare/Medical: Medical Equipment & Device Management",
  },
  { value: "123", label: "Healthcare/Medical: Nursing" },
  { value: "92", label: "Healthcare/Medical: Other" },
  { value: "125", label: "Healthcare/Medical: Patient Support" },
  { value: "138", label: "Healthcare/Medical: Pharmacy" },
  { value: "129", label: "Healthcare/Medical: Physicians" },
  { value: "139", label: "Healthcare/Medical: Rehabilitation & Therapy" },
  { value: "131", label: "Healthcare/Medical: Revenue Cycle" },
  { value: "111", label: "Helpdesk" },
  { value: "81", label: "Housing" },
  { value: "30", label: "Human Resources" },
  { value: "94", label: "Human Services" },
  { value: "31", label: "Information Technology" },
  { value: "142", label: "Information Technology (IT)" },
  { value: "91", label: "International" },
  { value: "114", label: "International Development" },
  { value: "49", label: "Investments/Asset Management" },
  { value: "61", label: "Labor" },
  { value: "52", label: "Legal" },
  { value: "101", label: "Legal Support" },
  { value: "100", label: "Library / Librarian" },
  { value: "109", label: "Lobbying" },
  { value: "162", label: "Logistics" },
  { value: "163", label: "Maintenance" },
  { value: "69", label: "Major Gifts" },
  { value: "85", label: "Manufacturing" },
  { value: "33", label: "Marketing" },
  { value: "54", label: "Membership" },
  { value: "99", label: "Museum" },
  { value: "34", label: "Operations" },
  { value: "66", label: "Organizing" },
  { value: "62", label: "Partnerships" },
  { value: "104", label: "Pastor / Spiritual Leader" },
  { value: "84", label: "Philanthropy" },
  { value: "65", label: "Policy" },
  { value: "53", label: "Politics & Government" },
  { value: "38", label: "Programs" },
  { value: "39", label: "Project Management" },
  { value: "122", label: "Property Management" },
  { value: "113", label: "Psychology" },
  { value: "148", label: "Public Policy & Legislative Affairs" },
  { value: "37", label: "Public Relations" },
  { value: "40", label: "Purchasing / Procurement" },
  { value: "97", label: "Recruiting" },
  { value: "21", label: "Research" },
  { value: "164", label: "Sales" },
  { value: "41", label: "Scientific" },
  { value: "115", label: "Security" },
  { value: "79", label: "Social Media" },
  { value: "51", label: "Social Work" },
  { value: "73", label: "Strategy" },
  { value: "150", label: "Supply Chain & Logistics" },
  { value: "98", label: "Talent Acquisition" },
  { value: "96", label: "Technical" },
  { value: "140", label: "Technology: Artificial Intelligence (AI)" },
  { value: "121", label: "Technology: Automation, AI & Blockchain" },
  { value: "141", label: "Technology: Engineering" },
  { value: "112", label: "Trades" },
  { value: "117", label: "Training" },
  { value: "143", label: "Volunteer Management & Coordination" },
  { value: "116", label: "Workforce Development" },
  { value: "45", label: "Writing / Editing" },
  { value: "35", label: "Other" },
];
