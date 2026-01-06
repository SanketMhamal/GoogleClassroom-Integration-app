"use client";

import { useState, useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

type Question = {
    id: string;
    title: string | null;
    type: string | null;
    options: any; // JSON
};

type Submission = {
    id: string;
    studentEmail: string | null;
    submittedAt: Date;
    answers: any; // JSON
    files: any[];
};

type Props = {
    questions: Question[];
    submissions: Submission[];
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AnalyticsDashboard({ questions, submissions }: Props) {
    const [activeTab, setActiveTab] = useState<'summary' | 'question' | 'individual'>('summary');
    const [selectedQuestionId, setSelectedQuestionId] = useState<string>(questions[0]?.id || "");
    const [selectedSubmissionIndex, setSelectedSubmissionIndex] = useState(0);

    // Helper to extract answer value for a specific question from a submission
    const getAnswerValue = (sub: Submission, qId: string) => {
        const answers = sub.answers as any;
        if (!answers || !answers[qId]) return null;

        const ansObj = answers[qId];
        if (ansObj.textAnswers?.answers) {
            return ansObj.textAnswers.answers.map((a: any) => a.value).join(", ");
        }
        // Handle other types if needed (file upload, etc.)
        return null;
    };

    // --- Summary View Logic ---
    const summaryData = useMemo(() => {
        return questions.map(q => {
            const counts: Record<string, number> = {};
            const responses: string[] = [];

            submissions.forEach(sub => {
                const val = getAnswerValue(sub, q.id);
                if (val) {
                    responses.push(val);
                    counts[val] = (counts[val] || 0) + 1;
                }
            });

            const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }));

            return { question: q, chartData, responses };
        });
    }, [questions, submissions]);

    // --- Question View Logic ---
    const specificQuestionData = useMemo(() => {
        const q = questions.find(q => q.id === selectedQuestionId);
        if (!q) return null;

        const answers = submissions.map(sub => ({
            student: sub.studentEmail || "Anonymous",
            date: new Date(sub.submittedAt).toLocaleDateString(),
            value: getAnswerValue(sub, q.id) || "(No answer)"
        }));

        return { question: q, answers };
    }, [questions, submissions, selectedQuestionId]);


    if (questions.length === 0) return <div className="p-4 text-gray-500">No questions found. Sync possibly needed.</div>;

    return (
        <div className="bg-white rounded-lg shadow mt-4">
            {/* Tabs */}
            <div className="flex border-b">
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('summary')}
                >
                    Summary
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'question' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('question')}
                >
                    Question
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'individual' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('individual')}
                >
                    Individual
                </button>
            </div>

            <div className="p-6">
                {/* === SUMMARY VIEW === */}
                {activeTab === 'summary' && (
                    <div className="space-y-8">
                        {summaryData.map(item => (
                            <div key={item.question.id} className="bg-gray-50 p-4 rounded-lg border">
                                <h3 className="font-semibold text-lg mb-4">{item.question.title}</h3>

                                {/* Visualize based on type */}
                                {(item.question.type === 'RADIO' || item.question.type === 'CHECKBOX' || item.question.type === 'DROP_DOWN') && item.chartData.length > 0 ? (
                                    <div className="h-64 w-full flex flex-col md:flex-row items-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={item.chartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {item.chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="text-xs text-gray-500 mt-2 md:mt-0 md:ml-4 w-full md:w-48 max-h-40 overflow-y-auto">
                                            <ul>
                                                {item.chartData.map((d, i) => (
                                                    <li key={i} className="flex justify-between mb-1">
                                                        <span>{d.name}</span>
                                                        <span className="font-semibold">{d.value}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto bg-white border p-2 rounded">
                                        {item.responses.length > 0 ? (
                                            <ul className="list-disc list-inside text-sm">
                                                {item.responses.map((r, i) => (
                                                    <li key={i} className="py-1 border-b last:border-0">{r}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-400 italic text-sm">No responses.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* === QUESTION VIEW === */}
                {activeTab === 'question' && (
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <label className="font-medium text-gray-700">Select Question:</label>
                            <select
                                className="border rounded p-2 flex-1 max-w-md"
                                value={selectedQuestionId}
                                onChange={(e) => setSelectedQuestionId(e.target.value)}
                            >
                                {questions.map(q => (
                                    <option key={q.id} value={q.id}>{q.title}</option>
                                ))}
                            </select>
                        </div>

                        {specificQuestionData && (
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h3 className="font-bold text-lg mb-4 text-blue-900">{specificQuestionData.question.title}</h3>
                                <span className="text-xs uppercase bg-blue-100 text-blue-800 px-2 py-1 rounded mb-4 inline-block">
                                    {specificQuestionData.question.type}
                                </span>

                                <div className="space-y-2 mt-4">
                                    {specificQuestionData.answers.map((ans, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-800">{ans.value}</p>
                                            </div>
                                            <div className="text-right text-xs text-gray-400">
                                                <p>{ans.student}</p>
                                                <p>{ans.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* === INDIVIDUAL VIEW === */}
                {activeTab === 'individual' && submissions.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-6 bg-gray-100 p-4 rounded">
                            <button
                                disabled={selectedSubmissionIndex === 0}
                                onClick={() => setSelectedSubmissionIndex(prev => prev - 1)}
                                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                            >
                                &larr; Prev
                            </button>
                            <div className="text-center">
                                <p className="font-bold">{submissions[selectedSubmissionIndex].studentEmail || "Anonymous"}</p>
                                <p className="text-xs text-gray-500">
                                    Submission {selectedSubmissionIndex + 1} of {submissions.length} • {new Date(submissions[selectedSubmissionIndex].submittedAt).toLocaleDateString()}
                                </p>
                            </div>
                            <button
                                disabled={selectedSubmissionIndex === submissions.length - 1}
                                onClick={() => setSelectedSubmissionIndex(prev => prev + 1)}
                                className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                            >
                                Next &rarr;
                            </button>
                        </div>

                        <div className="space-y-6">
                            {questions.map(q => (
                                <div key={q.id} className="border-b pb-4 last:border-0">
                                    <p className="text-sm text-gray-500 mb-1">{q.title}</p>
                                    <div className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                        {getAnswerValue(submissions[selectedSubmissionIndex], q.id) || <span className="text-gray-400 italic">No answer</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Show Files if any */}
                        {submissions[selectedSubmissionIndex].files.length > 0 && (
                            <div className="mt-8 pt-4 border-t">
                                <h4 className="font-medium mb-3">Attached Files</h4>
                                <div className="flex flex-wrap gap-2">
                                    {submissions[selectedSubmissionIndex].files.map((file: any) => (
                                        <a
                                            key={file.id}
                                            href={file.webViewLink || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 p-2 border rounded hover:bg-gray-100 group"
                                        >
                                            {file.thumbnailLink ? (
                                                <img src={file.thumbnailLink} alt={file.name} className="w-8 h-8 object-cover rounded" />
                                            ) : (
                                                <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">📄</div>
                                            )}
                                            <div className="max-w-[150px] truncate text-sm text-blue-600 group-hover:underline" title={file.name}>
                                                {file.name}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
