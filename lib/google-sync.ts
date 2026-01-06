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

  // Handle token refresh issues proactively
  authClient.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: account.providerAccountId
          }
        },
        data: {
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + (tokens.expiry_date || 3600)),
          refresh_token: tokens.refresh_token,
        }
      });
    } else if (tokens.access_token) {
      await prisma.account.update({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: account.providerAccountId
          }
        },
        data: {
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000 + (tokens.expiry_date || 3600)),
        }
      });
    }
  });

  // Refresh the token if it's expired (Google handles this internally usually, but good to be safe)
  // Note: googleapis library handles refresh automatically if refresh_token is present

  try {
    // Test request to verify token status
    await authClient.getAccessToken();
  } catch (error: any) {
    console.error("Token Validation Failed:", error.message);
    if (error.message?.includes('invalid_grant')) {
      throw new Error("Your Google session has expired or was revoked. Please Sign Out and Sign In again to reconnect.");
    }
  }

  const classroom = google.classroom({ version: 'v1', auth: authClient });
  const forms = google.forms({ version: 'v1', auth: authClient });
  const drive = google.drive({ version: 'v3', auth: authClient });

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
      if (!work.id) continue;
      let formId: string | null = null;
      let formUrl: string | null = null;

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
          update: { title: work.title || "Untitled", formId, formUrl },
          create: {
            id: work.id!,
            title: work.title!,
            courseId: course.id,
            formId,
            formUrl
          },
        });

        // 5. Fetch Form Structure (Questions) & Responses
        try {
          // A. Fetch Form Structure
          const formMeta = await forms.forms.get({ formId });
          const items = formMeta.data.items || [];

          for (const item of items) {
            if (item.questionItem) {
              const q = item.questionItem.question;
              // Determine type and options
              let type = "TEXT";
              let options: string[] = [];

              if (q?.textQuestion) type = "TEXT";
              if (q?.choiceQuestion) {
                type = q.choiceQuestion.type || "RADIO";
                options = q.choiceQuestion.options?.map(o => o.value || "") || [];
              }
              if (q?.fileUploadQuestion) type = "FILE_UPLOAD";
              if (q?.dateQuestion) type = "DATE";
              if (q?.timeQuestion) type = "TIME";
              if (q?.scaleQuestion) type = "SCALE";

              // Save Question
              await prisma.question.upsert({
                where: { id: q?.questionId! },
                update: {
                  title: item.title,
                  type,
                  options: options as any
                },
                create: {
                  id: q?.questionId!,
                  assignmentId: work.id!,
                  title: item.title,
                  type,
                  options: options as any
                }
              });
            }
          }

          // B. Fetch Responses
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
              const submission = await prisma.submission.create({
                data: {
                  assignmentId: work.id!,
                  studentEmail: sub.respondentEmail || "Anonymous",
                  submittedAt: new Date(sub.lastSubmittedTime!),
                  // Save the raw answer object as JSON
                  answers: sub.answers as any
                }
              });

              // Process file uploads
              if (sub.answers) {
                for (const [questionId, answer] of Object.entries(sub.answers)) {
                  const answerObj = answer as any;
                  if (answerObj.fileUploadAnswers && answerObj.fileUploadAnswers.answers) {
                    for (const fileAnswer of answerObj.fileUploadAnswers.answers) {
                      const fileId = fileAnswer.fileId;
                      if (fileId) {
                        try {
                          // Fetch file metadata from Drive
                          const fileMeta = await drive.files.get({
                            fileId: fileId,
                            fields: 'id, name, mimeType, thumbnailLink, webViewLink'
                          });

                          const fileData = fileMeta.data;

                          await prisma.formFile.create({
                            data: {
                              fileId: fileData.id!,
                              name: fileData.name || "Untitled",
                              mimeType: fileData.mimeType || "application/octet-stream",
                              thumbnailLink: fileData.thumbnailLink,
                              webViewLink: fileData.webViewLink,
                              submissionId: submission.id
                            }
                          });
                        } catch (driveErr) {
                          console.error(`Failed to fetch file ${fileId} from Drive:`, driveErr);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (err: any) {
          console.error(`[ERROR] Failed to sync form ${formId}:`, err.message);
          console.error(JSON.stringify(err.response?.data?.error || err));
        }
      }
    }
  }
}