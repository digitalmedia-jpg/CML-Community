import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as fs from "fs";

async function main() {
  console.log("Reading firebase-applet-config.json...");
  const configRaw = fs.readFileSync("./firebase-applet-config.json", "utf8");
  const firebaseConfig = JSON.parse(configRaw);

  console.log("Initializing Firebase Client SDK...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");

  console.log("Reading mock_db_store.json...");
  const rawData = fs.readFileSync("./mock_db_store.json", "utf8");
  const data = JSON.parse(rawData);

  console.log("Filtering and seeding collections...");
  let count = 0;
  
  // We can write sequentially or in batches. Let's do it sequentially with a small delay or concurrently in chunks to be fast.
  const entries = Object.entries(data);
  console.log(`Total entries in mock store: ${entries.length}`);

  for (const [key, value] of entries) {
    const shouldSeed = 
      key.startsWith("newsletter-subscribers-") ||
      key.startsWith("restaurant-guests-") ||
      key.startsWith("lost-and-found-") ||
      key.startsWith("complaints-") ||
      key.startsWith("mailer-contacts-") ||
      key.startsWith("cml-signin-") ||
      key.startsWith("cml-geofence-") ||
      key.startsWith("hrms-") ||
      key.startsWith("huddle-tasks-") ||
      key.startsWith("flipbooks-") ||
      key.startsWith("daily-news") ||
      key.startsWith("ramada_form_submissions") ||
      key.startsWith("managed_cases") ||
      key.startsWith("google_forms_links") ||
      key.startsWith("it_tickets");

    if (shouldSeed) {
      try {
        const docRef = doc(db, key);
        await setDoc(docRef, value as any);
        count++;
        if (count % 20 === 0) {
          console.log(`Seeded ${count} documents...`);
        }
      } catch (e) {
        console.error(`Error seeding document key ${key}:`, e);
      }
    }
  }

  console.log(`Seeding completed! Successfully seeded ${count} documents.`);
}

main().catch(console.error);
