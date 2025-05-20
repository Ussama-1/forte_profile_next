import { NextResponse } from "next/server";
import { connectMongoDB } from "@/app/api/lib/dbConnection";

import CareerProfile from "@/app/api/models/CareerProfile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET() {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile from database
    const careerProfile = await CareerProfile.findOne({
      userId: session.user.id,
    });

    if (!careerProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        experienceSummary: careerProfile.experienceSummary,
        coreCompetencies: careerProfile.coreCompetencies,
        admirableOrganizations: careerProfile.admirableOrganizations,
      },
    });
  } catch (error) {
    console.error("Error fetching career profile:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // Parse the text as JSON if it's already in JSON format
    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.warn(e);

      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "career profile",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process with OpenAI");
      }

      const data = await response.json();
      parsedData = data.content;
    }

    // Save to database
    const careerProfile = await CareerProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        experienceSummary: parsedData.experienceSummary,
        coreCompetencies: parsedData.coreCompetencies,
        admirableOrganizations: parsedData.admirableOrganizations,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: parsedData,
      profileId: careerProfile._id,
    });
  } catch (error) {
    console.error("Error processing career profile:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the document" },
      { status: 500 }
    );
  }
}
