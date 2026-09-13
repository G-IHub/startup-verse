/**
 * One-off migration: AgentMessage previously had no conversationId at all
 * (one single, endless thread per founder per agent). Now that a founder
 * can start a real "New chat", every existing message needs a real
 * conversationId — this backfill gives each founder's existing thread with
 * an agent one new, real, shared id, so nothing is lost and it becomes
 * exactly one real "past conversation" the History dropdown can show.
 *
 * Safe to re-run: only ever touches documents where conversationId is
 * missing.
 */
import mongoose from "mongoose";
import AgentMessage from "../src/models/AgentMessage.js";

const uri = process.env.MONGODB_CONNECTION_URI || "mongodb://127.0.0.1:27017/startupverse_dev";
await mongoose.connect(uri);

const pairs = await AgentMessage.aggregate([
  { $match: { conversationId: { $exists: false } } },
  { $group: { _id: { founderId: "$founderId", agentId: "$agentId" } } },
]);

let updated = 0;
for (const { _id } of pairs) {
  const conversationId = new mongoose.Types.ObjectId();
  const result = await AgentMessage.updateMany(
    { founderId: _id.founderId, agentId: _id.agentId, conversationId: { $exists: false } },
    { $set: { conversationId } },
  );
  updated += result.modifiedCount;
  console.log(`founder ${_id.founderId} / agent ${_id.agentId} -> conversationId ${conversationId} (${result.modifiedCount} messages)`);
}

console.log(`Done. ${pairs.length} conversation(s) created, ${updated} message(s) updated.`);
await mongoose.disconnect();
