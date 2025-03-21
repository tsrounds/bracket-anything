import { Metadata, ResolvingMetadata } from 'next';
import { adminDb } from '../../lib/firebase/firebase-admin';
import dynamic from 'next/dynamic';
import { cache } from 'react';

// Import the client component
const QuizContent = dynamic(() => import('./QuizContent'), {
  ssr: false
});

interface Props {
  params: { id: string };
}

interface Quiz {
  id: string;
  title: string;
  deadline: string;
  status: 'in-progress' | 'completed';
  coverImage?: string;
  questions: {
    id: string;
    text: string;
    type: 'multiple' | 'open';
    points: number;
    options?: string[];
  }[];
}

// Cache the quiz data fetch
const getQuizData = cache(async (quizId: string) => {
  console.log('Fetching quiz data for ID:', quizId);
  try {
    const docRef = adminDb.collection('quizzes').doc(quizId);
    console.log('Doc ref created:', docRef.path);
    
    const quizDoc = await docRef.get();
    console.log('Quiz doc fetched, exists:', quizDoc.exists);
    
    if (!quizDoc.exists) {
      console.log('Quiz not found');
      return null;
    }
    
    const data = { id: quizDoc.id, ...quizDoc.data() } as Quiz;
    console.log('Quiz data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching quiz data:', error);
    throw error;
  }
});

// Generate dynamic metadata for the quiz
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  console.log('Generating metadata for quiz ID:', params.id);
  
  try {
    const quiz = await getQuizData(params.id);
    console.log('Quiz data for metadata:', quiz);
    
    if (!quiz) {
      console.log('Quiz not found, returning default metadata');
      return {
        title: 'Quiz Not Found',
        description: 'The quiz you are looking for does not exist.',
      };
    }

    // Get parent metadata (to inherit things like metadataBase)
    const previousMetadata = await parent;
    console.log('Previous metadata:', previousMetadata);

    const metadata = {
      title: quiz.title,
      description: `Take part in the quiz: ${quiz.title}`,
      openGraph: {
        title: quiz.title,
        description: `Take part in the quiz: ${quiz.title}`,
        images: quiz.coverImage ? [quiz.coverImage] : undefined,
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: quiz.title,
        description: `Take part in the quiz: ${quiz.title}`,
        images: quiz.coverImage ? [quiz.coverImage] : undefined,
      },
    };
    
    console.log('Generated metadata:', metadata);
    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error Loading Quiz',
      description: 'There was an error loading the quiz.',
    };
  }
}

export default async function QuizPage({ params }: Props) {
  try {
    // Pre-fetch the quiz data to ensure it exists
    const quiz = await getQuizData(params.id);
    if (!quiz) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Quiz Not Found</h1>
            <p className="text-gray-600">The quiz you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      );
    }
    
    return <QuizContent />;
  } catch (error) {
    console.error('Error in QuizPage:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Quiz</h1>
          <p className="text-gray-600">There was an error loading the quiz. Please try again later.</p>
        </div>
      </div>
    );
  }
} 