/**
 * 合同类型管理页面
 */
import { useState, useEffect } from "react";
import { contractTypeApi, ContractType, CreateContractTypeRequest } from "../../api";
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
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function ContractTypeManage() {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContractType | null>(null);
  const [formData, setFormData] = useState<CreateContractTypeRequest>({
    code: "",
    name: "",
    description: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<ContractType | null>(null);

  useEffect(() => {
    loadContractTypes();
  }, []);

  async function loadContractTypes() {
    setLoading(true);
    try {
      const response = await contractTypeApi.list({ page: 1, page_size: 100 });
      setContractTypes(response.items);
    } catch (error) {
      toast.error("加载合同类型失败");
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingType(null);
    setFormData({ code: "", name: "", description: "" });
    setDialogOpen(true);
  }

  function openEditDialog(type: ContractType) {
    setEditingType(type);
    setFormData({
      code: type.code,
      name: type.name,
      description: type.description || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingType) {
        await contractTypeApi.update(editingType.id, {
          name: formData.name,
          description: formData.description,
        });
        toast.success("更新成功");
      } else {
        await contractTypeApi.create(formData);
        toast.success("创建成功");
      }
      setDialogOpen(false);
      loadContractTypes();
    } catch (error: any) {
      toast.error(error.message || "操作失败");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleStatus(type: ContractType) {
    try {
      await contractTypeApi.toggleStatus(type.id);
      toast.success(type.is_active ? "已禁用" : "已启用");
      loadContractTypes();
    } catch (error) {
      toast.error("状态切换失败");
    }
  }

  function openDeleteDialog(type: ContractType) {
    setDeletingType(type);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!deletingType) return;
    try {
      await contractTypeApi.delete(deletingType.id);
      toast.success("删除成功");
      setDeleteDialogOpen(false);
      loadContractTypes();
    } catch (error: any) {
      toast.error(error.message || "删除失败");
    }
  }

  const activeTypes = contractTypes.filter(t => t.is_active).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">共 {contractTypes.length} 个类型</p>
            <p className="text-sm font-semibold text-slate-700">{activeTypes} 个启用中</p>
          </div>
        </div>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          新增类型
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">编码</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">名称</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">描述</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">状态</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </td>
              </tr>
            ) : contractTypes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                  暂无合同类型
                </td>
              </tr>
            ) : (
              contractTypes.map((type) => (
                <tr key={type.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
                      {type.code}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-900">{type.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-500">{type.description || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                      type.is_active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", type.is_active ? "bg-emerald-500" : "bg-slate-400")} />
                      {type.is_active ? "启用" : "禁用"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleStatus(type)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title={type.is_active ? "禁用" : "启用"}
                      >
                        {type.is_active ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditDialog(type)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(type)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? "编辑合同类型" : "新增合同类型"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">类型编码</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如：RENTAL"
                  disabled={!!editingType}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">类型名称</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：租赁合同"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="请输入描述信息"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {editingType ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除合同类型 "{deletingType?.name}" 吗？此操作不可撤销。
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
    </div>
  );
}
