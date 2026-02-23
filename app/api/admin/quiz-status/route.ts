import { NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase/firebase-admin';

export async function PATCH(request: Request) {
  try {
    const { quizId, newStatus } = await request.json();

    if (!quizId || !newStatus) {
      return NextResponse.json({ error: 'Missing quizId or newStatus' }, { status: 400 });
    }

    if (!['in-progress', 'completed'].includes(newStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await adminDb.collection('quizzes').doc(quizId).update({ status: newStatus });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating quiz status:', error);
    return NextResponse.json({ error: 'Failed to update quiz status' }, { status: 500 });
  }
}
