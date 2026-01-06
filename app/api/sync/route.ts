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
  } catch (error: any) {
    console.error("Sync Error:", error);

    if (error.message?.includes('invalid_grant') || JSON.stringify(error).includes('invalid_grant')) {
      return NextResponse.json({
        error: "Your Google session has expired. Please Sign Out and Sign In again."
      }, { status: 401 });
    }

    return NextResponse.json({ error: "Sync failed: " + (error.message || "Unknown error") }, { status: 500 });
  }
}