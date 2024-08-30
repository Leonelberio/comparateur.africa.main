import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET a specific data source
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const dataSource = await db.dataSource.findUnique({
      where: { id: params.id },
      include: { selectedColumns: true },
    });

    if (!dataSource) {
      return NextResponse.json({ error: "Data source not found" }, { status: 404 });
    }

    return NextResponse.json(dataSource);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data source" }, { status: 500 });
  }
}

// PUT update a specific data source
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const dataSource = await db.dataSource.update({
      where: { id: params.id },
      data: {
        ...body,
      },
    });
    return NextResponse.json(dataSource);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update data source" }, { status: 500 });
  }
}

// DELETE a specific data source
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.dataSource.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete data source" }, { status: 500 });
  }
}
