/**
 * 我的合同页面 (C-end)
 * C-MY-001 ~ C-MY-003
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { draftApi, templateApi, Draft } from "../../api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Trash2,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  Download,
  Printer,
  Save,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";

const STATUS_CONFIG = {
  draft: {
    label: "草稿",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  pending_review: {
    label: "待审核",
    icon: Clock,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  approved: {
    label: "已批准",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  rejected: {
    label: "已拒绝",
    icon: XCircle,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  completed: {
    label: "已完成",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  archived: {
    label: "已归档",
    icon: Archive,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

function getStatusBadge(status: string) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.draft;
  const Icon = config.icon;
  return (
    <Badge className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export function MyContracts() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(10);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingContract, setDeletingContract] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Preview/Edit state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContract, setPreviewContract] = useState<Draft | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [editMode, setEditMode] = useState(true); // 默认编辑模式
  const [fieldDefinitions, setFieldDefinitions] = useState<Array<{
    id: number;
    field_name: string;
    display_name: string;
    field_type: string;
  }>>([]);

  const userId = 1;

  useEffect(() => {
    loadContracts();
  }, [page]);

  async function loadContracts() {
    setLoading(true);
    try {
      const response = await draftApi.list({ user_id: userId, page, page_size: pageSize });
      setContracts(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error("加载合同失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    navigate("/c/create-contract");
  }

  function openDeleteDialog(contract: Draft) {
    setDeletingContract(contract);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingContract) return;

    setDeleting(true);
    try {
      await draftApi.delete(deletingContract.id);
      toast.success("删除成功");
      setDeleteDialogOpen(false);
      loadContracts();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    } finally {
      setDeleting(false);
    }
  }

  async function openPreview(contract: Draft) {
    setPreviewContract(contract);
    setPreviewOpen(true);
    setLoadingPreview(true);
    setPreviewHtml("");
    setGeneratedContent("");
    setFormValues({});
    setFieldDefinitions([]);
    setEditMode(true); // 始终以编辑模式打开

    try {
      // Get template and fields
      const template = await templateApi.getById(contract.template_id);
      const fieldsData = await draftApi.getFields(contract.id);

      // Store field definitions
      setFieldDefinitions(fieldsData.fields || []);

      // form_data is stored with placeholder index as keys (strings "0", "1", etc.)
      if (contract.form_data) {
        setFormValues(contract.form_data as Record<string, string>);
      }

      // Build preview HTML with editable placeholders
      let html = template.html_content || "";

      // Replace placeholders with input fields
      const placeholderRegex = /<span class="ec-placeholder" data-index="(\d+)">[^<]*<\/span>/g;
      html = html.replace(placeholderRegex, (match, index) => {
        return `<span class="editable-placeholder" data-index="${index}"></span>`;
      });

      setPreviewHtml(html);
    } catch (error) {
      toast.error("加载预览失败");
    } finally {
      setLoadingPreview(false);
    }
  }

  function handleFieldChange(fieldName: string, value: string) {
    setFormValues(prev => ({ ...prev, [fieldName]: value }));
  }

  // Check if all fields are filled
  function allFieldsFilled(): boolean {
    if (fieldDefinitions.length === 0) {
      // If no field definitions, check formValues against total_fields
      const total = previewContract?.total_fields || 0;
      if (total === 0) return false;
      const filledCount = Object.values(formValues).filter(v => v && String(v).trim() !== "").length;
      return filledCount >= total;
    }
    // Check if all field definitions have values
    return fieldDefinitions.every(f => {
      const value = formValues[f.field_name];
      return value && String(value).trim() !== "";
    });
  }

  async function handleSave() {
    if (!previewContract) return;

    setSaving(true);
    try {
      // formValues uses placeholder index as keys (same format as stored in form_data)
      await draftApi.saveFieldValues(previewContract.id, formValues);
      toast.success("保存成功");
      loadContracts();
    } catch (error: any) {
      toast.error(error.message || "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!previewContract) return;

    setGenerating(true);
    try {
      // Save first (formValues uses placeholder index as keys)
      await draftApi.saveFieldValues(previewContract.id, formValues);

      // Generate contract
      const result = await draftApi.generate(previewContract.id);
      setGeneratedContent(result.content);
      setEditMode(false); // 切换到预览模式
      toast.success("合同生成成功");
      loadContracts();
    } catch (error: any) {
      toast.error(error.message || "生成失败");
    } finally {
      setGenerating(false);
    }
  }

  function getCompletionText(filled: number, total: number): string {
    if (total === 0) return "0%";
    const percent = Math.min(100, Math.round((filled / total) * 100));
    return `${percent}%`;
  }

  // Render contract with editable fields - inline text input style
  function renderEditableContract() {
    if (!previewHtml) return null;

    // Split HTML by editable placeholders and render with inline inputs
    const parts = previewHtml.split(/<span class="editable-placeholder" data-index="(\d+)"><\/span>/);
    const result: React.ReactNode[] = [];
    let key = 0;

    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Regular HTML content
        if (parts[i]) {
          result.push(
            <span key={key++} dangerouslySetInnerHTML={{ __html: parts[i] }} />
          );
        }
      } else {
        // Placeholder index - render as inline editable text
        const index = parts[i];
        const value = formValues[index] || "";
        result.push(
          <input
            key={`input-${index}`}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(index, e.target.value)}
            placeholder="____"
            className="inline-block bg-yellow-50 px-1 py-0.5 text-inherit outline-none focus:bg-yellow-100 focus:ring-1 focus:ring-blue-400 rounded"
            style={{
              width: `${Math.max(40, (value.length || 4) * 14 + 8)}px`,
              minWidth: '40px',
              border: 'none',
              borderBottom: '1px solid #94a3b8',
            }}
          />
        );
      }
    }

    return result;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">我的合同</h1>
          <p className="text-muted-foreground">管理您的合同草稿和已提交的合同</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          创建合同
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>合同名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>完成度</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground">暂无合同</span>
                        <Button variant="outline" size="sm" onClick={openCreateDialog}>
                          创建第一个合同
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{contract.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(contract.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: getCompletionText(
                                  contract.filled_fields,
                                  contract.total_fields
                                ),
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {getCompletionText(contract.filled_fields, contract.total_fields)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreview(contract)}
                            title="查看/编辑"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/c-side?contract_id=${contract.id}`)}
                            title="继续对话"
                          >
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </Button>
                          {contract.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(contract)}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-muted-foreground">共 {total} 条</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  上一页
                </Button>
                <span className="flex items-center px-2">
                  第 {page} / {Math.ceil(total / pageSize)} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Preview/Edit Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="!w-[95vw] !max-w-[95vw] !max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="flex flex-row items-center justify-between p-4 border-b bg-slate-50 shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {previewContract?.name || "合同预览"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {generatedContent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([generatedContent], { type: 'text/html;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${previewContract?.name || '合同'}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    下载
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <title>${previewContract?.name || '合同'}</title>
                            <style>
                              body { font-family: 'SimSun', '宋体', serif; padding: 40px; line-height: 1.8; }
                            </style>
                          </head>
                          <body>${generatedContent}</body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    打印
                  </Button>
                </>
              )}
            </div>
          </DialogHeader>

          {/* Action Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b bg-white shrink-0">
            <div className="flex items-center gap-4">
              <p className="text-sm text-slate-500">
                {editMode ? "点击黄色区域可修改填写内容" : "当前为预览模式"}
              </p>
              {generatedContent && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                  className="text-blue-600"
                >
                  {editMode ? "查看生成结果" : "返回编辑"}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || generating}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    保存草稿
                  </>
                )}
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={saving || generating || !allFieldsFilled()}
                className={allFieldsFilled() ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    生成合同
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-100 p-6">
            {loadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">加载中...</span>
              </div>
            ) : !editMode && generatedContent ? (
              /* Show generated contract (non-editable) */
              <div className="flex justify-center">
                <div
                  className="bg-white shadow-lg"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '25mm 20mm',
                    fontFamily: "'SimSun', '宋体', serif",
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: '#1a1a1a',
                    boxSizing: 'border-box',
                  }}
                  dangerouslySetInnerHTML={{ __html: generatedContent }}
                />
              </div>
            ) : previewHtml ? (
              /* Editable contract form */
              <div className="flex justify-center">
                <div
                  className="bg-white shadow-lg"
                  style={{
                    width: '210mm',
                    minHeight: '297mm',
                    padding: '25mm 20mm',
                    fontFamily: "'SimSun', '宋体', serif",
                    fontSize: '14px',
                    lineHeight: '1.8',
                    color: '#1a1a1a',
                    boxSizing: 'border-box',
                  }}
                >
                  <style>{`
                    .contract-content p { margin-bottom: 12px; text-indent: 2em; }
                    .contract-content p:first-child { text-indent: 0; }
                    .contract-content strong { font-weight: bold; }
                    .contract-content ol, .contract-content ul { margin: 12px 0; padding-left: 2em; }
                    .contract-content li { margin-bottom: 8px; }
                  `}</style>
                  <div className="contract-content">
                    {renderEditableContract()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p>暂无合同内容</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除合同 "{deletingContract?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
