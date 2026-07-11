import Head from "next/head";
import { useMemo, useState } from "react";
import {
  AtSign,
  Bot,
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  Globe2,
  History,
  Link as LinkIcon,
  Linkedin,
  Lock,
  Megaphone,
  MessageCircle,
  Moon,
  Paperclip,
  PenTool,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import okaraReplica from "@/data/okaraReplica";
import openSeoEngine from "@/lib/openSeoEngine";

const {
  accountMenuItems,
  agentFeed,
  analyticsTabs,
  companyDocuments,
  competitors,
  customerLogos,
  faqItems,
  marketingAgents,
  openSeoAuditSeed,
  openSeoAuditSnapshot,
  openSeoRecommendations,
  openSeoWorkflows,
  terminalLines,
} = okaraReplica;

const {
  applySeoRecommendation,
  buildImplementationQueue,
  createOpenSeoAudit,
} = openSeoEngine;

const okaraSeoApiUrl = process.env.NEXT_PUBLIC_OKARA_SEO_API_URL || "";

const iconMap: Record<string, any> = {
  influencer: Megaphone,
  reddit: MessageCircle,
  seo: Search,
  writer: PenTool,
  geo: Globe2,
  coding: Code2,
  ugc: Briefcase,
  twitter: X,
  linkedin: Linkedin,
  hackernews: Zap,
};

const statusStyles: Record<string, string> = {
  success: "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  danger: "text-red-700 bg-red-50 border-red-200",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function IconBadge({ id, className = "" }: { id: string; className?: string }) {
  const Icon = iconMap[id] || Bot;
  return (
    <span
      className={cx(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-white text-zinc-900 shadow-sm",
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={1.8} />
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "dark",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "dark" | "light" | "ghost";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:translate-y-px",
        variant === "dark" && "bg-zinc-950 text-white hover:bg-zinc-800",
        variant === "light" && "border border-zinc-200 bg-white text-zinc-950 hover:bg-zinc-50",
        variant === "ghost" && "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950",
        className,
      )}
    >
      {children}
    </button>
  );
}

function LandingView({ openDashboard }: { openDashboard: () => void }) {
  const repeatedLogos = useMemo(() => [...customerLogos, ...customerLogos], []);

  return (
    <main className="min-h-[100dvh] bg-[#f7f7f4] text-zinc-950">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <button
          type="button"
          onClick={openDashboard}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 underline underline-offset-4"
        >
          Looking for Private Chat?
        </button>
        <ActionButton onClick={openDashboard} variant="light" className="hidden sm:inline-flex">
          Go to Dashboard
        </ActionButton>
      </header>

      <section className="mx-auto flex min-h-[calc(100dvh-88px)] max-w-6xl flex-col items-center justify-center px-5 pb-16 pt-12 text-center">
        <button
          type="button"
          onClick={openDashboard}
          className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-px"
        >
          <Bot className="h-10 w-10 text-zinc-950" strokeWidth={1.8} />
          <span>
            <span className="block text-sm font-semibold">New - Influencer Agent</span>
            <span className="block text-xs text-zinc-500">Automate creator outreach</span>
          </span>
        </button>

        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-xl shadow-zinc-900/10">
          <Bot className="h-9 w-9" strokeWidth={1.8} />
        </div>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-zinc-950 sm:text-5xl">
          Meet Okara, the AI CMO
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-7 text-zinc-600">
          The only AI CMO you need for growth and marketing.
        </p>

        <div className="mt-10 flex w-full max-w-xl items-center gap-2 rounded-[24px] border border-zinc-200 bg-white p-2 shadow-[0_18px_70px_rgba(24,24,27,0.08)]">
          <span className="ml-3 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Bot className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <input
            aria-label="Website"
            className="min-w-0 flex-1 bg-transparent px-2 text-base text-zinc-500 outline-none"
            value="enconvo.com"
            readOnly
          />
          <ActionButton onClick={openDashboard} className="whitespace-nowrap rounded-[18px]">
            Go to Dashboard
            <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
          </ActionButton>
        </div>

        <p className="mt-12 text-sm text-zinc-400">CMO runs 10+ Marketing Agents Running 24/7</p>
        <div className="mt-5 grid grid-cols-5 gap-3 sm:flex sm:flex-wrap sm:justify-center">
          {marketingAgents.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={openDashboard}
              className="group flex flex-col items-center gap-2 text-xs text-zinc-500"
            >
              <IconBadge id={agent.id} className={agent.accent} />
              <span className="transition group-hover:text-zinc-950">{agent.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden border-y border-zinc-200 bg-white py-8">
        <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Used by 100,000+ users and trusted by teams at
        </p>
        <div className="flex min-w-max animate-[okara-marquee_36s_linear_infinite] gap-3 px-3 motion-reduce:animate-none">
          {repeatedLogos.map((name, index) => (
            <span
              key={`${name}-${index}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-700"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 text-[10px] font-bold text-white">
                {name[0]}
              </span>
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-semibold text-zinc-500">Your AI marketing co-pilot</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
            Everything a marketing team does, handled for you.
          </h2>
          <p className="mt-5 max-w-xl text-zinc-600">
            You stay in control. CMO does the heavy lifting, prepares drafts, and leaves publishing to you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {marketingAgents.slice(0, 8).map((agent, index) => (
            <article
              key={agent.id}
              className={cx(
                "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm",
                index === 0 && "sm:col-span-2",
              )}
            >
              <div className="flex items-center gap-3">
                <IconBadge id={agent.id} className={agent.accent} />
                <h3 className="font-semibold text-zinc-950">{agent.label}</h3>
              </div>
              <p className="mt-4 text-sm leading-6 text-zinc-600">{agent.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-zinc-950 px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold text-zinc-400">The $14,000/mo job for $99/mo</p>
          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">What CMO replaces vs. what it costs</h2>
          <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
            {[
              ["What needs doing", "Without CMO", "With CMO"],
              ["Full time marketing hire", "$5,000/mo", "$99/mo"],
              ["SEO agency", "$4,000/mo", "Included"],
              ["Content writer", "$1,500/mo", "Included"],
              ["Social media manager", "$1,500/mo", "Included"],
              ["AI search visibility", "Not possible", "Included"],
            ].map((row, index) => (
              <div
                key={row[0]}
                className={cx(
                  "grid grid-cols-3 gap-4 px-4 py-4 text-sm sm:px-6",
                  index === 0 ? "bg-white/10 font-semibold text-white" : "border-t border-white/10 text-zinc-300",
                )}
              >
                <span>{row[0]}</span>
                <span>{row[1]}</span>
                <span className="font-semibold text-white">{row[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-20 sm:px-8">
        <h2 className="text-3xl font-bold text-zinc-950">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {faqItems.map(([question, answer]) => (
            <details key={question} className="group rounded-2xl border border-zinc-200 bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-zinc-950">
                {question}
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" strokeWidth={1.8} />
              </summary>
              <p className="mt-4 text-sm leading-6 text-zinc-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-3xl font-bold text-zinc-950">Ready to grow?</h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600">
            Enter your website and let the AI CMO handle the rest.
          </p>
          <div className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-[24px] border border-zinc-200 bg-zinc-50 p-2">
            <input
              aria-label="CTA website"
              className="min-w-0 flex-1 bg-transparent px-4 text-zinc-500 outline-none"
              value="enconvo.com"
              readOnly
            />
            <ActionButton onClick={openDashboard}>Go to Dashboard</ActionButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-5 py-10 text-sm text-zinc-500 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Bot className="h-7 w-7 text-zinc-950" strokeWidth={1.8} />
            <span className="font-semibold text-zinc-950">Okara</span>
            <span>Your AI CMO for growth and marketing.</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {["Blog", "Changelog", "Docs", "LLMs.txt Generator", "Pricing", "Affiliates"].map((item) => (
              <button key={item} type="button" onClick={openDashboard} className="hover:text-zinc-950">
                {item}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

function TopTerminal({
  collapsed,
  setCollapsed,
  openHome,
  accountOpen,
  setAccountOpen,
  placeholderAction,
}: {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  openHome: () => void;
  accountOpen: boolean;
  setAccountOpen: (value: boolean) => void;
  placeholderAction: (label: string) => void;
}) {
  return (
    <header className="border-b border-zinc-800 bg-[#10100f] text-white">
      <div className="flex h-12 items-center justify-between gap-3 border-b border-zinc-800 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle terminal"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <ChevronDown className={cx("h-4 w-4 transition", collapsed && "-rotate-90")} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            onClick={openHome}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/15"
          >
            <Bot className="h-4 w-4" strokeWidth={1.8} />
            enconvo.com
          </button>
          <span className="hidden items-center gap-2 text-sm text-zinc-400 sm:inline-flex">
            <Bot className="h-4 w-4" strokeWidth={1.8} />
            Okara Terminal
          </span>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen(!accountOpen)}
            className="flex items-center gap-2 rounded-full border border-white/10 px-2 py-1 text-sm hover:bg-white/10"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-700 text-xs font-semibold">
              EA
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block text-zinc-100">Enconvo AI</span>
              <span className="block text-xs text-zinc-400">20 Credits</span>
            </span>
            <ChevronDown className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-11 z-40 w-72 rounded-2xl border border-zinc-200 bg-white p-2 text-zinc-950 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-zinc-100 p-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-700 text-sm font-semibold text-white">
                  EA
                </span>
                <div>
                  <p className="font-semibold">Enconvo AI</p>
                  <p className="text-xs text-zinc-500">enconvoai@gmail.com</p>
                  <p className="mt-1 text-xs font-medium text-zinc-700">20 Credits</p>
                </div>
                <button
                  type="button"
                  onClick={() => placeholderAction("Toggle theme")}
                  aria-label="Toggle theme"
                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-100"
                >
                  <Moon className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
              <div className="py-2">
                {accountMenuItems.map((item) => {
                  const isBilling = item === "Add Website" || item === "Add Team Member";
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => placeholderAction(item)}
                      className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-100"
                    >
                      <span>{item}</span>
                      {isBilling && <span className="text-xs text-zinc-500">{item === "Add Website" ? "$99 / mo" : "$20 / mo"}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className="h-40 overflow-hidden px-5 py-3 font-mono text-xs leading-6 text-zinc-300 sm:h-44">
          <button type="button" className="mb-1 text-zinc-400 hover:text-white">
            &gt; Load older history
          </button>
          <p className="text-zinc-500">-- 29 Jun (UTC) --</p>
          {terminalLines.map((line) => (
            <p key={line}>
              <span className="text-zinc-500">&gt;</span> {line}
            </p>
          ))}
        </div>
      )}
    </header>
  );
}

function CompanyPanel({
  editMode,
  setEditMode,
  openDocument,
  articlesOpen,
  setArticlesOpen,
}: {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  openDocument: (doc: any) => void;
  articlesOpen: boolean;
  setArticlesOpen: (value: boolean) => void;
}) {
  const articlesDoc = companyDocuments.find((doc) => doc.id === "articles");

  return (
    <aside className="min-w-0 border-r border-zinc-200 bg-white">
      <PanelHeader title="Company" />
      <div className="space-y-7 p-4">
        <div>
          <div className="mb-4 flex items-start justify-between gap-3">
            <a href="https://enconvo.com" target="_blank" rel="noreferrer" className="flex items-center gap-2 font-semibold text-zinc-900">
              <Bot className="h-5 w-5" strokeWidth={1.8} />
              Enconvo
            </a>
            <button
              type="button"
              onClick={() => setEditMode(true)}
              aria-label="Edit company"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Edit3 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs font-medium text-zinc-500">
                  Team
                  <input className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" placeholder="Team" type="number" />
                </label>
                <label className="space-y-1 text-xs font-medium text-zinc-500">
                  Category
                  <select className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900">
                    <option>Category...</option>
                    <option>SaaS</option>
                    <option>AI productivity assistant</option>
                    <option>API / Developer Tool</option>
                  </select>
                </label>
              </div>
              <label className="space-y-1 text-xs font-medium text-zinc-500">
                Social handle
                <input className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" placeholder="yourhandle" />
              </label>
              <label className="space-y-1 text-xs font-medium text-zinc-500">
                Profile URL
                <input className="h-9 w-full rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900" placeholder="profile or company URL" />
              </label>
              <label className="space-y-1 text-xs font-medium text-zinc-500">
                Description
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm leading-6 text-zinc-900 outline-none focus:border-zinc-900"
                  defaultValue="Enconvo is a macOS desktop AI companion that sits across your entire system. It helps users invoke AI anywhere without leaving their current app."
                />
              </label>
              <div className="flex justify-end gap-2">
                <ActionButton variant="light" onClick={() => setEditMode(false)}>
                  Cancel
                </ActionButton>
                <ActionButton onClick={() => setEditMode(false)}>Save</ActionButton>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
                >
                  Add team size & category
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
                >
                  Improve writing quality
                </button>
              </div>
              <p className="text-sm leading-6 text-zinc-600">
                Enconvo is a macOS desktop AI companion that sits across your entire system: sidebars, floating toolbars,
                and a command bar. Users can select text, share their screen, chat with documents, run voice commands,
                and build custom workflows powered by their choice of AI model.
              </p>
            </>
          )}
        </div>

        <div>
          <SectionLabel>Documents</SectionLabel>
          <div className="mt-3 space-y-1">
            {companyDocuments.map((doc) => {
              const isArticles = doc.id === "articles";
              return (
                <div key={doc.id}>
                  <button
                    type="button"
                    onClick={() => (isArticles ? setArticlesOpen(!articlesOpen) : openDocument(doc))}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                  >
                    <span className="flex items-center gap-2">
                      {isArticles ? <Briefcase className="h-4 w-4 text-zinc-400" strokeWidth={1.8} /> : <FileText className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />}
                      {doc.title}
                    </span>
                    <span className="flex items-center gap-2">
                      {doc.badge && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{doc.badge}</span>}
                      <ChevronDown className={cx("h-4 w-4 text-zinc-400 transition", isArticles && articlesOpen && "rotate-180")} strokeWidth={1.8} />
                    </span>
                  </button>
                  {isArticles && articlesOpen && articlesDoc?.children && (
                    <div className="ml-6 mt-1 space-y-1">
                      {articlesDoc.children.map((title) => (
                        <button
                          key={title}
                          type="button"
                          onClick={() => openDocument({ ...articlesDoc, title })}
                          className="block w-full rounded-lg px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          {title}
                        </button>
                      ))}
                      <button type="button" className="mt-2 rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white">
                        Upgrade
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <SectionLabel>Competitors</SectionLabel>
            <button type="button" aria-label="Edit competitors" className="text-zinc-400 hover:text-zinc-900">
              <Edit3 className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {competitors.map((competitor) => (
              <a
                key={competitor.name}
                href={competitor.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-950 text-[10px] font-bold text-white">
                  {competitor.name[0]}
                </span>
                {competitor.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

function AnalyticsPanel({
  activeTab,
  setActiveTab,
  placeholderAction,
  showToast,
}: {
  activeTab: string;
  setActiveTab: (value: string) => void;
  placeholderAction: (label: string) => void;
  showToast: (message: string) => void;
}) {
  const tab = analyticsTabs.find((item) => item.id === activeTab) || analyticsTabs[0];
  const openSeoAudit = useMemo(() => createOpenSeoAudit(openSeoAuditSeed), []);
  const openSeoImplementationQueue = useMemo(() => buildImplementationQueue(openSeoAudit), [openSeoAudit]);
  const [openSeoAuditState, setOpenSeoAuditState] = useState<"ready" | "running" | "complete">("complete");
  const [appliedOpenSeoFixes, setAppliedOpenSeoFixes] = useState<string[]>([]);
  const [selectedOpenSeoPatch, setSelectedOpenSeoPatch] = useState<any | null>(null);
  const [liveSeoState, setLiveSeoState] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [liveSeoResult, setLiveSeoResult] = useState<any | null>(null);
  const [liveSeoError, setLiveSeoError] = useState("");

  function startOpenSeoAudit() {
    setOpenSeoAuditState("running");
    window.setTimeout(() => {
      setOpenSeoAuditState("complete");
      showToast("OpenSEO local audit refreshed.");
    }, 700);
  }

  function applyOpenSeoFix(id: string, title: string) {
    const result = applySeoRecommendation(openSeoAudit, id);
    if (!result.applied) {
      showToast(result.message);
      return;
    }
    setAppliedOpenSeoFixes((current) => (current.includes(id) ? current : [...current, id]));
    setSelectedOpenSeoPatch(result);
    showToast(result.message || `Applied SEO patch: ${title}`);
  }

  async function runLiveSeoAnalysis() {
    if (!okaraSeoApiUrl) {
      setLiveSeoState("error");
      setLiveSeoError("NEXT_PUBLIC_OKARA_SEO_API_URL is not configured.");
      showToast("AI analysis failed: API URL is missing.");
      return;
    }

    setLiveSeoState("running");
    setLiveSeoError("");

    try {
      const response = await fetch(okaraSeoApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: openSeoAudit.input.startUrl,
          keywords: openSeoAudit.input.keywords,
          competitors: openSeoAudit.input.competitors,
          maxSearchResults: 5,
        }),
      });
      const json = await response.json();
      if (!response.ok || json.ok === false) {
        throw new Error(json.error || `SEO API returned ${response.status}`);
      }

      setLiveSeoResult(json);
      setLiveSeoState("complete");
      showToast("Live AI SEO analysis complete.");
    } catch (error: any) {
      const message = error?.message || "AI analysis failed.";
      setLiveSeoState("error");
      setLiveSeoError(message);
      showToast(`AI analysis failed: ${message}`);
    }
  }

  return (
    <section className="min-w-0 border-r border-zinc-200 bg-white">
      <PanelHeader title="Analytics" icon={<LinkIcon className="h-4 w-4" strokeWidth={1.8} />} />
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="grid flex-1 grid-cols-4 rounded-xl bg-zinc-100 p-1 text-sm">
            {analyticsTabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={cx(
                  "rounded-lg px-3 py-2 font-medium transition",
                  activeTab === item.id ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-950",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-zinc-200 bg-[#fffdf8] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Connect Google Services</p>
            <button type="button" onClick={() => placeholderAction("Dismiss")} className="text-zinc-400 hover:text-zinc-900">
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Google Analytics", "Search Console"].map((service) => (
              <button
                key={service}
                type="button"
                onClick={() => placeholderAction("Connect")}
                className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm hover:border-zinc-300"
              >
                <p className="font-semibold text-zinc-900">{service}</p>
                <p className="mt-1 text-xs text-zinc-500">{service === "Google Analytics" ? "Traffic & behavior" : "Search rankings"}</p>
                <span className="mt-5 block rounded-xl bg-zinc-950 px-3 py-2 text-center text-xs font-semibold text-white">Connect</span>
              </button>
            ))}
          </div>
        </div>

        <OpenSeoAuditPanel
          audit={openSeoAudit}
          auditState={openSeoAuditState}
          appliedFixes={appliedOpenSeoFixes}
          implementationQueue={openSeoImplementationQueue}
          onStartAudit={startOpenSeoAudit}
          onApplyFix={applyOpenSeoFix}
          placeholderAction={placeholderAction}
          selectedPatch={selectedOpenSeoPatch}
          liveSeoState={liveSeoState}
          liveSeoResult={liveSeoResult}
          liveSeoError={liveSeoError}
          onRunLiveSeoAnalysis={runLiveSeoAnalysis}
        />

        {tab.locked ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
            <Lock className="h-8 w-8 text-zinc-400" strokeWidth={1.8} />
            <h3 className="mt-4 font-semibold text-zinc-950">{tab.title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{tab.description}</p>
            <ActionButton className="mt-5" onClick={() => placeholderAction("Hire your AI CMO")}>
              Hire your AI CMO
            </ActionButton>
          </div>
        ) : tab.id === "technical" ? (
          <div className="space-y-5">
            <MetricGrid metrics={tab.metrics || []} />
            <MetricGroup title="Server Timing" rows={tab.timing || []} />
            <MetricGroup
              title="Social Media Tags"
              rows={[
                ["og:title", "EnConvo - AI Agent Launcher for macOS"],
                ["og:type", "website"],
                ["twitter:card", "summary_large_image"],
                ["twitter:site", "@enconvo_ai"],
              ]}
            />
          </div>
        ) : tab.id === "geo" ? (
          <div className="space-y-5">
            <DashboardCard title={tab.title} description={tab.description} meta="5/10">
              <SignalRows rows={tab.rows || []} />
            </DashboardCard>
            <MetricGroup title="Site Files" rows={tab.files || []} />
            <div className="rounded-2xl border border-dashed border-zinc-300 p-5 text-center">
              <Lock className="mx-auto h-5 w-5 text-zinc-400" strokeWidth={1.8} />
              <p className="mt-2 text-sm font-semibold text-zinc-900">Locked feature</p>
              <p className="mt-1 text-xs text-zinc-500">Unlock to see AI mentions, competitor visibility, and keyword insights.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-xs text-zinc-400">Last audited: 29/06/2026</p>
            <DashboardCard title={tab.title} description={tab.description}>
              <SignalRows rows={tab.rows || []} />
            </DashboardCard>
            <DashboardCard title="Issues" description="Detected on-page problems" meta="6">
              <div className="space-y-2">
                {(tab.issues || []).map((issue) => (
                  <div key={issue} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                    <span className="text-zinc-700">{issue}</span>
                    <span className="text-xs font-semibold text-amber-700">Warning</span>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        )}
      </div>
    </section>
  );
}

function OpenSeoAuditPanel({
  audit,
  auditState,
  appliedFixes,
  implementationQueue,
  onStartAudit,
  onApplyFix,
  placeholderAction,
  selectedPatch,
  liveSeoState,
  liveSeoResult,
  liveSeoError,
  onRunLiveSeoAnalysis,
}: {
  audit: any;
  auditState: "ready" | "running" | "complete";
  appliedFixes: string[];
  implementationQueue: any[];
  onStartAudit: () => void;
  onApplyFix: (id: string, title: string) => void;
  placeholderAction: (label: string) => void;
  selectedPatch: any | null;
  liveSeoState: "idle" | "running" | "complete" | "error";
  liveSeoResult: any | null;
  liveSeoError: string;
  onRunLiveSeoAnalysis: () => void;
}) {
  const isRunning = auditState === "running";
  const isLiveSeoRunning = liveSeoState === "running";
  const auditStats = [
    ["Pages Crawled", String(audit.stats.pagesCrawled)],
    ["Total URLs", String(audit.stats.totalUrls)],
    ["Lighthouse Tests", String(audit.stats.lighthouseTests)],
    ["Avg Response", `${audit.stats.avgResponseMs}ms`],
    ["Avg Lighthouse Perf", String(audit.stats.avgLighthousePerformance)],
    ["Avg Lighthouse SEO", String(audit.stats.avgLighthouseSeo)],
    ["Avg Lighthouse A11y", String(audit.stats.avgLighthouseA11y)],
    ["Missing Alt Text", String(audit.stats.totalImagesMissingAlt)],
  ];

  return (
    <section className="mb-5 rounded-2xl border border-zinc-200 bg-zinc-950 p-4 text-white">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">OpenSEO audit engine</p>
          <h3 className="mt-2 text-lg font-semibold">SEO suggestions and implementation queue</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Adapted from OpenSEO workflows: Site Audits, Lighthouse, Keyword research, Backlinks, competitor insights,
            rank tracking, Google Search Console, and AI Visibility. Paid APIs are left as placeholders.
          </p>
        </div>
        <ActionButton onClick={() => placeholderAction("Connect DataForSEO")} variant="light" className="shrink-0">
          Connect DataForSEO
        </ActionButton>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h4 className="font-semibold">Start New Audit</h4>
          <div className="mt-4 grid gap-3">
            <label className="space-y-2 text-sm font-medium text-zinc-300">
              Audit URL
              <input
                value={audit.input.startUrl}
                readOnly
                className="h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-zinc-300">
                Max pages
                <input
                  type="number"
                  value={audit.input.maxPages}
                  readOnly
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/10 px-3 text-sm text-white outline-none"
                />
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-sm font-medium text-zinc-300">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-white/20" />
                Include Lighthouse
              </label>
            </div>
            <ActionButton onClick={onStartAudit} variant="light" className="w-full">
              {isRunning ? "Running audit..." : "Start New Audit"}
            </ActionButton>
            <button
              type="button"
              onClick={onRunLiveSeoAnalysis}
              disabled={isLiveSeoRunning}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-zinc-400"
            >
              <Sparkles className="h-4 w-4" strokeWidth={1.8} />
              {isLiveSeoRunning ? "Running AI analysis..." : "Run AI Analysis"}
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-zinc-400">
            True OpenSEO execution would call DataForSEO, Search Console, Cloudflare Workers workflows, D1 storage,
            and Lighthouse payload exports. This replica runs a local deterministic audit preview.
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <h4 className="font-semibold">Workflow coverage</h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {openSeoWorkflows.map((workflow: any) => (
              <button
                key={workflow.name}
                type="button"
                onClick={() => placeholderAction(workflow.name)}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-left hover:bg-white/[0.08]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{workflow.name}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-950">{workflow.metric}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{workflow.summary}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {auditState === "complete" && (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {auditStats.map(([label, value]: string[]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.4fr_0.45fr_1fr_0.4fr_0.55fr_0.8fr_0.55fr] gap-3 bg-white/10 px-3 py-2 text-xs font-semibold text-zinc-300">
              <span>URL</span>
              <span>Status</span>
              <span>Title</span>
              <span>H1</span>
              <span>Words</span>
              <span>Images</span>
              <span>Speed</span>
            </div>
            {audit.pages.map((page: any) => (
              <div
                key={page.url}
                className="grid grid-cols-[1.4fr_0.45fr_1fr_0.4fr_0.55fr_0.8fr_0.55fr] gap-3 border-t border-white/10 px-3 py-2 text-xs text-zinc-400"
              >
                <span className="truncate text-white">{page.url}</span>
                <span>{page.status}</span>
                <span className="truncate">{page.title}</span>
                <span>{page.h1}</span>
                <span>{page.words}</span>
                <span>{page.images}</span>
                <span>{page.speed}</span>
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-semibold">OpenSEO recommendations</h4>
            <div className="mt-3 grid gap-3">
              {implementationQueue.map((recommendation: any) => {
                const isApplied = appliedFixes.includes(recommendation.id);
                return (
                  <article key={recommendation.id} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-zinc-950">
                            {recommendation.priority}
                          </span>
                          <span className="text-xs font-semibold text-zinc-400">{recommendation.source}</span>
                        </div>
                        <h5 className="mt-2 font-semibold text-white">{recommendation.title}</h5>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">{recommendation.reason}</p>
                        <p className="mt-2 text-sm leading-6 text-zinc-300">{recommendation.implementation}</p>
                        <details className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <summary className="cursor-pointer text-xs font-semibold text-zinc-300">
                            Recommendation evidence
                          </summary>
                          <ul className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                            {recommendation.evidence.map((item: string) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </details>
                      </div>
                      <ActionButton
                        onClick={() => onApplyFix(recommendation.id, recommendation.title)}
                        variant={isApplied ? "light" : "dark"}
                        className={cx("shrink-0 whitespace-nowrap", !isApplied && "border border-white/15")}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-4 w-4" strokeWidth={1.8} />
                            Applied locally
                          </>
                        ) : (
                          "Apply fix"
                        )}
                      </ActionButton>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold">Live AI SEO analysis</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Calls the Worker SEO service at NEXT_PUBLIC_OKARA_SEO_API_URL. The Worker keeps OpenAI, Exa MCP,
                  and Tavily keys server-side.
                </p>
              </div>
              <span className={cx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                liveSeoState === "complete" && "bg-emerald-50 text-emerald-700",
                liveSeoState === "error" && "bg-red-50 text-red-700",
                liveSeoState !== "complete" && liveSeoState !== "error" && "bg-white text-zinc-950",
              )}>
                {liveSeoState === "complete" ? "Connected" : liveSeoState === "error" ? "Error" : "Ready"}
              </span>
            </div>

            {liveSeoError && (
              <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                AI analysis failed: {liveSeoError}
              </div>
            )}

            {liveSeoResult ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-zinc-300">Search source</p>
                  <p className="mt-2 text-lg font-semibold text-white">{liveSeoResult.search?.provider || "unknown"}</p>
                  <p className="mt-2 text-xs leading-5 text-zinc-400">{liveSeoResult.search?.query}</p>
                  <div className="mt-3 space-y-2">
                    {(liveSeoResult.search?.results || []).slice(0, 3).map((result: any) => (
                      <a
                        key={`${result.url}-${result.title}`}
                        href={result.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs hover:bg-white/[0.08]"
                      >
                        <span className="block font-semibold text-white">{result.title}</span>
                        <span className="mt-1 block truncate text-zinc-500">{result.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-zinc-300">OpenAI summary</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{liveSeoResult.analysis?.summary}</p>
                  <div className="mt-3 space-y-2">
                    {(liveSeoResult.analysis?.recommendations || []).slice(0, 3).map((item: any) => (
                      <div key={`${item.id}-${item.title}`} className="rounded-lg bg-white/[0.05] p-3 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-zinc-950">{item.priority || "Medium"}</span>
                          <span className="font-semibold text-white">{item.title}</span>
                        </div>
                        <p className="mt-2 leading-5">{item.implementation}</p>
                      </div>
                    ))}
                  </div>
                  {(liveSeoResult.analysis?.implementationPlan || []).length > 0 && (
                    <details className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-zinc-300">Implementation plan</summary>
                      <div className="mt-2 space-y-1 text-xs leading-5 text-zinc-400">
                        {liveSeoResult.analysis.implementationPlan.map((item: any) => (
                          <p key={`${item.file}-${item.change}`}>
                            <span className="font-semibold text-white">{item.file}</span>: {item.change}
                          </p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-zinc-400">
                Start with Run AI Analysis to use the Worker crawler, Exa MCP or Tavily search, and OpenAI analysis.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="font-semibold">Implementation patch preview</h4>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  Apply fix generates a local implementation plan with files and code snippets. It does not write files
                  until a developer reviews the patch.
                </p>
              </div>
              {selectedPatch && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Applied SEO patch
                </span>
              )}
            </div>
            {selectedPatch ? (
              <div className="mt-4 grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs font-semibold text-zinc-300">Files</p>
                  <div className="mt-2 space-y-2">
                    {selectedPatch.patch.files.map((file: any) => (
                      <div key={`${file.path}-${file.action}`} className="rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-zinc-400">
                        <p className="font-semibold text-white">{file.path}</p>
                        <p className="mt-1">{file.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-5 text-zinc-300">
                  {selectedPatch.patch.preview}
                </pre>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-white/15 bg-black/20 p-4 text-sm text-zinc-400">
                Select Apply fix on any recommendation to preview the exact SEO implementation patch.
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function AgentsFeed({
  expandedAgent,
  setExpandedAgent,
  openSettings,
}: {
  expandedAgent: string | null;
  setExpandedAgent: (value: string | null) => void;
  openSettings: () => void;
}) {
  return (
    <section className="min-w-0 border-r border-zinc-200 bg-white">
      <PanelHeader
        title="Agents Feed"
        icon={
          <button
            type="button"
            onClick={openSettings}
            aria-label="Content instructions settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <Settings className="h-4 w-4" strokeWidth={1.8} />
          </button>
        }
      />
      <div className="divide-y divide-zinc-200">
        {agentFeed.map((agent) => {
          const isOpen = expandedAgent === agent.id;
          const agentId = agent.id === "x" ? "twitter" : agent.id;
          return (
            <article key={agent.id}>
              <button
                type="button"
                onClick={() => setExpandedAgent(isOpen ? null : agent.id)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-zinc-50"
              >
                <IconBadge id={agentId} className="h-8 w-8 rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold uppercase text-zinc-900">{agent.title}</span>
                  <span className="block truncate text-sm text-zinc-500">{agent.summary}</span>
                </span>
                <ChevronDown className={cx("h-4 w-4 text-zinc-400 transition", isOpen && "rotate-180")} strokeWidth={1.8} />
              </button>
              {isOpen && (
                <div className="space-y-2 bg-zinc-50 px-16 pb-4 text-sm text-zinc-600">
                  {agent.details.map((detail) => (
                    <p key={detail} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                      {detail}
                    </p>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChatPanel({
  placeholderAction,
  chatDraft,
  setChatDraft,
}: {
  placeholderAction: (label: string) => void;
  chatDraft: string;
  setChatDraft: (value: string) => void;
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "AI CMO",
      content:
        "hi, i'm your cmo. thanks for bringing me on.\n\nif you've paid to rent me fully, every day i'll send you:\n\n- 2 seo / geo issues to fix\n- 1 written article\n- 2 reddit opportunities\n- 1 tweet\n- 1 linkedin post (coming soon)\n\nelse, let me at least set up the basic strategy for you and share some docs.\n\nlet's grow.",
    },
  ]);

  function sendLocalMessage() {
    if (!chatDraft.trim()) return;
    setMessages((current) => [
      ...current,
      { role: "You", content: chatDraft.trim() },
      {
        role: "AI CMO",
        content: "Local replica response: live AI execution is intentionally left empty, but the chat shell and message flow are wired.",
      },
    ]);
    setChatDraft("");
  }

  return (
    <aside className="min-w-0 bg-white">
      <div className="border-b border-zinc-200 bg-zinc-950 p-4 text-white">
        <div className="flex items-center gap-3">
          <Bot className="h-9 w-9" strokeWidth={1.8} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Hire your full-time CMO</p>
            <p className="text-sm text-zinc-400">AI-powered marketing at $99/month</p>
          </div>
          <ActionButton variant="light" onClick={() => placeholderAction("Hire Now")} className="whitespace-nowrap">
            Hire Now
          </ActionButton>
        </div>
      </div>

      <PanelHeader
        title="Talk to AI CMO"
        icon={
          <div className="relative flex items-center gap-1">
            {[
              ["Connect WhatsApp", MessageCircle],
              ["Connect Telegram", Send],
              ["New chat", Plus],
            ].map(([label, Icon]: any) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => placeholderAction(label)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <Icon className="h-4 w-4" strokeWidth={1.8} />
              </button>
            ))}
            <button
              type="button"
              aria-label="Chat history"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <History className="h-4 w-4" strokeWidth={1.8} />
            </button>
            {historyOpen && (
              <div className="absolute right-0 top-9 z-30 w-64 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-xl">
                <p className="font-semibold text-zinc-900">Chat history</p>
                <p className="mt-1 text-xs text-zinc-500">Manage your AI CMO chats</p>
                <button
                  type="button"
                  onClick={() => {
                    setMessages([]);
                    setHistoryOpen(false);
                  }}
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                >
                  1
                  <span>New chat</span>
                </button>
                <div className="mt-2 flex gap-2">
                  <ActionButton variant="light" onClick={() => placeholderAction("Rename")} className="flex-1 text-xs">
                    Rename
                  </ActionButton>
                  <ActionButton variant="light" onClick={() => placeholderAction("Delete")} className="flex-1 text-xs">
                    Delete
                  </ActionButton>
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="flex h-[calc(100dvh-304px)] flex-col">
        <div className="flex-1 space-y-4 overflow-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
              <MessageCircle className="h-8 w-8 text-zinc-400" strokeWidth={1.8} />
              <p className="mt-3 font-semibold text-zinc-900">New chat</p>
              <p className="mt-1 text-sm text-zinc-500">Ask the local AI CMO shell anything. Live model calls are not connected.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <p className="mb-3 text-xs font-semibold text-zinc-500">{message.role}</p>
                <div className="whitespace-pre-line text-sm leading-6 text-zinc-700">{message.content}</div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-zinc-200 p-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            <textarea
              aria-label="Ask me anything"
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
              placeholder="Ask me anything..."
              className="min-h-[84px] w-full resize-none bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <button type="button" aria-label="Attach file" onClick={() => placeholderAction("Attach file")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white hover:text-zinc-900">
                  <Paperclip className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button type="button" aria-label="Mention" onClick={() => placeholderAction("Mention")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-white hover:text-zinc-900">
                  <AtSign className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
              <button
                type="button"
                onClick={sendLocalMessage}
                disabled={!chatDraft.trim()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950 text-white transition hover:bg-zinc-800 disabled:bg-zinc-300"
              >
                <Send className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SettingsDrawer({
  open,
  onClose,
  placeholderAction,
}: {
  open: boolean;
  onClose: () => void;
  placeholderAction: (label: string) => void;
}) {
  if (!open) return null;
  return (
    <Drawer title="Agents Settings" onClose={onClose}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-zinc-950">SEO Analysis</h3>
            <Toggle />
          </div>
          <label className="block space-y-2 text-sm font-medium text-zinc-600">
            Market / Language
            <select className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-zinc-900">
              {["United States (English)", "United Kingdom (English)", "Canada (English)", "Australia (English)", "France (French)", "Germany (German)", "Japan (Japanese)"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs leading-5 text-zinc-500">
            Sets the market for GEO data. Prior data from other markets is preserved.
          </p>
        </div>

        {["Reddit", "X / Twitter", "LinkedIn", "Articles"].map((section) => (
          <div key={section} className="rounded-2xl border border-zinc-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-950">{section}</h3>
              <Toggle />
            </div>
            <label className="block space-y-2 text-sm font-medium text-zinc-600">
              Writing instructions
              <textarea
                className="min-h-[92px] w-full rounded-xl border border-zinc-200 p-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900"
                placeholder="Sound helpful, concise, and never over-promotional."
              />
            </label>
            {section === "Reddit" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-zinc-600">
                  Search region
                  <select className="h-10 w-full rounded-xl border border-zinc-200 px-3 text-zinc-900 outline-none focus:border-zinc-900">
                    <option>Global (no filter)</option>
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>Japan</option>
                  </select>
                </label>
                <div className="space-y-2 text-sm font-medium text-zinc-600">
                  Priority subreddits
                  <button type="button" onClick={() => placeholderAction("Add subreddit")} className="h-10 w-full rounded-xl border border-zinc-200 text-zinc-900 hover:bg-zinc-50">
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function DocumentDrawer({
  doc,
  onClose,
  placeholderAction,
}: {
  doc: any | null;
  onClose: () => void;
  placeholderAction: (label: string) => void;
}) {
  if (!doc) return null;
  return (
    <Drawer title={doc.title} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-2">
        <ActionButton variant="light" onClick={() => placeholderAction("Copy")}>
          <Copy className="h-4 w-4" strokeWidth={1.8} />
          Copy
        </ActionButton>
        <ActionButton variant="light" onClick={() => placeholderAction("Edit")}>
          <Edit3 className="h-4 w-4" strokeWidth={1.8} />
          Edit
        </ActionButton>
        <ActionButton variant="light" onClick={() => placeholderAction("Download")}>
          <Download className="h-4 w-4" strokeWidth={1.8} />
          Download
        </ActionButton>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <h3 className="text-xl font-semibold text-zinc-950">{doc.title}</h3>
        <p className="mt-2 text-sm text-zinc-500">{doc.summary}</p>
        <div className="mt-6 space-y-4 text-sm leading-7 text-zinc-700">
          {(doc.body || []).map((paragraph: string) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Drawer>
  );
}

function Drawer({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button type="button" aria-label="Close overlay" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative h-full w-full max-w-2xl overflow-auto border-l border-zinc-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{title}</p>
            <h2 className="mt-1 text-lg font-semibold text-zinc-950">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-zinc-100">
            <X className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

function Toggle() {
  const [on, setOn] = useState(true);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => setOn(!on)}
      className={cx("flex h-6 w-11 rounded-full p-1 transition", on ? "bg-zinc-950" : "bg-zinc-300")}
    >
      <span className={cx("h-4 w-4 rounded-full bg-white transition", on && "translate-x-5")} />
    </button>
  );
}

function PanelHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex h-11 items-center justify-between border-b border-zinc-200 px-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-600">{title}</h2>
      {icon}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{children}</h3>;
}

function DashboardCard({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description?: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex items-start justify-between gap-4 border-b border-zinc-200 p-4">
        <div>
          <h3 className="font-semibold text-zinc-950">{title}</h3>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
        {meta && <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">{meta}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function SignalRows({ rows }: { rows: string[][] }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value, status]) => (
        <div key={label} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2 text-sm">
          <span className="text-zinc-700">{label}</span>
          <span className={cx("rounded-full border px-2 py-0.5 text-xs font-semibold", statusStyles[status] || statusStyles.warning)}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function MetricGrid({ metrics }: { metrics: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {metrics.map(([label, value]) => (
        <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-xs text-zinc-500">{label}</p>
          <p className="mt-2 text-xl font-semibold text-zinc-950">{value}</p>
        </div>
      ))}
    </div>
  );
}

function MetricGroup({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <DashboardCard title={title}>
      <div className="grid gap-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm">
            <span className="text-zinc-500">{label}</span>
            <span className="font-medium text-zinc-900">{value}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function DashboardView({ openHome }: { openHome: () => void }) {
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [articlesOpen, setArticlesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("seo");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [documentOpen, setDocumentOpen] = useState<any | null>(null);
  const [toast, setToast] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function placeholderAction(label: string) {
    showToast(`${label} is a placeholder in this replica.`);
  }

  return (
    <main className="min-h-[100dvh] bg-zinc-100 text-zinc-950">
      <TopTerminal
        collapsed={terminalCollapsed}
        setCollapsed={setTerminalCollapsed}
        openHome={openHome}
        accountOpen={accountOpen}
        setAccountOpen={setAccountOpen}
        placeholderAction={placeholderAction}
      />
      <div className="grid min-h-[calc(100dvh-225px)] grid-cols-1 overflow-hidden rounded-b-2xl border-x border-b border-zinc-200 bg-white lg:grid-cols-[22rem_minmax(24rem,1fr)_26rem_28rem]">
        <CompanyPanel
          editMode={editMode}
          setEditMode={setEditMode}
          openDocument={setDocumentOpen}
          articlesOpen={articlesOpen}
          setArticlesOpen={setArticlesOpen}
        />
        <AnalyticsPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          placeholderAction={placeholderAction}
          showToast={showToast}
        />
        <AgentsFeed expandedAgent={expandedAgent} setExpandedAgent={setExpandedAgent} openSettings={() => setSettingsOpen(true)} />
        <ChatPanel placeholderAction={placeholderAction} chatDraft={chatDraft} setChatDraft={setChatDraft} />
      </div>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} placeholderAction={placeholderAction} />
      <DocumentDrawer doc={documentOpen} onClose={() => setDocumentOpen(null)} placeholderAction={placeholderAction} />
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-xl">
          {toast}
        </div>
      )}
    </main>
  );
}

export default function OkaraReplicaPage() {
  const [view, setView] = useState<"home" | "dashboard">("home");

  return (
    <>
      <Head>
        <title>Okara Replica</title>
        <meta
          name="description"
          content="A local interactive replica of Okara's AI CMO website and logged-in dashboard shell."
        />
      </Head>
      <style jsx global>{`
        @keyframes okara-marquee {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
      {view === "home" ? (
        <LandingView openDashboard={() => setView("dashboard")} />
      ) : (
        <DashboardView openHome={() => setView("home")} />
      )}
    </>
  );
}
