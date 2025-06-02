import { NextRequest, NextResponse } from "next/server";
import { scrapeNployJobs } from "./Functions";
import { connectMongoDB } from "../lib/dbConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface QueryParams {
  country?: string; // Country code (e.g., "US", "CA", "UK")
  kw?: string | string[]; // Keyword for job search (e.g., "software engineer", "ai engineer", multiple keywords allowed)
  wm?: string | string[]; // Work model: ons (on-site), hyb (hybrid), hme (home), Remote
  wt?: string | string[]; // Work type: Part (part-time), Full (full-time)
  jt?: string | string[]; // Job type: 1 (full-time), 2 (part-time), 4 (contract), 6 (internship)
  explvl?: string; // Experience level: junior, middle, senior, leadership
}
export const GET = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const { searchParams } = new URL(request.url);

    await connectMongoDB();
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

    const careerProfile = await CareerProfile.find({
      userId: session?.user?.id,
    });
    const forteprofile = await ForteProfile.find({ userId: session?.user?.id });
    const priority = await Priority.find({ userId: session?.user?.id });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: ` You are provided with the following user inputs:
                      Forte Profile
                      Career Profile
                      Priority Profile
                      nploy.net Search Parameters (optional)
                      Your task is divided into two clear steps:
    
                      Step 1: Generate Job Title for nploy.net Search
                      Analyze the Forte Profile, Career Profile, Priority Profile, and search params (if present) the job title included in the search parameters.
                      Based on this holistic understanding, output one concise and relevant job title.
                      This job title must be highly optimized for nploy.net's job search bar, meaning it should reflect roles that best align with the candidate’s strengths, goals, and preferences.
    
                      Step 2: Generate Optimized nploy.net Search Parameters
                      Using the same inputs—Forte Profile, Career Profile, Priority Profile, and search params (if present) existing search parameters—provide a corrected and fully populated set of nploy.net job search parameters. Your output should fill in or correct the following fields:
                      
    
    
                      Final Output Format
                      Return your results as a JSON object in the following structure always give response in strict following formate:
                     {
                        country?: string; // Country code (e.g., "US", "CA", "UK")
                        kw?: string | string[]; // Keyword for job(job title dont inlcude jobtitle sepratly dont inlcude "and" just make an array of minimum optamized keyword) search (e.g., "software engineer", "ai engineer", multiple keywords allowed) keywords are for job search so make sure you keep it minimum and optamized (that give good results)
                        wm?: string | string[]; // Work model: ons (on-site), hyb (hybrid), hme (home), Remote
                        wt?: string | string[]; // Work type: Part (part-time), Full (full-time)
                        jt?: string | string[]; // Job type: 1 (full-time), 2 (part-time), 4 (contract), 6 (internship)
                        explvl?: string; // Experience level: junior, middle, senior, leadership
                        }         
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

    let parsedResponse: QueryParams;

    try {
      parsedResponse = JSON.parse(rawResponse);

      console.log(parsedResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error("Failed to parse rawResponse: " + errorMessage);
    }

    const jobs = await scrapeNployJobs(parsedResponse);

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
