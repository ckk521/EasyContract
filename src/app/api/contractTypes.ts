/**
 * 合同类型管理 API
 */
import { apiClient, ApiError } from "./client";

export interface ContractType {
  id: number;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ContractTypeListResponse {
  items: ContractType[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CreateContractTypeRequest {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateContractTypeRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export const contractTypeApi = {
  /**
   * 创建合同类型
   */
  create: async (data: CreateContractTypeRequest): Promise<ContractType> => {
    const response = await apiClient.post<{
      success: boolean;
      data: ContractType;
      message: string;
    }>("/api/contract-types", data);
    return response.data;
  },

  /**
   * 获取合同类型列表
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    code?: string;
    name?: string;
    is_active?: boolean;
  }): Promise<ContractTypeListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.code) searchParams.set("code", params.code);
    if (params?.name) searchParams.set("name", params.name);
    if (params?.is_active !== undefined)
      searchParams.set("is_active", String(params.is_active));

    const query = searchParams.toString();
    const response = await apiClient.get<{
      success: boolean;
      data: ContractTypeListResponse;
    }>(`/api/contract-types${query ? `?${query}` : ""}`);
    return response.data;
  },

  /**
   * 获取合同类型详情
   */
  getById: async (id: number): Promise<ContractType> => {
    const response = await apiClient.get<{
      success: boolean;
      data: ContractType;
    }>(`/api/contract-types/${id}`);
    return response.data;
  },

  /**
   * 更新合同类型
   */
  update: async (
    id: number,
    data: UpdateContractTypeRequest
  ): Promise<ContractType> => {
    const response = await apiClient.put<{
      success: boolean;
      data: ContractType;
      message: string;
    }>(`/api/contract-types/${id}`, data);
    return response.data;
  },

  /**
   * 切换合同类型状态
   */
  toggleStatus: async (id: number): Promise<ContractType> => {
    const response = await apiClient.patch<{
      success: boolean;
      data: ContractType;
      message: string;
    }>(`/api/contract-types/${id}/toggle-status`);
    return response.data;
  },

  /**
   * 删除合同类型
   */
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/contract-types/${id}`);
  },
};

export { ApiError };
