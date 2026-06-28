import fs from "fs";
import path from "path";

async function run() {
  const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
  const { projectId, apiKey } = config;
  const dbId = "(default)";

  const collections = [
    "newsletter-subscribers-cml",
    "newsletter-subscribers-ramada",
    "newsletter-subscribers-wyndham"
  ];

  console.log(`Inspecting Firestore projectId: ${projectId}, databaseId: ${dbId}`);

  for (const col of collections) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${col}?pageSize=10&key=${apiKey}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        const docCount = data.documents ? data.documents.length : 0;
        console.log(`Collection '${col}': Found ${docCount} documents.`);
      } else {
        console.log(`Collection '${col}': Fetch failed with status ${res.status}`);
      }
    } catch (e: any) {
      console.log(`Collection '${col}': Exception ${e.message}`);
    }
  }
}

run();
