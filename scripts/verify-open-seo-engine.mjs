import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const enginePath = join(root, "src/lib/openSeoEngine.js");
const pagePath = join(root, "src/pages/okara.tsx");

assert.ok(existsSync(enginePath), "src/lib/openSeoEngine.js should exist");
assert.ok(existsSync(pagePath), "src/pages/okara.tsx should exist");

const {
  applySeoRecommendation,
  buildImplementationQueue,
  createOpenSeoAudit,
  normalizeAuditInput,
} = require(enginePath);

for (const [name, value] of Object.entries({
  applySeoRecommendation,
  buildImplementationQueue,
  createOpenSeoAudit,
  normalizeAuditInput,
})) {
  assert.equal(typeof value, "function", `${name} should be exported`);
}

const auditInput = normalizeAuditInput({
  startUrl: "https://enconvo.com",
  maxPages: 50,
  lighthouseStrategy: "auto",
  competitors: ["Raycast", "PopClip", "Alter"],
  keywords: ["macOS AI assistant", "Raycast AI alternative"],
  pages: [
    {
      path: "/",
      status: 200,
      title: "EnConvo - AI Agent Launcher for macOS",
      description: "",
      h1Count: 1,
      wordCount: 842,
      canonical: "",
      openGraph: {},
      structuredData: false,
      robotsAllowed: false,
      llmsTxt: false,
      images: [
        { src: "/hero.png", alt: "" },
        { src: "/logo.png", alt: "Enconvo logo" },
      ],
      performance: {
        responseMs: 185,
        lighthouse: { performance: 91, seo: 82, accessibility: 88 },
      },
    },
    {
      path: "/downloads",
      status: 200,
      title: "Download EnConvo",
      description: "Download EnConvo for macOS.",
      h1Count: 1,
      wordCount: 416,
      canonical: "https://enconvo.com/downloads",
      openGraph: { title: "Download EnConvo" },
      structuredData: true,
      robotsAllowed: true,
      llmsTxt: false,
      images: [],
      performance: {
        responseMs: 142,
        lighthouse: { performance: 96, seo: 94, accessibility: 92 },
      },
    },
  ],
});

assert.equal(auditInput.startUrl, "https://enconvo.com", "URL should normalize without a trailing slash");
assert.equal(auditInput.maxPages, 50, "maxPages should keep valid values");

const audit = createOpenSeoAudit(auditInput);
assert.equal(audit.stats.pagesCrawled, 2, "audit should count pages");
assert.equal(audit.stats.totalImagesMissingAlt, 1, "audit should count missing image alt text");
assert.equal(audit.stats.avgLighthouseSeo, 88, "audit should average Lighthouse SEO scores");
assert.ok(audit.recommendations.length >= 5, "audit should generate multiple actionable recommendations");

const recommendationIds = audit.recommendations.map((item) => item.id);
for (const expectedId of [
  "canonical-tags",
  "open-graph-tags",
  "image-alt-text",
  "llms-txt",
  "structured-data",
  "comparison-pages",
]) {
  assert.ok(recommendationIds.includes(expectedId), `audit should recommend ${expectedId}`);
}

assert.deepEqual(
  audit.recommendations.map((item) => item.priorityRank).slice().sort((a, b) => a - b),
  audit.recommendations.map((item) => item.priorityRank),
  "recommendations should be sorted by priority",
);

const queue = buildImplementationQueue(audit);
assert.equal(queue.length, audit.recommendations.length, "implementation queue should cover every recommendation");
assert.ok(
  queue.every((item) => item.patch && item.patch.files.length > 0),
  "each queue item should include implementation patch files",
);

const canonicalPatch = applySeoRecommendation(audit, "canonical-tags");
assert.equal(canonicalPatch.applied, true, "canonical recommendation should be applicable");
assert.ok(
  canonicalPatch.patch.files.some((file) => file.path.includes("src/pages")),
  "canonical patch should point at page-level SEO implementation",
);
assert.ok(
  canonicalPatch.patch.preview.includes('rel="canonical"'),
  "canonical patch preview should include a canonical link",
);

const llmsPatch = applySeoRecommendation(audit, "llms-txt");
assert.ok(
  llmsPatch.patch.files.some((file) => file.path === "public/llms.txt"),
  "llms.txt patch should create public/llms.txt",
);

const pageSource = readFileSync(pagePath, "utf8");
for (const label of [
  "createOpenSeoAudit",
  "buildImplementationQueue",
  "Implementation patch preview",
  "Applied SEO patch",
  "Recommendation evidence",
]) {
  assert.ok(pageSource.includes(label), `/okara page should include ${label}`);
}

assert.equal(pageSource.includes("\u2014"), false, "visible copy should avoid em dashes");
assert.equal(pageSource.includes("\u2013"), false, "visible copy should avoid en dashes");

console.log("OpenSEO engine behavior verified");
