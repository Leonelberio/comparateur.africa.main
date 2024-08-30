import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth"; // Assuming you have an auth setup in lib/auth.ts


// GET all data sources
export async function GET() {
  try {
    const dataSources = await db.dataSource.findMany();
    return NextResponse.json(dataSources);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data sources" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
    try {
      const { comparatorId, authKey, type, sheetId } = await req.json();
      const session = await auth(); // Get the session with Auth.js v5
  
      if (!session?.user?.id) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
      }
  
      const newDataSource = await db.dataSource.create({
        data: {
          comparatorId,
          userId: session.user.id,
          authKey,
          type,
          sheetId,
          lastUsed: new Date(),
        },
      });
  
      return NextResponse.json(newDataSource);
    } catch (error) {
      console.error("Error creating data source:", error);
      return NextResponse.json({ error: "Failed to create data source" }, { status: 500 });
    }
  }