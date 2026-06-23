import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/layout"
import LoginPage from "@/components/auth/Login"
import Dashboard from "@/components/dashboard/Overview"
import UnitsMembers from "@/components/units/UnitsMembers"
import MemberDetail from "@/components/members/MemberDetail"
import MemberForm from "@/components/members/MemberForm"
import UnitDetail from "@/components/units/UnitDetail"
import UnitForm from "@/components/units/UnitForm"
import StaffList from "@/components/staff/StaffList"
import StaffProfile from "@/components/staff/StaffProfile"
import StaffForm from "@/components/staff/StaffForm"
import BillingPayments from "@/components/billing/BillingPayments"
import InvoiceDetail from "@/components/billing/InvoiceDetail"
import InvoiceForm from "@/components/billing/InvoiceForm"
import NoticesCommunication from "@/components/communication/NoticesCommunication"
import AuditLog from "@/components/system/AuditLog"
import SuperAdminLayout from "@/components/super-admin/SuperAdminLayout"
import BuildingsOverview from "@/components/super-admin/BuildingsOverview"
import BuildingForm from "@/components/super-admin/BuildingForm"
import BuildingDetail from "@/components/super-admin/BuildingDetail"
import VisitorManagement from "@/components/visitors/VisitorManagement"
import VisitorForm from "@/components/visitors/VisitorForm"
import ComplaintList from "@/components/helpdesk/ComplaintList"
import ComplaintForm from "@/components/helpdesk/ComplaintForm"
import ComplaintDetail from "@/components/helpdesk/ComplaintDetail"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<BuildingsOverview />} />
          <Route path="buildings/new" element={<BuildingForm />} />
          <Route path="buildings/:id" element={<BuildingDetail />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<UnitsMembers />} />
          <Route path="/members/new" element={<MemberForm />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/units/new" element={<UnitForm />} />
          <Route path="/units/:id/edit" element={<UnitForm />} />
          <Route path="/units/:id" element={<UnitDetail />} />
          <Route path="/staff" element={<StaffList />} />
          <Route path="/staff/new" element={<StaffForm />} />
          <Route path="/staff/:id/edit" element={<StaffForm />} />
          <Route path="/staff/:id" element={<StaffProfile />} />
          <Route path="/billing" element={<BillingPayments />} />
          <Route path="/billing/new" element={<InvoiceForm />} />
          <Route path="/billing/:id" element={<InvoiceDetail />} />
          <Route path="/notices" element={<NoticesCommunication />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/visitors" element={<VisitorManagement />} />
          <Route path="/visitors/new" element={<VisitorForm />} />
          <Route path="/helpdesk" element={<ComplaintList />} />
          <Route path="/helpdesk/new" element={<ComplaintForm />} />
          <Route path="/helpdesk/:id" element={<ComplaintDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
