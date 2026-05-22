import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Layout from "@/components/layout"
import LoginPage from "@/components/auth/Login"
import Dashboard from "@/components/dashboard/Overview"
import UnitsMembers from "@/components/units/UnitsMembers"
import MemberDetail from "@/components/members/MemberDetail"
import UnitDetail from "@/components/units/UnitDetail"
import StaffDetail from "@/components/staff/StaffDetail"
import BillingPayments from "@/components/billing/BillingPayments"
import InvoiceDetail from "@/components/billing/InvoiceDetail"
import NoticesCommunication from "@/components/communication/NoticesCommunication"
import AuditLog from "@/components/system/AuditLog"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/members" element={<UnitsMembers />} />
          <Route path="/members/:id" element={<MemberDetail />} />
          <Route path="/units/:id" element={<UnitDetail />} />
          <Route path="/staff" element={<StaffDetail />} />
          <Route path="/staff/:id" element={<StaffDetail />} />
          <Route path="/billing" element={<BillingPayments />} />
          <Route path="/billing/:id" element={<InvoiceDetail />} />
          <Route path="/notices" element={<NoticesCommunication />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
