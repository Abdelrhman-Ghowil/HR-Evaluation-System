import React from 'react';
import PrayerTimes from './PrayerTimes';
import Tasbeeh from './Tasbeeh';
import DailyCharity from './DailyCharity';
import FastingTracker from './FastingTracker';
import DuasAdhkar from './DuasAdhkar';
import QuranTracker from './QuranTracker';
import IftarCountdown from './IftarCountdown';

const RamadanDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header with Ramadan decoration */}
      <div className="text-center p-6 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 rounded-2xl border-2 border-amber-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-center">
          🌙
        </div>
        <h1 className="text-3xl font-bold text-amber-900 relative z-10">
          🌙 رمضان كريم 🌙
        </h1>
        <p className="text-amber-700 mt-2 relative z-10 text-lg">
          اللهم بلغنا رمضان وأعنا على صيامه وقيامه
        </p>
        <div className="flex justify-center gap-3 mt-3 relative z-10">
          <span className="text-2xl animate-pulse">✨</span>
          <span className="text-2xl animate-bounce">🕌</span>
          <span className="text-2xl animate-pulse">⭐</span>
          <span className="text-2xl animate-bounce">🌟</span>
          <span className="text-2xl animate-pulse">✨</span>
        </div>
      </div>

      {/* Iftar/Suhoor Countdown */}
      <IftarCountdown />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrayerTimes />
        <DuasAdhkar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Tasbeeh />
        <QuranTracker />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FastingTracker />
        <DailyCharity />
      </div>
    </div>
  );
};

export default RamadanDashboard;
