import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

const FastingTracker = () => {
  const [fastingDays, setFastingDays] = useState<number[]>([]);
  const ramadanDays = 30;

  useEffect(() => {
    const saved = localStorage.getItem('ramadan_fasting_days');
    if (saved) setFastingDays(JSON.parse(saved));
  }, []);

  const toggleDay = (day: number) => {
    const updated = fastingDays.includes(day)
      ? fastingDays.filter(d => d !== day)
      : [...fastingDays, day];
    setFastingDays(updated);
    localStorage.setItem('ramadan_fasting_days', JSON.stringify(updated));
  };

  const progress = (fastingDays.length / ramadanDays) * 100;

  return (
    <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-indigo-900">
          <span className="text-2xl">🌙</span>
          متتبع الصيام
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge className="bg-indigo-500 text-white">
            {fastingDays.length} / {ramadanDays} يوم
          </Badge>
          <Badge variant="outline" className="border-indigo-300 text-indigo-700">
            {progress.toFixed(0)}% مكتمل
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="w-full bg-indigo-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-500 to-violet-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: ramadanDays }, (_, i) => {
            const day = i + 1;
            const isFasted = fastingDays.includes(day);
            return (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isFasted
                    ? 'bg-indigo-500 text-white shadow-md scale-105'
                    : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                }`}
              >
                <span className="text-xs font-medium">يوم</span>
                <span className="text-lg font-bold">{day}</span>
                {isFasted ? (
                  <CheckCircle className="h-3 w-3 mt-0.5" />
                ) : (
                  <Circle className="h-3 w-3 mt-0.5 opacity-30" />
                )}
              </button>
            );
          })}
        </div>

        {fastingDays.length === ramadanDays && (
          <div className="text-center p-4 bg-indigo-100 rounded-xl animate-pulse">
            <span className="text-2xl">🎉</span>
            <p className="font-bold text-indigo-900 mt-1">ما شاء الله! أتممت صيام رمضان كاملاً</p>
            <p className="text-sm text-indigo-600">تقبل الله منا ومنكم</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FastingTracker;
