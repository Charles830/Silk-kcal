import React, { useState } from 'react';
import { Camera, History, Target, ArrowRight, Check } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Camera size={48} className="text-avocado-600" />,
      title: "拍照即识",
      description: "无需手动输入，拍摄食物即可由 AI 自动分析热量与营养成分。",
      color: "bg-avocado-100"
    },
    {
      icon: <History size={48} className="text-orange-500" />,
      title: "饮食足迹",
      description: "按时间轴记录每日饮食。右滑卡片即可删除，轻松管理饮食日记。",
      color: "bg-orange-100"
    },
    {
      icon: <Target size={48} className="text-blue-500" />,
      title: "目标管理",
      description: "设定增肌或减脂目标，AI 将为您分析每日摄入并提供针对性建议。",
      color: "bg-blue-100"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-cream flex flex-col items-center justify-center p-6 animate-slide-up">
      {/* Skip Button */}
      <button 
        onClick={onComplete}
        className="absolute top-6 right-6 text-stone-400 font-medium text-sm hover:text-stone-600"
      >
        跳过
      </button>

      <div className="w-full max-w-sm">
        {/* Carousel Content */}
        <div className="mb-12 text-center">
          <div className="h-64 flex items-center justify-center relative mb-8">
            {steps.map((s, index) => (
              <div 
                key={index}
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 ease-in-out transform
                  ${index === step ? 'opacity-100 translate-x-0 scale-100' : 
                    index < step ? 'opacity-0 -translate-x-full scale-90' : 'opacity-0 translate-x-full scale-90'}
                `}
              >
                <div className={`w-32 h-32 ${s.color} rounded-full flex items-center justify-center mb-8 shadow-inner`}>
                  {s.icon}
                </div>
                <h2 className="text-2xl font-bold text-avocado-900 mb-4">{s.title}</h2>
                <p className="text-stone-600 leading-relaxed px-4">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-10">
          {steps.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === step ? 'w-8 bg-avocado-600' : 'w-2 bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleNext}
          className="w-full bg-avocado-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-avocado-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-avocado-700"
        >
          {step === steps.length - 1 ? (
            <>
              开始使用 <Check size={20} />
            </>
          ) : (
            <>
              下一步 <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};