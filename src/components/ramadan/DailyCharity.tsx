import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, RefreshCw, CheckCircle } from 'lucide-react';

const charityIdeas = [
  { text: 'تصدق بمبلغ مالي لفقير أو محتاج', emoji: '💰', category: 'مال' },
  { text: 'أطعم صائماً عند الإفطار', emoji: '🍽️', category: 'طعام' },
  { text: 'تبرع بملابس لا تحتاجها', emoji: '👕', category: 'ملابس' },
  { text: 'ساعد جارك في حاجته', emoji: '🏠', category: 'مساعدة' },
  { text: 'اسقِ الماء للصائمين', emoji: '💧', category: 'طعام' },
  { text: 'ادعُ لأخيك المسلم بظهر الغيب', emoji: '🤲', category: 'دعاء' },
  { text: 'تبسم في وجه أخيك', emoji: '😊', category: 'أخلاق' },
  { text: 'أصلح بين متخاصمين', emoji: '🤝', category: 'أخلاق' },
  { text: 'علِّم طفلاً آية من القرآن', emoji: '📖', category: 'علم' },
  { text: 'ساهم في كفالة يتيم', emoji: '👶', category: 'مال' },
  { text: 'أزل الأذى عن الطريق', emoji: '🧹', category: 'أخلاق' },
  { text: 'أفشِ السلام على من تعرف ومن لا تعرف', emoji: '👋', category: 'أخلاق' },
  { text: 'تبرع بالدم', emoji: '🩸', category: 'مساعدة' },
  { text: 'اكفل عائلة محتاجة في رمضان', emoji: '👨‍👩‍👧‍👦', category: 'مال' },
  { text: 'شارك طعامك مع جيرانك', emoji: '🥘', category: 'طعام' },
  { text: 'تبرع بكتب مفيدة', emoji: '📚', category: 'علم' },
  { text: 'ساعد مسناً في حاجته', emoji: '👴', category: 'مساعدة' },
  { text: 'اغرس شجرة أو نبتة', emoji: '🌱', category: 'بيئة' },
  { text: 'صِل رحمك واتصل بأقاربك', emoji: '📞', category: 'أخلاق' },
  { text: 'ادخل السرور على قلب طفل يتيم', emoji: '🎁', category: 'مساعدة' },
  { text: 'انشر علماً نافعاً على وسائل التواصل', emoji: '📱', category: 'علم' },
  { text: 'اعتق رقبة بالتبرع لسجين معسر', emoji: '⛓️', category: 'مال' },
  { text: 'أحسن إلى حيوان بإطعامه أو سقيه', emoji: '🐱', category: 'أخلاق' },
  { text: 'ساعد في تنظيف مسجد', emoji: '🕌', category: 'مساعدة' },
  { text: 'تبرع لحفر بئر ماء', emoji: '🚰', category: 'مال' },
  { text: 'أهدِ مصحفاً', emoji: '📗', category: 'علم' },
  { text: 'عُد مريضاً في المستشفى', emoji: '🏥', category: 'مساعدة' },
  { text: 'ساعد في توزيع وجبات الإفطار', emoji: '🍲', category: 'طعام' },
  { text: 'اصنع سلة رمضانية لعائلة محتاجة', emoji: '🧺', category: 'طعام' },
  { text: 'علِّم شخصاً مهارة جديدة', emoji: '🎓', category: 'علم' },
];

const DailyCharity = () => {
  const [todayCharity, setTodayCharity] = useState(charityIdeas[0]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    // Get today's charity based on date
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    setTodayCharity(charityIdeas[dayOfYear % charityIdeas.length]);

    // Load completed from localStorage
    const saved = localStorage.getItem('ramadan_charity_completed');
    if (saved) setCompleted(JSON.parse(saved));
    const savedStreak = localStorage.getItem('ramadan_charity_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const handleComplete = () => {
    const today = new Date().toDateString();
    if (!completed.includes(today)) {
      const newCompleted = [...completed, today];
      setCompleted(newCompleted);
      localStorage.setItem('ramadan_charity_completed', JSON.stringify(newCompleted));
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem('ramadan_charity_streak', newStreak.toString());
    }
  };

  const getNewCharity = () => {
    const randomIndex = Math.floor(Math.random() * charityIdeas.length);
    setTodayCharity(charityIdeas[randomIndex]);
  };

  const isTodayCompleted = completed.includes(new Date().toDateString());

  return (
    <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-rose-900">
          <span className="text-2xl">❤️</span>
          صدقة اليوم
        </CardTitle>
        <div className="flex items-center gap-3">
          <Badge className="bg-rose-500 text-white">
            🔥 {streak} يوم متتالي
          </Badge>
          <Badge variant="outline" className="border-rose-300 text-rose-700">
            ✅ {completed.length} صدقة
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`p-6 rounded-xl text-center transition-all ${
          isTodayCompleted 
            ? 'bg-green-100 border-2 border-green-300' 
            : 'bg-white/80 border-2 border-rose-100'
        }`}>
          <span className="text-5xl block mb-3">{todayCharity.emoji}</span>
          <p className="text-xl font-bold text-rose-900 mb-2">{todayCharity.text}</p>
          <Badge variant="outline" className="border-rose-200 text-rose-600">
            {todayCharity.category}
          </Badge>
        </div>

        <div className="flex gap-2">
          {!isTodayCompleted ? (
            <Button
              onClick={handleComplete}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              تم تنفيذها ✨
            </Button>
          ) : (
            <div className="flex-1 text-center p-3 bg-green-100 rounded-lg text-green-700 font-bold">
              ✅ بارك الله فيك! أتممت صدقة اليوم
            </div>
          )}
          <Button
            variant="outline"
            onClick={getNewCharity}
            className="border-rose-300 text-rose-700 hover:bg-rose-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* 30-day tracker */}
        <div>
          <p className="text-sm font-medium text-rose-800 mb-2">تتبع صدقات رمضان (30 يوم)</p>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-sm ${
                  i < completed.length
                    ? 'bg-rose-400'
                    : 'bg-rose-100'
                }`}
                title={`يوم ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyCharity;