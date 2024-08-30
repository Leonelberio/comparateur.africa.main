import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const comparatorId = parseInt(params.id, 10);
  
      if (isNaN(comparatorId)) {
        return NextResponse.json({ error: "Invalid comparator ID" }, { status: 400 });
      }
  
      const comparator = await db.comparator.findUnique({
        where: { id: comparatorId },
        include: { dataSources: true },
      });
  
      if (!comparator) {
        return NextResponse.json({ error: "Comparator not found" }, { status: 404 });
      }
  
      return NextResponse.json(comparator);
    } catch (error) {
      console.error("Error fetching comparator:", error);
      return NextResponse.json({ error: "Failed to fetch comparator" }, { status: 500 });
    }
  }


  export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
      const body = await req.json();
  
      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
      }
  
      const parsedId = parseInt(id, 10);
  
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
  
      // Check if the comparator exists before updating
      const existingComparator = await db.comparator.findUnique({
        where: { id: parsedId },
      });
  
      if (!existingComparator) {
        return NextResponse.json({ error: "Comparator not found" }, { status: 404 });
      }
  
      const updatedComparator = await db.comparator.update({
        where: { id: parsedId },
        data: {
          ...body,
        },
      });
  
      return NextResponse.json(updatedComparator);
    } catch (error) {
      console.error("Error updating comparator:", error);
      return NextResponse.json({ error: "Failed to update comparator" }, { status: 500 });
    }
  }

  
  
  // DELETE a comparator by ID
  export async function DELETE(req: NextRequest) {
    try {
      // Get the current user's session
      const session = await auth();
  
      // Ensure that a user session is available
      if (!session?.user?.id) {
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
      }
  
      const userId = session.user.id;
      const url = new URL(req.url);
      const comparatorId = url.searchParams.get("id");
  
      // Ensure a comparator ID is provided
      if (!comparatorId) {
        return NextResponse.json({ error: "Comparator ID is required" }, { status: 400 });
      }
  
      // Ensure the comparator belongs to the current user
      const comparator = await db.comparator.findFirst({
        where: { id: Number(comparatorId), ownerId: userId },
      });
  
      // Check if the comparator exists and belongs to the user
      if (!comparator) {
        return NextResponse.json({ error: "Comparator not found or not authorized" }, { status: 404 });
      }
  
      // Delete the comparator
      await db.comparator.delete({
        where: { id: Number(comparatorId) },
      });
  
      // Return a success message
      return NextResponse.json({ message: "Comparator deleted successfully" });
    } catch (error) {
      console.error("Error deleting comparator:", error);
      return NextResponse.json({ error: "Failed to delete comparator" }, { status: 500 });
    }
  }
  