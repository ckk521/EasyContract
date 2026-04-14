/**
 * 创建合同页面 (C-end)
 * C-DRAFT-001 ~ C-DRAFT-006
 */
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  draftApi,
  templateApi,
  Draft,
  ContractTemplate,
  DraftFieldsResponse,
  FieldValues,
  ValidationResult,
} from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Save,
  Eye,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";

const FIELD_TYPE_COMPONENTS = {
  text: ({ field, value, onChange }: FieldComponentProps) => (
    <Input
      id={field.field_name}
      value={(value as string) || ""}
      onChange={(e) => onChange(field.field_name, e.target.value)}
      placeholder={field.placeholder}
    />
  ),
  number: ({ field, value, onChange }: FieldComponentProps) => (
    <Input
      id={field.field_name}
      type="number"
      value={(value as number) || ""}
      onChange={(e) => onChange(field.field_name, e.target.value ? Number(e.target.value) : undefined)}
      placeholder={field.placeholder}
    />
  ),
  textarea: ({ field, value, onChange }: FieldComponentProps) => (
    <Textarea
      id={field.field_name}
      value={(value as string) || ""}
      onChange={(e) => onChange(field.field_name, e.target.value)}
      placeholder={field.placeholder}
      rows={4}
    />
  ),
  select: ({ field, value, onChange }: FieldComponentProps) => {
    const options = field.validation_rules?.options || [];
    return (
      <Select
        value={(value as string) || ""}
        onValueChange={(v) => onChange(field.field_name, v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={field.placeholder || "请选择"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt: { value: string; label: string }) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
  checkbox: ({ field, value, onChange }: FieldComponentProps) => (
    <div className="flex items-center gap-2">
      <Checkbox
        id={field.field_name}
        checked={(value as boolean) || false}
        onCheckedChange={(checked) => onChange(field.field_name, checked)}
      />
      <Label htmlFor={field.field_name} className="cursor-pointer">
        {field.description || field.display_name}
      </Label>
    </div>
  ),
  date: ({ field, value, onChange }: FieldComponentProps) => (
    <Input
      id={field.field_name}
      type="date"
      value={(value as string) || ""}
      onChange={(e) => onChange(field.field_name, e.target.value)}
    />
  ),
};

interface FieldComponentProps {
  field: DraftFieldsResponse["fields"][number];
  value: unknown;
  onChange: (fieldName: string, value: unknown) => void;
}

function DynamicField({ field, value, onChange }: FieldComponentProps) {
  const FieldComponent = FIELD_TYPE_COMPONENTS[field.field_type as keyof typeof FIELD_TYPE_COMPONENTS] || FIELD_TYPE_COMPONENTS.text;

  if (field.field_type === "checkbox") {
    return <FieldComponent field={field} value={value} onChange={onChange} />;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label htmlFor={field.field_name}>{field.display_name}</Label>
        {field.required && <span className="text-red-500">*</span>}
      </div>
      <FieldComponent field={field} value={value} onChange={onChange} />
      {field.description && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

export function CreateContract() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [draftFields, setDraftFields] = useState<DraftFieldsResponse | null>(null);
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Check if there's a draft_id in URL
  useEffect(() => {
    const draftId = searchParams.get("draft_id");
    const templateId = searchParams.get("template_id");

    if (draftId) {
      loadDraft(Number(draftId));
    } else if (templateId) {
      loadTemplate(Number(templateId));
    }
  }, [searchParams]);

  async function loadTemplates() {
    try {
      const response = await templateApi.list({ page: 1, page_size: 100 });
      // Only show published templates
      const published = response.items.filter((t) => t.status === "published");
      setTemplates(published);
    } catch (error) {
      toast.error("加载模板失败");
    }
  }

  async function loadTemplate(templateId: number) {
    try {
      const template = await templateApi.get(templateId);
      setSelectedTemplate(template);
    } catch (error) {
      toast.error("加载模板失败");
    }
  }

  async function loadDraft(draftId: number) {
    setLoading(true);
    try {
      const draftData = await draftApi.get(draftId);
      setDraft(draftData);

      const template = await templateApi.get(draftData.template_id);
      setSelectedTemplate(template);

      const fieldsData = await draftApi.getFields(draftId);
      setDraftFields(fieldsData);
      setFieldValues(fieldsData.form_data || {});
    } catch (error) {
      toast.error("加载草稿失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDraft() {
    if (!selectedTemplate) {
      toast.error("请先选择模板");
      return;
    }

    setSaving(true);
    try {
      // Get current user ID from somewhere (likely from auth context)
      const userId = 1; // TODO: Get from auth context
      const newDraft = await draftApi.create({
        name: `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`,
        template_id: selectedTemplate.id,
        user_id: userId,
      });

      setDraft(newDraft);
      toast.success("草稿创建成功");

      // Load fields for the new draft
      const fieldsData = await draftApi.getFields(newDraft.id);
      setDraftFields(fieldsData);

      // Update URL
      navigate(`/c/create-contract?draft_id=${newDraft.id}`, { replace: true });
    } catch (error: any) {
      toast.error(error.message || "创建草稿失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFields() {
    if (!draft) return;

    setSaving(true);
    try {
      const updatedDraft = await draftApi.saveFieldValues(draft.id, fieldValues);
      setDraft(updatedDraft);
      toast.success("保存成功");
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!draft) return;

    setLoading(true);
    try {
      const result = await draftApi.validate(draft.id, fieldValues);
      setValidationResult(result);
      if (result.is_valid) {
        toast.success("验证通过");
      } else {
        toast.error("请检查表单填写");
      }
    } catch (error: any) {
      toast.error(error.message || "验证失败");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!draft) return;

    // First validate
    const result = await draftApi.validate(draft.id, fieldValues);
    if (!result.is_valid) {
      setValidationResult(result);
      toast.error("请先完善必填字段");
      return;
    }

    setGenerating(true);
    try {
      const generated = await draftApi.generate(draft.id);
      setGeneratedContent(generated.content);
      setPreviewOpen(true);
    } catch (error: any) {
      toast.error(error.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  function handleFieldChange(fieldName: string, value: unknown) {
    setFieldValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear validation for this field
    if (validationResult?.errors) {
      setValidationResult({
        ...validationResult,
        errors: validationResult.errors.filter((e) => e.field !== fieldName),
      });
    }
  }

  function getFieldError(fieldName: string): string | undefined {
    return validationResult?.errors.find((e) => e.field === fieldName)?.message;
  }

  // Group fields
  function groupFieldsByGroup(fields: DraftFieldsResponse["fields"]) {
    const groups: Record<string, typeof fields> = {};
    const ungrouped: typeof fields = [];

    for (const field of fields) {
      if (field.group_id) {
        if (!groups[field.group_id]) {
          groups[field.group_id] = [];
        }
        groups[field.group_id].push(field);
      } else {
        ungrouped.push(field);
      }
    }

    return { groups, ungrouped };
  }

  // Template selection view
  if (!selectedTemplate && templates.length > 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">创建合同</h1>
          <p className="text-muted-foreground">请选择一个合同模板开始</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-colors"
              onClick={() => {
                setSelectedTemplate(template);
                loadTemplate(template.id);
              }}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-8 h-8 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{template.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description || "暂无描述"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{template.template_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      v{template.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (loading && !draftFields) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!draft && !selectedTemplate) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-medium mb-2">没有可用的模板</h2>
          <p className="text-muted-foreground mb-4">
            请等待管理员发布合同模板后再试
          </p>
          <Button variant="outline" onClick={() => navigate("/c/contracts")}>
            返回我的合同
          </Button>
        </div>
      </div>
    );
  }

  const { groups, ungrouped } = draftFields ? groupFieldsByGroup(draftFields.fields) : { groups: {}, ungrouped: [] };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/c/contracts")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {draft?.name || selectedTemplate?.name || "创建合同"}
            </h1>
            {draftFields && (
              <p className="text-sm text-muted-foreground">
                已填写 {draftFields.filled_fields} / {draftFields.total_fields} 个字段
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSaveFields()} disabled={saving || !draft}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
          <Button variant="outline" onClick={() => handleValidate()} disabled={loading || !draft}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <CheckCircle className="w-4 h-4 mr-2" />
            验证
          </Button>
          <Button onClick={() => handleGenerate()} disabled={generating || !draft}>
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <FileText className="w-4 h-4 mr-2" />
            生成合同
          </Button>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ungrouped fields */}
          {ungrouped.length > 0 && (
            <div className="border rounded-lg p-4 space-y-4">
              {ungrouped.map((field) => (
                <div key={field.id}>
                  <DynamicField
                    field={field}
                    value={fieldValues[field.field_name]}
                    onChange={handleFieldChange}
                  />
                  {getFieldError(field.field_name) && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getFieldError(field.field_name)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Grouped fields */}
          {Object.entries(groups).map(([groupId, fields]) => (
            <div key={groupId} className="border rounded-lg p-4 space-y-4">
              <h3 className="font-medium">分组 {groupId}</h3>
              {fields.map((field) => (
                <div key={field.id}>
                  <DynamicField
                    field={field}
                    value={fieldValues[field.field_name]}
                    onChange={handleFieldChange}
                  />
                  {getFieldError(field.field_name) && (
                    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {getFieldError(field.field_name)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* No draft created yet */}
          {!draft && (
            <div className="border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">开始创建合同</h3>
              <p className="text-muted-foreground mb-4">
                点击下方按钮创建草稿并开始填写
              </p>
              <Button onClick={handleCreateDraft} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <ChevronRight className="w-4 h-4 mr-2" />
                创建草稿
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          {draftFields && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">填写进度</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">已完成</span>
                  <span>
                    {draftFields.filled_fields} / {draftFields.total_fields}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(draftFields.filled_fields / draftFields.total_fields) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Validation errors */}
          {validationResult && validationResult.errors.length > 0 && (
            <div className="border rounded-lg p-4 border-red-200 bg-red-50">
              <h3 className="font-medium mb-2 text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                验证问题
              </h3>
              <ul className="space-y-1">
                {validationResult.errors.map((error, i) => (
                  <li key={i} className="text-sm text-red-600">
                    {error.field}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Template info */}
          {selectedTemplate && (
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-4">模板信息</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">名称</span>
                  <span>{selectedTemplate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">类型</span>
                  <Badge variant="outline">{selectedTemplate.template_type}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">版本</span>
                  <span>v{selectedTemplate.version}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          {draft && (
            <div className="border rounded-lg p-4 space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4 mr-2" />
                预览合同
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.name || selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md p-4 bg-muted/50">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {generatedContent || draft?.generated_content || "请先生成合同"}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              关闭
            </Button>
            {generatedContent && (
              <Button
                onClick={() => {
                  toast.success("合同已保存");
                  setPreviewOpen(false);
                  navigate("/c/contracts");
                }}
              >
                确认提交
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
