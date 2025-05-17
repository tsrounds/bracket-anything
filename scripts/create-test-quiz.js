const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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