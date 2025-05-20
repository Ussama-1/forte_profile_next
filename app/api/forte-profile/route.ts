import { NextResponse } from "next/server";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import ForteProfile from "@/app/api/models/ForteProfile";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(request: Request) {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get profile from database
    const forteProfile = await ForteProfile.findOne({
      userId: session.user.id,
    });

    if (!forteProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: forteProfile });
  } catch (error) {
    console.error("Error fetching forte profile:", error);
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
      // If it's not valid JSON, use it as raw text for the OpenAI API
      // Redirect to the OpenAI API with the text and type
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/openai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "forte profile",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process with OpenAI");
      }

      const data = await response.json();
      parsedData = data.content;
    }

    // Save to database
    const forteProfile = await ForteProfile.findOneAndUpdate(
      { userId: session.user.id },
      {
        purpose: parsedData.purpose,
        strengths: parsedData.strengths,
        motivations: parsedData.motivations,
        passions: parsedData.passions,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: parsedData,
      profileId: forteProfile._id,
    });
  } catch (error) {
    console.error("Error processing forte profile:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the document" },
      { status: 500 }
    );
  }
}
