import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase/firebase-admin';

interface Question {
  id: string;
  points: number;
}

export async function POST(request: Request) {
  try {
    const { quizId, answers, questions } = await request.json();

    if (!quizId || !answers || !questions) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update quiz status and correct answers
    await adminDb.collection('quizzes').doc(quizId).update({
      status: 'completed',
      correctAnswers: answers,
      completedAt: new Date().toISOString(),
    });

    // Get all submissions for this quiz and calculate scores
    const submissionsSnapshot = await adminDb
      .collection('submissions')
      .where('quizId', '==', quizId)
      .get();

    await Promise.all(
      submissionsSnapshot.docs.map(async (submissionDoc) => {
        const submission = submissionDoc.data();
        let score = 0;

        Object.entries(submission.answers as Record<string, string>).forEach(
          ([questionId, answer]) => {
            const correctAnswer = answers[questionId];
            const participantAnswer = answer.trim();
            const isCorrect = Array.isArray(correctAnswer)
              ? correctAnswer.some((ca: string) => ca.trim() === participantAnswer)
              : participantAnswer === (correctAnswer as string).trim();
            if (isCorrect) {
              const question = (questions as Question[]).find((q) => q.id === questionId);
              if (question) score += question.points;
            }
          }
        );

        await submissionDoc.ref.update({ score });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing quiz:', error);
    return NextResponse.json({ error: 'Failed to complete quiz' }, { status: 500 });
  }
}
