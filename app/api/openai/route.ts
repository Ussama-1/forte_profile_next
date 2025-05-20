import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { connectMongoDB } from "@/app/api/lib/dbConnection";

import ForteProfile from "@/app/api/models/ForteProfile";
import CareerProfile from "@/app/api/models/CareerProfile";
import Priority from "@/app/api/models/Priority";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { prompt, type } = data;

    if (!prompt || !type) {
      return NextResponse.json(
        { error: "Prompt and type are required" },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    const responseFormat = { type: "json_object" as const };

    // Set system prompt based on type
    switch (type.toLowerCase()) {
      case "forte profile":
        systemPrompt = `You are an AI assistant specialized in analyzing career and personal development documents.
          
          Analyze the provided text and extract the following key elements:
          1. Purpose Statement: The individual's professional purpose or mission statement
          2. Strengths: Key professional strengths and abilities
          3. Motivations: What motivates the person professionally
          4. Professional Work Passions: What aspects of work they are passionate about
          
          Return the extracted information in the following JSON format:
          {
            "purpose": "The extracted purpose statement",
            "strengths": "The extracted strengths",
            "motivations": "The extracted motivations",
            "passions": "The extracted professional work passions"
          }
          
          If any element is not clearly stated in the text, provide a logical inference based on the available information or indicate "Not clearly stated in the document."
          Ensure each field contains comprehensive information while remaining concise.`;
        break;

      case "career profile":
        systemPrompt = `You are an AI assistant specialized in analyzing resumes and CVs.
          
          Analyze the provided CV/resume and extract the following key elements:
          1. Experience Summary: A concise summary of the person's professional experience
          2. Core Competencies: Key skills and competencies demonstrated in their career
          3. Admirable Organizations: Organizations mentioned that they might want to work for, or organizations similar to those they've worked with
          
          Return the extracted information in the following JSON format:
          {
            "experienceSummary": "The extracted experience summary",
            "coreCompetencies": "The extracted core competencies",
            "admirableOrganizations": ["Org 1", "Org 2", "Org 3", "Org 4", "Org 5"]
          }
          
          For admirableOrganizations, include up to 5 organizations. If fewer than 5 are mentioned, include only those that are mentioned.
          If any element is not clearly stated in the text, provide a logical inference based on the available information or indicate "Not clearly stated in the document."
          Ensure each field contains comprehensive information while remaining concise.`;
        break;

      case "priorities":
        systemPrompt = `You are an AI assistant specialized in analyzing career priorities documents.
          
          Analyze the provided text and extract the following career priorities with their importance weights and current scores:
          
          1. Values Alignment: How important alignment with organizational values is, descriptions of best/medium/worst fit
          2. Leveraging Gifts and Strengths: How important utilizing core strengths is, descriptions of best/medium/worst fit
          3. Leveraging Knowledge and Experience: How important applying previous experience is, descriptions of best/medium/worst fit
          4. Compensation: How important salary and benefits are, descriptions of best/medium/worst fit
          
          Return the extracted information in the following JSON format:
          {
            "priorities": [
              {
                "name": "Values Alignment",
                "weight": 35,
                "currentScore": 8,
                "bestFit": "Description of best fit scenario",
                "mediumFit": "Description of medium fit scenario",
                "worstFit": "Description of worst fit scenario"
              },
              {
                "name": "Leveraging Gifts and Strengths",
                "weight": 25,
                "currentScore": 5,
                "bestFit": "Description of best fit scenario",
                "mediumFit": "Description of medium fit scenario",
                "worstFit": "Description of worst fit scenario"
              },
              {
                "name": "Leveraging Knowledge and Experience",
                "weight": 15,
                "currentScore": 6,
                "bestFit": "Description of best fit scenario",
                "mediumFit": "Description of medium fit scenario",
                "worstFit": "Description of worst fit scenario"
              },
              {
                "name": "Compensation",
                "weight": 25,
                "currentScore": 4,
                "bestFit": "Description of best fit scenario",
                "mediumFit": "Description of medium fit scenario",
                "worstFit": "Description of worst fit scenario"
              }
            ]
          }
          
          Ensure the weights add up to 100. If specific weights are not provided, make a reasonable estimate based on the emphasis in the document.
          If current scores are not provided, estimate them based on the content.
          If any descriptions are not provided, create reasonable placeholders based on common career expectations.`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type specified" },
          { status: 400 }
        );
    }

    // Process with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: responseFormat,
    });

    const rawResponse = completion.choices[0].message.content;
    if (!rawResponse) {
      throw new Error("No response content received");
    }

    const parsedResponse = JSON.parse(rawResponse);
    const userId = session.user.id;

    // Save to database based on type
    let savedData;
    switch (type.toLowerCase()) {
      case "forte profile":
        savedData = await saveForteProfile(userId, parsedResponse);
        break;
      case "career profile":
        savedData = await saveCareerProfile(userId, parsedResponse);
        break;
      case "priorities":
        savedData = await savePriorities(userId, parsedResponse);
        break;
    }

    return NextResponse.json(
      { success: true, content: parsedResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}

async function saveForteProfile(userId: string, data: any) {
  const { purpose, strengths, motivations, passions } = data;

  // Find existing profile or create new one
  const profile = await ForteProfile.findOneAndUpdate(
    { userId },
    {
      purpose,
      strengths,
      motivations,
      passions,
    },
    { upsert: true, new: true }
  );

  return profile;
}

async function saveCareerProfile(userId: string, data: any) {
  const { experienceSummary, coreCompetencies, admirableOrganizations } = data;

  // Find existing profile or create new one
  const profile = await CareerProfile.findOneAndUpdate(
    { userId },
    {
      experienceSummary,
      coreCompetencies,
      admirableOrganizations,
    },
    { upsert: true, new: true }
  );

  return profile;
}

async function savePriorities(userId: string, data: any) {
  const { priorities } = data;

  // Delete existing priorities
  await Priority.deleteMany({ userId });

  // Create new priorities
  const savedPriorities = await Promise.all(
    priorities.map((priority: any) =>
      Priority.create({
        userId,
        name: priority.name,
        weight: priority.weight,
        currentScore: priority.currentScore,
        bestFit: priority.bestFit,
        mediumFit: priority.mediumFit,
        worstFit: priority.worstFit,
      })
    )
  );

  return savedPriorities;
}
