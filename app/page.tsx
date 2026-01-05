// app/page.tsx
import { auth, signIn, signOut } from "@/auth";
import { SyncButton } from "../components/SyncButton";
import { prisma } from "../lib/prisma";

export default async function Home() {
  const session = await auth();

  // Fetch data to display if user is logged in
  const courses = session?.user?.id 
    ? await prisma.course.findMany({ 
        where: { teacherId: session.user.id },
        include: { assignments: { include: { submissions: true } } }
      }) 
    : [];

  return (
    <main className="min-h-screen p-10 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Google Classroom Integration
        </h1>

        {!session ? (
          <div className="text-center py-10">
            <p className="mb-4 text-gray-600">Please sign in to access your classrooms.</p>
            <form action={async () => { "use server"; await signIn("google"); }}>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                Sign in with Google
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <div>
                <p className="text-lg font-medium">Welcome, {session.user?.name}</p>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
              
              <div className="flex gap-4">
                 <SyncButton />
                 <form action={async () => { "use server"; await signOut(); }}>
                   <button className="text-red-500 hover:text-red-700 font-medium px-4 py-3">
                     Sign Out
                   </button>
                 </form>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Your Classrooms</h2>
              {courses.length === 0 ? (
                <p className="text-gray-500 italic">No courses found yet. Click Sync!</p>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg text-blue-900">{course.name}</h3>
                    
                    <div className="mt-4 pl-4 border-l-2 border-gray-200">
                      {course.assignments.length === 0 && <p className="text-sm text-gray-400">No forms found.</p>}
                      
                      {course.assignments.map(assign => (
                        <div key={assign.id} className="mb-4">
                          <p className="font-medium">{assign.title}</p>
                          <p className="text-sm text-gray-500 mb-2">
                            Responses: {assign.submissions.length}
                          </p>
                          
                          {/* Simple table for responses */}
                          {assign.submissions.length > 0 && (
                            <div className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              <pre>{JSON.stringify(assign.submissions[0].answers, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}