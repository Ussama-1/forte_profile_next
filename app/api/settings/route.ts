import { NextResponse } from "next/server";
import { connectMongoDB } from "@/app/api/lib/dbConnection";
import User from "@/app/api/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import bcrypt from "bcryptjs";

// GET user settings
export async function GET(request: Request) {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching settings for user ID:", session.user.id);

    // Get user from database
    const user = await User.findById(session.user.id).select("-password");

    if (!user) {
      console.log("User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("User settings retrieved:", user);

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching settings" },
      { status: 500 }
    );
  }
}

// UPDATE user settings
export async function PUT(request: Request) {
  try {
    await connectMongoDB();

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      email,
      currentPassword,
      newPassword,
      phone,
      location,
      jobTitle,
      company,
      industry,
      experience,
    } = data;

    // Get user from database
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update basic info
    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== session.user.id) {
        return NextResponse.json(
          { error: "Email is already in use" },
          { status: 400 }
        );
      }
      user.email = email;
    }

    // Update profile info - explicitly set each field even if undefined
    user.phone = phone !== undefined ? phone : user.phone;
    user.location = location !== undefined ? location : user.location;
    user.jobTitle = jobTitle !== undefined ? jobTitle : user.jobTitle;
    user.company = company !== undefined ? company : user.company;
    user.industry = industry !== undefined ? industry : user.industry;
    user.experience = experience !== undefined ? experience : user.experience;

    // Update password if provided
    if (currentPassword && newPassword) {
      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = newPassword;
    }

    // Save updated user
    await user.save();

    // Return user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "An error occurred while updating settings" },
      { status: 500 }
    );
  }
}
