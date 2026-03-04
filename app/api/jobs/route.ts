import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApplicationStatus, JobSource } from "@/types";

/**
 * GET /api/jobs
 * Retrieve all job applications, optionally filtered by status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ApplicationStatus | null;
    const userId = "default_user"; // For MVP, single user

    const conditions = [eq(applications.userId, userId)];
    if (status) {
      conditions.push(eq(applications.status, status));
    }

    const jobs = await db
      .select()
      .from(applications)
      .where(and(...conditions))
      .orderBy(desc(applications.appliedDate));

    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Create a new job application
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      jobTitle,
      companyName,
      jobUrl,
      applicationUrl,
      status = "applied",
      source = "manual",
      notes,
      salaryRange,
      location,
    } = body;

    // Validation
    if (!jobTitle || !companyName || !jobUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: jobTitle, companyName, jobUrl" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date();

    const newJob = await db
      .insert(applications)
      .values({
        id,
        userId: "default_user",
        jobTitle,
        companyName,
        jobUrl,
        applicationUrl,
        status: status as ApplicationStatus,
        source: source as JobSource,
        notes,
        salaryRange,
        location,
        appliedDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ success: true, data: newJob[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
