import mongoose, { Schema, type Document } from "mongoose";

export interface IPriority extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  weight: number;
  currentScore: number;
  bestFit: string;
  mediumFit: string;
  worstFit: string;
  createdAt: Date;
  updatedAt: Date;
}

const PrioritySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    currentScore: { type: Number, required: true },
    bestFit: { type: String, required: true },
    mediumFit: { type: String, required: true },
    worstFit: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Priority ||
  mongoose.model<IPriority>("Priority", PrioritySchema);
