import { auth } from "@/auth";
import { prisma } from "../../../lib/prisma";
import { AnalyticsDashboard } from "../../../components/AnalyticsDashboard";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AssignmentPage({ params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) redirect("/");

    const assignment = await prisma.assignment.findUnique({
        where: { id: params.id },
        include: {
            submissions: { include: { files: true } },
            questions: true,
            course: true
        }
    });

    if (!assignment) {
        return <div className="p-10 text-center">Assignment not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/" className="flex items-center text-sm text-gray-500 hover:text-blue-600 transition-colors">
                        ← Back to Dashboard
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
                    <p className="text-gray-500">
                        Course: <span className="font-medium text-gray-700">{assignment.course.name}</span> •
                        Responses: <span className="font-medium text-gray-700">{assignment.submissions.length}</span>
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <AnalyticsDashboard
                        questions={assignment.questions as any[]}
                        submissions={assignment.submissions as any[]}
                    />
                </div>
            </div>
        </div>
    );
}
