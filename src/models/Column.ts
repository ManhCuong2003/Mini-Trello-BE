import mongoose, { Document, Schema, Types } from "mongoose";

export interface IColumn extends Document {
  name: string;
  board: Types.ObjectId;
  taskOrder: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ColumnSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    board: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Board",
    },
    taskOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IColumn>("Column", ColumnSchema);
