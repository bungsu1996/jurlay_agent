import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "task" | "employee" | "priority";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = "task" }) => {
  let colorClasses = "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700";
  let displayLabel = status.replace(/_/g, " ");

  if (type === "employee") {
    switch (status) {
      case "IDLE":
        colorClasses = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800";
        displayLabel = "STAND BY";
        break;
      case "MEETING":
        colorClasses = "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-900 animate-pulse";
        displayLabel = "RAPAT AI";
        break;
      case "WORKING":
        colorClasses = "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-700 animate-pulse font-bold";
        displayLabel = "EKSEKUSI";
        break;
      case "BLOCKED":
        colorClasses = "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-400 font-bold";
        displayLabel = "KENDALA";
        break;
    }
  } else if (type === "priority") {
    switch (status) {
      case "LOW":
        colorClasses = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
        displayLabel = "RENDAH";
        break;
      case "MEDIUM":
        colorClasses = "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-600";
        displayLabel = "SEDANG";
        break;
      case "HIGH":
        colorClasses = "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-300 dark:border-red-900 font-semibold";
        displayLabel = "TINGGI";
        break;
      case "URGENT":
        colorClasses = "bg-red-600 text-white border-red-700 font-extrabold shadow-xs";
        displayLabel = "DARURAT";
        break;
    }
  } else {
    // Task status
    switch (status) {
      case "BACKLOG":
        colorClasses = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700";
        displayLabel = "TUGAS BARU";
        break;
      case "MEETING":
        colorClasses = "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800";
        displayLabel = "RAPAT TIM";
        break;
      case "IN_PROGRESS":
        colorClasses = "bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border-zinc-700";
        displayLabel = "DIKERJAKAN";
        break;
      case "QA_REVIEW":
        colorClasses = "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-400 dark:border-zinc-600";
        displayLabel = "AUDIT QA";
        break;
      case "DONE":
        colorClasses = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 font-bold";
        displayLabel = "SELESAI";
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {displayLabel}
    </span>
  );
};
