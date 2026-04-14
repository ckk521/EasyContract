"use client";

import React from "react";
import { cn } from "../ui/utils";

interface PlaceholderTokenProps {
  index: number;
  assignedField: { id: number; display_name: string; field_name: string } | null;
  isActive: boolean;
  onClick: (index: number) => void;
}

export function PlaceholderToken({
  index,
  assignedField,
  isActive,
  onClick,
}: PlaceholderTokenProps) {
  const handleClick = () => {
    onClick(index);
  };

  return (
    <span
      className={cn(
        "ec-placeholder inline-flex items-center rounded px-1 py-0.5 cursor-pointer transition-all",
        // 未分配状态
        !assignedField && [
          "bg-yellow-100 border-b-2 border-dashed border-yellow-500",
          "hover:bg-yellow-200",
        ],
        // 已分配状态
        assignedField && !isActive && [
          "bg-blue-100 border border-blue-400",
          "hover:bg-blue-200",
        ],
        // 激活状态
        isActive && [
          "bg-yellow-200 border-2 border-amber-500 ring-2 ring-amber-300",
        ]
      )}
      data-index={index}
      onClick={handleClick}
      title={assignedField ? `已分配: ${assignedField.display_name}` : "点击分配字段"}
    >
      {assignedField ? assignedField.display_name : "____"}
    </span>
  );
}
