/**
 * 合同模板管理 API
 */
import { apiClient, ApiError } from "./client";

export interface PlaceholderInfo {
  name: string;
  display_name: string;
  field_type: string;
  required: boolean;
  description?: string;
}

export interface DocxPlaceholderInfo {
  index: number;
  context: string;
  original_text?: string;
}

export interface ContractTemplate {
  id: number;
  name: string;
  description?: string;
  template_type: string;
  content: string;
  version: number;
  status: string;
  placeholders?: PlaceholderInfo[];
  contract_type_id?: number;
  created_by?: number;
  // Word 文档支持
  raw_docx_path?: string;
  html_content?: string;
  placeholder_field_map?: Record<string, number | null>;
  is_complete?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ContractTemplateListResponse {
  items: ContractTemplate[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_type: string;
  content: string;
  contract_type_id?: number;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  content?: string;
}

export interface ParsePlaceholderRequest {
  content: string;
}

export interface ParsePlaceholderResponse {
  placeholders: PlaceholderInfo[];
  total_count: number;
  required_count: number;
}

export interface DocxUploadParseResult {
  html_content: string;
  placeholders: DocxPlaceholderInfo[];
  placeholder_count: number;
}

export interface CreateFromDocxRequest {
  name: string;
  description?: string;
  template_type: string;
  raw_docx_path: string;
  html_content: string;
  placeholders: DocxPlaceholderInfo[];
  contract_type_id?: number;
}

export interface PlaceholderAssignRequest {
  field_id: number;
}

export interface PlaceholderAssignResponse {
  template_id: number;
  placeholder_index: number;
  field_id: number | null;
  is_complete: boolean;
}

export const templateApi = {
  /**
   * 创建模板
   */
  create: async (data: CreateTemplateRequest): Promise<ContractTemplate> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ContractTemplate;
      message: string;
    }>("/api/templates", data);
    return response.data;
  },

  /**
   * 获取模板列表
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    template_type?: string;
    status?: string;
    contract_type_id?: number;
  }): Promise<ContractTemplateListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.template_type) searchParams.set("template_type", params.template_type);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.contract_type_id)
      searchParams.set("contract_type_id", String(params.contract_type_id));

    const query = searchParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: ContractTemplateListResponse;
    }>(`/api/templates${query ? `?${query}` : ""}`);
    return response.data;
  },

  /**
   * 获取模板详情
   */
  getById: async (id: number): Promise<ContractTemplate> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ContractTemplate;
    }>(`/api/templates/${id}`);
    return response.data;
  },

  /**
   * 更新模板
   */
  update: async (id: number, data: UpdateTemplateRequest): Promise<ContractTemplate> => {
    const response = await apiClient.put<{
      success: boolean;
      data: ContractTemplate;
      message: string;
    }>(`/api/templates/${id}`, data);
    return response.data;
  },

  /**
   * 发布模板
   */
  publish: async (id: number): Promise<ContractTemplate> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ContractTemplate;
      message: string;
    }>(`/api/templates/${id}/publish`);
    return response.data;
  },

  /**
   * 创建新版本
   */
  newVersion: async (id: number, content: string): Promise<ContractTemplate> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ContractTemplate;
      message: string;
    }>(`/api/templates/${id}/new-version`, { content });
    return response.data;
  },

  /**
   * 解析占位符
   */
  parsePlaceholders: async (content: string): Promise<ParsePlaceholderResponse> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ParsePlaceholderResponse;
    }>("/api/templates/parse-placeholders", { content });
    return response.data;
  },

  /**
   * 删除模板
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/templates/${id}`);
  },

  /**
   * 上传并解析 docx 文件
   */
  parseDocx: async (file: File): Promise<DocxUploadParseResult> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{
      success: boolean;
      data: DocxUploadParseResult;
      message: string;
    }>("/api/templates/upload-docx", formData);
    return response.data;
  },

  /**
   * 从 docx 创建模板
   */
  createFromDocx: async (data: CreateFromDocxRequest): Promise<ContractTemplate> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ContractTemplate;
      message: string;
    }>("/api/templates/from-docx", data);
    return response.data;
  },

  /**
   * 为占位符分配字段
   */
  assignPlaceholder: async (
    templateId: number,
    placeholderIndex: number,
    fieldId: number
  ): Promise<PlaceholderAssignResponse> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: PlaceholderAssignResponse;
      message: string;
    }>(`/api/templates/${templateId}/placeholders/${placeholderIndex}`, {
      field_id: fieldId,
    });
    return response.data;
  },
};

export { ApiError };
