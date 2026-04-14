"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { FieldDefinition } from "@/app/api/fields";

interface SimilarFieldResult {
  field: FieldDefinition;
  similarity_score: number;
}

interface SimilarFieldDialogProps {
  open: boolean;
  newFieldName: string;
  similarFields: SimilarFieldResult[];
  onUseExisting: (field: FieldDefinition) => void;
  onCreateAnyway: () => void;
  onCancel: () => void;
}

export function SimilarFieldDialog({
  open,
  newFieldName,
  similarFields,
  onUseExisting,
  onCreateAnyway,
  onCancel,
}: SimilarFieldDialogProps) {
  if (similarFields.length === 0) {
    return null;
  }

  // 按相似度排序
  const sortedFields = [...similarFields].sort(
    (a, b) => b.similarity_score - a.similarity_score
  );

  // 最相似的字段
  const mostSimilar = sortedFields[0];

  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>发现相似字段</AlertDialogTitle>
          <AlertDialogDescription>
            您要创建的字段 &quot;{newFieldName}&quot;
            与以下已有字段相似：
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-4">
          {sortedFields.map((result) => (
            <div
              key={result.field.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border",
                result.similarity_score >= 0.8
                  ? "bg-red-50 border-red-200"
                  : "bg-yellow-50 border-yellow-200"
              )}
            >
              <div>
                <div className="font-medium">{result.field.display_name}</div>
                <div className="text-sm text-gray-500">
                  {result.field.field_name}
                </div>
              </div>
              <div
                className={cn(
                  "text-sm font-medium",
                  result.similarity_score >= 0.8
                    ? "text-red-600"
                    : "text-yellow-600"
                )}
              >
                {Math.round(result.similarity_score * 100)}% 相似
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onUseExisting(mostSimilar.field)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            使用 &quot;{mostSimilar.field.display_name}&quot;
          </AlertDialogAction>
          <AlertDialogAction
            onClick={onCreateAnyway}
            className="bg-orange-600 hover:bg-orange-700"
          >
            仍然创建新字段
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
