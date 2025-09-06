import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface StanCaptchaProps {
  onComplete: () => void;
  isCompleted: boolean;
}

export const StanCaptcha: React.FC<StanCaptchaProps> = ({ onComplete, isCompleted }) => {
  const [answer, setAnswer] = useState('');
  const [isSmiling, setIsSmiling] = useState(false);

  const correctAnswers = [
    'nowhere', 'home', 'work', 'school', 'store', 'outside', 
    'away', 'out', 'shopping', 'office', 'gym', 'park'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (correctAnswers.some(correct => 
      answer.toLowerCase().includes(correct) || correct.includes(answer.toLowerCase())
    )) {
      setIsSmiling(true);
      setTimeout(() => {
        onComplete();
      }, 500);
    } else {
      // Shake animation for wrong answer
      const stanElement = document.getElementById('stan-character');
      if (stanElement) {
        stanElement.classList.add('shake');
        setTimeout(() => {
          stanElement.classList.remove('shake');
        }, 500);
      }
    }
  };

  if (isCompleted) {
    return null;
  }

  return (
    <div className="w-full bg-background/95 backdrop-blur-sm border border-border rounded-lg p-6 mb-4">
      <div className="text-center mb-4">
        <div 
          id="stan-character" 
          className={`inline-block transition-all duration-300 ${isSmiling ? 'scale-110' : ''}`}
        >
          <div className="relative w-24 h-32 mx-auto mb-4">
            {/* Stan's head */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-yellow-200 rounded-full border-2 border-gray-800">
              {/* Hair */}
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-gray-800 rounded-full"></div>
              
              {/* Eyes */}
              <div className="absolute top-6 left-3 w-6 h-4 bg-white rounded border border-gray-800">
                <div className={`w-3 h-3 bg-gray-800 rounded-full mt-0.5 ml-0.5 transition-all duration-300 ${isSmiling ? 'animate-bounce' : ''}`}></div>
              </div>
              <div className="absolute top-6 right-3 w-6 h-4 bg-white rounded border border-gray-800">
                <div className={`w-3 h-3 bg-gray-800 rounded-full mt-0.5 ml-0.5 transition-all duration-300 ${isSmiling ? 'animate-bounce' : ''}`}></div>
              </div>
              
              {/* Glasses */}
              <div className="absolute top-5 left-2 right-2 h-6 border-2 border-gray-800 rounded bg-transparent">
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800"></div>
              </div>
              
              {/* Nose */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600"></div>
              
              {/* Mouth */}
              <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
                isSmiling ? 'w-6 h-3 border-b-2 border-l-2 border-r-2 border-gray-800 rounded-b-full' : 'w-4 h-1 bg-gray-800'
              }`}></div>
              
              {/* Tears (when not smiling) */}
              {!isSmiling && (
                <>
                  <div className="tear absolute top-11 left-2 w-1 h-4 bg-blue-400 rounded-full opacity-70 animate-pulse"></div>
                  <div className="tear absolute top-11 right-2 w-1 h-4 bg-blue-400 rounded-full opacity-70 animate-pulse"></div>
                </>
              )}
            </div>
            
            {/* Body */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gray-800 rounded"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-8 bg-blue-600 rounded-b"></div>
          </div>
        </div>
        
        <p className="text-foreground font-medium mb-4">
          Prove you're human. Make Stan smile.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Where did you go?"
          className="text-center"
          required
        />
        <Button type="submit" className="w-full" variant="secondary">
          Tell Stan
        </Button>
      </form>
      
      <p className="text-xs text-muted-foreground text-center mt-2">
        reCAPTCHA
      </p>
      
      <style>{`
        .shake {
          animation: shake 0.5s ease-in-out;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .tear {
          animation: tears-falling 2s ease-in-out infinite;
        }
        
        @keyframes tears-falling {
          0% { transform: translateY(0); opacity: 0.7; }
          100% { transform: translateY(8px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};