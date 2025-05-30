import React from 'react';
import ProgressBar from './ProgressBar';

interface RegistrationLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
}

const RegistrationLayout: React.FC<RegistrationLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="min-h-screen bg-[#0e162a]">
      <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
      <div className="max-w-md mx-auto min-h-screen flex flex-col px-4">
        <div className="flex-grow flex flex-col justify-center -mt-16">
          <h1 className="text-3xl font-bold mb-8 text-white/90 font-['PP_Object_Sans']">Get started</h1>
          {children}
        </div>
      </div>
    </div>
  );
};

export default RegistrationLayout; 