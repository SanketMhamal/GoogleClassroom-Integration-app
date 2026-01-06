import { auth } from "@/auth";
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Delete the Google Account link for this user
        // This forces NextAuth to create a fresh one on next login
        await prisma.account.deleteMany({
            where: {
                userId: session.user.id,
                provider: "google"
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Disconnect Error:", error);
        return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }
}
