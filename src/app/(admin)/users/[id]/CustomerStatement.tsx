"use client"

import React, { forwardRef } from "react"
import { format } from "date-fns"

interface Payment {
  id: string
  created_at: string
  amount: number
  collected_by: string
  payment_method: string
  transaction_id?: string
  remarks?: string
}

interface Customer {
  full_name: string
  pppoe_username: string
  phone: string
  area: string
  packages?: { name: string }
}

interface CustomerStatementProps {
  customer: Customer
  payments: Payment[]
  dueBalance: number
  monthlyFee: number
  lifetimeValue: number
}

export const CustomerStatement = forwardRef<HTMLDivElement, CustomerStatementProps>(
  ({ customer, payments, dueBalance, monthlyFee, lifetimeValue }, ref) => {
    return (
      <div ref={ref} className="bg-white text-black p-10 font-sans leading-normal">
        {/* Print specific tailwind resets for perfect A4 rendering */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { margin: 15mm; size: A4 portrait; }
          }
        `}} />

        {/* ── Header ── */}
        <div className="flex justify-between items-start border-b-2 border-slate-200 pb-6 mb-6">
          <div>
            <h1 className="text-3xl font-black text-emerald-600 tracking-tighter uppercase">Purrfect Universe</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Official Account Statement</p>
          </div>
          <div className="text-right text-sm">
            <p className="text-slate-600 font-bold">Support: +880 1234-567890</p>
            <p className="text-slate-400 mt-1">Generated: {format(new Date(), "PPp")}</p>
          </div>
        </div>

        {/* ── Customer Info ── */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Subscriber Details</h3>
            <p className="font-bold text-lg">{customer.full_name}</p>
            <p className="text-sm font-mono text-slate-600 mt-1">{customer.phone}</p>
            <p className="text-sm text-slate-600">{customer.area || "N/A"}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b pb-1">Network Profile</h3>
            <p className="text-sm"><span className="text-slate-500">Username:</span> <span className="font-bold font-mono text-blue-700">{customer.pppoe_username}</span></p>
            <p className="text-sm mt-1"><span className="text-slate-500">Package:</span> <span className="font-bold">{customer.packages?.name || "Standard"}</span></p>
            <p className="text-sm mt-1"><span className="text-slate-500">Monthly Bill:</span> <span className="font-bold">৳{monthlyFee}</span></p>
          </div>
        </div>

        {/* ── Financial Summary ── */}
        <div className="bg-slate-50 rounded-lg p-5 mb-8 border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Current Due Balance</p>
            <p className={`text-2xl font-black mt-1 ${dueBalance > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {dueBalance > 0 ? `৳${dueBalance}` : "৳0 (Cleared)"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase">Lifetime Value (Total Paid)</p>
            <p className="text-xl font-black mt-1 text-slate-800">৳{lifetimeValue}</p>
          </div>
        </div>

        {/* ── Ledger Table ── */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Payment Ledger History</h3>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-slate-900">
                <th className="py-2 font-bold uppercase text-[10px] tracking-wider">Date</th>
                <th className="py-2 font-bold uppercase text-[10px] tracking-wider">Description</th>
                <th className="py-2 font-bold uppercase text-[10px] tracking-wider">Method</th>
                <th className="py-2 font-bold uppercase text-[10px] tracking-wider">Received By</th>
                <th className="py-2 font-bold uppercase text-[10px] tracking-wider text-right">Amount (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No payments recorded.</td></tr>
              ) : (
                payments.map(payment => (
                  <tr key={payment.id} className="text-slate-700">
                    <td className="py-2.5 font-mono text-xs">{format(new Date(payment.created_at), "dd MMM yyyy")}</td>
                    <td className="py-2.5">{payment.remarks || "Monthly Internet Fee Payment"}</td>
                    <td className="py-2.5 capitalize">{payment.payment_method || "N/A"}</td>
                    <td className="py-2.5 font-medium">{payment.collected_by || "System"}</td>
                    <td className="py-2.5 text-right font-bold text-slate-900">৳{payment.amount}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-800">
                <td colSpan={4} className="py-3 text-right font-bold uppercase text-xs tracking-wider text-slate-600">Total Paid (Lifetime):</td>
                <td className="py-3 text-right font-black text-base text-slate-900">৳{lifetimeValue}</td>
              </tr>
            </tfoot>
          </table>
          <p className="text-center text-[10px] text-slate-400 mt-12 italic uppercase tracking-widest border-t border-slate-100 pt-4">*** End of Statement ***</p>
        </div>
      </div>
    )
  }
)

CustomerStatement.displayName = "CustomerStatement"
