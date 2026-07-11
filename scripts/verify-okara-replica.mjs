import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const pagePath = join(root, "src/pages/okara.tsx");
const dataPath = join(root, "src/data/okaraReplica.js");
const require = createRequire(import.meta.url);

assert.ok(existsSync(pagePath), "src/pages/okara.tsx should exist");
assert.ok(existsSync(dataPath), "src/data/okaraReplica.js should exist");

const data = require(dataPath);
const pageSource = readFileSync(pagePath, "utf8");

const requiredExports = [
  "marketingAgents",
  "companyDocuments",
  "analyticsTabs",
  "agentFeed",
  "terminalLines",
  "faqItems",
  "accountMenuItems",
  "openSeoWorkflows",
  "openSeoRecommendations",
];

for (const exportName of requiredExports) {
  assert.ok(Array.isArray(data[exportName]), `${exportName} should be an array`);
  assert.ok(data[exportName].length > 0, `${exportName} should not be empty`);
}

assert.ok(
  data.marketingAgents.length >= 10,
  "marketingAgents should cover the public homepage agent grid",
);

assert.deepEqual(
  data.analyticsTabs.map((tab) => tab.id),
  ["seo", "links", "technical", "geo"],
  "analytics tabs should match the observed dashboard tabs",
);

for (const label of [
  "Meet Okara, the AI CMO",
  "Okara Terminal",
  "Company",
  "Analytics",
  "Agents Feed",
  "Talk to AI CMO",
  "Agents Settings",
  "Chat history",
  "OpenSEO audit engine",
  "Start New Audit",
  "Include Lighthouse",
  "Keyword research",
  "Backlinks",
  "AI Visibility",
  "Apply fix",
  "Run AI Analysis",
  "Live AI SEO analysis",
  "NEXT_PUBLIC_OKARA_SEO_API_URL",
  "AI analysis failed",
]) {
  assert.ok(pageSource.includes(label), `page should render ${label}`);
}

for (const action of ["Connect", "Hire Now", "Download", "Log out"]) {
  const actionInReplicaData = Object.values(data).some(
    (value) => Array.isArray(value) && JSON.stringify(value).includes(action),
  );
  assert.ok(
    pageSource.includes("placeholderAction") && (pageSource.includes(action) || actionInReplicaData),
    `${action} should be represented as a placeholder action`,
  );
}

assert.equal(pageSource.includes("\u2014"), false, "visible copy should avoid em dashes");
assert.equal(pageSource.includes("\u2013"), false, "visible copy should avoid en dashes");

console.log("Okara replica coverage verified");
