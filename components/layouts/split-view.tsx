"use client";

import { motion } from "framer-motion";

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
}

export function SplitView({
  left,
  right,
  leftWidth = "35%",
  rightWidth = "65%",
}: SplitViewProps) {
  return (
    <div className="h-screen flex">
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: leftWidth }}
        className="border-r border-zinc-200 h-screen bg-white"
      >
        {left}
      </motion.div>

      <motion.div
        initial={{ width: 0 }}
        animate={{ width: rightWidth }}
        className="h-screen bg-[#fafafa]"
      >
        {right}
      </motion.div>
    </div>
  );
}
