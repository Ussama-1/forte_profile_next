import { NextRequest, NextResponse } from "next/server";
import puppeteer, { Browser, Page, executablePath } from "puppeteer";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { OpenAI } from "openai";
import { connectMongoDB } from "../lib/dbConnection";
import {
  categoryOptions,
  QueryParams,
  scrapeFoundationListJobs,
} from "./Functions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
                         foundationlist.org Search Parameters (optional)
                         Your task is divided into two clear steps:
       
                         
                         Step 1: 
                         Analyze the Forte Profile, Career Profile, Priority Profile, and search params (if present) the job title included in the search parameters.
                         Based on this holistic understanding, output one concise and relevant job category.
                         This job category must be highly optimized for foundationlist.org's job search bar, meaning it should reflect roles that best align with the candidate’s strengths, goals, and preferences.
       
                         
       
       
                         preprocess:the job category will always be in the ${categoryOptions} you have to put the value of the label you must have to put the value not the label i.e 64 or 12 based on the cetagor you have to pick the value of it 
                         Final Output Format
                         Return your results as a JSON object in the following structure always give response in strict following formate:
                       {
                        category?: string //64 or 12; 

                        }

                        example:
                        { category: '64' } //correct
                         { category: 'Education Program Management' } //wrong
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

    const jobs = await scrapeFoundationListJobs(parsedResponse);

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
