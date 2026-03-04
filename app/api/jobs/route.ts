import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApplicationStatus } from "@/types";
import { createJobSchema } from "@/lib/validations/job";

/**
 * GET /api/jobs
 * List job applications for the signed-in user. Optional ?status= filter.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ApplicationStatus | null;

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
 * Create a job application. Body validated with Zod.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((issue) => issue.message)
        .filter(Boolean)
        .join("; ");
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const id = nanoid();
    const now = new Date();

    const [newJob] = await db
      .insert(applications)
      .values({
        id,
        userId,
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        jobUrl: data.jobUrl,
        applicationUrl: data.applicationUrl || undefined,
        status: data.status,
        source: data.source,
        notes: data.notes,
        salaryRange: data.salaryRange,
        location: data.location,
        appliedDate: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}
