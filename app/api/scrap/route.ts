// In Next.js Route Handler API
const puppeteer = require("puppeteer");
const { NextResponse } = require("next/server");

// Use a simple query to find web developer jobs
const GOOGLE_JOBS_URL = `https://www.google.com/search?q=web+developer+jobs&ibp=htl;jobs`;

/**
 * Google Jobs scraper API route that includes job descriptions and apply links
 * @returns {Promise<NextResponse>} JSON response with scraped jobs
 */
export async function GET() {
  let browser;
  try {
    // Launch a browser instance with specific configurations
    browser = await puppeteer.launch({
      headless: false, // Set to true in production
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();

    // Configure browser to appear more human-like
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36"
    );

    // Set extra headers to appear more like a regular browser
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
    });

    // Navigate directly to Google Jobs using the jobs-specific URL
    console.log("Navigating to Google Jobs search...");
    await page.goto(GOOGLE_JOBS_URL, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    console.log("Page loaded! Looking for job listings...");

    // Take a screenshot for debugging
    await page.screenshot({ path: "debug-page-loaded.png" });

    // Wait for the job cards to appear
    // Trying multiple selectors to find job listings
    const jobCardSelector =
      "div.iFjolb, li.iFjolb, div.PwjeAc, g-card.vtFJAb, div.gws-plugins-horizon-jobs__li-ed";

    try {
      await page.waitForSelector(jobCardSelector, { timeout: 10000 });
      console.log("Job cards found on the page");
    } catch (error) {
      console.log(
        "Could not find job cards with main selector, trying alternative approach"
      );
      // Save page content for debugging
      const fs = require("fs");
      fs.writeFileSync("page-html.txt", await page.content());
    }

    // Find all job cards on the page
    const jobCards = await page.$$eval(
      jobCardSelector,
      (cards) => cards.length
    );
    console.log(`Found ${jobCards} job cards on the page`);

    if (jobCards === 0) {
      console.log(
        "No job cards found. Taking screenshot and saving HTML for debugging"
      );
      await page.screenshot({ path: "no-jobs-found.png" });
      const fs = require("fs");
      fs.writeFileSync("page-content.html", await page.content());

      return NextResponse.json(
        { error: "No job listings found on the page" },
        { status: 500 }
      );
    }

    // Process a limited number of jobs
    const jobLimit = 5; // Limiting to 5 for testing
    const jobsToProcess = Math.min(jobCards, jobLimit);
    const processedJobs = [];

    console.log(
      `Processing ${jobsToProcess} jobs with detailed information...`
    );

    // For each job card, click and extract detailed information
    for (let i = 0; i < jobsToProcess; i++) {
      try {
        console.log(`Processing job ${i + 1}/${jobsToProcess}...`);

        // Click on the job card more reliably using page.$$ and direct click
        const cards = await page.$$(jobCardSelector);
        if (cards[i]) {
          await cards[i].click();
          console.log(`Clicked on job card ${i + 1}`);

          // Wait for the sidebar to appear and load content
          // Using multiple possible selectors for the sidebar
          const sidebarSelector =
            'div.pE8vnd, div.KGlVrd, div.YgLbBe, div[jsname="eO2Zfd"], div[data-ved]';

          try {
            await page.waitForSelector(sidebarSelector, { timeout: 5000 });
            console.log("Sidebar loaded successfully");
          } catch (error) {
            console.log(
              "Sidebar selector not found, taking screenshot for debugging"
            );
            await page.screenshot({ path: `job-${i + 1}-sidebar-missing.png` });
          }

          // Give the sidebar content extra time to fully load
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Take a screenshot of the sidebar for debugging
          await page.screenshot({ path: `job-${i + 1}-sidebar.png` });

          // Extract job information with improved selectors
          const jobInfo = await extractJobDetails(page);

          if (jobInfo && jobInfo.title && jobInfo.title !== "Not found") {
            processedJobs.push(jobInfo);
            console.log(
              `Successfully extracted job ${i + 1}: ${jobInfo.title}`
            );
          } else {
            console.log(
              `Failed to extract complete information for job ${i + 1}`
            );
          }
        } else {
          console.log(`Could not find job card element ${i + 1}`);
        }
      } catch (error) {
        console.error(`Error processing job ${i + 1}:`, error.message);
      }

      // Add a delay between processing jobs to avoid detection
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Close the browser
    if (browser) {
      await browser.close();
    }

    console.log(
      `✅ Successfully scraped ${processedJobs.length} jobs with details`
    );
    return NextResponse.json(processedJobs, { status: 200 });
  } catch (error) {
    console.error("❌ Scraping Error:", error.message);
    console.error(error.stack);

    // Make sure browser is closed even if there's an error
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore errors when closing browser
      }
    }

    return NextResponse.json(
      { error: "Failed to scrape jobs", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Extract detailed job information from the sidebar with improved selectors
 * @param {Page} page - Puppeteer page object
 * @returns {Promise<Object>} - Job details including description and apply link
 */
async function extractJobDetails(page) {
  return await page.evaluate(() => {
    try {
      // More comprehensive selectors for job details

      // Job title
      const titleSelectors = [
        "h2.KpBd3b",
        "h2.pMhGee",
        "h2.tNfdCb",
        'div[role="heading"]',
        "div.nJlQNd > div.BjJfJf",
        '[data-control-type="job_title"]',
      ];

      // Company name
      const companySelectors = [
        ".nJlQNd",
        ".vNEEBe",
        "div.sMzDkb",
        "div.vNEEBe",
        "div.BjJfJf ~ div",
        '[data-control-type="company_name"]',
      ];

      // Location
      const locationSelectors = [
        ".Qk80Jf",
        ".Ld2paf",
        "div.sMzDkb ~ div",
        "span.Qk80Jf",
        '[data-control-type="location"]',
      ];

      // Job description - Trying multiple possible selectors
      const descriptionSelectors = [
        'span[jsname="YS01Ge"]',
        "div.HBvzbc",
        "div.pE8vnd",
        "div.KGlVrd",
        "div.YgLbBe",
        'div[jsmodel="QP6oV"]',
        "div.jANrlb",
      ];

      // Apply button/link - More comprehensive selectors
      const applySelectors = [
        "a.DaDV9e",
        "a.pMhGee",
        'div[jsname="WbKHeb"] a',
        "a.pMhGee.V46Bsb",
        'a[jsname="i4CWFd"]',
        'a[jscontroller="M9mgyc"]',
        "a.pMhGee button",
        "a.FNfAib",
        'a[data-control-type="apply_button"]',
      ];

      // Helper function to get text from the first matching selector
      const getFirstMatch = (selectors) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element && element.innerText.trim()) {
              return element.innerText.trim();
            }
          }
        }
        return "Not found";
      };

      // Helper function to get href from the first matching selector
      const getFirstLink = (selectors) => {
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          for (const element of elements) {
            if (element) {
              // If the element itself is an anchor tag
              if (element.tagName === "A") {
                return element.href;
              }
              // If the element is a button inside an anchor
              const parentAnchor = element.closest("a");
              if (parentAnchor) {
                return parentAnchor.href;
              }
            }
          }
        }
        return "#";
      };

      // Extract job description specifically
      let description = "Not available";
      for (const selector of descriptionSelectors) {
        const descElements = document.querySelectorAll(selector);
        for (const descEl of descElements) {
          if (
            descEl &&
            descEl.innerText &&
            descEl.innerText.trim().length > 20
          ) {
            // Found a substantial description text
            description = descEl.innerText.trim();
            break;
          }
        }
        if (description !== "Not available") break;
      }

      // If we still don't have a description, try getting it from the entire sidebar
      if (description === "Not available") {
        const sidebarContainers = [
          'div[jsmodel="QP6oV"]',
          "div[data-ved]",
          "div.YgLbBe",
        ];

        for (const container of sidebarContainers) {
          const sidebarEl = document.querySelector(container);
          if (
            sidebarEl &&
            sidebarEl.innerText &&
            sidebarEl.innerText.length > 100
          ) {
            // Extract everything after "Job description" or similar headings
            const text = sidebarEl.innerText;
            const descIndex = text.indexOf("Job description");
            if (descIndex >= 0) {
              description = text
                .substring(descIndex)
                .replace("Job description", "")
                .trim();
              break;
            } else {
              // Look for other potential description sections
              const aboutIndex = text.indexOf("About the Role");
              if (aboutIndex >= 0) {
                description = text.substring(aboutIndex).trim();
                break;
              }
            }
          }
        }
      }

      // Extract apply link - with fallback methods
      let applyLink = getFirstLink(applySelectors);

      // If no apply link found, try to look for any "Apply" button text and get its parent link
      if (applyLink === "#") {
        const applyButtons = Array.from(
          document.querySelectorAll("button, a, div")
        ).filter((el) => el.innerText.toLowerCase().includes("apply"));

        for (const button of applyButtons) {
          const link =
            button.tagName === "A" ? button.href : button.closest("a")?.href;
          if (link) {
            applyLink = link;
            break;
          }
        }
      }

      // Build and return the job object
      return {
        title: getFirstMatch(titleSelectors),
        company: getFirstMatch(companySelectors),
        location: getFirstMatch(locationSelectors),
        description: description,
        applyLink: applyLink,
        posted:
          document
            .querySelector('.LL4CDc, span.KKh3md, span[class*="LL4"]')
            ?.innerText?.trim() || "Not specified",
      };
    } catch (error) {
      console.error("Error extracting job details:", error);
      return null;
    }
  });
}
