'use client';

import { useState, useEffect } from 'react';
import { db } from '../../../lib/firebase/firebase-client';
import firebase from 'firebase/compat/app';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/UserAuth';
import UserAuth from '../../../components/UserAuth';
import AvatarSelector from '../../../components/AvatarSelector';
import RegistrationLayout from '../../../components/RegistrationLayout';
import ConsolidatedRegistrationForm from '../../../components/ConsolidatedRegistrationForm';

interface UserRegistration {
  name: string;
  phoneNumber: string;
  avatar?: string;
}

const NameStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">What's your name?</div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light border-none focus:ring-0 focus:outline-none bg-transparent"
      placeholder="Type your answer here..."
      autoFocus
    />
  </div>
);

const PhoneStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">What's your phone number?</div>
    <input
      type="tel"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-3xl font-light border-none focus:ring-0 focus:outline-none bg-transparent"
      placeholder="Type your answer here..."
      autoFocus
    />
  </div>
);

const AvatarStep = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="space-y-4">
    <div className="text-2xl text-gray-700">Choose your avatar</div>
    <div className="flex justify-center">
      <AvatarSelector
        onAvatarSelect={onChange}
        initialAvatar={value}
      />
    </div>
  </div>
);

export default function QuizRegistration({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UserRegistration>({
    name: '',
    phoneNumber: '',
    avatar: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const router = useRouter();

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinalSubmit = () => {
    router.replace(`/quiz/${params.id}/take`);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!user?.uid) {
        throw new Error('Please sign in to continue');
      }

      if (!db) {
        throw new Error('Database not initialized');
      }

      if (!formData.name.trim() || !formData.phoneNumber.trim()) {
        throw new Error('Please fill in all required fields');
      }

      const firestore = db as firebase.firestore.Firestore;

      // Update user profile
      await firestore.collection('userProfiles').doc(user.uid).set({
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        avatar: formData.avatar || null,
      }, { merge: true });

      // Create quiz registration
      await firestore.collection('quizRegistrations').doc(`${params.id}_${user.uid}`).set({
        userId: user.uid,
        name: formData.name.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        avatar: formData.avatar || null,
        quizId: params.id,
        createdAt: new Date().toISOString(),
      });

      // Set as registered before proceeding
      setIsRegistered(true);

      // Store session data
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('userName', formData.name.trim());
      sessionStorage.setItem('quizId', params.id);

      // Show consolidated form instead of redirecting
      setIsSubmitting(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to register');
      setIsSubmitting(false);
    }
  };

  // Single effect for data fetching
  useEffect(() => {
    const checkRegistration = async () => {
      // Don't do anything while auth is loading
      if (authLoading) {
        console.log('Waiting for auth...');
        return;
      }

      // If no user after auth is done loading, we can stop initializing
      if (!user) {
        console.log('No user found, stopping initialization');
        setIsInitializing(false);
        setHasCheckedRegistration(true);
        return;
      }

      // Only proceed with data fetching if we haven't checked registration yet
      if (!hasCheckedRegistration && db) {
        try {
          console.log('Checking registration status for user:', user.uid);
          const firestore = db as firebase.firestore.Firestore;
          
          // Get user profile data
          const userProfileDoc = await firestore.collection('userProfiles').doc(user.uid).get();
          
          if (userProfileDoc.exists) {
            const profileData = userProfileDoc.data();
            setFormData({
              name: profileData?.name || '',
              phoneNumber: profileData?.phoneNumber || '',
              avatar: profileData?.avatar || '',
            });
          }

          // Check quiz registration
          const registrationId = `${params.id}_${user.uid}`;
          const quizRegistrationDoc = await firestore
            .collection('quizRegistrations')
            .doc(registrationId)
            .get();

          console.log('Registration check complete:', { exists: quizRegistrationDoc.exists });
          setIsRegistered(quizRegistrationDoc.exists);
        } catch (error) {
          console.error('Error checking registration:', error);
        } finally {
          setIsInitializing(false);
          setHasCheckedRegistration(true);
        }
      }
    };

    checkRegistration();
  }, [user, authLoading, params.id, hasCheckedRegistration]);

  // Debug effect for state changes
  useEffect(() => {
    console.log('Component state:', { 
      authLoading,
      hasUser: !!user,
      isInitializing,
      hasCheckedRegistration,
      isRegistered,
      currentStep
    });
  }, [authLoading, user, isInitializing, hasCheckedRegistration, isRegistered, currentStep]);

  // Show loading state during auth or data initialization
  if (authLoading || (isInitializing && !hasCheckedRegistration)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show auth component if no user
  if (!user) {
    return <UserAuth />;
  }

  // Show consolidated form for registered users
  if (isRegistered) {
    return (
      <ConsolidatedRegistrationForm
        formData={formData}
        onSubmit={(e) => {
          e.preventDefault();
          handleFinalSubmit();
        }}
        onChange={handleFieldChange}
        error={error}
        loading={isSubmitting}
      />
    );
  }

  // Show step-by-step form first
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <NameStep
            value={formData.name}
            onChange={(value) => handleFieldChange('name', value)}
          />
        );
      case 2:
        return (
          <PhoneStep
            value={formData.phoneNumber}
            onChange={(value) => handleFieldChange('phoneNumber', value)}
          />
        );
      case 3:
        return (
          <AvatarStep
            value={formData.avatar || ''}
            onChange={(value) => handleFieldChange('avatar', value)}
          />
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.phoneNumber.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <RegistrationLayout currentStep={currentStep} totalSteps={3}>
      <div className="space-y-8">
        {renderStep()}
        
        {error && (
          <div className="text-red-600 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:bg-blue-400"
        >
          {currentStep === 3 ? (isSubmitting ? 'Starting...' : 'Start Quiz') : 'Continue'}
        </button>
      </div>
    </RegistrationLayout>
  );
} 