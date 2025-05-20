import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface LinkedInJobParams {
  keywords?: string;
  location?: string;
  distance?: string;
  datePosted?: string;
  jobType?: string[];
  remoteFilter?: string;
  experienceLevel?: string[];
  industryFilter?: string[];
  salaryFilter?: string;
  limit?: number;
  companyName?: string[];
  companyId?: string[];
}

interface Job {
  id?: string | number;
  title: string;
  description: string;
  company?: string;
  location?: string;
  salaryRange?: string;
  postedDate?: string;
  matchScore?: number;
  requirements?: string[];
  benefits?: string[];
  priorityMatches?: { categoryName: string; score: number }[];
  source?: string;
  url?: string;
  applyLink?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: No active session found." },
        { status: 401 }
      );
    }
    if (!process.env.APIFY_API_TOKEN) {
      throw new Error("APIFY_API_TOKEN is not set in environment variables");
    }

    const params: LinkedInJobParams = await request.json();

    const {
      keywords = "",
      location = "",
      distance = "25",
      datePosted = "any",
      jobType = [],
      remoteFilter = "",
      experienceLevel = [],
      industryFilter = [],
      salaryFilter = "",
      limit = 20,
      companyName = [],
      companyId = [],
    } = params;

    connectMongoDB();

    const userId = session.user.id;

    await connectMongoDB();

    const careerProfile = await CareerProfile.findOne({ userId });
    const forteProfile = await ForteProfile.findOne({ userId });
    const priorities = await Priority.find({ userId });

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are a job-matching assistant that analyzes a user's career data to generate the most relevant job search keywords. response should be in json`,
        },
        {
          role: "user",
          content: JSON.stringify({
            careerProfile,
            forteProfile,
            priorities,
            incomingKeywords: keywords,
          }),
        },
      ],
      response_format: { type: "json_object" },
    });

    const aiGenerated = JSON.parse(
      completion.choices[0].message.content || "{}"
    );
    const finalKeywords = `${keywords}, ${aiGenerated.keywords || ""}`;

    console.log(aiGenerated);

    const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

    let url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(finalKeywords)}`;

    if (location) {
      url += `&location=${encodeURIComponent(location)}`;
    }

    if (distance) {
      url += `&distance=${distance}`;
    }

    if (datePosted !== "any") {
      const datePostedMap: Record<string, string> = {
        past24h: "r86400",
        pastWeek: "r604800",
        pastMonth: "r2592000",
      };
      if (datePostedMap[datePosted]) {
        url += `&f_TPR=${datePostedMap[datePosted]}`;
      }
    }

    if (jobType.length > 0) {
      const jobTypeMap: Record<string, string> = {
        fulltime: "F",
        parttime: "P",
        contract: "C",
        temporary: "T",
        volunteer: "V",
        internship: "I",
      };
      jobType.forEach((type) => {
        if (jobTypeMap[type]) {
          url += `&f_JT=${jobTypeMap[type]}`;
        }
      });
    }

    if (remoteFilter) {
      const remoteFilterMap: Record<string, string> = {
        remote: "remote",
        onsite: "onsite",
        hybrid: "hybrid",
      };
      if (remoteFilterMap[remoteFilter]) {
        url += `&f_WT=${remoteFilterMap[remoteFilter]}`;
      }
    }

    if (experienceLevel.length > 0) {
      const experienceLevelMap: Record<string, string> = {
        internship: "1",
        entry: "2",
        associate: "3",
        "mid-senior": "4",
        director: "5",
        executive: "6",
      };
      experienceLevel.forEach((level) => {
        if (experienceLevelMap[level]) {
          url += `&f_E=${experienceLevelMap[level]}`;
        }
      });
    }

    if (industryFilter.length > 0) {
      industryFilter.forEach((industry) => {
        url += `&f_I=${encodeURIComponent(industry)}`;
      });
    }

    if (salaryFilter) {
      const salaryFilterMap: Record<string, string> = {
        "$40,000+": "1",
        "$60,000+": "2",
        "$80,000+": "3",
        "$100,000+": "4",
        "$120,000+": "5",
      };
      if (salaryFilterMap[salaryFilter]) {
        url += `&f_SB=${salaryFilterMap[salaryFilter]}`;
      }
    }

    const input = {
      title: keywords,
      location,
      companyName,
      companyId,
      publishedAt: datePosted === "any" ? "" : datePosted,
      rows: limit,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"],
      },
      startUrls:
        companyName.length === 0 && companyId.length === 0 ? [{ url }] : [],
    };

    const run = await client.actor("BHzefUZlZRKWxkTck").call(input);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    const jobs = items.map((item, index) => {
      // Extract requirements from description if not provided
      const requirements =
        item.requirements ||
        item.skills ||
        extractRequirements(
          typeof item.description === "string"
            ? item.description
            : typeof item.jobDescription === "string"
            ? item.jobDescription
            : ""
        );
      // Extract benefits from description if not provided
      const benefits =
        item.benefits ||
        extractBenefits(
          typeof item.description === "string"
            ? item.description
            : typeof item.jobDescription === "string"
              ? item.jobDescription
              : ""
        );
      // Generate placeholder priorityMatches
      const priorityMatches = item.priorityMatches || [
        {
          categoryName: "Skills Match",
          score: Math.floor(Math.random() * 100),
        },
        {
          categoryName: "Experience Level",
          score: Math.floor(Math.random() * 100),
        },
      ];

      return {
        id: item.id || `job-${index}`,
        title: item.title || "Untitled Position",
        description: item.description || item.jobDescription || "",
        company: item.company || item.companyName || "Unknown Company",
        location:
          item.location || item.city || item.state || "Unknown Location",
        salaryRange: item.salary || item.salaryRange || undefined,
        postedDate:
          item.postedDate || item.datePosted || item.publishedAt || undefined,
        matchScore: item.matchScore || Math.floor(Math.random() * 10) + 1, // Random score 1-10
        requirements,
        benefits,
        priorityMatches,
        source: item.source || "LinkedIn",
        url: item.applyLink || item.applyUrl || item.url || undefined,
        applyLink: item.applyLink || item.applyUrl || undefined,
      };
    });

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length,
      searchParams: params,
    });
  } catch (error) {
    console.error("LinkedIn scraper error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

// Helper function to extract requirements from description
function extractRequirements(description: string): string[] {
  const lines = description.split("\n").map((line) => line.trim());
  const requirements = lines
    .filter(
      (line) =>
        line.toLowerCase().startsWith("•") ||
        line.toLowerCase().includes("require") ||
        line.toLowerCase().includes("qualification") ||
        line.toLowerCase().includes("skill")
    )
    .map((line) => line.replace(/^•\s*/, "")); // Remove bullet points
  return requirements.length > 0 ? requirements : ["Not specified"];
}

// Helper function to extract benefits from description
function extractBenefits(description: string): string[] {
  const lines = description.split("\n").map((line) => line.trim());
  const benefits = lines
    .filter(
      (line) =>
        line.toLowerCase().includes("benefit") ||
        line.toLowerCase().includes("perk") ||
        line.toLowerCase().includes("offer")
    )
    .map((line) => line.replace(/^•\s*/, "")); // Remove bullet points
  return benefits.length > 0 ? benefits : ["Not specified"];
}
