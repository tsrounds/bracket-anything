import { db } from '../app/lib/firebase/firebase-client';
import { collection, addDoc } from 'firebase/firestore';

const testQuiz = {
  title: "Test Quiz",
  deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  questions: [
    {
      id: "1",
      type: "multiple",
      text: "What is your favorite color?",
      points: 10,
      options: ["Red", "Blue", "Green", "Yellow"]
    },
    {
      id: "2",
      type: "open",
      text: "Tell us about your favorite book and why you like it.",
      points: 20
    },
    {
      id: "3",
      type: "multiple",
      text: "How many hours do you sleep per night?",
      points: 10,
      options: ["Less than 6", "6-8", "More than 8"]
    }
  ],
  createdAt: new Date().toISOString(),
  status: "in-progress"
};

async function createTestQuiz() {
  try {
    const docRef = await addDoc(collection(db, 'quizzes'), testQuiz);
    console.log('Test quiz created successfully with ID:', docRef.id);
    console.log('You can access the quiz at:', `http://localhost:3000/quiz/${docRef.id}`);
  } catch (error) {
    console.error('Error creating test quiz:', error);
  }
}

createTestQuiz(); 