import { apiClient, ApiError } from "./client";

export interface Draft {
  id: number;
  name: string;
  status: string;
  template_id: number;
  user_id: number;
  conversation_id?: string;
  form_data?: Record<string, unknown>;
  generated_content?: string;
  filled_fields: number;
  total_fields: number;
  created_at: string;
  updated_at?: string;
}

export interface DraftListResponse {
  items: Draft[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateDraftRequest {
  name: string;
  template_id: number;
  user_id: number;
  conversation_id?: string;
}

export interface FieldValues {
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
}

export interface DraftFieldsResponse {
  fields: Array<{
    id: number;
    field_name: string;
    display_name: string;
    field_type: string;
    description?: string;
    placeholder?: string;
    required: boolean;
    validation_rules?: Record<string, unknown>;
    group_id?: number;
    sort_order: number;
  }>;
  form_data: Record<string, unknown>;
  filled_fields: number;
  total_fields: number;
}

class DraftApi {
  async create(data: CreateDraftRequest): Promise<Draft> {
    const response = await apiClient.post<Draft>("/drafts", data);
    if (!response.success) {
      throw new ApiError(response.message || "创建草稿失败");
    }
    return response.data!;
  }

  async list(params: {
    user_id?: number;
    page?: number;
    page_size?: number;
  }): Promise<DraftListResponse> {
    const query = new URLSearchParams();
    if (params.user_id) query.set("user_id", String(params.user_id));
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));

    const response = await apiClient.get<DraftListResponse>(
      `/drafts?${query.toString()}`
    );
    if (!response.success) {
      throw new ApiError(response.message || "获取草稿列表失败");
    }
    return response.data!;
  }

  async get(id: number): Promise<Draft> {
    const response = await apiClient.get<Draft>(`/drafts/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "获取草稿详情失败");
    }
    return response.data!;
  }

  async update(id: number, data: Partial<{ name: string; form_data: Record<string, unknown> }>): Promise<Draft> {
    const response = await apiClient.put<Draft>(`/drafts/${id}`, data);
    if (!response.success) {
      throw new ApiError(response.message || "更新草稿失败");
    }
    return response.data!;
  }

  async delete(id: number): Promise<void> {
    const response = await apiClient.delete(`/drafts/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "删除草稿失败");
    }
  }

  async getFields(id: number): Promise<DraftFieldsResponse> {
    const response = await apiClient.get<DraftFieldsResponse>(`/drafts/${id}/fields`);
    if (!response.success) {
      throw new ApiError(response.message || "获取草稿字段失败");
    }
    return response.data!;
  }

  async saveFieldValues(id: number, values: FieldValues): Promise<Draft> {
    const response = await apiClient.put<Draft>(`/drafts/${id}/fields`, values);
    if (!response.success) {
      throw new ApiError(response.message || "保存字段值失败");
    }
    return response.data!;
  }

  async validate(id: number, values: FieldValues): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `/drafts/${id}/validate`,
      values
    );
    if (!response.success) {
      throw new ApiError(response.message || "验证字段失败");
    }
    return response.data!;
  }

  async generate(id: number): Promise<{ content: string; draft_id: number }> {
    const response = await apiClient.post<{ content: string; draft_id: number }>(
      `/drafts/${id}/generate`,
      null
    );
    if (!response.success) {
      throw new ApiError(response.message || "生成合同内容失败");
    }
    return response.data!;
  }
}

export const draftApi = new DraftApi();
