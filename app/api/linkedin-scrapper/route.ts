import { NextRequest, NextResponse } from "next/server";
import { scrapeLinkedInJobs } from "./Functions";
import { OpenAI } from "openai";
import CareerProfile from "@/app/api/models/CareerProfile";
import ForteProfile from "@/app/api/models/ForteProfile";
import Priority from "@/app/api/models/Priority";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const startTime = Date.now();

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

                  LinkedIn Search Parameters (optional)

                  Your task is divided into two clear steps:

                  Step 1: Generate Job Title for LinkedIn Search
                  Analyze the Forte Profile, Career Profile, Priority Profile, and (if present) the job title included in the search parameters.

                  Based on this holistic understanding, output one concise and relevant job title.

                  This job title must be highly optimized for LinkedIn's job search bar, meaning it should reflect roles that best align with the candidate’s strengths, goals, and preferences.

                  Step 2: Generate Optimized LinkedIn Search Parameters
                  Using the same inputs—Forte Profile, Career Profile, Priority Profile, and (if present) existing search parameters—provide a corrected and fully populated set of LinkedIn job search parameters. Your output should fill in or correct the following fields:
                  params = new URLSearchParams({
                    keywords: "{job title from Step 1}",
                    location: "{correct location or one based on profile}",
                    f_TPR: "r86400",
                    f_JT: "{comma-separated job types based on input data, e.g., F,C}",
                    f_E: "{comma-separated experience levels, e.g., 2,3}",
                    f_WT: "{comma-separated work types, e.g., 1,2,3}",
                    f_CCS: "{comma-separated company sizes, e.g., 6,7,8}",
                    sortBy: "DD",
                    distance: "25"
                  });


                  Final Output Format
                  Return your results as a JSON object in the following structure always give response in strict following formate:
                  {
                    jobtitle: "Your Suggested Job Title //never give two title i.e software engineer and full stack dev only give one title like Ai engineer or software engineer ",
                    jobtype: "F,C",
                    Experience: "2,3",
                    RemoteFilter: "2,3",
                    CompanySize: "6,7,8"
                    Location:"// proper formate so that i will not recieve any type of error in the linkedin if now location is provided just add United States"
                    Radius:"//as provided"
                  }


                  if the response is not in the following formate please fix this then:
                  {
                      jobtitle: string;
                      jobtype: string;
                      Experience: string;
                      RemoteFilter: string;
                      CompanySize: string;
                      Location:string;
                      Radius: string;
                    }


                    If the output deviates in any way — including use of single quotes, additional keys, missing keys, different order, or incorrect capitalization — fix it immediately.
                            
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

    let parsedResponse: {
      jobtitle: string;
      jobtype: string;
      Experience: string;
      RemoteFilter: string;
      CompanySize: string;
      Location: string;
      Radius: string;
    };

    try {
      parsedResponse = JSON.parse(rawResponse);

      console.log(parsedResponse);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error("Failed to parse rawResponse: " + errorMessage);
    }

    const jobs = await scrapeLinkedInJobs(parsedResponse);

    const responseData = {
      success: true,
      data: jobs,
      metadata: {
        totalJobs: jobs.length,
        searchQuery: { parsedResponse },
        scrapedAt: new Date().toISOString(),
        processingTime: `${Date.now() - startTime}ms`,
      },
    };

    return NextResponse.json(
      responseData,

      {
        status: 200,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("API Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      {
        status:
          error instanceof Error && error.message.includes("must be at least")
            ? 400
            : 500,
      }
    );
  }
};
