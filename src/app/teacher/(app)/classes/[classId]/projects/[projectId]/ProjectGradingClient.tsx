"use client";

import { useState } from "react";
import type { StudentProfile, ProjectGrade } from "@prisma/client";

type Row = { student: StudentProfile; grade: ProjectGrade | null };

export default function ProjectGradingClient({
  projectId,
  maxScore,
  initialRows,
}: {
  projectId: string;
  maxScore: number;
  initialRows: Row[];
}) {
  const [rows, setRows] = useState(initialRows);
  const [saving, setSaving] = useState<string | null>(null);

  async function save(studentProfileId: string, score: number, feedback: string) {
    setSaving(studentProfileId);
    const res = await fetch(`/api/teacher/projects/${projectId}/grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentProfileId, score, feedback }),
    });
    const data = await res.json();
    setSaving(null);
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.student.id === studentProfileId ? { ...r, grade: data.grade } : r
        )
      );
    }
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-right text-slate-500">
            <th className="px-4 py-3 font-medium">الطالب</th>
            <th className="px-4 py-3 font-medium">الدرجة (من {maxScore})</th>
            <th className="px-4 py-3 font-medium">ملاحظات</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <GradeRow
              key={row.student.id}
              row={row}
              maxScore={maxScore}
              saving={saving === row.student.id}
              onSave={save}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GradeRow({
  row,
  maxScore,
  saving,
  onSave,
}: {
  row: Row;
  maxScore: number;
  saving: boolean;
  onSave: (studentProfileId: string, score: number, feedback: string) => void;
}) {
  const [score, setScore] = useState(row.grade?.score ?? 0);
  const [feedback, setFeedback] = useState(row.grade?.feedback ?? "");

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 font-medium text-slate-900">{row.student.fullName}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={maxScore}
          step="0.5"
          value={score}
          onChange={(e) => setScore(Number(e.target.value))}
          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <input
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSave(row.student.id, score, feedback)}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saving ? "..." : "حفظ"}
        </button>
      </td>
    </tr>
  );
}
