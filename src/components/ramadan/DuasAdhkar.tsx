import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';

interface Dhikr {
  text: string;
  repeat: number;
  source?: string;
}

interface DuaItem {
  title: string;
  text: string;
  translation?: string;
}

const morningAdhkar: Dhikr[] = [
  { text: 'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', repeat: 1 },
  { text: 'اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور', repeat: 1 },
  { text: 'أصبحنا على فطرة الإسلام وعلى كلمة الإخلاص وعلى دين نبينا محمد ﷺ وعلى ملة أبينا إبراهيم حنيفاً مسلماً وما كان من المشركين', repeat: 1 },
  { text: 'سبحان الله وبحمده', repeat: 100, source: 'صحيح مسلم' },
  { text: 'لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', repeat: 100, source: 'البخاري ومسلم' },
  { text: 'سبحان الله العظيم وبحمده', repeat: 100, source: 'البخاري ومسلم' },
  { text: 'اللهم إني أسألك علماً نافعاً ورزقاً طيباً وعملاً متقبلاً', repeat: 1, source: 'ابن ماجه' },
  { text: 'أعوذ بكلمات الله التامات من شر ما خلق', repeat: 3, source: 'مسلم' },
  { text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم', repeat: 3, source: 'أبو داود والترمذي' },
  { text: 'اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت', repeat: 3 },
];

const eveningAdhkar: Dhikr[] = [
  { text: 'أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير', repeat: 1 },
  { text: 'اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير', repeat: 1 },
  { text: 'اللهم ما أمسى بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر', repeat: 1 },
  { text: 'سبحان الله وبحمده', repeat: 100, source: 'صحيح مسلم' },
  { text: 'أعوذ بكلمات الله التامات من شر ما خلق', repeat: 3, source: 'مسلم' },
  { text: 'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم', repeat: 3, source: 'أبو داود والترمذي' },
  { text: 'اللهم إني أعوذ بك من الهم والحزن وأعوذ بك من العجز والكسل وأعوذ بك من الجبن والبخل وأعوذ بك من غلبة الدين وقهر الرجال', repeat: 1, source: 'أبو داود' },
  { text: 'حسبي الله لا إله إلا هو عليه توكلت وهو رب العرش العظيم', repeat: 7, source: 'أبو داود' },
];

const ramadanDuas: DuaItem[] = [
  { title: 'دعاء الإفطار', text: 'ذهب الظمأ وابتلت العروق وثبت الأجر إن شاء الله', translation: 'The thirst has gone, the veins are moistened, and the reward is confirmed, if Allah wills' },
  { title: 'دعاء ليلة القدر', text: 'اللهم إنك عفو تحب العفو فاعف عني', translation: 'O Allah, You are pardoning and You love to pardon, so pardon me' },
  { title: 'دعاء السحور', text: 'اللهم إني نويت صيام غدٍ من شهر رمضان فتقبله مني إنك أنت السميع العليم', translation: 'O Allah, I intend to fast tomorrow in Ramadan, accept it from me' },
  { title: 'دعاء الصائم', text: 'اللهم لك صمت وعلى رزقك أفطرت، اللهم تقبل مني إنك أنت السميع العليم', translation: 'O Allah, for You I fasted and on Your provision I broke my fast' },
  { title: 'دعاء قبل الإفطار', text: 'اللهم إني أسألك برحمتك التي وسعت كل شيء أن تغفر لي', translation: 'O Allah, I ask You by Your mercy that encompasses all things to forgive me' },
  { title: 'دعاء القنوت', text: 'اللهم اهدنا فيمن هديت وعافنا فيمن عافيت وتولنا فيمن توليت وبارك لنا فيما أعطيت وقنا شر ما قضيت إنك تقضي ولا يقضى عليك', translation: 'O Allah, guide us among those You have guided' },
  { title: 'دعاء جامع', text: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار', translation: 'Our Lord, give us good in this world and good in the Hereafter and protect us from the torment of the Fire' },
  { title: 'دعاء التوبة', text: 'اللهم أنت ربي لا إله إلا أنت خلقتني وأنا عبدك وأنا على عهدك ووعدك ما استطعت أعوذ بك من شر ما صنعت أبوء لك بنعمتك علي وأبوء بذنبي فاغفر لي فإنه لا يغفر الذنوب إلا أنت', translation: 'Sayyid al-Istighfar - The Master of Seeking Forgiveness' },
];

const quranicDuas: DuaItem[] = [
  { title: 'دعاء سيدنا إبراهيم', text: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ', translation: 'سورة إبراهيم - 40' },
  { title: 'دعاء سيدنا موسى', text: 'رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي', translation: 'سورة طه - 25-26' },
  { title: 'دعاء سيدنا يونس', text: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ', translation: 'سورة الأنبياء - 87' },
  { title: 'دعاء سيدنا زكريا', text: 'رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ', translation: 'سورة الأنبياء - 89' },
  { title: 'دعاء أولي الألباب', text: 'رَبَّنَا مَا خَلَقْتَ هَٰذَا بَاطِلًا سُبْحَانَكَ فَقِنَا عَذَابَ النَّارِ', translation: 'سورة آل عمران - 191' },
  { title: 'طلب المغفرة', text: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', translation: 'سورة الأعراف - 23' },
];

const DuasAdhkar = () => {
  const [activeTab, setActiveTab] = useState('morning');
  const [currentDuaIndex, setCurrentDuaIndex] = useState(0);

  const getCurrentDuas = () => {
    switch (activeTab) {
      case 'ramadan': return ramadanDuas;
      case 'quran': return quranicDuas;
      default: return [];
    }
  };

  const duas = getCurrentDuas();

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-fuchsia-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <span className="text-2xl">📖</span>
          الأدعية والأذكار
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCurrentDuaIndex(0); }}>
          <TabsList className="grid w-full grid-cols-4 bg-purple-100">
            <TabsTrigger value="morning" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              🌅 الصباح
            </TabsTrigger>
            <TabsTrigger value="evening" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              🌆 المساء
            </TabsTrigger>
            <TabsTrigger value="ramadan" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              🌙 رمضان
            </TabsTrigger>
            <TabsTrigger value="quran" className="text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              📗 قرآنية
            </TabsTrigger>
          </TabsList>

          {/* Morning Adhkar */}
          <TabsContent value="morning" className="space-y-2 mt-3 max-h-[400px] overflow-y-auto">
            {morningAdhkar.map((dhikr, idx) => (
              <div key={idx} className="p-3 bg-white/80 rounded-lg border border-purple-100">
                <p className="text-purple-900 font-medium text-right leading-relaxed">{dhikr.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge className="bg-purple-200 text-purple-800 text-xs">
                    التكرار: {dhikr.repeat} {dhikr.repeat > 1 ? 'مرات' : 'مرة'}
                  </Badge>
                  {dhikr.source && (
                    <span className="text-xs text-purple-500">📚 {dhikr.source}</span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Evening Adhkar */}
          <TabsContent value="evening" className="space-y-2 mt-3 max-h-[400px] overflow-y-auto">
            {eveningAdhkar.map((dhikr, idx) => (
              <div key={idx} className="p-3 bg-white/80 rounded-lg border border-purple-100">
                <p className="text-purple-900 font-medium text-right leading-relaxed">{dhikr.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge className="bg-purple-200 text-purple-800 text-xs">
                    التكرار: {dhikr.repeat} {dhikr.repeat > 1 ? 'مرات' : 'مرة'}
                  </Badge>
                  {dhikr.source && (
                    <span className="text-xs text-purple-500">📚 {dhikr.source}</span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Ramadan & Quranic Duas - Card Carousel */}
          {(activeTab === 'ramadan' || activeTab === 'quran') && duas.length > 0 && (
            <div className="mt-3 space-y-3">
              <div className="p-5 bg-white/80 rounded-xl border-2 border-purple-200 text-center min-h-[200px] flex flex-col justify-center">
                <Badge className="bg-purple-500 text-white mx-auto mb-3">
                  {duas[currentDuaIndex].title}
                </Badge>
                <p className="text-xl font-bold text-purple-900 leading-relaxed mb-3">
                  {duas[currentDuaIndex].text}
                </p>
                {duas[currentDuaIndex].translation && (
                  <p className="text-sm text-purple-600 italic">
                    {duas[currentDuaIndex].translation}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDuaIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentDuaIndex === 0}
                  className="border-purple-300 text-purple-700"
                >
                  <ChevronRight className="h-4 w-4" />
                  السابق
                </Button>
                <span className="text-sm text-purple-600">
                  {currentDuaIndex + 1} / {duas.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDuaIndex(prev => Math.min(duas.length - 1, prev + 1))}
                  disabled={currentDuaIndex === duas.length - 1}
                  className="border-purple-300 text-purple-700"
                >
                  التالي
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default DuasAdhkar;