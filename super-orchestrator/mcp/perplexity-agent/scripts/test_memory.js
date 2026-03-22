import { intelligence } from "../src/intelligence.js";
import { db } from "../src/db.js";
async function testIntelligence() {
    console.log("🧠 Testing Super-Orchestrator v3.0 Intelligence Hub...");
    try {
        // 1. Save a lesson
        console.log("\n--- Step 1: Saving a high-quality lesson ---");
        await intelligence.saveLesson({
            taskDescription: "Create a TypeScript interface for a user profile with address.",
            preset: "pro-search",
            strategy: "Used strict typing and interface exports.",
            result: "export interface User { id: string; name: string; address: { street: string; city: string; }; }",
            successScore: 5,
            critique: "Perfect balance of simplicity and safety."
        });
        // 2. Scout for it
        console.log("\n--- Step 2: Scouting for similar tasks (User Profile) ---");
        const found = await intelligence.scoutSimilar("Create a profile for a customer with location");
        console.log(`Found ${found.length} relevant lessons.`);
        if (found.length > 0) {
            console.log("Memory injection preview:");
            console.log(intelligence.formatMemory(found));
        }
        else {
            console.error("❌ Failed to find the lesson that was just saved.");
        }
        // 3. Stats
        const col = await db.getCollection("lessons");
        const count = await col.countDocuments();
        console.log(`\nVerified: ${count} lessons total in MongoDB.`);
    }
    catch (err) {
        console.error("Verification failed:", err);
    }
    finally {
        await db.close();
        process.exit(0);
    }
}
testIntelligence();
