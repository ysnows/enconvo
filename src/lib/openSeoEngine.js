const PRIORITY_RANK = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const LIGHTHOUSE_STRATEGIES = new Set(["auto", "all", "manual", "none"]);

function trimTrailingSlash(value) {
  if (value.length <= 1) return value;
  return value.replace(/\/+$/, "");
}

function normalizeStartUrl(value) {
  const rawValue = typeof value === "string" && value.trim() ? value.trim() : "https://enconvo.com";
  const withProtocol = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  const parsed = new URL(withProtocol);
  const normalizedPath = parsed.pathname === "/" ? "" : trimTrailingSlash(parsed.pathname);
  return `${parsed.origin}${normalizedPath}`;
}

function clampNumber(value, min, max, fallback) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return fallback;
  return Math.max(min, Math.min(max, Math.round(numberValue)));
}

function normalizePath(path) {
  if (typeof path !== "string" || !path.trim()) return "/";
  const trimmed = path.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    const parsed = new URL(trimmed);
    return parsed.pathname || "/";
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizePage(page = {}) {
  const images = Array.isArray(page.images) ? page.images : [];
  const lighthouse = page.performance?.lighthouse || {};

  return {
    path: normalizePath(page.path || page.url),
    status: clampNumber(page.status, 100, 599, 200),
    title: typeof page.title === "string" ? page.title : "",
    description: typeof page.description === "string" ? page.description : "",
    h1Count: clampNumber(page.h1Count, 0, 20, 0),
    wordCount: clampNumber(page.wordCount, 0, 100000, 0),
    canonical: typeof page.canonical === "string" ? page.canonical.trim() : "",
    openGraph: page.openGraph && typeof page.openGraph === "object" ? page.openGraph : {},
    structuredData: Boolean(page.structuredData),
    robotsAllowed: page.robotsAllowed !== false,
    llmsTxt: Boolean(page.llmsTxt),
    images: images.map((image) => ({
      src: typeof image.src === "string" ? image.src : "",
      alt: typeof image.alt === "string" ? image.alt : "",
    })),
    performance: {
      responseMs: clampNumber(page.performance?.responseMs, 0, 60000, 0),
      lighthouse: {
        performance: clampNumber(lighthouse.performance, 0, 100, 0),
        seo: clampNumber(lighthouse.seo, 0, 100, 0),
        accessibility: clampNumber(lighthouse.accessibility, 0, 100, 0),
      },
    },
  };
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
    : [];
}

function normalizeAuditInput(input = {}) {
  const pages = Array.isArray(input.pages) && input.pages.length > 0 ? input.pages : [{ path: "/" }];
  const lighthouseStrategy = LIGHTHOUSE_STRATEGIES.has(input.lighthouseStrategy)
    ? input.lighthouseStrategy
    : "auto";

  return {
    startUrl: normalizeStartUrl(input.startUrl),
    maxPages: clampNumber(input.maxPages, 10, 10000, 50),
    lighthouseStrategy,
    competitors: normalizeStringArray(input.competitors),
    keywords: normalizeStringArray(input.keywords),
    pages: pages.map(normalizePage),
  };
}

function average(values) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return 0;
  return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
}

function routeUrl(startUrl, path) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = normalizePath(path);
  return normalizedPath === "/" ? `${startUrl}/` : `${startUrl}${normalizedPath}`;
}

function hasOpenGraphGap(page) {
  const openGraph = page.openGraph || {};
  return !openGraph.title || !openGraph.description || !openGraph.image;
}

function collectSignals(input) {
  const pages = input.pages;
  const pagesMissingCanonical = pages.filter((page) => !page.canonical);
  const pagesMissingOpenGraph = pages.filter(hasOpenGraphGap);
  const imagesMissingAlt = pages.flatMap((page) =>
    page.images
      .filter((image) => !image.alt.trim())
      .map((image) => ({ page: page.path, src: image.src })),
  );
  const pagesMissingStructuredData = pages.filter((page) => !page.structuredData);
  const robotsBlockedPages = pages.filter((page) => !page.robotsAllowed);
  const thinPages = pages.filter((page) => page.wordCount > 0 && page.wordCount < 600);
  const llmsTxtMissing = pages.some((page) => !page.llmsTxt);

  return {
    pagesMissingCanonical,
    pagesMissingOpenGraph,
    imagesMissingAlt,
    pagesMissingStructuredData,
    robotsBlockedPages,
    thinPages,
    llmsTxtMissing,
    hasComparisonOpportunity: input.competitors.length > 0 || input.keywords.length > 0,
    hasBacklinkOpportunity: input.competitors.length > 0,
  };
}

function createRecommendation({ id, source, priority, title, reason, implementation, evidence }) {
  return {
    id,
    source,
    priority,
    priorityRank: PRIORITY_RANK[priority] || PRIORITY_RANK.Low,
    title,
    reason,
    implementation,
    evidence,
  };
}

function createRecommendations(input, signals) {
  const recommendations = [];

  if (signals.pagesMissingCanonical.length > 0) {
    recommendations.push(
      createRecommendation({
        id: "canonical-tags",
        source: "Site Audits",
        priority: "High",
        title: "Add canonical URL tags to core pages",
        reason: "Missing canonicals can split ranking signals when crawlers discover duplicate or parameterized URLs.",
        implementation: "Add a route-specific canonical link in each page Head block.",
        evidence: signals.pagesMissingCanonical.map((page) => `${page.path} is missing rel canonical`),
      }),
    );
  }

  if (signals.pagesMissingOpenGraph.length > 0) {
    recommendations.push(
      createRecommendation({
        id: "open-graph-tags",
        source: "Site Audits",
        priority: "High",
        title: "Complete Open Graph and Twitter tags",
        reason: "Social previews and AI citation surfaces need explicit page titles, descriptions, and images.",
        implementation: "Add og:title, og:description, og:image, twitter:card, and twitter:image values.",
        evidence: signals.pagesMissingOpenGraph.map((page) => `${page.path} has incomplete social metadata`),
      }),
    );
  }

  if (signals.pagesMissingStructuredData.length > 0) {
    recommendations.push(
      createRecommendation({
        id: "structured-data",
        source: "AI Visibility",
        priority: "High",
        title: "Add Organization and SoftwareApplication schema",
        reason: "Structured data gives search and AI crawlers a clean entity description for Enconvo.",
        implementation: "Add JSON-LD with product, organization, operating system, and offer details.",
        evidence: signals.pagesMissingStructuredData.map((page) => `${page.path} has no structured data flag`),
      }),
    );
  }

  if (signals.robotsBlockedPages.length > 0) {
    recommendations.push(
      createRecommendation({
        id: "robots-policy",
        source: "Technical SEO",
        priority: "High",
        title: "Publish a crawler-friendly robots policy",
        reason: "Robots rules should allow important pages and expose sitemap discovery.",
        implementation: "Publish public/robots.txt with crawl allow rules and a sitemap URL.",
        evidence: signals.robotsBlockedPages.map((page) => `${page.path} is not marked crawlable`),
      }),
    );
  }

  if (signals.imagesMissingAlt.length > 0) {
    recommendations.push(
      createRecommendation({
        id: "image-alt-text",
        source: "Site Audits",
        priority: "Medium",
        title: "Fix missing image alt text",
        reason: "Missing alt text weakens accessibility and image-search context for product screenshots.",
        implementation: "Add descriptive alt text to each product image and provider logo.",
        evidence: signals.imagesMissingAlt.map((image) => `${image.page} image ${image.src || "unknown"} has no alt text`),
      }),
    );
  }

  if (signals.llmsTxtMissing) {
    recommendations.push(
      createRecommendation({
        id: "llms-txt",
        source: "AI Visibility",
        priority: "Medium",
        title: "Publish llms.txt for AI crawlers",
        reason: "A concise llms.txt helps answer engines understand the product, audience, and canonical facts.",
        implementation: "Create public/llms.txt with product facts, primary pages, and comparison context.",
        evidence: ["No audited page reports llms.txt coverage"],
      }),
    );
  }

  if (signals.hasComparisonOpportunity) {
    const competitorText = input.competitors.slice(0, 3).join(", ") || "tracked competitors";
    recommendations.push(
      createRecommendation({
        id: "comparison-pages",
        source: "Keyword research",
        priority: "Medium",
        title: "Create high-intent comparison pages",
        reason: "OpenSEO-style keyword research uses competitor and alternative queries to find bottom-funnel topics.",
        implementation: "Draft comparison pages around Raycast AI alternative, PopClip workflows, and local AI assistant searches.",
        evidence: [`Competitor or keyword seed exists: ${competitorText}`],
      }),
    );
  }

  if (signals.hasBacklinkOpportunity) {
    recommendations.push(
      createRecommendation({
        id: "backlink-prospects",
        source: "Backlinks",
        priority: "Low",
        title: "Build a backlink prospect list",
        reason: "Referring-domain reviews can turn competitor mentions into manual outreach targets.",
        implementation: "Queue developer directories, macOS newsletters, AI tooling roundups, and comparison sites.",
        evidence: [`${input.competitors.length} competitors are available for prospect mining`],
      }),
    );
  }

  return recommendations.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return a.title.localeCompare(b.title);
  });
}

function createOpenSeoAudit(rawInput = {}) {
  const input = normalizeAuditInput(rawInput);
  const signals = collectSignals(input);
  const recommendations = createRecommendations(input, signals);

  return {
    input,
    stats: {
      pagesCrawled: input.pages.length,
      totalUrls: input.pages.length,
      lighthouseTests: input.lighthouseStrategy === "none" ? 0 : input.pages.length,
      avgResponseMs: average(input.pages.map((page) => page.performance.responseMs)),
      avgLighthousePerformance: average(input.pages.map((page) => page.performance.lighthouse.performance)),
      avgLighthouseSeo: average(input.pages.map((page) => page.performance.lighthouse.seo)),
      avgLighthouseA11y: average(input.pages.map((page) => page.performance.lighthouse.accessibility)),
      totalImagesMissingAlt: signals.imagesMissingAlt.length,
      totalIssues: recommendations.length,
    },
    pages: input.pages.map((page) => ({
      url: page.path,
      status: String(page.status),
      title: page.title || "Missing title",
      h1: String(page.h1Count),
      words: page.wordCount.toLocaleString("en-US"),
      images: page.images.length === 0
        ? "ok"
        : `${page.images.filter((image) => !image.alt.trim()).length} missing alt`,
      speed: page.performance.responseMs ? `${page.performance.responseMs}ms` : "n/a",
    })),
    signals,
    recommendations,
  };
}

function createPatchForRecommendation(audit, recommendation) {
  const startUrl = audit.input.startUrl;
  const homepage = audit.input.pages.find((page) => page.path === "/") || audit.input.pages[0];

  const patches = {
    "canonical-tags": {
      files: audit.signals.pagesMissingCanonical.map((page) => ({
        path: `src/pages${page.path === "/" ? "/index" : page.path}.tsx`,
        action: "Add a canonical link in the page Head block",
      })),
      preview: audit.signals.pagesMissingCanonical
        .map((page) => `<link rel="canonical" href="${routeUrl(startUrl, page.path)}" />`)
        .join("\n"),
    },
    "open-graph-tags": {
      files: audit.signals.pagesMissingOpenGraph.map((page) => ({
        path: `src/pages${page.path === "/" ? "/index" : page.path}.tsx`,
        action: "Add Open Graph and Twitter card meta tags",
      })),
      preview: [
        `<meta property="og:title" content="${homepage.title || "Enconvo"}" />`,
        `<meta property="og:description" content="${homepage.description || "AI productivity for macOS workflows."}" />`,
        `<meta property="og:image" content="${startUrl}/og/enconvo.png" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
      ].join("\n"),
    },
    "structured-data": {
      files: [{ path: "src/components/SeoSoftwareSchema.tsx", action: "Add reusable SoftwareApplication JSON-LD" }],
      preview: JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Enconvo",
          applicationCategory: "ProductivityApplication",
          operatingSystem: "macOS",
          url: `${startUrl}/`,
        },
        null,
        2,
      ),
    },
    "robots-policy": {
      files: [{ path: "public/robots.txt", action: "Publish crawl allow rules and sitemap discovery" }],
      preview: [`User-agent: *`, `Allow: /`, `Sitemap: ${startUrl}/sitemap.xml`].join("\n"),
    },
    "image-alt-text": {
      files: [{ path: "src/pages/index.tsx", action: "Replace empty alt attributes on product imagery" }],
      preview: `alt="Enconvo macOS AI assistant showing a system-wide command workflow"`,
    },
    "llms-txt": {
      files: [{ path: "public/llms.txt", action: "Create an AI crawler summary file" }],
      preview: [
        "# Enconvo",
        "",
        "Enconvo is a macOS AI productivity companion for system-wide commands, context-aware chat, voice input, and extension workflows.",
        "",
        `Primary URL: ${startUrl}/`,
        "Audience: Mac power users, developers, writers, and operators.",
      ].join("\n"),
    },
    "comparison-pages": {
      files: [
        { path: "src/pages/compare/raycast-ai-alternative.tsx", action: "Draft competitor comparison landing page" },
        { path: "src/pages/compare/popclip-ai-workflows.tsx", action: "Draft selected-text workflow comparison page" },
      ],
      preview: [
        "Target pages:",
        "- Raycast AI alternative for macOS automation",
        "- PopClip AI workflows vs system-wide AI commands",
        "- Local AI assistant for Mac with model choice",
      ].join("\n"),
    },
    "backlink-prospects": {
      files: [{ path: "content/seo/backlink-prospects.md", action: "Create a manual outreach queue" }],
      preview: [
        "Prospect categories:",
        "- macOS app directories",
        "- AI productivity newsletters",
        "- developer tool roundups",
        "- workflow automation blogs",
      ].join("\n"),
    },
  };

  return patches[recommendation.id] || {
    files: [{ path: "content/seo/recommendations.md", action: "Document manual SEO follow-up" }],
    preview: recommendation.implementation,
  };
}

function buildImplementationQueue(audit) {
  return audit.recommendations.map((recommendation) => ({
    ...recommendation,
    patch: createPatchForRecommendation(audit, recommendation),
  }));
}

function applySeoRecommendation(audit, recommendationId) {
  const queueItem = buildImplementationQueue(audit).find((item) => item.id === recommendationId);

  if (!queueItem) {
    return {
      applied: false,
      message: "Recommendation not found",
      patch: { files: [], preview: "" },
    };
  }

  return {
    applied: true,
    message: `Applied SEO patch: ${queueItem.title}`,
    recommendation: queueItem,
    patch: queueItem.patch,
  };
}

module.exports = {
  applySeoRecommendation,
  buildImplementationQueue,
  createOpenSeoAudit,
  normalizeAuditInput,
};
