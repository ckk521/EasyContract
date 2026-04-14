import { apiClient, ApiError } from "./client";

export interface ValidationRules {
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
  pattern?: string;
}

export type FieldType = "text" | "number" | "select" | "checkbox" | "date" | "textarea";

export interface FieldDefinition {
  id: number;
  field_name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
  placeholder?: string;
  required: boolean;
  validation_rules?: ValidationRules;
  group_id?: number;
  template_id?: number;
  preset_id?: number;
  sort_order: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SimilarFieldResult {
  field: FieldDefinition;
  similarity_score: number;
}

export interface FieldGroup {
  id: number;
  name: string;
  description?: string;
  template_id?: number;
  sort_order: number;
  created_at?: string;
}

export interface FieldCondition {
  id: number;
  field_id: number;
  condition_type: "display" | "required";
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  logic_operator: "AND" | "OR";
  created_at?: string;
}

export interface FieldListResponse {
  items: FieldDefinition[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface FieldGroupListResponse {
  items: FieldGroup[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateFieldRequest {
  field_name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  validation_rules?: ValidationRules;
  group_id?: number;
  template_id?: number;
  preset_id?: number;
  sort_order?: number;
}

export interface UpdateFieldRequest {
  display_name?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  validation_rules?: ValidationRules;
  group_id?: number;
  sort_order?: number;
}

export interface CreateFieldGroupRequest {
  name: string;
  description?: string;
  template_id?: number;
  sort_order?: number;
}

export interface UpdateFieldGroupRequest {
  name?: string;
  description?: string;
  sort_order?: number;
}

export interface CreateFieldConditionRequest {
  field_id: number;
  condition_type: "display" | "required";
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  logic_operator?: "AND" | "OR";
}

class FieldApi {
  async list(params: {
    page?: number;
    page_size?: number;
    template_id?: number;
    group_id?: number;
  }): Promise<FieldListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    if (params.template_id) query.set("template_id", String(params.template_id));
    if (params.group_id) query.set("group_id", String(params.group_id));

    const response = await apiClient.get<FieldListResponse>(
      `/api/fields?${query.toString()}`
    );
    if (!response.success) {
      throw new ApiError(response.message || "获取字段列表失败");
    }
    return response.data!;
  }

  async get(id: number): Promise<FieldDefinition> {
    const response = await apiClient.get<FieldDefinition>(`/api/fields/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "获取字段详情失败");
    }
    return response.data!;
  }

  async create(data: CreateFieldRequest): Promise<FieldDefinition> {
    const response = await apiClient.post<FieldDefinition>("/api/fields", data);
    if (!response.success) {
      throw new ApiError(response.message || "创建字段失败");
    }
    return response.data!;
  }

  async update(id: number, data: UpdateFieldRequest): Promise<FieldDefinition> {
    const response = await apiClient.put<FieldDefinition>(`/api/fields/${id}`, data);
    if (!response.success) {
      throw new ApiError(response.message || "更新字段失败");
    }
    return response.data!;
  }

  async delete(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/fields/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "删除字段失败");
    }
  }

  async reorder(fieldIds: number[]): Promise<void> {
    const response = await apiClient.put("/api/fields-batch-reorder", null, {
      params: { field_ids: fieldIds.join(",") },
    });
    if (!response.success) {
      throw new ApiError(response.message || "字段排序失败");
    }
  }

  // Field Groups
  async listGroups(params?: {
    template_id?: number;
  }): Promise<FieldGroupListResponse> {
    const query = new URLSearchParams();
    if (params?.template_id) {
      query.set("template_id", String(params.template_id));
    }

    const response = await apiClient.get<FieldGroupListResponse>(
      `/api/field-groups?${query.toString()}`
    );
    if (!response.success) {
      throw new ApiError(response.message || "获取分组列表失败");
    }
    return response.data!;
  }

  async createGroup(data: CreateFieldGroupRequest): Promise<FieldGroup> {
    const response = await apiClient.post<FieldGroup>("/api/field-groups", data);
    if (!response.success) {
      throw new ApiError(response.message || "创建分组失败");
    }
    return response.data!;
  }

  async updateGroup(
    id: number,
    data: UpdateFieldGroupRequest
  ): Promise<FieldGroup> {
    const response = await apiClient.put<FieldGroup>(
      `/api/field-groups/${id}`,
      data
    );
    if (!response.success) {
      throw new ApiError(response.message || "更新分组失败");
    }
    return response.data!;
  }

  async deleteGroup(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/field-groups/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "删除分组失败");
    }
  }

  // Field Conditions
  async listConditions(fieldId?: number): Promise<{
    items: FieldCondition[];
    total: number;
  }> {
    const query = fieldId ? `?field_id=${fieldId}` : "";
    const response = await apiClient.get<{
      items: FieldCondition[];
      total: number;
    }>(`/api/field-conditions${query}`);
    if (!response.success) {
      throw new ApiError(response.message || "获取条件列表失败");
    }
    return response.data!;
  }

  async createCondition(
    data: CreateFieldConditionRequest
  ): Promise<FieldCondition> {
    const response = await apiClient.post<FieldCondition>(
      "/api/field-conditions",
      data
    );
    if (!response.success) {
      throw new ApiError(response.message || "创建条件失败");
    }
    return response.data!;
  }

  async deleteCondition(id: number): Promise<void> {
    const response = await apiClient.delete(`/api/field-conditions/${id}`);
    if (!response.success) {
      throw new ApiError(response.message || "删除条件失败");
    }
  }

  // 字段相似度查询
  async findSimilar(
    query: string,
    threshold: number = 0.65
  ): Promise<SimilarFieldResult[]> {
    const response = await apiClient.get<{
      success: boolean;
      data: SimilarFieldResult[];
    }>(`/api/fields/similar?query=${encodeURIComponent(query)}&threshold=${threshold}`);
    if (!response.success) {
      throw new ApiError(response.message || "查询相似字段失败");
    }
    return response.data || [];
  }

  // 初始化默认字段
  async initDefaults(): Promise<{ created: number; skipped: number }> {
    const response = await apiClient.post<{
      success: boolean;
      data: { created: number; skipped: number };
    }>("/api/fields/init-defaults");
    if (!response.success) {
      throw new ApiError(response.message || "初始化默认字段失败");
    }
    return response.data!;
  }
}

export const fieldApi = new FieldApi();
