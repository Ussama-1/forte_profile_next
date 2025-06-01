import puppeteer, { Browser, Page } from "puppeteer";

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
  maxPages: number;
  viewport: {
    width: number;
    height: number;
  };
}

const SCRAPING_CONFIG: ScrapingConfig = {
  headless: true,
  timeout: 30000,
  maxJobs: 20,
  maxPages: 4,
  viewport: { width: 1366, height: 768 },
};

export const validateSearchParams = (searchParams: URLSearchParams) => {
  const jobTitle = searchParams.get("jobTitle")?.trim();
  const location = searchParams.get("location")?.trim() || "United States";

  if (!jobTitle || jobTitle.length < 2) {
    throw new Error("Job title must be at least 2 characters long");
  }

  if (jobTitle.length > 100 || location.length > 100) {
    throw new Error("Search parameters too long");
  }

  return { jobTitle, location };
};

export const createBrowser = async (): Promise<Browser> => {
  const browser = await puppeteer.launch({
    headless: SCRAPING_CONFIG.headless,
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

  return browser;
};

export const setupPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  await page.setViewport(SCRAPING_CONFIG.viewport);
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  );

  await page.setDefaultTimeout(SCRAPING_CONFIG.timeout);

  return page;
};

export const loginToLinkedIn = async (page: Page): Promise<void> => {
  const email = process.env.LINKEDIN_EMAIL;
  const password = process.env.LINKEDIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "LinkedIn email or password not provided in environment variables"
    );
  }

  try {
    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await page.waitForSelector("#username", { timeout: 8000 });
    await page.type("#username", email);
    await page.type("#password", password);

    await Promise.all([
      page.click('button[type="submit"]'),
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 25000 })
        .catch(() => {}),
    ]);

    await new Promise((resolve) => setTimeout(resolve, 4000));

    const isLoggedIn = await page.evaluate(() => {
      return !!document.querySelector(
        'a[href*="/in/"], a[href*="/profile/"], .global-nav__me'
      );
    });

    if (!isLoggedIn) {
      const captcha = await page.$('iframe[src*="captcha"], [id*="captcha"]');
      if (captcha) {
        throw new Error(
          "CAPTCHA detected. Manual intervention or CAPTCHA-solving service required."
        );
      }

      const verification = await page.$('[data-test-id="challenge"]');
      if (verification) {
        throw new Error(
          "Verification challenge detected (e.g., 2FA or email/phone verification)."
        );
      }

      const errorMessage = await page.$(".alert-error, .error-message");
      if (errorMessage) {
        const errorText = await page.evaluate(
          (el) => el.textContent,
          errorMessage
        );
        throw new Error(`Login failed: ${errorText || "Invalid credentials"}`);
      }

      throw new Error("Login failed: Unable to confirm login status.");
    }

    console.log("Login successful, current URL:", await page.url());
  } catch (error) {
    await page.screenshot({ path: "login_error.png" }).catch(() => {});
    console.error("Login error:", error);
    throw new Error(
      `Failed to login: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const buildLinkedInUrl = (
  rawResponse: {
    jobtitle: string;
    jobtype: string;
    Experience: string;
    RemoteFilter: string;
    CompanySize: string;
    Location: string;
    Radius: string;
  }
) => {
  const baseUrl = "https://www.linkedin.com/jobs/search/";
  const params = new URLSearchParams({
    keywords: rawResponse.jobtitle,
    location: rawResponse?.Location || "United States",
    f_TPR: "r86400",
    // job type
    // F = Full-time, P = Part-time, C = Contract, T = Temporary, I = Internship, V = Volunteer, O = Other
    f_JT: rawResponse.jobtype,
    // Experience Level (f_E)
    // 1 = Internship, 2 = Entry level, 3 = Associate, 4 = Mid-Senior, 5 = Director, 6 = Executive
    f_E: rawResponse.Experience,
    // Remote Filter (f_WT)
    // 1 = On-site, 2 = Hybrid, 3 = Remote
    f_WT: rawResponse.RemoteFilter,
    // Company Size (f_CCS)
    // 1 = Myself Only, 2 = 1-10, 3 = 11-50, 4 = 51-200, 5 = 201-500, 6 = 501-1000, 7 = 1001-5000, 8 = 5001-10,000, 9 = 10,001+
    f_CCS: rawResponse.CompanySize,

    sortBy: "DD",
    distance: rawResponse.Radius,
  });

  return `${baseUrl}?${params.toString()}`;
};

export const scrollJobList = async (page: Page): Promise<void> => {
  try {
    await page.waitForSelector("ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA", {
      timeout: 30000,
    });

    let previousJobCount = 0;
    let sameCount = 0;
    const maxSameCount = 3;

    while (sameCount < maxSameCount) {
      const jobCount = await page.evaluate(() => {
        const jobList = document.querySelector(
          "ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA"
        );
        return jobList
          ? jobList.querySelectorAll(".job-card-container").length
          : 0;
      });

      if (jobCount === previousJobCount) {
        sameCount++;
      } else {
        sameCount = 0;
      }

      previousJobCount = jobCount;

      await page.evaluate(() => {
        const jobList = document.querySelector(
          "ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA"
        );
        if (jobList) {
          jobList.scrollIntoView({ behavior: "smooth", block: "end" });
          window.scrollBy(0, window.innerHeight);
        }
      });

      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    console.log(`Scrolled job list, loaded ${previousJobCount} jobs`);
  } catch (error) {
    console.error("Error scrolling job list:", error);
  }
};

export const extractJobLinks = async (page: Page): Promise<string[]> => {
  try {
    await page.waitForSelector("ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA", {
      timeout: 40000,
    });

    const links = await page.evaluate(() => {
      const jobCards = Array.from(
        document.querySelectorAll(".job-card-container")
      );

      return jobCards
        .map((card) => {
          const linkElement = card.querySelector(".job-card-list__title--link");
          const href = linkElement?.getAttribute("href") || "";
          return href.startsWith("/")
            ? `https://www.linkedin.com${href}`
            : href;
        })
        .filter((link) => link);
    });

    return links;
  } catch (error) {
    console.error("Error extracting job links:", error);
    return [];
  }
};

export const extractJobDetails = async (
  page: Page,
  applyLink: string
): Promise<JobData | null> => {
  try {
    await page.goto(applyLink, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await page.waitForSelector(".job-view-layout.jobs-details", {
      timeout: 40000,
    });

    // Click "See more" button if present
    const seeMoreButton = await page.$(".jobs-description__footer-button");
    if (seeMoreButton) {
      await seeMoreButton.click();
      await new Promise((resolve) => setTimeout(resolve, 4000)); // Wait for description to expand
    }

    const jobDetails = await page.evaluate(() => {
      const companyElement = document.querySelector(
        ".job-details-jobs-unified-top-card__company-name a"
      );
      const titleElement = document.querySelector(".t-24.t-bold");
      const jobTypeElements = document.querySelectorAll(
        ".job-details-fit-level-preferences button"
      );
      const descriptionElement = document.querySelector(
        ".jobs-box__html-content .mt4 p"
      );
      const locationElement = document.querySelector(
        ".job-details-jobs-unified-top-card__primary-description-container .t-black--light span.tvm__text.tvm__text--low-emphasis"
      );

      const company = companyElement?.textContent?.trim() || "";
      const title = titleElement?.textContent?.trim() || "";
      const jobType = Array.from(jobTypeElements)
        .map((el) => el.textContent?.trim() || "")
        .filter(Boolean);
      const description = descriptionElement
        ? descriptionElement.outerHTML
        : "";
      const location = locationElement?.textContent?.trim() || "";

      return { company, title, jobType, description, location };
    });

    if (!jobDetails.description) {
      console.warn(`No description found for ${applyLink}`);
    }

    return {
      title: jobDetails.title,
      company: jobDetails.company,
      jobType: jobDetails.jobType,
      description: jobDetails.description,
      applyLink,
      location: jobDetails.location, // Add location to the return object
    };
  } catch (error) {
    console.error(`Error extracting details for ${applyLink}:`, error);
    await page
      .screenshot({ path: `job_error_${applyLink.split("/").pop()}.png` })
      .catch(() => {});
    return null;
  }
};

export const scrapeLinkedInJobs = async (
  rawResponse:  {
    jobtitle: string;
    jobtype: string;
    Experience: string;
    RemoteFilter: string;
    CompanySize: string;
    Location: string;
    Radius: string;
  }
): Promise<JobData[]> => {
  let browser: Browser | null = null;

  try {
    browser = await createBrowser();
    const page = await setupPage(browser);

    await loginToLinkedIn(page);

    const url = buildLinkedInUrl(rawResponse);
    let allLinks: string[] = [];
    const seenLinks = new Set<string>();

    for (let pageNum = 1; pageNum <= SCRAPING_CONFIG.maxPages; pageNum++) {
      console.log(`Scraping page ${pageNum}...`);

      try {
        await page.goto(url + `&start=${(pageNum - 1) * 25}`, {
          waitUntil: "domcontentloaded",
          timeout: 25000,
        });
      } catch (error) {
        console.log("First load attempt failed, trying with load event...", error instanceof Error ? error.message : "Unknown error");
        await page.goto(url + `&start=${(pageNum - 1) * 25}`, {
          waitUntil: "domcontentloaded",
          timeout: 40000,
        });
      }

      await scrollJobList(page);

      let links = await extractJobLinks(page);

      links = links.filter((link) => {
        if (seenLinks.has(link)) return false;
        seenLinks.add(link);
        return true;
      });

      allLinks = allLinks.concat(links);

      const nextButton = await page.$(
        "button.jobs-search-pagination__button--next:not([disabled])"
      );

      if (!nextButton || allLinks.length >= SCRAPING_CONFIG.maxJobs) {
        console.log("No more pages or max jobs reached.");
        break;
      }

      try {
        await Promise.all([
          page.click("button.jobs-search-pagination__button--next"),
          page.waitForSelector("ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA", {
            timeout: 40000,
          }),
        ]);
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error("Error clicking next button:", error);
        break;
      }
    }

    const allJobs: JobData[] = [];
    for (const link of allLinks.slice(0, SCRAPING_CONFIG.maxJobs)) {
      console.log(`Fetching details for ${link}`);
      const jobDetails = await extractJobDetails(page, link);
      if (jobDetails) {
        allJobs.push(jobDetails);
      }
    }

    return allJobs;
  } catch (error) {
    console.error("Scraping error:", error);
    throw new Error(
      `Failed to scrape LinkedIn jobs: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};
