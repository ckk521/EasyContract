"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router";
import { TemplateManage } from "./TemplateManage";
import { FieldManage } from "./FieldManage";
import { ContractTypeManage } from "./ContractTypeManage";
import { FileStack, FormInput, Shield, FileText, LayoutGrid, Settings } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

const tabs = [
  { id: "types", label: "合同类型", icon: Shield },
  { id: "templates", label: "模板管理", icon: FileStack },
  { id: "fields", label: "字段管理", icon: LayoutGrid },
];

export function ContractManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getInitialTab = () => {
    const tab = searchParams.get("tab");
    return ["types", "templates", "fields"].includes(tab || "") ? tab! : "types";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">合同管理</h2>
          <p className="text-sm text-slate-500">管理合同类型、模板与字段定义</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm">
            <Settings className="w-4 h-4" />
            设置
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100">
            <FileText className="w-4 h-4" />
            导出配置
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const counts = [6, 12, 13];
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "bg-white p-5 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left group",
                activeTab === tab.id
                  ? "border-indigo-200 shadow-lg shadow-indigo-50 ring-2 ring-indigo-100"
                  : "border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                activeTab === tab.id ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200"
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">
                  {tab.label}
                </p>
                <p className="text-2xl font-extrabold text-slate-900">{counts[i]}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Custom Tab Header */}
        <div className="flex items-center border-b border-slate-100 px-4 bg-slate-50/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all duration-200 border-b-2 -mb-px",
                  isActive
                    ? "text-indigo-600 border-indigo-600"
                    : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="p-0">
          {activeTab === "types" && <ContractTypeManage />}
          {activeTab === "templates" && <TemplateManage />}
          {activeTab === "fields" && <FieldManage />}
        </div>
      </div>
    </div>
  );
}
