/**
 * 字段管理页面
 * 展示默认字段和自定义字段
 */
import { useState, useEffect } from "react";
import {
  fieldApi,
  FieldDefinition,
} from "../../api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPES = [
  { value: "text", label: "文本" },
  { value: "number", label: "数字" },
  { value: "select", label: "下拉选择" },
  { value: "checkbox", label: "复选框" },
  { value: "date", label: "日期" },
  { value: "textarea", label: "多行文本" },
];

export function FieldManage() {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFieldTab, setActiveFieldTab] = useState("custom");

  // Field dialog
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [fieldFormData, setFieldFormData] = useState({
    field_name: "",
    display_name: "",
    field_type: "text" as "text" | "number" | "select" | "checkbox" | "date" | "textarea",
    description: "",
    placeholder: "",
    required: false,
  });
  const [fieldFormLoading, setFieldFormLoading] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<FieldDefinition | null>(null);

  useEffect(() => {
    loadFields();
  }, []);

  async function loadFields() {
    setLoading(true);
    try {
      const response = await fieldApi.list({ page: 1, page_size: 100 });
      setFields(response.items);
    } catch (error) {
      toast.error("加载字段失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreateField() {
    setEditingField(null);
    setFieldFormData({
      field_name: "",
      display_name: "",
      field_type: "text",
      description: "",
      placeholder: "",
      required: false,
    });
    setFieldDialogOpen(true);
  }

  function openEditField(field: FieldDefinition) {
    setEditingField(field);
    setFieldFormData({
      field_name: field.field_name,
      display_name: field.display_name,
      field_type: field.field_type,
      description: field.description || "",
      placeholder: field.placeholder || "",
      required: field.required,
    });
    setFieldDialogOpen(true);
  }

  async function handleFieldSubmit() {
    setFieldFormLoading(true);
    try {
      if (editingField) {
        await fieldApi.update(editingField.id, {
          display_name: fieldFormData.display_name,
          description: fieldFormData.description || undefined,
          placeholder: fieldFormData.placeholder || undefined,
          required: fieldFormData.required,
        });
        toast.success("字段更新成功");
      } else {
        await fieldApi.create({
          field_name: fieldFormData.field_name,
          display_name: fieldFormData.display_name,
          field_type: fieldFormData.field_type,
          description: fieldFormData.description || undefined,
          placeholder: fieldFormData.placeholder || undefined,
          required: fieldFormData.required,
        });
        toast.success("字段创建成功");
      }
      setFieldDialogOpen(false);
      loadFields();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    } finally {
      setFieldFormLoading(false);
    }
  }

  async function handleDeleteField() {
    if (!deletingField) return;
    try {
      await fieldApi.delete(deletingField.id);
      toast.success("字段删除成功");
      setDeleteDialogOpen(false);
      loadFields();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  }

  const defaultFields = fields.filter((f) => f.is_default);
  const customFields = fields.filter((f) => !f.is_default);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">字段管理</h1>
        <Button onClick={openCreateField}>
          <Plus className="w-4 h-4 mr-2" />
          添加字段
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeFieldTab} onValueChange={setActiveFieldTab}>
          <TabsList>
            <TabsTrigger value="defaults" className="gap-2">
              <Shield className="size-4" />
              默认字段 ({defaultFields.length})
            </TabsTrigger>
            <TabsTrigger value="custom" className="gap-2">
              <Edit className="size-4" />
              自定义字段 ({customFields.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="defaults" className="mt-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>字段名称</TableHead>
                    <TableHead>显示名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>必填</TableHead>
                    <TableHead>描述</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaultFields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无默认字段
                      </TableCell>
                    </TableRow>
                  ) : (
                    defaultFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                            {field.field_name}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{field.display_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FIELD_TYPES.find((t) => t.value === field.field_type)?.label ||
                              field.field_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <span className="text-red-500">是</span>
                          ) : (
                            <span className="text-muted-foreground">否</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {field.description || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>字段名称</TableHead>
                    <TableHead>显示名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>必填</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customFields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        暂无自定义字段
                      </TableCell>
                    </TableRow>
                  ) : (
                    customFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                            {field.field_name}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{field.display_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {FIELD_TYPES.find((t) => t.value === field.field_type)?.label ||
                              field.field_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <span className="text-red-500">是</span>
                          ) : (
                            <span className="text-muted-foreground">否</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {field.description || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditField(field)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDeletingField(field);
                                setDeleteDialogOpen(true);
                              }}
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
          </TabsContent>
        </Tabs>
      )}

      {/* Field Dialog */}
      <Dialog open={fieldDialogOpen} onOpenChange={setFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField ? "编辑字段" : "添加字段"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingField && (
              <div className="space-y-2">
                <Label htmlFor="field_name">字段名称</Label>
                <Input
                  id="field_name"
                  value={fieldFormData.field_name}
                  onChange={(e) =>
                    setFieldFormData({ ...fieldFormData, field_name: e.target.value })
                  }
                  placeholder="如: lessor_name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="display_name">显示名称</Label>
              <Input
                id="display_name"
                value={fieldFormData.display_name}
                onChange={(e) =>
                  setFieldFormData({ ...fieldFormData, display_name: e.target.value })
                }
                placeholder="如: 房东姓名"
              />
            </div>

            {!editingField && (
              <div className="space-y-2">
                <Label htmlFor="field_type">字段类型</Label>
                <Select
                  value={fieldFormData.field_type}
                  onValueChange={(v) =>
                    setFieldFormData({ ...fieldFormData, field_type: v as typeof fieldFormData.field_type })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={fieldFormData.description}
                onChange={(e) =>
                  setFieldFormData({ ...fieldFormData, description: e.target.value })
                }
                placeholder="字段描述信息"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholder">占位符</Label>
              <Input
                id="placeholder"
                value={fieldFormData.placeholder}
                onChange={(e) =>
                  setFieldFormData({ ...fieldFormData, placeholder: e.target.value })
                }
                placeholder="输入提示文字"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="required"
                checked={fieldFormData.required}
                onChange={(e) =>
                  setFieldFormData({ ...fieldFormData, required: e.target.checked })
                }
                className="w-4 h-4"
              />
              <Label htmlFor="required">必填字段</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFieldDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleFieldSubmit} disabled={fieldFormLoading}>
              {fieldFormLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingField ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除字段 "{deletingField?.display_name}" 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteField}
              className="bg-destructive"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
