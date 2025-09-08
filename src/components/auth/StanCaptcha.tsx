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

  const positiveWords = [
    'happy', 'smile', 'love', 'great', 'awesome', 'wonderful', 'amazing', 
    'fantastic', 'beautiful', 'good', 'nice', 'excellent', 'perfect',
    'joy', 'fun', 'exciting', 'brilliant', 'marvelous', 'superb',
    'delightful', 'pleasant', 'cheerful', 'magnificent', 'spectacular',
    'incredible', 'outstanding', 'fabulous', 'terrific', 'splendid',
    'lovely', 'charming', 'sweet', 'kind', 'caring', 'warm', 'cozy',
    'cool', 'cute', 'adorable', 'friendly', 'handsome', 'pretty',
    'smart', 'clever', 'talented', 'special', 'unique', 'funny',
    'hilarious', 'entertaining', 'enjoyable', 'relaxing', 'peaceful'
  ];

  const negativePhrases = [
    'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'bad',
    'ugly', 'stupid', 'dumb', 'worst', 'suck', 'boring', 'annoying',
    'trash', 'garbage', 'worthless', 'useless', 'pathetic', 'loser',
    'idiot', 'moron', 'failure', 'disgusting', 'gross', 'creepy',
    'weird', 'lame', 'cringe', 'sucks', 'die', 'kill', 'destroy'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lowerAnswer = answer.toLowerCase().trim();
    
    // Check if the answer contains positive words
    const hasPositiveWords = positiveWords.some(word => lowerAnswer.includes(word));
    const hasNegativeWords = negativePhrases.some(word => lowerAnswer.includes(word));
    
    // Accept if it has positive words and no negative words, or if it's a generally uplifting phrase
    const upliftingPhrases = [
      'you are amazing', 'you are great', 'you are awesome', 'you are wonderful',
      'you are the best', 'you are fantastic', 'you are incredible', 'you are special',
      'you matter', 'you are loved', 'you are important', 'you are valued',
      'keep going', 'stay strong', 'be happy', 'have a great day',
      'you got this', 'believe in yourself', 'you are enough', 'stan is',
      'hello stan', 'hi stan', 'hey stan', 'looking good'
    ];
    
    // Check for exact uplifting phrases or if answer is just positive without negative words
    const isUpliftingPhrase = upliftingPhrases.some(phrase => 
      lowerAnswer.includes(phrase)
    );
    
    // More lenient check - if it's reasonably long and has positive words, accept it
    const isPositiveMessage = lowerAnswer.length >= 3 && hasPositiveWords;
    
    if ((isPositiveMessage && !hasNegativeWords) || (isUpliftingPhrase && !hasNegativeWords)) {
      setIsSmiling(true);
      setTimeout(() => {
        onComplete();
      }, 800);
    } else {
      // Shake animation for wrong answer
      const stanElement = document.getElementById('stan-character');
      if (stanElement) {
        stanElement.classList.add('shake');
        setTimeout(() => {
          stanElement.classList.remove('shake');
        }, 500);
      }
      // Clear the input to try again
      setTimeout(() => {
        setAnswer('');
      }, 500);
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
                <div className={`w-3 h-3 bg-gray-800 rounded-full mt-0.5 ml-0.5 transition-all duration-500 ${
                  isSmiling ? 'transform scale-110 animate-pulse' : ''
                }`}></div>
              </div>
              <div className="absolute top-6 right-3 w-6 h-4 bg-white rounded border border-gray-800">
                <div className={`w-3 h-3 bg-gray-800 rounded-full mt-0.5 ml-0.5 transition-all duration-500 ${
                  isSmiling ? 'transform scale-110 animate-pulse' : ''
                }`}></div>
              </div>
              
              {/* Glasses */}
              <div className="absolute top-5 left-2 right-2 h-6 border-2 border-gray-800 rounded bg-transparent">
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-gray-800"></div>
              </div>
              
              {/* Nose */}
              <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-gray-600"></div>
              
              {/* Mouth */}
              <div className={`absolute top-12 left-1/2 transform -translate-x-1/2 transition-all duration-500 ${
                isSmiling ? 'w-6 h-3 border-b-2 border-l-2 border-r-2 border-gray-800 rounded-b-full animate-pulse' : 'w-4 h-1 bg-gray-800 rounded'
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
          {isSmiling ? "Thank you! Stan is happy! 😊" : "Prove you're human. Make Stan smile."}
        </p>
        {!isSmiling && (
          <p className="text-sm text-muted-foreground mb-4">
            💡 Hint: Say something nice to Stan!
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Say something nice to Stan..."
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