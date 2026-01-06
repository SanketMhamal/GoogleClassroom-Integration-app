// app/page.tsx
import { auth, signIn, signOut } from "@/auth";
import { SyncButton } from "../components/SyncButton";
import { DisconnectButton } from "../components/DisconnectButton";
import { prisma } from "../lib/prisma";
import { StatCard } from "../components/StatCard";

export default async function Home() {
  const session = await auth();

  // Fetch data to display if user is logged in
  const courses = session?.user?.id
    ? await prisma.course.findMany({
      where: { teacherId: session.user.id },
      include: { assignments: { include: { submissions: true } } }
    })
    : [];

  // Calculate stats
  const totalCourses = courses.length;
  const totalAssignments = courses.reduce((acc, c) => acc + c.assignments.length, 0);
  const totalSubmissions = courses.reduce((acc, c) => acc + c.assignments.reduce((a, s) => a + s.submissions.length, 0), 0);

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Classroom Analytics</h1>
            {session?.user && (
              <p className="text-gray-500 mt-1">
                Overview for <span className="font-medium text-gray-700">{session.user.name}</span>
              </p>
            )}
          </div>

          {session ? (
            <div className="flex items-center gap-3 mt-4 md:mt-0">
              <SyncButton />
              <form
                action={async () => {
                  "use server"
                  await signOut()
                }}
              >
                <button type="submit" className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  Sign Out
                </button>
              </form>
              <div className="border-l pl-3 ml-1">
                <DisconnectButton />
              </div>
            </div>
          ) : (
            <form
              action={async () => {
                "use server"
                await signIn("google")
              }}
            >
              <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
                Sign In with Google
              </button>
            </form>
          )}
        </div>

        {session && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Active Courses" value={totalCourses} color="blue" />
              <StatCard title="Total Forms" value={totalAssignments} color="purple" />
              <StatCard title="Total Responses" value={totalSubmissions} color="green" trend="+12" />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {courses.length === 0 && (
                <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No courses found. Click "Sync" to get started.</p>
                </div>
              )}

              {courses.map(course => (
                <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                  <div className="p-5 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1" title={course.name}>{course.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">Course ID: {course.id}</p>
                  </div>

                  <div className="p-5">
                    {course.assignments.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No forms linked.</p>
                    ) : (
                      <div className="space-y-3">
                        {course.assignments.map(assign => (
                          <a href={`/assignment/${assign.id}`} key={assign.id} className="block group">
                            <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-semibold text-gray-700 group-hover:text-blue-700 line-clamp-1">{assign.title}</span>
                                <span className="bg-white px-2 py-1 rounded-md text-xs font-bold text-gray-500 shadow-sm group-hover:text-blue-600">
                                  {assign.submissions.length}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-400 group-hover:text-blue-500/70">
                                <span>View Analytics →</span>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}