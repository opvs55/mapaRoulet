import React, { useState } from 'react';
import { LogoIcon, CameraIcon, PartyPopperIcon } from '../ui/Icons.tsx';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <LogoIcon className="w-24 h-24 text-blue-400" />,
      title: 'Bem-vindo ao Radar Urbano!',
      description: 'Descubra e compartilhe os melhores eventos e momentos que estão rolando na sua cidade, em tempo real.',
      buttonText: 'Começar',
    },
    {
      icon: <CameraIcon className="w-24 h-24 text-green-400" />,
      title: 'Explore e Interaja',
      description: 'Navegue pelo mapa para ver o que está acontecendo. Clique nos eventos para ver fotos, vídeos e comentar.',
      buttonText: 'Próximo',
    },
    {
      icon: <PartyPopperIcon className="w-24 h-24 text-yellow-400" />,
      title: 'Crie seu Próprio Rolê',
      description: 'Gostou de um lugar? Crie um post, adicione uma foto e mostre para todo mundo o que está rolando!',
      buttonText: 'Entendi, vamos lá!',
    },
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentStep = steps[step];

  return (
    <div className="w-screen h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
      <div className="flex flex-col items-center justify-center flex-grow">
        <div className="mb-8 transition-opacity duration-500">
          {currentStep.icon}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{currentStep.title}</h1>
        <p className="text-lg text-gray-300 max-w-md mx-auto">{currentStep.description}</p>
      </div>

      <div className="w-full max-w-md">
         <div className="flex justify-center mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2.5 h-2.5 rounded-full mx-1.5 transition-all duration-300 ${
                  index === step ? 'bg-blue-500 scale-125' : 'bg-gray-600'
                }`}
              ></div>
            ))}
          </div>
        <button
          onClick={handleNext}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-transform transform hover:scale-105"
        >
          {currentStep.buttonText}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;