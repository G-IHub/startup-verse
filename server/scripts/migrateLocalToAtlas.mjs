/**
 * migrateLocalToAtlas.mjs
 * Copies all collections from local dev MongoDB → production Atlas.
 * Safe to run multiple times — upserts by _id, never duplicates.
 *
 * Usage:
 *   ATLAS_URI="<your-atlas-uri>" node server/scripts/migrateLocalToAtlas.mjs
 *
 * Or add ATLAS_URI to server/.env and run:
 *   node server/scripts/migrateLocalToAtlas.mjs
 */

import { MongoClient } from "mongodb";
import "dotenv/config";

const LOCAL_URI = "mongodb://127.0.0.1:27017/startupverse_dev";
const ATLAS_URI = process.env.ATLAS_URI || process.env.MONGODB_CONNECTION_URI;
const ATLAS_DB = process.env.MONGODB_DB_NAME || "startupverse";

if (!ATLAS_URI) {
  console.error("Error: set ATLAS_URI or MONGODB_CONNECTION_URI in your environment.");
  process.exit(1);
}

// Collections to migrate — order matters for referential sanity
const COLLECTIONS = [
  "users",
  "startups",
  "tasks",
  "milestones",
  "goals",
  "actiontypes",
  "agents",
  "autonomysettings",
  "agentevents",
  "agentmessages",
  "agentconversations",
  "hostedsites",
  "formsubmissions",
  "saveditems",
  "memberships",
  "invitations",
  "teamroles",
];

async function migrate() {
  console.log("Connecting to local MongoDB...");
  const local = new MongoClient(LOCAL_URI);
  await local.connect();
  const localDb = local.db("startupverse_dev");

  console.log("Connecting to Atlas...");
  const atlas = new MongoClient(ATLAS_URI, { tls: true });
  await atlas.connect();
  const atlasDb = atlas.db(ATLAS_DB);

  for (const colName of COLLECTIONS) {
    const localCol = localDb.collection(colName);
    const count = await localCol.countDocuments();

    if (count === 0) {
      console.log(`  ${colName}: empty, skipping`);
      continue;
    }

    const docs = await localCol.find({}).toArray();
    const atlasCol = atlasDb.collection(colName);

    let upserted = 0;
    let unchanged = 0;
    for (const doc of docs) {
      const result = await atlasCol.replaceOne(
        { _id: doc._id },
        doc,
        { upsert: true }
      );
      if (result.upsertedCount > 0 || result.modifiedCount > 0) upserted++;
      else unchanged++;
    }

    console.log(`  ${colName}: ${upserted} upserted, ${unchanged} unchanged (${count} total)`);
  }

  await local.close();
  await atlas.close();
  console.log("\nMigration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
