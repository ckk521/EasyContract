"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { templateApi, contractTypeApi, ContractType, DocxUploadParseResult } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
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
import { UploadIcon, Loader2, FileIcon } from "lucide-react";
import { toast } from "sonner";

interface UploadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadTemplateDialog({ open, onOpenChange }: UploadTemplateDialogProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<"upload" | "info">("upload");
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 上传后的数据
  const [parseResult, setParseResult] = useState<DocxUploadParseResult | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [contractTypeId, setContractTypeId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      loadContractTypes();
      // Reset state when dialog opens
      setStep("upload");
      setParseResult(null);
      setTemplateName("");
      setTemplateDescription("");
      setContractTypeId(null);
    }
  }, [open]);

  async function loadContractTypes() {
    try {
      const response = await contractTypeApi.list({ page_size: 100 });
      setContractTypes(response.items.filter((t) => t.is_active));
    } catch (error) {
      console.error("加载合同类型失败", error);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("只支持 .docx 格式的 Word 文档");
      return;
    }

    setUploading(true);
    try {
      const result = await templateApi.parseDocx(file);
      setParseResult(result);
      setTemplateName(file.name.replace(/\.docx$/i, "")); // 默认用文件名作为模板名
      setStep("info");
      toast.success(`成功解析 ${result.placeholder_count} 个占位符`);
    } catch (error) {
      console.error("上传失败", error);
      toast.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  }

  function handleContinue() {
    if (!templateName.trim()) {
      toast.error("请输入模板名称");
      return;
    }
    if (!contractTypeId) {
      toast.error("请选择合同类型");
      return;
    }

    // 跳转到编辑器，携带解析结果
    navigate("/b-side/contracts/template-editor", {
      state: {
        isNew: true,
        parseResult,
        templateName,
        templateDescription,
        contractTypeId,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" ? "上传 Word 模板" : "填写模板信息"}
          </DialogTitle>
        </DialogHeader>

        {step === "upload" ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-center mb-6">
              <FileIcon className="size-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                上传 Word 文档模板
              </h3>
              <p className="text-gray-500 text-sm">
                支持 .docx 格式，文档中的 ____ 下划线将作为可填充字段
              </p>
            </div>
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
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">模板名称 *</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="如：房屋租赁合同（标准版）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractType">合同类型 *</Label>
              <Select
                value={contractTypeId?.toString() || ""}
                onValueChange={(value) => setContractTypeId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择合同类型" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="请输入模板描述（可选）"
              />
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground">
                已识别 <span className="font-medium text-foreground">{parseResult?.placeholder_count}</span> 个占位符
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {step === "info" && (
            <Button onClick={handleContinue} disabled={saving}>
              {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
              继续编辑
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
