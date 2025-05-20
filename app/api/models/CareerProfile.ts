import mongoose, { Schema, type Document } from "mongoose";

export interface ICareerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  experienceSummary: string;
  coreCompetencies: string;
  admirableOrganizations: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CareerProfileSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    experienceSummary: { type: String, required: true },
    coreCompetencies: { type: String, required: true },
    admirableOrganizations: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.CareerProfile ||
  mongoose.model<ICareerProfile>("CareerProfile", CareerProfileSchema);
