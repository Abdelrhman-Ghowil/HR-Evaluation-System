import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Timer, Utensils, Moon } from 'lucide-react';

const IftarCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextEvent, setNextEvent] = useState<'iftar' | 'suhoor'>('iftar');
  const [maghribTime, setMaghribTime] = useState('');
  const [fajrTime, setFajrTime] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch today's prayer times for countdown
  useEffect(() => {
    const fetchTimes = async () => {
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        // Default to Riyadh
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=24.7136&longitude=46.6753&method=4`
        );
        const data = await res.json();
        if (data.code === 200) {
          setMaghribTime(data.data.timings.Maghrib.split(' ')[0]);
          setFajrTime(data.data.timings.Fajr.split(' ')[0]);
        }
      } catch {
        // Fallback times
        setMaghribTime('18:00');
        setFajrTime('04:45');
      } finally {
        setLoading(false);
      }
    };
    fetchTimes();
  }, []);

  useEffect(() => {
    if (!maghribTime || !fajrTime) return;

    const updateCountdown = () => {
      const now = new Date();
      const [mH, mM] = maghribTime.split(':').map(Number);
      const [fH, fM] = fajrTime.split(':').map(Number);
      
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const maghribMin = mH * 60 + mM;
      const fajrMin = fH * 60 + fM;

      let targetMin: number;
      let targetSeconds: number;

      if (nowMin < maghribMin) {
        // Before Maghrib - countdown to Iftar
        setNextEvent('iftar');
        const diffSec = (maghribMin * 60) - (nowMin * 60 + now.getSeconds());
        targetSeconds = diffSec;
      } else {
        // After Maghrib - countdown to Suhoor (next Fajr)
        setNextEvent('suhoor');
        const remainingToday = (24 * 60 - nowMin) * 60 - now.getSeconds();
        const tomorrowFajr = fajrMin * 60;
        targetSeconds = remainingToday + tomorrowFajr;
      }

      const hrs = Math.floor(targetSeconds / 3600);
      const mins = Math.floor((targetSeconds % 3600) / 60);
      const secs = targetSeconds % 60;
      setTimeLeft({ hours: hrs, minutes: mins, seconds: secs });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [maghribTime, fajrTime]);

  const isIftar = nextEvent === 'iftar';

  return (
    <Card className={`border-2 ${isIftar ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 ${isIftar ? 'text-orange-900' : 'text-blue-900'}`}>
          {isIftar ? (
            <>
              <Utensils className="h-6 w-6" />
              ⏰ العد التنازلي للإفطار
            </>
          ) : (
            <>
              <Moon className="h-6 w-6" />
              ⏰ العد التنازلي للسحور
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div>
        ) : (
          <div className="text-center space-y-4">
            <div className="flex justify-center gap-4">
              {[
                { value: timeLeft.hours, label: 'ساعة' },
                { value: timeLeft.minutes, label: 'دقيقة' },
                { value: timeLeft.seconds, label: 'ثانية' },
              ].map((unit, idx) => (
                <div key={idx} className={`flex flex-col items-center p-4 rounded-xl min-w-[80px] ${
                  isIftar ? 'bg-orange-100 border-2 border-orange-200' : 'bg-blue-100 border-2 border-blue-200'
                }`}>
                  <span className={`text-3xl font-bold font-mono ${isIftar ? 'text-orange-800' : 'text-blue-800'}`}>
                    {String(unit.value).padStart(2, '0')}
                  </span>
                  <span className={`text-xs mt-1 ${isIftar ? 'text-orange-600' : 'text-blue-600'}`}>
                    {unit.label}
                  </span>
                </div>
              ))}
            </div>
            
            <div className={`flex justify-center gap-4 text-sm ${isIftar ? 'text-orange-700' : 'text-blue-700'}`}>
              <span>🕌 المغرب: {maghribTime}</span>
              <span>🌙 الفجر: {fajrTime}</span>
            </div>
            
            <p className={`text-sm ${isIftar ? 'text-orange-600' : 'text-blue-600'}`}>
              {isIftar ? '🤲 اللهم إني أسألك من فضلك ورحمتك' : '🤲 اللهم بارك لنا في سحورنا'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IftarCountdown;
