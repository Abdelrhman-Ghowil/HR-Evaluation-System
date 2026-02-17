import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';

interface DhikrType {
  id: string;
  text: string;
  translation: string;
  target: number;
}

const dhikrTypes: DhikrType[] = [
  { id: 'subhanallah', text: 'سبحان الله', translation: 'Glory be to Allah', target: 33 },
  { id: 'alhamdulillah', text: 'الحمد لله', translation: 'Praise be to Allah', target: 33 },
  { id: 'allahuakbar', text: 'الله أكبر', translation: 'Allah is the Greatest', target: 34 },
  { id: 'lailaha', text: 'لا إله إلا الله', translation: 'There is no god but Allah', target: 100 },
  { id: 'istighfar', text: 'أستغفر الله', translation: 'I seek forgiveness from Allah', target: 100 },
  { id: 'salawat', text: 'اللهم صلِّ على محمد', translation: 'O Allah, send blessings upon Muhammad', target: 100 },
  { id: 'hawqala', text: 'لا حول ولا قوة إلا بالله', translation: 'There is no power except with Allah', target: 100 },
  { id: 'tahleel', text: 'سبحان الله وبحمده', translation: 'Glory and praise be to Allah', target: 100 },
];

const Tasbeeh = () => {
  const [selectedDhikr, setSelectedDhikr] = useState<DhikrType>(dhikrTypes[0]);
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleCount = useCallback(() => {
    setCount(prev => prev + 1);
    setTotalCount(prev => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  }, []);

  const handleReset = () => {
    setCount(0);
  };

  const handleSelectDhikr = (dhikr: DhikrType) => {
    setSelectedDhikr(dhikr);
    setCount(0);
  };

  const progress = Math.min((count / selectedDhikr.target) * 100, 100);
  const isComplete = count >= selectedDhikr.target;

  return (
    <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <span className="text-2xl">📿</span>
          السبحة الإلكترونية
        </CardTitle>
        <p className="text-sm text-emerald-600">إجمالي التسبيح: {totalCount}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dhikr Type Selection */}
        <div className="flex flex-wrap gap-2">
          {dhikrTypes.map(dhikr => (
            <Badge
              key={dhikr.id}
              variant={selectedDhikr.id === dhikr.id ? 'default' : 'outline'}
              className={`cursor-pointer transition-all text-sm py-1 px-3 ${
                selectedDhikr.id === dhikr.id
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              }`}
              onClick={() => handleSelectDhikr(dhikr)}
            >
              {dhikr.text}
            </Badge>
          ))}
        </div>

        {/* Counter Display */}
        <div className="text-center space-y-4">
          <div className="relative">
            {/* Circular progress */}
            <div className="w-48 h-48 mx-auto relative">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="4"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke={isComplete ? '#10b981' : '#059669'}
                  strokeWidth="4"
                  strokeDasharray={`${progress * 2.83} ${283 - progress * 2.83}`}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <button
                onClick={handleCount}
                className={`absolute inset-4 rounded-full flex flex-col items-center justify-center transition-all duration-200 ${
                  isComplete
                    ? 'bg-emerald-100 border-4 border-emerald-400'
                    : 'bg-white border-4 border-emerald-200 hover:border-emerald-400 hover:shadow-lg active:scale-95'
                } ${isAnimating ? 'scale-95' : ''}`}
              >
                <span className="text-4xl font-bold text-emerald-800">{count}</span>
                <span className="text-xs text-emerald-600">/ {selectedDhikr.target}</span>
              </button>
            </div>
          </div>

          {/* Selected Dhikr Text */}
          <div className={`p-4 rounded-xl transition-all ${
            isAnimating ? 'bg-emerald-200 scale-105' : 'bg-white/80'
          } border border-emerald-100`}>
            <p className="text-2xl font-bold text-emerald-900 mb-1">{selectedDhikr.text}</p>
            <p className="text-sm text-emerald-600">{selectedDhikr.translation}</p>
          </div>

          {isComplete && (
            <div className="animate-bounce text-emerald-600 font-bold text-lg">
              ✨ ما شاء الله! أتممت الذكر ✨
            </div>
          )}

          {/* Reset Button */}
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            إعادة العداد
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Tasbeeh;
