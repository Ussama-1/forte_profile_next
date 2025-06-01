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
  maxJobs: 10,
  maxPages: 5,
  viewport: { width: 1366, height: 768 },
};

const getRandomUserAgent = (): string => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

const humanTypeText = async (
  page: Page,
  selector: string,
  text: string
): Promise<void> => {
  await page.focus(selector);
  await randomDelay(200, 500);

  for (const char of text) {
    await page.keyboard.type(char);
    await randomDelay(50, 150);
  }
};

declare global {
  interface Window {
    chrome: {
      runtime: any;
      loadTimes(): void;
      csi(): void;
      app: any;
    };
  }
}

const addStealthScripts = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    window.chrome = {
      runtime: {},
      loadTimes: function () {},
      csi: function () {},
      app: {},
    };

    Object.defineProperty(navigator, "permissions", {
      get: () => ({
        query: () => Promise.resolve({ state: "granted" }),
      }),
    });

    delete Object.getPrototypeOf(navigator).webdriver;

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
            name: "notifications" as PermissionName,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as PermissionStatus)
        : originalQuery(parameters);

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel Iris OpenGL Engine";
      }
      return getParameter(parameter);
    };

    ["height", "width"].forEach((property) => {
      const imageDescriptor = Object.getOwnPropertyDescriptor(
        HTMLImageElement.prototype,
        property
      );
      Object.defineProperty(HTMLImageElement.prototype, property, {
        ...(imageDescriptor || {}),
        get: function () {
          if (this.complete && this.naturalHeight == 0) {
            return 20;
          }
          return imageDescriptor?.get?.apply(this) ?? 0;
        },
      });
    });
  });
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
      "--disable-blink-features=AutomationControlled",
      "--disable-features=VizDisplayCompositor",
      "--disable-extensions-file-access-check",
      "--disable-extensions-http-throttling",
      "--disable-extensions-except",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-translate",
      "--hide-scrollbars",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-pings",
      "--password-store=basic",
      "--use-mock-keychain",
      "--disable-web-security",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--enable-features=NetworkService,NetworkServiceLogging",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
    ignoreDefaultArgs: [
      "--enable-automation",
      "--enable-blink-features=IdleDetection",
    ],
    defaultViewport: null,
  });

  return browser;
};

export const setupPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();

  await addStealthScripts(page);

  await page.setViewport({
    ...SCRAPING_CONFIG.viewport,
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });

  await page.setUserAgent(getRandomUserAgent());

  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Cache-Control": "max-age=0",
  });

  await page.setDefaultTimeout(SCRAPING_CONFIG.timeout);

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
            name: "notifications" as PermissionName,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => true,
          } as PermissionStatus)
        : originalQuery(parameters);
  });

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
    await randomDelay(1000, 3000);

    await page.goto("https://www.linkedin.com/login", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await randomDelay(2000, 4000);

    await page.waitForSelector("#username", { timeout: 8000 });

    await randomDelay(500, 1500);
    await page.mouse.move(Math.random() * 100 + 100, Math.random() * 100 + 100);

    await humanTypeText(page, "#username", email);
    await randomDelay(1000, 2000);

    await humanTypeText(page, "#password", password);
    await randomDelay(1500, 3000);

    await page.mouse.move(Math.random() * 200 + 200, Math.random() * 100 + 300);

    await randomDelay(500, 1000);

    await Promise.all([
      page.click('button[type="submit"]'),
      page
        .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 25000 })
        .catch(() => {}),
    ]);

    await randomDelay(4000, 6000);

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

export const buildLinkedInUrl = (rawResponse: {
  jobtitle: string;
  jobtype: string;
  Experience: string;
  RemoteFilter: string;
  CompanySize: string;
  Location: string;
  Radius: string;
}) => {
  const baseUrl = "https://www.linkedin.com/jobs/search/";
  const params = new URLSearchParams({
    keywords: rawResponse.jobtitle,
    location: rawResponse?.Location || "United States",
    f_TPR: "r86400",
    f_JT: rawResponse.jobtype,
    f_E: rawResponse.Experience,
    f_WT: rawResponse.RemoteFilter,
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

      await randomDelay(800, 1500);

      await page.mouse.move(
        Math.random() * 200 + 300,
        Math.random() * 100 + 400
      );

      await page.evaluate(() => {
        const jobList = document.querySelector(
          "ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA"
        );
        if (jobList) {
          jobList.scrollIntoView({ behavior: "smooth", block: "end" });
          window.scrollBy(0, window.innerHeight);
        }
      });

      await randomDelay(3000, 5000);
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
    await randomDelay(2000, 4000);

    await page.goto(applyLink, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });

    await randomDelay(1500, 3000);

    await page.waitForSelector(".job-view-layout.jobs-details", {
      timeout: 40000,
    });

    await randomDelay(1000, 2000);

    await page.mouse.move(Math.random() * 300 + 200, Math.random() * 200 + 300);

    const seeMoreButton = await page.$(".jobs-description__footer-button");
    if (seeMoreButton) {
      await randomDelay(500, 1000);
      await seeMoreButton.click();
      await randomDelay(3000, 5000);
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
      location: jobDetails.location,
    };
  } catch (error) {
    console.error(`Error extracting details for ${applyLink}:`, error);
    await page
      .screenshot({ path: `job_error_${applyLink.split("/").pop()}.png` })
      .catch(() => {});
    return null;
  }
};

export const scrapeLinkedInJobs = async (rawResponse: {
  jobtitle: string;
  jobtype: string;
  Experience: string;
  RemoteFilter: string;
  CompanySize: string;
  Location: string;
  Radius: string;
}): Promise<JobData[]> => {
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
        await randomDelay(2000, 4000);
        await page.goto(url + `&start=${(pageNum - 1) * 25}`, {
          waitUntil: "domcontentloaded",
          timeout: 25000,
        });
      } catch (error) {
        console.log(
          "First load attempt failed, trying with load event...",
          error instanceof Error ? error.message : "Unknown error"
        );
        await randomDelay(3000, 5000);
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
        await randomDelay(1000, 2000);
        await page.mouse.move(
          Math.random() * 100 + 400,
          Math.random() * 50 + 500
        );

        await Promise.all([
          page.click("button.jobs-search-pagination__button--next"),
          page.waitForSelector("ul.XmiiqsfgkweaCNUMRlQgLIWHNSiBbioBmTA", {
            timeout: 40000,
          }),
        ]);
        await randomDelay(3000, 5000);
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
