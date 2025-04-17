import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITask extends Document {
  title: string;
  description: string;
  board: Types.ObjectId;
  column: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    board: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Board",
    },
    column: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Column",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);
