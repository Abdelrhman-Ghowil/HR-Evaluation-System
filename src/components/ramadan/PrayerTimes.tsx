import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Sun, Sunset, Moon, Sunrise, Loader2, Timer } from 'lucide-react';

interface PrayerTime {
  name: string;
  nameAr: string;
  time: string;
  icon: React.ReactNode;
}

interface CityConfig {
  name: string;
  lat: number;
  lng: number;
  method: number; // Aladhan calculation method
}

const saudiCities: CityConfig[] = [
  { name: 'الرياض', lat: 24.7136, lng: 46.6753, method: 4 },
  { name: 'جدة', lat: 21.4858, lng: 39.1925, method: 4 },
  { name: 'مكة المكرمة', lat: 21.3891, lng: 39.8579, method: 4 },
  { name: 'المدينة المنورة', lat: 24.5247, lng: 39.5692, method: 4 },
];

const egyptCities: CityConfig[] = [
  { name: 'القاهرة', lat: 30.0444, lng: 31.2357, method: 5 },
  { name: 'الإسكندرية', lat: 31.2001, lng: 29.9187, method: 5 },
  { name: 'أسوان', lat: 24.0889, lng: 32.8998, method: 5 },
];

const PrayerTimes = () => {
  const [country, setCountry] = useState<'saudi' | 'egypt'>('saudi');
  const [selectedCityIndex, setSelectedCityIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [error, setError] = useState('');

  const cities = country === 'saudi' ? saudiCities : egyptCities;
  const selectedCity = cities[selectedCityIndex] || cities[0];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch prayer times from Aladhan API
  useEffect(() => {
    const fetchPrayers = async () => {
      setLoading(true);
      setError('');
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${selectedCity.lat}&longitude=${selectedCity.lng}&method=${selectedCity.method}`
        );
        const data = await res.json();
        
        if (data.code === 200) {
          const t = data.data.timings;
          setPrayers([
            { name: 'Fajr', nameAr: 'الفجر', time: t.Fajr.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Moon className="h-4 w-4" /> },
            { name: 'Sunrise', nameAr: 'الشروق', time: t.Sunrise.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Sunrise className="h-4 w-4" /> },
            { name: 'Dhuhr', nameAr: 'الظهر', time: t.Dhuhr.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Sun className="h-4 w-4" /> },
            { name: 'Asr', nameAr: 'العصر', time: t.Asr.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Sun className="h-4 w-4" /> },
            { name: 'Maghrib', nameAr: 'المغرب', time: t.Maghrib.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Sunset className="h-4 w-4" /> },
            { name: 'Isha', nameAr: 'العشاء', time: t.Isha.replace(' (EET)', '').replace(' (AST)', '').split(' ')[0], icon: <Moon className="h-4 w-4" /> },
          ]);
        }
      } catch (err) {
        setError('تعذر تحميل مواعيد الصلاة');
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, [selectedCity.lat, selectedCity.lng, selectedCity.method]);

  // Find next prayer & countdown
  useEffect(() => {
    if (prayers.length === 0) return;
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    let found = false;
    for (const prayer of prayers) {
      const [h, m] = prayer.time.split(':').map(Number);
      const prayerMin = h * 60 + m;
      if (prayerMin > now) {
        setNextPrayer(prayer.nameAr);
        const diff = prayerMin - now;
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        setCountdown(hrs > 0 ? `${hrs} ساعة و ${mins} دقيقة` : `${mins} دقيقة`);
        found = true;
        break;
      }
    }
    if (!found && prayers.length > 0) {
      setNextPrayer(prayers[0].nameAr);
      setCountdown('غداً إن شاء الله');
    }
  }, [currentTime, prayers]);

  return (
    <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <span className="text-2xl">🕌</span>
          مواعيد الصلاة
          <Badge variant="outline" className="border-green-400 text-green-700 text-xs mr-auto">
            ⚡ مباشر
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-amber-700">
          <Clock className="h-4 w-4" />
          {currentTime.toLocaleTimeString('ar-EG')}
        </div>
        {nextPrayer && (
          <div className="flex items-center gap-2 text-sm bg-amber-100 rounded-lg p-2 mt-1">
            <Timer className="h-4 w-4 text-amber-600" />
            <span className="text-amber-800 font-medium">
              الصلاة القادمة: <strong>{nextPrayer}</strong> - بعد {countdown}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Country Tabs */}
        <Tabs value={country} onValueChange={(v) => { setCountry(v as 'saudi' | 'egypt'); setSelectedCityIndex(0); }}>
          <TabsList className="grid w-full grid-cols-2 bg-amber-100">
            <TabsTrigger value="saudi" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              🇸🇦 السعودية
            </TabsTrigger>
            <TabsTrigger value="egypt" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
              🇪🇬 مصر
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* City Selection */}
        <div className="flex flex-wrap gap-2">
          {cities.map((city, idx) => (
            <Badge
              key={city.name}
              variant={selectedCityIndex === idx ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                selectedCityIndex === idx
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
              onClick={() => setSelectedCityIndex(idx)}
            >
              <MapPin className="h-3 w-3 mr-1" />
              {city.name}
            </Badge>
          ))}
        </div>

        {/* Prayer Times */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <span className="mr-2 text-amber-700">جاري تحميل المواعيد...</span>
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-600">{error}</div>
        ) : (
          <div className="space-y-2">
            {prayers.map((prayer) => (
              <div
                key={prayer.name}
                className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                  nextPrayer === prayer.nameAr
                    ? 'bg-amber-200 border-2 border-amber-400 shadow-md'
                    : 'bg-white/60 border border-amber-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    nextPrayer === prayer.nameAr ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {prayer.icon}
                  </div>
                  <div>
                    <p className="font-bold text-amber-900">{prayer.nameAr}</p>
                    <p className="text-xs text-amber-600">{prayer.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {nextPrayer === prayer.nameAr && (
                    <Badge className="bg-amber-500 text-white text-xs animate-pulse">
                      القادمة
                    </Badge>
                  )}
                  <span className="font-mono font-bold text-amber-900 text-lg">{prayer.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
