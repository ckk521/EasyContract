"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import parse, { DOMNode, Element } from "html-react-parser";
import { templateApi, contractTypeApi, fieldApi, ContractTemplate, ContractType, FieldDefinition } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  ArrowLeftIcon,
  UploadIcon,
  SaveIcon,
  Loader2,
  CheckCircleIcon,
  AlertCircleIcon,
  FileIcon,
} from "lucide-react";
import { toast } from "sonner";
import { FieldPanel } from "../../components/template/FieldPanel";
import { PlaceholderToken } from "../../components/template/PlaceholderToken";
import { cn } from "../../components/ui/utils";

interface PlaceholderMap {
  [index: number]: {
    placeholder: { index: number; context: string; original_text?: string };
    field: FieldDefinition | null;
  };
}

export function TemplateEditor() {
  const { templateId } = useParams<{ templateId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!templateId;

  // 状态
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // 模板信息
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState("");
  const [contractTypeId, setContractTypeId] = useState<number | null>(null);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);

  // 上传状态
  const [uploading, setUploading] = useState(false);
  const [showUploadConfirm, setShowUploadConfirm] = useState(false);

  // 解析结果
  const [htmlContent, setHtmlContent] = useState("");
  const [placeholders, setPlaceholders] = useState<PlaceholderMap>({});

  // 字段面板
  const [fieldPanelOpen, setFieldPanelOpen] = useState(false);
  const [activePlaceholderIndex, setActivePlaceholderIndex] = useState<number | null>(null);

  // 加载数据
  useEffect(() => {
    loadContractTypes();
    if (isEditMode) {
      loadTemplate(parseInt(templateId!));
    } else {
      // 从上传弹窗接收数据
      const state = location.state as {
        isNew?: boolean;
        parseResult?: { html_content: string; placeholders: any[]; placeholder_count: number };
        templateName?: string;
        templateDescription?: string;
        contractTypeId?: number;
      } | null;

      if (state?.isNew && state?.parseResult) {
        setTemplateName(state.templateName || "");
        setTemplateDescription(state.templateDescription || "");
        setContractTypes((prev) => prev); // 已经加载
        setHtmlContent(state.parseResult.html_content);
        setContractTypeId(state.contractTypeId || null);

        // 初始化占位符映射
        const map: PlaceholderMap = {};
        state.parseResult.placeholders.forEach((p: any) => {
          map[p.index] = {
            placeholder: p,
            field: null,
          };
        });
        setPlaceholders(map);

        // 清除 state，避免刷新后重复提交
        navigate(location.pathname, { replace: true });
      }
    }
  }, [templateId, location.state]);

  const loadContractTypes = async () => {
    try {
      const response = await contractTypeApi.list({ page_size: 100 });
      setContractTypes(response.items.filter((t) => t.is_active));
    } catch (error) {
      console.error("加载合同类型失败", error);
    }
  };

  const loadTemplate = async (id: number) => {
    setLoading(true);
    try {
      const tmpl = await templateApi.getById(id);
      setTemplate(tmpl);
      setTemplateName(tmpl.name);
      setTemplateDescription(tmpl.description || "");
      setTemplateType(tmpl.template_type);
      setContractTypeId(tmpl.contract_type_id || null);
      setHtmlContent(tmpl.html_content || "");

      // 还原占位符映射
      if (tmpl.placeholder_field_map) {
        const map: PlaceholderMap = {};
        for (const [indexStr, fieldId] of Object.entries(tmpl.placeholder_field_map)) {
          const index = parseInt(indexStr);
          map[index] = {
            placeholder: {
              index,
              context: `占位符 ${index + 1}`,
            },
            field: null, // 字段信息需要单独加载
          };
        }
        setPlaceholders(map);

        // 加载已分配的字段信息
        for (const [indexStr, fieldId] of Object.entries(tmpl.placeholder_field_map)) {
          if (fieldId) {
            try {
              const field = await fieldApi.get(fieldId);
              setPlaceholders((prev) => ({
                ...prev,
                [parseInt(indexStr)]: {
                  ...prev[parseInt(indexStr)],
                  field,
                },
              }));
            } catch (e) {
              console.error(`加载字段 ${fieldId} 失败`, e);
            }
          }
        }
      }
    } catch (error) {
      console.error("加载模板失败", error);
      toast.error("加载模板失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("只支持 .docx 格式的 Word 文档");
      return;
    }

    setUploading(true);
    try {
      const result = await templateApi.parseDocx(file);
      setHtmlContent(result.html_content);

      // 初始化占位符映射
      const map: PlaceholderMap = {};
      result.placeholders.forEach((p) => {
        map[p.index] = {
          placeholder: p,
          field: null,
        };
      });
      setPlaceholders(map);

      toast.success(`成功解析 ${result.placeholder_count} 个占位符`);
      setShowUploadConfirm(true);
    } catch (error) {
      console.error("上传失败", error);
      toast.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 点击占位符
  const handlePlaceholderClick = (index: number) => {
    setActivePlaceholderIndex(index);
    setFieldPanelOpen(true);
  };

  // 分配字段
  const handleAssignField = (placeholderIndex: number, field: FieldDefinition) => {
    setPlaceholders((prev) => ({
      ...prev,
      [placeholderIndex]: {
        ...prev[placeholderIndex],
        field,
      },
    }));
    toast.success(`已将 "{$field.display_name}" 分配给占位符`);
  };

  // 保存草稿
  const handleSave = async () => {
    if (!templateName.trim()) {
      toast.error("请输入模板名称");
      return;
    }

    setSaving(true);
    try {
      // 构建占位符字段映射
      const placeholderFieldMap: Record<string, number | null> = {};
      for (const [index, data] of Object.entries(placeholders)) {
        placeholderFieldMap[index] = data.field?.id || null;
      }

      // 检查是否所有占位符都已分配
      const isComplete = Object.values(placeholderFieldMap).every((v) => v !== null);

      if (isEditMode && template) {
        // 更新现有模板基本信息
        await templateApi.update(template.id, {
          name: templateName,
          description: templateDescription,
        });

        // 更新占位符分配
        for (const [index, data] of Object.entries(placeholders)) {
          if (data.field) {
            await templateApi.assignPlaceholder(
              template.id,
              parseInt(index),
              data.field.id
            );
          }
        }

        toast.success("模板已保存");
      } else {
        // 创建新模板
        const newTemplate = await templateApi.createFromDocx({
          name: templateName,
          description: templateDescription,
          template_type: templateType || "OTHER",
          raw_docx_path: "", // 上传模式不需要这个
          html_content: htmlContent,
          placeholders: Object.values(placeholders).map((p) => p.placeholder),
          contract_type_id: contractTypeId || undefined,
        });

        // 分配字段
        for (const [index, data] of Object.entries(placeholders)) {
          if (data.field) {
            await templateApi.assignPlaceholder(
              newTemplate.id,
              parseInt(index),
              data.field.id
            );
          }
        }

        toast.success("模板创建成功");
        navigate("/b-side/contracts");
      }
    } catch (error) {
      console.error("保存失败", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  // 发布模板
  const handlePublish = async () => {
    if (!template) {
      toast.error("请先保存模板");
      return;
    }

    // 检查完整性
    const unassignedCount = Object.values(placeholders).filter((p) => !p.field).length;
    if (unassignedCount > 0) {
      toast.error(`还有 ${unassignedCount} 个占位符未分配字段，无法发布`);
      return;
    }

    setPublishing(true);
    try {
      await templateApi.publish(template.id);
      toast.success("模板发布成功");
      navigate("/b-side/contracts");
    } catch (error) {
      console.error("发布失败", error);
      toast.error("发布失败");
    } finally {
      setPublishing(false);
    }
  };

  // 计算完成度
  const totalPlaceholders = Object.keys(placeholders).length;
  const assignedPlaceholders = Object.values(placeholders).filter((p) => p.field).length;
  const isComplete = totalPlaceholders > 0 && assignedPlaceholders === totalPlaceholders;

  // 渲染 HTML 内容
  const renderHtmlContent = () => {
    if (!htmlContent) return null;

    return parse(htmlContent, {
      replace: (domNode: DOMNode) => {
        if (domNode instanceof Element && domNode.attribs?.class === "ec-placeholder") {
          const index = parseInt(domNode.attribs["data-index"]);
          const data = placeholders[index];
          return (
            <PlaceholderToken
              key={`placeholder-${index}`}
              index={index}
              assignedField={data?.field || null}
              isActive={activePlaceholderIndex === index}
              onClick={handlePlaceholderClick}
            />
          );
        }
        return undefined;
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-40 bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/b-side/contracts?tab=templates")}>
              <ArrowLeftIcon className="size-4 mr-2" />
              返回
            </Button>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="输入模板名称"
              className="w-64 font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* 完成度指示器 */}
            {totalPlaceholders > 0 && (
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded-full text-sm",
                  isComplete
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                )}
              >
                {isComplete ? (
                  <CheckCircleIcon className="size-4" />
                ) : (
                  <AlertCircleIcon className="size-4" />
                )}
                {assignedPlaceholders}/{totalPlaceholders} 已分配
              </div>
            )}

            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <SaveIcon className="size-4 mr-2" />}
              保存草稿
            </Button>

            <Button
              onClick={handlePublish}
              disabled={!isComplete || publishing}
            >
              {publishing ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              发布
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* 左侧：HTML 预览 */}
        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-gray-400" />
            </div>
          ) : !isEditMode && !htmlContent ? (
            // 上传区域（新建模式且未上传）
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <FileIcon className="size-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  上传 Word 文档模板
                </h3>
                <p className="text-gray-500 mb-4">
                  支持 .docx 格式，文档中的 ____ 下划线将作为可填充字段
                </p>
                <label>
                  <input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  <Button asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          解析中...
                        </>
                      ) : (
                        <>
                          <UploadIcon className="size-4 mr-2" />
                          选择 Word 文件
                        </>
                      )}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          ) : (
            // 预览和编辑区域
            <div className="bg-white rounded-lg border shadow-sm p-8 max-w-4xl mx-auto">
              {htmlContent && (
                <div className="prose max-w-none">
                  {/* 模板名称 */}
                  <div className="mb-8 pb-4 border-b">
                    <Input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="模板名称"
                      className="text-2xl font-bold border-none px-0 focus:ring-0"
                    />
                    <Input
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="模板描述（可选）"
                      className="mt-2 text-gray-500 border-none px-0 focus:ring-0"
                    />
                  </div>

                  {/* HTML 内容 */}
                  <div className="whitespace-pre-wrap">{renderHtmlContent()}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧字段面板 */}
        <FieldPanel
          open={fieldPanelOpen}
          activePlaceholderIndex={activePlaceholderIndex}
          activePlaceholderContext={
            activePlaceholderIndex !== null
              ? placeholders[activePlaceholderIndex]?.placeholder.context || ""
              : ""
          }
          onAssignField={handleAssignField}
          onClose={() => {
            setFieldPanelOpen(false);
            setActivePlaceholderIndex(null);
          }}
        />
      </div>
    </div>
  );
}
