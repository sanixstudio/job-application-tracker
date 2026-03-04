import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ApplicationStatus } from "@/types";

/**
 * GET /api/jobs/[id]
 * Get a specific job application by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "default_user";

    const job = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!job.length || job[0].userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: job[0] });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/jobs/[id]
 * Update a job application
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "default_user";
    const body = await request.json();

    // Check if job exists and belongs to user
    const existing = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!existing.length || existing[0].userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    // Update job
    const updated = await db
      .update(applications)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(applications.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update job" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/jobs/[id]
 * Delete a job application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "default_user";

    // Check if job exists and belongs to user
    const existing = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id))
      .limit(1);

    if (!existing.length || existing[0].userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    await db.delete(applications).where(eq(applications.id, id));

    return NextResponse.json({ success: true, message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
