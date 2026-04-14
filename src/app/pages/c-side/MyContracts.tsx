/**
 * 我的合同页面 (C-end)
 * C-MY-001 ~ C-MY-003
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { draftApi, Draft } from "../../api";
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
import { toast } from "sonner";
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
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

  // Mock user ID - in real app, get from auth context
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

  function openEditDialog(contract: Draft) {
    navigate(`/c/create-contract?draft_id=${contract.id}`);
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

  function getCompletionText(filled: number, total: number): string {
    if (total === 0) return "0%";
    return `${Math.round((filled / total) * 100)}%`;
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
                          {contract.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(contract)}
                              title="编辑"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/c/create-contract?draft_id=${contract.id}`)}
                            title="查看"
                          >
                            <Eye className="w-4 h-4" />
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
