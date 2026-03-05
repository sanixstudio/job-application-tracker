import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { jsPDF } from "jspdf";
import type { ResumeSection } from "@/types";

const MARGIN = 20;
const LINE_HEIGHT = 6;
const TITLE_FONT_SIZE = 18;
const HEADING_FONT_SIZE = 12;
const BODY_FONT_SIZE = 10;

/**
 * GET /api/resumes/[id]/export?format=pdf
 * Generates a PDF of the resume and returns it as a download. User must own the resume.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format") ?? "pdf";

    if (format !== "pdf") {
      return NextResponse.json(
        { success: false, error: "Unsupported format. Use format=pdf" },
        { status: 400 }
      );
    }

    const [resume] = await db
      .select()
      .from(resumes)
      .where(and(eq(resumes.id, id), eq(resumes.userId, userId)))
      .limit(1);

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    const doc = new jsPDF();
    let y = MARGIN;

    const addText = (text: string, fontSize: number, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, doc.internal.pageSize.getWidth() - 2 * MARGIN);
      for (const line of lines) {
        if (y > doc.internal.pageSize.getHeight() - MARGIN) {
          doc.addPage();
          y = MARGIN;
        }
        doc.text(line, MARGIN, y);
        y += LINE_HEIGHT;
      }
    };

    // Title
    addText(resume.title, TITLE_FONT_SIZE, true);
    y += LINE_HEIGHT;

    // Sections
    const sections = (resume.content as { sections?: ResumeSection[] })?.sections ?? [];
    for (const section of sections) {
      if (y > doc.internal.pageSize.getHeight() - MARGIN - 20) {
        doc.addPage();
        y = MARGIN;
      }
      addText(section.heading, HEADING_FONT_SIZE, true);
      y += LINE_HEIGHT;

      if (section.body) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(BODY_FONT_SIZE);
        const bodyLines = doc.splitTextToSize(
          section.body,
          doc.internal.pageSize.getWidth() - 2 * MARGIN
        );
        for (const line of bodyLines) {
          if (y > doc.internal.pageSize.getHeight() - MARGIN) {
            doc.addPage();
            y = MARGIN;
          }
          doc.text(line, MARGIN, y);
          y += LINE_HEIGHT;
        }
        y += LINE_HEIGHT;
      }

      if (section.items?.length) {
        for (const item of section.items) {
          const company = (item.company ?? "").trim();
          const title = (item.title ?? "").trim();
          const dates = (item.dates ?? "").trim();
          const description = (item.description ?? item.bullets ?? "").trim();
          const school = (item.school ?? "").trim();
          const degree = (item.degree ?? "").trim();
          const field = (item.field ?? "").trim();
          const isExperience = section.type === "experience" && (company || title || dates || description);
          const isEducation = section.type === "education" && (school || degree || field || dates);

          if (isEducation) {
            const degreeLine = [degree, field].filter(Boolean).join(" in ");
            const header = [school, degreeLine, dates].filter(Boolean).join(" · ");
            if (header) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(BODY_FONT_SIZE);
              const headerLines = doc.splitTextToSize(header, doc.internal.pageSize.getWidth() - 2 * MARGIN);
              for (const line of headerLines) {
                if (y > doc.internal.pageSize.getHeight() - MARGIN) {
                  doc.addPage();
                  y = MARGIN;
                }
                doc.text(line, MARGIN, y);
                y += LINE_HEIGHT;
              }
              doc.setFont("helvetica", "normal");
            }
          } else if (isExperience) {
            const header = [company, title, dates].filter(Boolean).join(" · ");
            if (header) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(BODY_FONT_SIZE);
              const headerLines = doc.splitTextToSize(header, doc.internal.pageSize.getWidth() - 2 * MARGIN);
              for (const line of headerLines) {
                if (y > doc.internal.pageSize.getHeight() - MARGIN) {
                  doc.addPage();
                  y = MARGIN;
                }
                doc.text(line, MARGIN, y);
                y += LINE_HEIGHT;
              }
              doc.setFont("helvetica", "normal");
            }
            if (description) {
              const bulletLines = description.split(/\r?\n/).filter((l) => l.trim());
              for (const bl of bulletLines) {
                const prefixed = bl.trim().replace(/^[•\-]\s*/, "");
                const lines = doc.splitTextToSize("• " + prefixed, doc.internal.pageSize.getWidth() - 2 * MARGIN - 6);
                for (const line of lines) {
                  if (y > doc.internal.pageSize.getHeight() - MARGIN) {
                    doc.addPage();
                    y = MARGIN;
                  }
                  doc.text(line, MARGIN + 4, y);
                  y += LINE_HEIGHT;
                }
              }
            }
          } else if (!isExperience && !isEducation) {
            const parts = Object.entries(item)
              .filter(([, v]) => v != null && String(v).trim() !== "")
              .map(([k, v]) => `${k}: ${v}`);
            if (parts.length === 0) continue;
            const itemText = parts.join(" · ");
            doc.setFontSize(BODY_FONT_SIZE);
            const itemLines = doc.splitTextToSize(
              itemText,
              doc.internal.pageSize.getWidth() - 2 * MARGIN
            );
            for (const line of itemLines) {
              if (y > doc.internal.pageSize.getHeight() - MARGIN) {
                doc.addPage();
                y = MARGIN;
              }
              doc.text(line, MARGIN, y);
              y += LINE_HEIGHT;
            }
          }
          y += LINE_HEIGHT * 0.5;
        }
        y += LINE_HEIGHT;
      }
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resume.title.replace(/[^a-z0-9-_]/gi, "_") || "resume"}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Error exporting resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export resume" },
      { status: 500 }
    );
  }
}
