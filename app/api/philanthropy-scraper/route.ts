import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, Page, executablePath } from "puppeteer";
import { connectMongoDB } from "../lib/dbConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { OpenAI } from "openai";
import { QueryParams, scrapePhilanthropyJobs } from "./Functions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

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
    await connectMongoDB();


    const careerProfile = await CareerProfile.find({
      userId: session?.user?.id,
    });
    const forteprofile = await ForteProfile.find({ userId: session?.user?.id });
    const priority = await Priority.find({ userId: session?.user?.id });


    let parsedResponse: QueryParams;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: ` You are provided with the following user inputs:
                        Forte Profile
                        Career Profile
                        Priority Profile
                        philanthropy Search Parameters (optional)
                        Your task is divided into two clear steps:
      
                        Step 1: Generate Job Title for philanthropy Search
                        Analyze the Forte Profile, Career Profile, Priority Profile, and (if present) the job title included in the search parameters.
      
                        Based on this holistic understanding, output one concise and relevant job title.
      
                        This job title must be highly optimized for philanthropy's job search bar, meaning it should reflect roles that best align with the candidate’s strengths, goals, and preferences.
      
                        Step 2: Generate Optimized philanthropy Search Parameters
                        Using the same inputs—Forte Profile, Career Profile, Priority Profile, and (if present) existing search parameters—provide a corrected and fully populated set of philanthropy job search parameters. Your output should fill in or correct the following fields:
                        {
                              Keywords?: string | string[]; // Keyword for job search (e.g., "job", "engineer", multiple keywords allowed)
                              radialtown?: string; // Town or region (e.g., "United States")
                              LocationId?: string; // Location ID (e.g., "200")
                              RadialLocation?: string; // Radius for location search (e.g., "100")
                              CountryCode?: string; // Country code (e.g., "", or "US")
                              EmploymentType?: string | string[]; // Employment type (e.g., "67" for full-time, "68" for part-time)
                              }
                              response is always injson formate
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

      try {
        parsedResponse = JSON.parse(rawResponse);

        console.log(parsedResponse);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error("Failed to parse rawResponse: " + errorMessage);
      }
    } catch (error) {
      let errorMsg = "Unknown error";
      if (error instanceof Error) {
        errorMsg = error.message;
        if ((error as any).response) {
          // OpenAI API error
          errorMsg += ` | OpenAI API response: ${JSON.stringify(
            (error as any).response.data
          )}`;
        }
      } else if (typeof error === "string") {
        errorMsg = error;
      }
      throw new Error("Error during OpenAI completion or parsing: " + errorMsg);
    }


    const jobs = await scrapePhilanthropyJobs(parsedResponse);

    return NextResponse.json(
      {
        success: true,
        data: jobs,
        metadata: {
          totalJobs: jobs.length,
          scrapedAt: new Date().toISOString(),
        },
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
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

export const runtime = "nodejs";
