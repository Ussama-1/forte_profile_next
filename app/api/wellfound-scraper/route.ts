import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export async function GET() {
  try {
    const browser = await puppeteer.launch({
      headless: false, // 'true' if you want full headless
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);

    page.on("request", async (interceptedRequest) => {
      const isGraphQL =
        interceptedRequest.url().includes("/graphql") &&
        interceptedRequest.method() === "POST";
      if (isGraphQL) {
        const headers = interceptedRequest.headers();
        const postData = interceptedRequest.postData();

        console.log("--- Intercepted GraphQL Request ---");
        console.log("Headers:", headers);
        console.log("Payload:", postData);

        await browser.close();

        // Return early with extracted data
        return NextResponse.json({
          message: "GraphQL Request Intercepted",
          headers,
          payload: JSON.parse(postData || "{}"),
        });
      }

      interceptedRequest.continue();
    });

    await page.goto("https://wellfound.com/jobs", {
      waitUntil: "domcontentloaded",
    });

    // Wait for user-driven network activity or a default timeout
    await new Promise(res => setTimeout(res, 15000));

    await browser.close();
    return NextResponse.json({
      message: "No GraphQL request was intercepted in time.",
    });
  } catch (error) {
    console.error("Error in Puppeteer script:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
