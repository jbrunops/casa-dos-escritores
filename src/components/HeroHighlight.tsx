"use client";
import { useMotionValue, motion, useMotionTemplate } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase-browser";

interface HeroHighlightProps {
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
}

export function HeroHighlight({
  title,
  subtitle,
  buttonText,
  buttonLink,
}: HeroHighlightProps) {
  // ...restante igual, apenas com tipagem.
}

export function Highlight({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
