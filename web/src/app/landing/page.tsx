"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Zap,
  GitBranch,
  FileText,
  Scale,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContractSwarmLogo } from "@/components/logo";

const stats = [
  { value: "6x", label: "Faster Review", icon: Clock },
  { value: "100%", label: "Contract Coverage", icon: FileText },
  { value: "50+", label: "Legal Precedents", icon: Scale },
  { value: "24/7", label: "Always Available", icon: Zap },
];

const features = [
  {
    icon: Zap,
    title: "Parallel Agent Swarms",
    description:
      "Deploy a dedicated AI agent per contract. Every client agreement is analyzed simultaneously — not sequentially. What took weeks now takes minutes.",
  },
  {
    icon: Scale,
    title: "Real-Time Case Law Research",
    description:
      "Each agent queries live legal databases to find relevant precedent. Clause-level risk analysis grounded in actual court decisions, not just pattern matching.",
  },
  {
    icon: GitBranch,
    title: "Compliance Knowledge Graph",
    description:
      "Visualize the web of relationships between clients, contract clauses, and applicable law. Instantly see which agreements create exposure and why.",
  },
  {
    icon: FileText,
    title: "Amendment Drafting",
    description:
      "For every violation found, receive a proposed amendment with legal justification. Export-ready language your team can send to clients immediately.",
  },
];

const clientNames = [
  "Morrison & Partners",
  "Thornfield Capital",
  "Westbrook LLP",
  "Summit Legal Group",
  "Meridian Advisors",
  "Prescott & Hale",
  "Ashford Holdings",
  "Redline Compliance",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background -mt-14">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <ContractSwarmLogo />
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:text-foreground hidden sm:flex"
              >
                Live Demo
              </Button>
            </Link>
            <Button
              size="sm"
              className="bg-gold text-white hover:bg-gold/90"
            >
              Request Access
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              <span className="text-xs font-semibold text-gold tracking-wide">
                AI-Powered Contract Compliance
              </span>
            </div>

            <h1 className="font-heading text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              <span className="text-gold">Contract-Swarm</span>
            </h1>
            <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-muted-foreground sm:text-3xl">
              Vendor Compliance, Perfected
            </p>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl max-w-2xl mx-auto">
              When you onboard a new vendor, you need to know which
              clients&apos; data can be shared — and which can&apos;t.
              Contract-Swarm deploys AI agent swarms to analyze every contract in
              parallel. Minutes, not weeks.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gold text-white hover:bg-gold/90 font-semibold h-12 px-8 text-base shadow-lg shadow-gold/20"
                >
                  Try the Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-border text-muted-foreground hover:text-foreground h-12 px-8 text-base"
                >
                  See How It Works
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Hero visual — video in browser chrome */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="mt-16 sm:mt-20"
          >
            <div className="relative mx-auto max-w-5xl rounded-xl border border-border bg-white p-1 shadow-2xl shadow-black/8">
              <div className="rounded-lg bg-white overflow-hidden">
                {/* Browser chrome */}
                <div className="border-b border-border px-4 py-2.5 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="ml-3 flex-1 rounded-md bg-surface px-3 py-1">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      contract-swarm.ai/assessment/swarm
                    </span>
                  </div>
                </div>
                {/* Video */}
                <div className="relative aspect-video bg-surface">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  >
                    <source src="/demo-video.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="border-y border-border bg-white py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-8">
            Trusted by Leading Legal Teams
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {clientNames.map((name) => (
              <span
                key={name}
                className="text-sm font-medium text-foreground/20 whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="rounded-xl border border-border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
                  <stat.icon className="h-5 w-5 text-gold" />
                </div>
                <p className="font-heading text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground font-medium">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Every Contract. Every Clause.{" "}
              <span className="text-gold">Every Risk.</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
              Contract-Swarm doesn&apos;t just flag problems — it explains them
              with legal precedent and drafts the fix.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group rounded-xl border border-border bg-background p-8 transition-all hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 border border-gold/20">
                  <feature.icon className="h-6 w-6 text-gold" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              From Upload to{" "}
              <span className="text-gold">Actionable Report</span>
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed text-lg">
              Four steps. Full visibility. Complete compliance picture.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-0 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Upload Contracts",
                desc: "Drop your client agreements. PDFs, engagement letters, SOWs — all supported.",
              },
              {
                step: "02",
                icon: Users,
                title: "Deploy Swarm",
                desc: "AI agents spin up in parallel — one per contract. Watch them analyze in real-time.",
              },
              {
                step: "03",
                icon: GitBranch,
                title: "Map Compliance",
                desc: "See every client, clause, and legal precedent connected in an interactive graph.",
              },
              {
                step: "04",
                icon: CheckCircle2,
                title: "Act on Results",
                desc: "Per-client risk scores, violation details, and draft amendments ready to send.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative border border-border bg-white rounded-xl p-8 m-[-0.5px]"
              >
                <span className="font-heading text-7xl font-black text-gold/10 absolute top-4 right-6">
                  {item.step}
                </span>
                <div className="relative">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <item.icon className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="text-base font-bold mb-2 text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Badges */}
      <section className="border-y border-border py-14">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-8">
            Enterprise-Grade Security
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {["SOC 2 Type II", "GDPR", "CCPA", "ISO 27001", "HIPAA"].map(
              (badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 rounded-full border border-border bg-white px-5 py-2.5 shadow-sm"
                >
                  <Shield className="h-4 w-4 text-gold" />
                  <span className="text-xs font-semibold text-foreground/70">
                    {badge}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-12 sm:p-16 text-center shadow-lg"
          >
            <h2 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Stop Reviewing Contracts{" "}
              <span className="text-gold">One at a Time</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Your next vendor onboarding doesn&apos;t have to take three weeks.
              See Contract-Swarm in action.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gold text-white hover:bg-gold/90 font-semibold h-12 px-8 text-base shadow-lg shadow-gold/20"
                >
                  Try the Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="border-border text-muted-foreground hover:text-foreground h-12 px-8 text-base"
              >
                Request Access
                <ChevronRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <ContractSwarmLogo size="sm" />
            <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              &copy; 2026 Contract-Swarm. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
