import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBoard extends Document {
  name: string;
  owner: Types.ObjectId;
  columnOrder: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const BoardSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    columnOrder: [
      {
        type: Schema.Types.ObjectId,
        ref: "Column",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IBoard>("Board", BoardSchema);
