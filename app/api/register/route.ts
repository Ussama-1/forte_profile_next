import { NextResponse } from "next/server";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import User from "@/app/api/models/User";
import { z } from "zod";

// Validation schema
const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character"
    ),
});

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const body = await request.json();

    // Validate input
    const validationResult = userSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: { email: ["User with this email already exists"] } },
        { status: 400 }
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by the pre-save hook
    });

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json(
      { user: userObj, message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    );
  }
}
