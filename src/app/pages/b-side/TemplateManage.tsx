/**
 * 合同模板管理页面
 * B-TPL-001 ~ B-TPL-006
 */
import { useState, useEffect } from "react";
import { templateApi, contractTypeApi, ContractTemplate, ContractType, PlaceholderInfo } from "../../api";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog";
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
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Eye,
  Loader2,
  FileText,
  CheckCircle,
  LinkIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { cn } from "../../components/ui/utils";
import { UploadTemplateDialog } from "../../components/template/UploadTemplateDialog";

export function TemplateManage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);

  // 创建/编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ContractTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
    contract_type_id: undefined as number | undefined,
  });
  const [formLoading, setFormLoading] = useState(false);

  // 预览弹窗
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ContractTemplate | null>(null);

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<ContractTemplate | null>(null);

  // 预览占位符
  const [placeholders, setPlaceholders] = useState<PlaceholderInfo[]>([]);

  // 上传模板弹窗
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    loadContractTypes();
    loadTemplates();
  }, [page]);

  async function loadContractTypes() {
    try {
      const response = await contractTypeApi.list({ page_size: 100 });
      setContractTypes(response.items.filter((t) => t.is_active));
    } catch (error) {
      console.error("加载合同类型失败", error);
    }
  }

  async function loadTemplates() {
    setLoading(true);
    try {
      const response = await templateApi.list({ page, page_size: pageSize });
      setTemplates(response.items);
      setTotal(response.total);
    } catch (error) {
      toast.error("加载模板失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingTemplate(null);
    setFormData({
      name: "",
      description: "",
      content: "",
      contract_type_id: undefined,
    });
    setPlaceholders([]);
    setDialogOpen(true);
  }

  function openEditDialog(template: ContractTemplate) {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || "",
      content: template.content,
      contract_type_id: template.contract_type_id,
    });
    setPlaceholders(template.placeholders || []);
    setDialogOpen(true);
  }

  function openPreviewDialog(template: ContractTemplate) {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  }

  async function handleContentChange(content: string) {
    setFormData({ ...formData, content });
    // 解析占位符
    if (content.includes("{{")) {
      try {
        const result = await templateApi.parsePlaceholders(content);
        setPlaceholders(result.placeholders);
      } catch (error) {
        console.error("解析占位符失败", error);
      }
    } else {
      setPlaceholders([]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingTemplate) {
        await templateApi.update(editingTemplate.id, {
          name: formData.name,
          description: formData.description,
          content: formData.content,
        });
        toast.success("更新成功");
      } else {
        await templateApi.create({
          name: formData.name,
          description: formData.description,
          template_type: formData.template_type,
          content: formData.content,
          contract_type_id: formData.contract_type_id,
        });
        toast.success("创建成功");
      }
      setDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    } finally {
      setFormLoading(false);
    }
  }

  async function handlePublish(template: ContractTemplate) {
    try {
      await templateApi.publish(template.id);
      toast.success("发布成功");
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "发布失败");
    }
  }

  function openDeleteDialog(template: ContractTemplate) {
    setDeletingTemplate(template);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingTemplate) return;
    try {
      await templateApi.delete(deletingTemplate.id);
      toast.success("删除成功");
      setDeleteDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">已发布</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
      case "archived":
        return <Badge variant="outline">已归档</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">合同模板管理</h1>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          上传 Word 模板
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
                  <TableHead>模板名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>版本</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>完整性</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{template.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{template.template_type}</TableCell>
                      <TableCell>v{template.version}</TableCell>
                      <TableCell>{getStatusBadge(template.status)}</TableCell>
                      <TableCell>
                        {template.is_complete ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircleIcon className="w-4 h-4" />
                            完整
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-600 text-sm">
                            <AlertCircleIcon className="w-4 h-4" />
                            {template.placeholder_field_map
                              ? `${Object.values(template.placeholder_field_map).filter(v => v !== null).length}/${Object.keys(template.placeholder_field_map).length} 已分配`
                              : "未分配"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPreviewDialog(template)}
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {template.status === "draft" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/b-side/contracts/template-editor/${template.id}`)}
                                title="编辑字段映射"
                              >
                                <LinkIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePublish(template)}
                                title="发布"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(template)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(template)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
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

      {/* 创建/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "编辑模板" : "上传模板"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">模板名称</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：房屋租赁合同（标准版）"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contract_type_id">合同类型</Label>
                  <Select
                    value={formData.contract_type_id?.toString() || ""}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contract_type_id: parseInt(value) })
                    }
                    required
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="请输入模板描述"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">模板内容（Markdown）</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="# 合同标题&#10;&#10;甲方：{{lessor_name}}&#10;乙方：{{lessee_name}}&#10;..."
                  rows={12}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  使用 {"{{字段名}}"} 格式定义占位符，系统将自动识别并映射字段
                </p>
              </div>

              {/* 占位符预览 */}
              {placeholders.length > 0 && (
                <div className="space-y-2">
                  <Label>已识别的占位符</Label>
                  <div className="border rounded-md p-3 bg-muted/50">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      {placeholders.map((p) => (
                        <div key={p.name} className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {p.name}
                          </Badge>
                          <span className="text-muted-foreground">
                            ({p.field_type})
                            {p.required && <span className="text-red-500">*</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingTemplate ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>类型: {previewTemplate?.template_type}</span>
              <span>版本: v{previewTemplate?.version}</span>
              <span>状态: {previewTemplate?.status}</span>
            </div>
            <div className="border rounded-md p-4 bg-muted/50">
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {previewTemplate?.content}
              </pre>
            </div>
            {previewTemplate?.placeholders && previewTemplate.placeholders.length > 0 && (
              <div>
                <Label className="mb-2 block">占位符列表</Label>
                <div className="border rounded-md p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {previewTemplate.placeholders.map((p) => (
                      <div key={p.name} className="flex items-center gap-2">
                        <code className="bg-background px-2 py-1 rounded">
                          {p.name}
                        </code>
                        <span className="text-muted-foreground">
                          → {p.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除模板 "{deletingTemplate?.name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 上传模板弹窗 */}
      <UploadTemplateDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
      />
    </div>
  );
}
