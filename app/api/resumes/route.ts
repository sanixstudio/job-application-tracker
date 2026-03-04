import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createResumeSchema } from "@/lib/validations/resume";

/**
 * GET /api/resumes
 * Returns the signed-in user's resume (one per user in v1). 404 if none.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .limit(1);

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: resume });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch resume" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/resumes
 * Create a resume for the signed-in user. 409 if user already has one.
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

    const [existing] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Resume already exists for this user" },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = createResumeSchema.safeParse(body);
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

    const [newResume] = await db
      .insert(resumes)
      .values({
        id,
        userId,
        title: data.title,
        content: data.content as typeof resumes.$inferInsert.content,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json({ success: true, data: newResume }, { status: 201 });
  } catch (error) {
    console.error("Error creating resume:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create resume" },
      { status: 500 }
    );
  }
}
