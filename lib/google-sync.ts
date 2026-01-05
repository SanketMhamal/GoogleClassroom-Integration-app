// lib/google-sync.ts
import { google } from 'googleapis';
import { prisma } from "./prisma";

export async function syncClassroomData(userId: string) {
  // 1. Get the User's Tokens from MySQL
  const account = await prisma.account.findFirst({
    where: { userId: userId, provider: 'google' },
  });

  if (!account || !account.refresh_token) {
    throw new Error("User not connected to Google or missing refresh token. Please sign out and sign in again.");
  }

  // 2. Setup Google Client
  const authClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  
  authClient.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  // Refresh the token if it's expired (Google handles this internally usually, but good to be safe)
  // Note: googleapis library handles refresh automatically if refresh_token is present

  const classroom = google.classroom({ version: 'v1', auth: authClient });
  const forms = google.forms({ version: 'v1', auth: authClient });

  console.log("Starting Sync for User:", userId);

  // 3. List Courses
  const coursesRes = await classroom.courses.list({ teacherId: 'me' });
  const courses = coursesRes.data.courses || [];

  for (const course of courses) {
    if (!course.id) continue;

    // Save Course to DB
    await prisma.course.upsert({
      where: { id: course.id },
      update: { name: course.name || "Untitled" },
      create: { 
        id: course.id, 
        name: course.name || "Untitled", 
        teacherId: userId 
      },
    });

    // 4. List Assignments
    const workRes = await classroom.courses.courseWork.list({ courseId: course.id });
    const assignments = workRes.data.courseWork || [];

    for (const work of assignments) {
       let formId = null;
       let formUrl = null;

       // Look for Forms inside assignment materials
       if (work.materials) {
         work.materials.forEach(mat => {
           // Check driveFile or explicit form object
           const possibleUrl = mat.form?.formUrl || mat.driveFile?.driveFile?.alternateLink;
           
           if (possibleUrl && possibleUrl.includes("docs.google.com/forms")) {
             formUrl = possibleUrl;
             // Regex to extract ID between /d/ and /viewform
             const match = formUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
             if (match) formId = match[1];
           }
         });
       }

       if (formId) {
         // Save Assignment
         await prisma.assignment.upsert({
           where: { id: work.id },
           update: { title: work.title, formId, formUrl },
           create: { 
             id: work.id!, 
             title: work.title!, 
             courseId: course.id, 
             formId, 
             formUrl 
           },
         });

         // 5. Fetch Actual Form Responses
         try {
           const responsesRes = await forms.forms.responses.list({ formId });
           const submissions = responsesRes.data.responses || [];

           for (const sub of submissions) {
             const existing = await prisma.submission.findFirst({
               where: { 
                 assignmentId: work.id, 
                 submittedAt: new Date(sub.lastSubmittedTime!) 
               }
             });

             if (!existing) {
               await prisma.submission.create({
                 data: {
                   assignmentId: work.id!,
                   studentEmail: sub.respondentEmail || "Anonymous",
                   submittedAt: new Date(sub.lastSubmittedTime!),
                   // Save the raw answer object as JSON
                   answers: sub.answers as any 
                 }
               });
             }
           }
         } catch (err) {
           console.log(`Skipping form ${formId} (You might not own this form).`);
         }
       }
    }
  }
}