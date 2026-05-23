const BASE_URL = "http://localhost:8000"

function getToken(): string | null {
  return localStorage.getItem("bsms_token")
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem("bsms_token")
    if (window.location.pathname !== "/login") {
      window.location.href = "/login"
    }
    throw new Error("Session expired. Please sign in again.")
  }
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = error.detail
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((item: { msg?: string }) => item.msg || "").filter(Boolean).join(", ")
          : `Request failed: ${res.status}`
    throw new Error(message || `Request failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export interface PaymentRecord {
  id: string
  invoice_id: string
  amount: string
  payment_date: string
  payment_method: string
}

export const api = {
  auth: {
    login: (email: string, password: string, role: string) =>
      request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      }),
    me: () => request<{ id: string; email: string; name: string; role: string }>("/auth/me"),
  },

  dashboard: {
    stats: () =>
      request<{
        total_units: number
        occupied_units: number
        vacancy_rate: string
        pending_payments: string
        overdue_count: number
        staff_on_duty: number
        total_members: number
        total_staff: number
      }>("/dashboard/stats"),
  },

  members: {
    list: () =>
      request<Array<{ id: string; name: string; email: string; phone: string; unit_id: string | null; is_active: boolean; created_at: string }>>("/members/"),
    get: (id: string) =>
      request<{
        id: string
        name: string
        email: string
        phone: string
        unit_id: string | null
        move_in_date: string | null
        is_owner: boolean
        is_active: boolean
        created_at: string
        unit_number: string | null
        building: string | null
        maintenance_fee: string | null
        outstanding_balance: string
        payment_history: Array<{
          id: string
          invoice_id: string
          amount: string
          payment_date: string
          payment_method: string
        }>
      }>(`/members/${id}`),
    create: (data: Record<string, unknown>) =>
      request<{ id: string }>("/members/", { method: "POST", body: JSON.stringify(data) }),
  },

  units: {
    list: () =>
      request<Array<{ id: string; unit_number: string; building: string; floor: number; bedrooms: number; bathrooms: number; status: string; occupant_name: string | null; maintenance_fee: string }>>("/units/"),
    get: (id: string) => request<Record<string, unknown>>(`/units/${id}`),
    create: (data: Record<string, unknown>) =>
      request<{ id: string }>("/units/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ id: string }>(`/units/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  staff: {
    list: () => request<Array<{ id: string; name: string; email: string; phone: string; position: string; department: string; is_active: boolean }>>("/staff/"),
    get: (id: string) => request<Record<string, unknown>>(`/staff/${id}`),
    create: (data: Record<string, unknown>) =>
      request<{ id: string }>("/staff/", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ id: string }>(`/staff/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  },

  billing: {
    invoices: () =>
      request<Array<{
        id: string
        invoice_number: string
        member_id: string
        amount: string
        due_date: string
        status: string
        created_at: string
      }>>("/billing/invoices"),
    getInvoice: (id: string) => request<Record<string, unknown>>(`/billing/invoices/${id}`),
    createInvoice: (data: Record<string, unknown>) =>
      request<{ id: string }>("/billing/invoices", { method: "POST", body: JSON.stringify(data) }),
    createPayment: (data: Record<string, unknown>) =>
      request<{ id: string }>("/billing/payments", { method: "POST", body: JSON.stringify(data) }),
  },

  notices: {
    list: () =>
      request<Array<{
        id: string
        title: string
        content: string
        priority: string
        author_id: string | null
        is_published: boolean
        published_at: string | null
        created_at: string
      }>>("/notices/"),
    create: (data: Record<string, unknown>) =>
      request<{ id: string }>("/notices/", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/notices/${id}`, { method: "DELETE" }),
  },

  auditLog: {
    list: (params?: { entity_type?: string; action?: string }) => {
      const query = new URLSearchParams()
      if (params?.entity_type) query.set("entity_type", params.entity_type)
      if (params?.action) query.set("action", params.action)
      const qs = query.toString()
      return request<Array<{
        id: string
        user_id: string | null
        action: string
        entity_type: string
        details: string | null
        created_at: string
      }>>(`/audit-log${qs ? `?${qs}` : ""}`)
    },
  },
}
