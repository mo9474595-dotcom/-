import PptxGenJS from "pptxgenjs";
import type { StudentBreakdown } from "@/lib/ranking";

const NAVY = "1B3A6B";
const BLUE = "2F6FED";
const GREEN = "1E9E6B";
const GRAY = "667085";
const LIGHT_GRAY = "F2F4F7";

function pctText(v: number | null): string {
  return v == null ? "—" : `${v.toFixed(1)}%`;
}

function average(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

const MAX_CHART_STUDENTS = 20;
const ROWS_PER_TABLE_SLIDE = 14;

/**
 * Builds a presentable .pptx summarizing one class's performance — meant to
 * be shown as-is to parents or school administration, not just raw data.
 * Uses pptxgenjs's native chart/table objects (not embedded images), so the
 * result stays editable in PowerPoint and never touches any image-parsing
 * code path.
 */
export async function buildClassReportPptx(params: {
  orgName: string;
  className: string;
  ranking: StudentBreakdown[];
}): Promise<Buffer> {
  const { orgName, className, ranking } = params;
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 10, height: 5.63 });
  pptx.layout = "WIDE";
  pptx.rtlMode = true;

  const rtlText = (align: "right" | "center" | "left" = "right") => ({ align, rtlMode: true });

  // --- Title slide ---
  const title = pptx.addSlide();
  title.background = { color: "FFFFFF" };
  title.addText(className, {
    x: 0.5, y: 1.7, w: 9, h: 1,
    fontSize: 34, bold: true, color: NAVY, ...rtlText("center"),
  });
  title.addText("تقرير أداء الشعبة", {
    x: 0.5, y: 2.6, w: 9, h: 0.6,
    fontSize: 18, color: GRAY, ...rtlText("center"),
  });
  title.addText(orgName, {
    x: 0.5, y: 4.4, w: 9, h: 0.4,
    fontSize: 12, color: GRAY, ...rtlText("center"),
  });
  title.addText(
    new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
    { x: 0.5, y: 4.8, w: 9, h: 0.4, fontSize: 11, color: GRAY, ...rtlText("center") }
  );

  // --- Summary / KPI slide ---
  const summary = pptx.addSlide();
  summary.addText("نظرة عامة", { x: 0.5, y: 0.3, w: 9, h: 0.6, fontSize: 24, bold: true, color: NAVY, ...rtlText() });

  const kpis: { label: string; value: string; color: string }[] = [
    { label: "عدد الطلاب", value: String(ranking.length), color: BLUE },
    { label: "متوسط المعدل العام", value: pctText(average(ranking.map((r) => r.overallPct))), color: GREEN },
    { label: "متوسط الحضور", value: pctText(average(ranking.map((r) => r.attendancePct))), color: BLUE },
    { label: "متوسط الامتحانات", value: pctText(average(ranking.map((r) => r.examPct))), color: NAVY },
  ];
  const boxW = 2.1;
  const gap = 0.15;
  const startX = (10 - (boxW * kpis.length + gap * (kpis.length - 1))) / 2;
  kpis.forEach((k, i) => {
    const x = startX + i * (boxW + gap);
    summary.addShape(pptx.ShapeType.roundRect, {
      x, y: 1.2, w: boxW, h: 1.6, fill: { color: LIGHT_GRAY }, line: { color: LIGHT_GRAY },
      rectRadius: 0.08,
    });
    summary.addText(k.value, { x, y: 1.35, w: boxW, h: 0.8, fontSize: 26, bold: true, color: k.color, align: "center" });
    summary.addText(k.label, { x, y: 2.15, w: boxW, h: 0.5, fontSize: 11, color: GRAY, align: "center" });
  });

  // --- Chart slide: overall % per student ---
  if (ranking.length > 0) {
    const chartSlide = pptx.addSlide();
    const truncated = ranking.length > MAX_CHART_STUDENTS;
    const chartRanking = truncated ? ranking.slice(0, MAX_CHART_STUDENTS) : ranking;
    chartSlide.addText(
      truncated ? `المعدل العام لكل طالب (أعلى ${MAX_CHART_STUDENTS})` : "المعدل العام لكل طالب",
      { x: 0.5, y: 0.3, w: 9, h: 0.5, fontSize: 20, bold: true, color: NAVY, ...rtlText() }
    );
    chartSlide.addChart(
      pptx.ChartType.bar,
      [
        {
          name: "المعدل العام %",
          labels: chartRanking.map((r) => r.fullName),
          values: chartRanking.map((r) => Math.round(r.overallPct ?? 0)),
        },
      ],
      {
        x: 0.4, y: 0.9, w: 9.2, h: 4.5,
        barDir: "col",
        showValue: true,
        dataLabelFontSize: 8,
        catAxisLabelFontSize: 8,
        valAxisMaxVal: 100,
        chartColors: [BLUE],
        showLegend: false,
      }
    );
  }

  // --- Roster table slide(s) ---
  const headerRow = [
    "الترتيب", "اسم الطالب", "الامتحانات %", "درجات أخرى %", "المشاريع %", "الحضور %", "المعدل العام %",
  ].map((t) => ({
    text: t,
    options: { bold: true, fill: { color: NAVY }, color: "FFFFFF", fontSize: 10, align: "center" as const },
  }));

  for (let start = 0; start < ranking.length; start += ROWS_PER_TABLE_SLIDE) {
    const chunk = ranking.slice(start, start + ROWS_PER_TABLE_SLIDE);
    const tableSlide = pptx.addSlide();
    tableSlide.addText(
      ranking.length > ROWS_PER_TABLE_SLIDE
        ? `قائمة الطلاب (${start + 1}–${start + chunk.length} من ${ranking.length})`
        : "قائمة الطلاب",
      { x: 0.5, y: 0.25, w: 9, h: 0.5, fontSize: 18, bold: true, color: NAVY, ...rtlText() }
    );

    const rows = [
      headerRow,
      ...chunk.map((r, i) => {
        const rank = start + i + 1;
        const cells = [
          String(rank),
          r.fullName,
          pctText(r.examPct),
          pctText(r.manualPct),
          pctText(r.projectPct),
          pctText(r.attendancePct),
          pctText(r.overallPct),
        ];
        return cells.map((text, ci) => ({
          text,
          options: {
            fontSize: 10,
            align: ci === 1 ? ("right" as const) : ("center" as const),
            fill: { color: rank % 2 === 0 ? LIGHT_GRAY : "FFFFFF" },
          },
        }));
      }),
    ];

    tableSlide.addTable(rows, { x: 0.4, y: 0.9, w: 9.2, h: 4.4, colW: [0.9, 3.2, 1.24, 1.24, 1.24, 1.24, 1.24] });
  }

  const buf = await pptx.write({ outputType: "nodebuffer" });
  return buf as Buffer;
}
