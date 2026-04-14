import { createBrowserRouter } from "react-router";
import { Root, Home } from "./pages/Root";
import { BSideLayout } from "./pages/b-side/BSideLayout";
import { Dashboard } from "./pages/b-side/Dashboard";
import { ContractList } from "./pages/b-side/ContractList";
import { ReviewDetail } from "./pages/b-side/ReviewDetail";
import { RuleLibrary } from "./pages/b-side/RuleLibrary";
import { StaffManagement, SystemSettings } from "./pages/b-side/OtherPages";
import { ContractManagement } from "./pages/b-side/ContractManagement";
import { TemplateEditor } from "./pages/b-side/TemplateEditor";
import { FieldManage } from "./pages/b-side/FieldManage";
import { CSideLayout } from "./pages/c-side/CSideLayout";
import { AgentChat } from "./pages/c-side/AgentChat";
import { MyContracts } from "./pages/c-side/MyContracts";
import { CreateContract } from "./pages/c-side/CreateContract";
import { ReportView } from "./pages/c-side/ReportView";
import { CLogin } from "./pages/c-login/CLogin";
import { CRegister } from "./pages/c-login/CRegister";
import { BLogin } from "./pages/b-login/BLogin";
import { BChangePassword } from "./pages/b-login/BChangePassword";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      // C端 Auth Routes
      { path: "c-login", Component: CLogin },
      { path: "c-register", Component: CRegister },
      // B端 Auth Routes
      { path: "b-login", Component: BLogin },
      { path: "b-change-password", Component: BChangePassword },
      {
        path: "b-side",
        Component: BSideLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: "contracts", Component: ContractManagement },
          { path: "contracts/templates", Component: ContractManagement },
          { path: "contracts/fields", Component: ContractManagement },
          { path: "contracts/template-editor", Component: TemplateEditor },
          { path: "contracts/template-editor/:templateId", Component: TemplateEditor },
          { path: "review/:id", Component: ReviewDetail },
          { path: "rules", Component: RuleLibrary },
          { path: "staff", Component: StaffManagement },
          { path: "settings", Component: SystemSettings },
        ],
      },
      {
        path: "c-side",
        Component: CSideLayout,
        children: [
          { index: true, Component: AgentChat },
          { path: "history", Component: MyContracts },
          { path: "report/:id", Component: ReportView },
        ],
      },
      // C端合同创建（不在CSideLayout内）
      { path: "c/create-contract", Component: CreateContract },
    ],
  },
]);
