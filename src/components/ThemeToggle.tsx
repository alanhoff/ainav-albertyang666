"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from "react";

const ThemeToggleButton = dynamic(() => import('./ThemeToggleButton'), {
  ssr: false,
});

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = storedTheme ? storedTheme === "dark" : systemPrefersDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
    // 使用 setTimeout 来避免同步 setState 警告
    const timer = setTimeout(() => setIsDark(shouldUseDark), 0);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextIsDark);
    setIsDark(nextIsDark);
  };

  return (
    <ThemeToggleButton isDark={isDark} onToggle={toggleTheme} />
  );
}
