import mongoose, { type Model } from "mongoose";

export type CounterDocument = {
  name: string;
  seq: number;
};

const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 1000 },
});

const Counter =
  (mongoose.models.Counter as Model<CounterDocument> | undefined) ||
  mongoose.model<CounterDocument>("Counter", counterSchema);

export const STUDENT_ID_SEQ_START = 1000;

// atomic increment — safe for concurrent calls
export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return counter.seq;
}

export async function setSequence(name: string, seq: number): Promise<void> {
  await Counter.findOneAndUpdate(
    { name },
    { $set: { seq } },
    { upsert: true }
  );
}

export default Counter;
