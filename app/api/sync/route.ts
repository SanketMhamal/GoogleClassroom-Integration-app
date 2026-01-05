// app/api/sync/route.ts
import { auth } from "@/auth"; 
import { syncClassroomData } from "../../../lib/google-sync";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run the sync function for the logged-in user
    await syncClassroomData(session.user.id);
    return NextResponse.json({ success: true, message: "Sync Complete" });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}