import puppeteer, { Browser, Page } from "puppeteer";
import { loginToLinkedInHelper } from "./LinkedinLogin";

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

const randomDelay = (min: number, max: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
};

declare global {
  interface Window {
    chrome: {
      runtime;
      loadTimes(): void;
      csi(): void;
      app;
    };
  }
}


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

interface ScrapingConfig {
  headless: boolean;
  viewport: {
    width: number;
    height: number;
  };
  timeout: number;
}


const getRandomUserAgent = (): string => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const getRandomViewport = () => {
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1600, height: 900 },
  ];
  return viewports[Math.floor(Math.random() * viewports.length)];
};

const humanMouseMove = async (
  page: Page,
  targetX: number,
  targetY: number
): Promise<void> => {
  const currentMouse = await page.evaluate(() => ({ x: 0, y: 0 }));

  const steps = Math.floor(Math.random() * 10) + 10;
  const stepX = (targetX - currentMouse.x) / steps;
  const stepY = (targetY - currentMouse.y) / steps;

  for (let i = 0; i <= steps; i++) {
    const x = currentMouse.x + stepX * i + (Math.random() - 0.5) * 2;
    const y = currentMouse.y + stepY * i + (Math.random() - 0.5) * 2;

    await page.mouse.move(x, y);
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10 + 5));
  }
};

const humanClick = async (page: Page, selector: string): Promise<void> => {
  try {
    const element = await page.$(selector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    const x = box.x + box.width / 2 + (Math.random() - 0.5) * box.width * 0.1;
    const y = box.y + box.height / 2 + (Math.random() - 0.5) * box.height * 0.1;

    await humanMouseMove(page, x, y);
    await randomDelay(100, 300);

    await page.mouse.down();
    await randomDelay(50, 150);
    await page.mouse.up();

    await randomDelay(200, 500);
  } catch (error) {
    console.error("Human click failed:", error);
  }
};

const humanType = async (
  page: Page,
  selector: string,
  text: string
): Promise<void> => {
  try {
    await page.focus(selector);
    await randomDelay(200, 500);

    for (const char of text) {
      await page.keyboard.type(char);
      await randomDelay(50, 200);
    }

    await randomDelay(300, 700);
  } catch (error) {
    console.error("Human type failed:", error);
  }
};

const simulateHumanBehavior = async (page: Page): Promise<void> => {
  const actions = [
    async () => {
      const randomX = Math.random() * 1920;
      const randomY = Math.random() * 1080;
      await humanMouseMove(page, randomX, randomY);
    },
    async () => {
      await page.keyboard.press("Tab");
      await randomDelay(100, 300);
    },
    async () => {
      const scrollAmount = Math.random() * 200 - 100;
      await page.mouse.wheel({ deltaY: scrollAmount });
      await randomDelay(100, 300);
    },
  ];

  const action = actions[Math.floor(Math.random() * actions.length)];
  await action();
};

const addAdvancedStealthScripts = async (page: Page): Promise<void> => {
  await page.evaluateOnNewDocument(() => {
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

    Object.defineProperty(navigator, "platform", {
      get: () => "Win32",
    });

    Object.defineProperty(navigator, "hardwareConcurrency", {
      get: () => 8,
    });

    Object.defineProperty(navigator, "deviceMemory", {
      get: () => 8,
    });

    Object.defineProperty(navigator, "maxTouchPoints", {
      get: () => 0,
    });

    Object.defineProperty(screen, "colorDepth", {
      get: () => 24,
    });

    Object.defineProperty(screen, "pixelDepth", {
      get: () => 24,
    });

    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) {
        return "Intel Inc.";
      }
      if (parameter === 37446) {
        return "Intel(R) Iris(TM) Graphics 6100";
      }
      return getParameter.call(this, parameter);
    };

    const elementDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "offsetHeight"
    );
    Object.defineProperty(HTMLDivElement.prototype, "offsetHeight", {
      ...elementDescriptor,
      get: function () {
        if (this.id === "modernizr") {
          return 1;
        }
        return elementDescriptor?.get?.apply(this);
      },
    });

    const addEventListenerDescriptor = Object.getOwnPropertyDescriptor(
      EventTarget.prototype,
      "addEventListener"
    );
    Object.defineProperty(EventTarget.prototype, "addEventListener", {
      ...addEventListenerDescriptor,
      value: function (type: string, listener: any, options?: any) {
        if (type === "unload") {
          return;
        }
        return addEventListenerDescriptor?.value?.apply(this, [
          type,
          listener,
          options,
        ]);
      },
    });

    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Array;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Promise;
    delete (window as any).cdc_adoQpoasnfa76pfcZLmcfl_Symbol;

    (window as any).chrome = {
      runtime: {},
      loadTimes: function () {
        return {
          commitLoadTime: Date.now() / 1000 - Math.random() * 100,
          connectionInfo: "http/1.1",
          finishDocumentLoadTime: Date.now() / 1000 - Math.random() * 10,
          finishLoadTime: Date.now() / 1000 - Math.random() * 10,
          firstPaintAfterLoadTime: 0,
          firstPaintTime: Date.now() / 1000 - Math.random() * 10,
          navigationType: "Other",
          npnNegotiatedProtocol: "http/1.1",
          requestTime: Date.now() / 1000 - Math.random() * 100,
          startLoadTime: Date.now() / 1000 - Math.random() * 100,
          wasAlternateProtocolAvailable: false,
          wasFetchedViaSpdy: false,
          wasNpnNegotiated: false,
        };
      },
      csi: function () {
        return {
          startE: Date.now() - Math.random() * 1000,
          onloadT: Date.now() - Math.random() * 100,
          pageT: Math.random() * 10,
          tran: Math.floor(Math.random() * 20),
        };
      },
    };
  });

  await page.setJavaScriptEnabled(true);

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("webdriver") || url.includes("automation")) {
      request.abort();
    } else {
      request.continue();
    }
  });
};

export const createBrowser = async (): Promise<Browser> => {
  const viewport = getRandomViewport();

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
      "--disable-hang-monitor",
      "--disable-prompt-on-repost",
      "--disable-domain-reliability",
      "--disable-component-update",
      "--disable-background-networking",
      "--disable-breakpad",
      "--disable-client-side-phishing-detection",
      "--disable-datasaver-prompt",
      "--disable-desktop-notifications",
      "--disable-logging",
      "--disable-metrics",
      "--disable-metrics-reporting",
      "--disable-plugins-discovery",
      "--disable-speech-api",
      "--disable-web-resources",
      "--no-crash-upload",
      "--no-report-upload",
      `--window-size=${viewport.width},${viewport.height}`,
      "--start-maximized",
    ],
    ignoreDefaultArgs: [
      "--enable-automation",
      "--enable-blink-features=IdleDetection",
    ],
    defaultViewport: null,
    executablePath: undefined,
  });

  return browser;
};

export const setupPage = async (browser: Browser): Promise<Page> => {
  const page = await browser.newPage();
  const viewport = getRandomViewport();

  await addAdvancedStealthScripts(page);

  await page.setViewport({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1 + Math.random() * 0.1,
    hasTouch: false,
    isLandscape: true,
    isMobile: false,
  });

  const userAgent = getRandomUserAgent();
  await page.setUserAgent(userAgent);

  const acceptLanguages = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.8,es;q=0.7",
    "en-US,en;q=0.9,fr;q=0.8",
  ];
  const randomAcceptLanguage =
    acceptLanguages[Math.floor(Math.random() * acceptLanguages.length)];

  await page.setExtraHTTPHeaders({
    "Accept-Language": randomAcceptLanguage,
    "Accept-Encoding": "gzip, deflate, br",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-User": "?1",
    "Sec-Fetch-Dest": "document",
    "Cache-Control": "max-age=0",
    DNT: "1",
    Connection: "keep-alive",
    "Sec-CH-UA":
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-CH-UA-Mobile": "?0",
    "Sec-CH-UA-Platform": '"Windows"',
  });

  await page.setDefaultTimeout(SCRAPING_CONFIG.timeout);
  await page.setDefaultNavigationTimeout(SCRAPING_CONFIG.timeout);

  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  return page;
};

export const navigateWithHumanBehavior = async (
  page: Page,
  url: string
): Promise<void> => {
  await randomDelay(1000, 3000);

  await page.goto(url, {
    waitUntil: "networkidle2",
    timeout: SCRAPING_CONFIG.timeout,
  });

  await randomDelay(2000, 5000);

  await simulateHumanBehavior(page);

  const scrollAmount = Math.random() * 500 + 200;
  await page.evaluate((amount) => {
    window.scrollTo({
      top: amount,
      behavior: "smooth",
    });
  }, scrollAmount);

  await randomDelay(1000, 3000);
};

export const waitForElementWithHumanBehavior = async (
  page: Page,
  selector: string,
  timeout: number = 10000
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      await page.waitForSelector(selector, { timeout: 1000 });
      await randomDelay(500, 1500);
      return;
    } catch (error) {
      await simulateHumanBehavior(page);
      await randomDelay(1000, 2000);
    }
  }

  throw new Error(`Element ${selector} not found within ${timeout}ms`);
};

export { humanClick, humanType, randomDelay, simulateHumanBehavior };

export const loginToLinkedIn = async (page: Page): Promise<void> => {
  await loginToLinkedInHelper(page);
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
