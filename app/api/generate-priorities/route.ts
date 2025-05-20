import { NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import CareerProfile from "../models/CareerProfile";
import ForteProfile from "../models/ForteProfile";
import Priority from "../models/Priority";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST() {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const careerProfile = await CareerProfile.findOne({ userId });
    const forteProfile = await ForteProfile.findOne({ userId });
    const priorities = await Priority.find({ userId });

    // Construct a prompt for OpenAI
    const systemPrompt = `You are an AI career advisor specialized in analyzing career priorities. 
    
    Based on the user's input, generate personalized career priorities with appropriate weights, current scores, and fit scenarios.
    
    The priorities should include:
    1. Values Alignment - How important alignment with organizational values is
    2. Leveraging Gifts and Strengths - How important utilizing core strengths is
    3. Leveraging Knowledge and Experience - How important applying previous experience is
    4. Compensation - How important salary and benefits are
    
    For each priority, provide:
    - A weight (percentage importance) that reflects how important this priority is based on the user's input
    - A current score (1-10) that estimates their current satisfaction in this area
    - Descriptions of best fit, medium fit, and worst fit scenarios
    
    The weights must add up to 100%.
    
    Return the data in the following JSON format:
    {
      "priorities": [
        {
          "name": "Values Alignment",
          "weight": 35,
          "currentScore": 7,
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
    }`;

    const userPrompt = `
    Career profile: ${careerProfile || "not specified"}
    forte profile: ${forteProfile || "Not specified"}
    priorities: ${priorities || "Not specified"}
    
    
    Based on this information, generate personalized career priorities for me.`;

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
          content: userPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const rawResponse = completion.choices[0].message.content;
    if (!rawResponse) {
      throw new Error("No response content received");
    }

    const parsedResponse = JSON.parse(rawResponse);

    return NextResponse.json(
      { success: true, data: parsedResponse },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating priorities:", error);
    return NextResponse.json(
      { error: "An error occurred while generating priorities" },
      { status: 500 }
    );
  }
}
