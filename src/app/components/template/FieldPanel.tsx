"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { SearchIcon, PlusIcon, TypeIcon, CalendarIcon, HashIcon } from "lucide-react";
import { fieldApi, FieldDefinition, FieldType, SimilarFieldResult } from "@/app/api/fields";
import { SimilarFieldDialog } from "./SimilarFieldDialog";
import { cn } from "../ui/utils";

interface FieldPanelProps {
  open: boolean;
  activePlaceholderIndex: number | null;
  activePlaceholderContext: string;
  onAssignField: (placeholderIndex: number, field: FieldDefinition) => void;
  onClose: () => void;
  existingFields?: FieldDefinition[];
}

export function FieldPanel({
  open,
  activePlaceholderIndex,
  activePlaceholderContext,
  onAssignField,
  onClose,
  existingFields = [],
}: FieldPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("text");
  const [similarFields, setSimilarFields] = useState<SimilarFieldResult[]>([]);
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [creating, setCreating] = useState(false);

  // 加载字段列表
  useEffect(() => {
    if (open) {
      loadFields();
    }
  }, [open]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const response = await fieldApi.list({ page_size: 100 });
      setFields(response.items);
    } catch (error) {
      console.error("加载字段失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 过滤字段
  const filteredFields = fields.filter((field) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      field.display_name.toLowerCase().includes(query) ||
      field.field_name.toLowerCase().includes(query)
    );
  });

  // 默认字段优先
  const sortedFields = [...filteredFields].sort((a, b) => {
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;
    return a.display_name.localeCompare(b.display_name);
  });

  // 选择字段
  const handleSelectField = (field: FieldDefinition) => {
    if (activePlaceholderIndex === null) return;
    onAssignField(activePlaceholderIndex, field);
    onClose();
  };

  // 创建新字段
  const handleCreateField = async () => {
    if (!newFieldName.trim()) return;

    setCreating(true);
    try {
      // 检查相似字段
      const similar = await fieldApi.findSimilar(newFieldName);
      if (similar.length > 0) {
        setSimilarFields(similar);
        setShowSimilarDialog(true);
        setCreating(false);
        return;
      }

      // 直接创建
      await createField();
    } catch (error) {
      console.error("创建字段失败:", error);
      setCreating(false);
    }
  };

  const createField = async () => {
    const field_name = newFieldName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, "_")
      .replace(/_{2,}/g, "_");

    const newField = await fieldApi.create({
      field_name,
      display_name: newFieldName,
      field_type: newFieldType,
      required: true,
    });

    // 刷新字段列表
    await loadFields();

    // 分配给当前占位符
    if (activePlaceholderIndex !== null) {
      onAssignField(activePlaceholderIndex, newField);
    }

    // 重置表单
    setNewFieldName("");
    setNewFieldType("text");
    setShowCreateForm(false);
    setCreating(false);
    onClose();
  };

  // 使用相似字段
  const handleUseSimilar = (field: FieldDefinition) => {
    setShowSimilarDialog(false);
    if (activePlaceholderIndex !== null) {
      onAssignField(activePlaceholderIndex, field);
    }
    onClose();
  };

  // 仍然创建
  const handleCreateAnyway = () => {
    setShowSimilarDialog(false);
    createField();
  };

  const getFieldTypeIcon = (type: FieldType) => {
    switch (type) {
      case "text":
      case "textarea":
        return <TypeIcon className="size-4" />;
      case "date":
        return <CalendarIcon className="size-4" />;
      case "number":
        return <HashIcon className="size-4" />;
      default:
        return <TypeIcon className="size-4" />;
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent side="right" className="w-[320px] sm:max-w-[320px]">
          <SheetHeader>
            <SheetTitle>选择字段</SheetTitle>
            {activePlaceholderContext && (
              <p className="text-sm text-gray-500 truncate">
                {activePlaceholderContext}
              </p>
            )}
          </SheetHeader>

          <div className="flex flex-col h-full">
            {/* 搜索框 */}
            <div className="p-4 space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  placeholder="搜索字段..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 字段列表 */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">加载中...</div>
                ) : sortedFields.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">暂无字段</div>
                ) : (
                  sortedFields.map((field) => (
                    <button
                      key={field.id}
                      onClick={() => handleSelectField(field)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors",
                        "hover:bg-gray-50 border-gray-200"
                      )}
                    >
                      <div className="flex-shrink-0 text-gray-400">
                        {getFieldTypeIcon(field.field_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {field.display_name}
                          </span>
                          {field.is_default && (
                            <span className="flex-shrink-0 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                              默认
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 truncate">
                          {field.field_name}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* 创建新字段按钮/表单 */}
              {!showCreateForm ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowCreateForm(true)}
                >
                  <PlusIcon className="size-4 mr-2" />
                  创建新字段
                </Button>
              ) : (
                <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
                  <Input
                    placeholder="字段显示名称"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value as FieldType)}
                      className="flex-1 px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="text">文本</option>
                      <option value="number">数字</option>
                      <option value="date">日期</option>
                    </select>
                    <Button
                      size="sm"
                      onClick={handleCreateField}
                      disabled={!newFieldName.trim() || creating}
                    >
                      {creating ? "创建中..." : "创建"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewFieldName("");
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* 相似字段确认弹窗 */}
      <SimilarFieldDialog
        open={showSimilarDialog}
        newFieldName={newFieldName}
        similarFields={similarFields}
        onUseExisting={handleUseSimilar}
        onCreateAnyway={handleCreateAnyway}
        onCancel={() => setShowSimilarDialog(false)}
      />
    </>
  );
}
