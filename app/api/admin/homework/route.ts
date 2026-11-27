import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, isAdminAuthenticated } from "@/lib/auth";
import {
  createHomeworkAssignment,
  deleteHomeworkAssignment,
  fetchAllHomework,
} from "@/lib/homework";

export async function GET() {
  const homework = await fetchAllHomework();
  return NextResponse.json({ homework });
}

export async function POST(req: NextRequest) {
  const user = getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      subjectName?: unknown;
      title?: unknown;
      description?: unknown;
      dueDate?: unknown;
      linkUrl?: unknown;
    };

    const subjectName =
      typeof body.subjectName === "string" ? body.subjectName.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const rawLink = typeof body.linkUrl === "string" ? body.linkUrl.trim() : "";

    if (!subjectName || !title || !description) {
      return NextResponse.json(
        { error: "Subject, title, and description are required." },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json(
        { error: "Please choose a valid due date." },
        { status: 400 }
      );
    }

    let linkUrl: string | null = null;
    if (rawLink.length > 0) {
      if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
        linkUrl = rawLink.slice(0, 500);
      } else {
        linkUrl = `https://${rawLink.slice(0, 490)}`;
      }
    }

    const homework = await createHomeworkAssignment({
      subjectName: subjectName.slice(0, 80),
      title: title.slice(0, 140),
      description: description.slice(0, 2000),
      dueDate,
      linkUrl,
      createdBy: user.username,
    });

    return NextResponse.json({ homework }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ error: "Missing homework id." }, { status: 400 });
  }

  const ok = await deleteHomeworkAssignment(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Homework assignment not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ deleted: true });
}
