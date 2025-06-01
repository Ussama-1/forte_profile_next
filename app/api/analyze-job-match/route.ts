import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import Priority, { IPriority } from "@/app/api/models/Priority";
import ForteProfile, { IForteProfile } from "@/app/api/models/ForteProfile";
import CareerProfile, { ICareerProfile } from "@/app/api/models/CareerProfile";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface JobMatchRequest {
  jobs: Array<{
    title: string;
    company: string;
    description: string;
    location: string;
    applyLink: string;
  }>;
}

interface PriorityMatchResult {
  jobIndex: number;
  overallScore: number;
  priorityBreakdown: Array<{
    priorityName: string;
    score: number;
    reasoning: string;
  }>;
}

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobs }: JobMatchRequest = await request.json();

    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: "Jobs array is required" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Fetch user data
    const [priorities, forteProfile, careerProfile] = await Promise.all([
      Priority.find({ userId }) as Promise<IPriority[]>,
      ForteProfile.findOne({ userId }),
      CareerProfile.findOne({ userId }),
    ]);

    if (!priorities || priorities.length === 0) {
      return NextResponse.json(
        { error: "User priorities not found" },
        { status: 404 }
      );
    }

    // Process jobs in batches to avoid token limits
    const batchSize = 5;
    const results: PriorityMatchResult[] = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchResults = await processBatch(
        batch,
        priorities,
        forteProfile,
        careerProfile,
        i
      );
      results.push(...batchResults);
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error analyzing job matches:", error);
    return NextResponse.json(
      { error: "An error occurred while analyzing job matches" },
      { status: 500 }
    );
  }
}

async function processBatch(
  jobs: JobMatchRequest["jobs"],
  priorities: IPriority[],
  forteProfile: IForteProfile,
  careerProfile: ICareerProfile,
  startIndex: number
): Promise<PriorityMatchResult[]> {
  const systemPrompt = `You are an AI career advisor specialized in matching job opportunities with candidate priorities and profiles.

You will analyze job descriptions against the candidate's priorities, forte profile, and career profile to provide match scores.

For each job, evaluate how well it matches each priority category on a scale of 1-10, then calculate an overall weighted score.

Priorities and their weights:
${priorities
  .map(
    (p) =>
      `- ${p.name} (Weight: ${p.weight}%): Best fit: ${p.bestFit}, Medium fit: ${p.mediumFit}, Worst fit: ${p.worstFit}`
  )
  .join("\n")}

Candidate Profile:
${
  forteProfile
    ? `Purpose: ${forteProfile.purpose}
Strengths: ${forteProfile.strengths}
Motivations: ${forteProfile.motivations}
Passions: ${forteProfile.passions}`
    : "No forte profile available"
}

${
  careerProfile
    ? `Experience: ${careerProfile.experienceSummary}
Core Competencies: ${careerProfile.coreCompetencies}
Admirable Organizations: ${careerProfile.admirableOrganizations?.join(", ")}`
    : "No career profile available"
}

Return your analysis in the following JSON format:
{
  "jobAnalyses": [
    {
      "jobIndex": 0,
      "overallScore": 7.5,
      "priorityBreakdown": [
        {
          "priorityName": "Values Alignment",
          "score": 8,
          "reasoning": "Brief explanation of why this score was given"
        }
      ]
    }
  ]
}

Ensure scores are realistic and well-reasoned based on the job description content.`;

  const userPrompt = `Please analyze the following ${
    jobs.length
  } job(s) against the candidate's priorities:

${jobs
  .map(
    (job, index) =>
      `Job ${index + 1}:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Description: ${job.description.substring(0, 2000)}...

`
  )
  .join("\n")}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(response);

    // Adjust job indices to account for batch processing
    return parsed.jobAnalyses.map((analysis) => ({
      ...analysis,
      jobIndex: analysis.jobIndex + startIndex,
    }));
  } catch (error) {
    console.error("Error processing batch:", error);
    // Return default scores if OpenAI fails
    return jobs.map((_, index) => ({
      jobIndex: startIndex + index,
      overallScore: 5,
      priorityBreakdown: priorities.map((p) => ({
        priorityName: p.name,
        score: 5,
        reasoning: "Analysis unavailable",
      })),
    }));
  }
}
