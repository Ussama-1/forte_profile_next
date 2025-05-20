import { NextResponse } from "next/server";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import Priority from "@/app/api/models/Priority";
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

    // Get priorities from database
    const priorities = await Priority.find({ userId: session.user.id });

    return NextResponse.json({
      success: true,
      data: {
        priorities: priorities,
      },
    });
  } catch (error) {
    console.error("Error fetching priorities:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching priorities" },
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
          type: "priorities",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process with OpenAI");
      }

      const data = await response.json();
      parsedData = data.content;
    }

    // Delete existing priorities
    await Priority.deleteMany({ userId: session.user.id });

    // Create new priorities
    const savedPriorities = await Promise.all(
      parsedData.priorities.map((priority: any) =>
        Priority.create({
          userId: session.user.id,
          name: priority.name,
          weight: priority.weight,
          currentScore: priority.currentScore,
          bestFit: priority.bestFit,
          mediumFit: priority.mediumFit,
          worstFit: priority.worstFit,
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("Error processing priorities:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the document" },
      { status: 500 }
    );
  }
}
