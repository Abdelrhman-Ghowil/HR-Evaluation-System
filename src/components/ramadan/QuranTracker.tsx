import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Circle, Target } from 'lucide-react';

const QuranTracker = () => {
  const totalJuz = 30;
  const [completedJuz, setCompletedJuz] = useState<number[]>([]);
  const [dailyPages, setDailyPages] = useState(0);
  const targetPagesPerDay = 20; // ~604 pages / 30 days

  useEffect(() => {
    const saved = localStorage.getItem('ramadan_quran_juz');
    if (saved) setCompletedJuz(JSON.parse(saved));
    const savedPages = localStorage.getItem('ramadan_quran_daily_pages');
    if (savedPages) {
      const data = JSON.parse(savedPages);
      if (data.date === new Date().toDateString()) {
        setDailyPages(data.count);
      }
    }
  }, []);

  const toggleJuz = (juz: number) => {
    const updated = completedJuz.includes(juz)
      ? completedJuz.filter(j => j !== juz)
      : [...completedJuz, juz];
    setCompletedJuz(updated);
    localStorage.setItem('ramadan_quran_juz', JSON.stringify(updated));
  };

  const addPages = (count: number) => {
    const newCount = Math.max(0, dailyPages + count);
    setDailyPages(newCount);
    localStorage.setItem('ramadan_quran_daily_pages', JSON.stringify({
      date: new Date().toDateString(),
      count: newCount
    }));
  };

  const progress = (completedJuz.length / totalJuz) * 100;
  const dailyProgress = Math.min((dailyPages / targetPagesPerDay) * 100, 100);

  return (
    <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-cyan-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-teal-900">
          <span className="text-2xl">📗</span>
          ختمة القرآن الكريم
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge className="bg-teal-500 text-white">
            {completedJuz.length} / {totalJuz} جزء
          </Badge>
          <Badge variant="outline" className="border-teal-300 text-teal-700">
            {progress.toFixed(0)}% مكتمل
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Daily pages counter */}
        <div className="bg-white/80 rounded-xl p-4 border border-teal-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-teal-800 flex items-center gap-1">
              <Target className="h-4 w-4" />
              ورد اليوم
            </span>
            <span className="text-sm text-teal-600">{dailyPages} / {targetPagesPerDay} صفحة</span>
          </div>
          <Progress value={dailyProgress} className="h-2 mb-3" />
          <div className="flex gap-2 justify-center">
            <Button size="sm" onClick={() => addPages(-1)} variant="outline" className="border-teal-300 text-teal-700 px-3">-1</Button>
            <Button size="sm" onClick={() => addPages(1)} className="bg-teal-500 hover:bg-teal-600 text-white px-3">+1 صفحة</Button>
            <Button size="sm" onClick={() => addPages(5)} className="bg-teal-600 hover:bg-teal-700 text-white px-3">+5</Button>
            <Button size="sm" onClick={() => addPages(10)} className="bg-teal-700 hover:bg-teal-800 text-white px-3">+10</Button>
          </div>
          {dailyPages >= targetPagesPerDay && (
            <p className="text-center text-teal-600 font-bold mt-2 animate-pulse">✨ أكملت ورد اليوم! بارك الله فيك ✨</p>
          )}
        </div>

        {/* Juz Grid */}
        <div>
          <p className="text-sm font-medium text-teal-800 mb-2">تتبع الأجزاء</p>
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: totalJuz }, (_, i) => {
              const juz = i + 1;
              const isCompleted = completedJuz.includes(juz);
              return (
                <button
                  key={juz}
                  onClick={() => toggleJuz(juz)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all text-xs ${
                    isCompleted
                      ? 'bg-teal-500 text-white shadow-md scale-105'
                      : 'bg-white border border-teal-200 text-teal-700 hover:bg-teal-50'
                  }`}
                >
                  <span className="font-bold text-sm">{juz}</span>
                  {isCompleted ? <CheckCircle className="h-3 w-3 mt-0.5" /> : <Circle className="h-3 w-3 mt-0.5 opacity-30" />}
                </button>
              );
            })}
          </div>
        </div>

        {completedJuz.length === totalJuz && (
          <div className="text-center p-4 bg-teal-100 rounded-xl animate-pulse">
            <span className="text-2xl">🎉</span>
            <p className="font-bold text-teal-900 mt-1">ما شاء الله! أتممت ختمة القرآن</p>
            <p className="text-sm text-teal-600">اللهم اجعل القرآن ربيع قلوبنا</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuranTracker;
