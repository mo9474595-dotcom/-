"use client";

export default function ReceiptPrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-full bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy"
    >
      تحميل / طباعة الإيصال
    </button>
  );
}
