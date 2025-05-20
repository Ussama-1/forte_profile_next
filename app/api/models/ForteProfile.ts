import mongoose, { Schema, type Document } from "mongoose";

export interface IForteProfile extends Document {
  userId: mongoose.Types.ObjectId;
  purpose: string;
  strengths: string;
  motivations: string;
  passions: string;
  createdAt: Date;
  updatedAt: Date;
}

const ForteProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    purpose: { type: String, required: true },
    strengths: { type: String, required: true },
    motivations: { type: String, required: true },
    passions: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ForteProfile ||
  mongoose.model<IForteProfile>("ForteProfile", ForteProfileSchema);
