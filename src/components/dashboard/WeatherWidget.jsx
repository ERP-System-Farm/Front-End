import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, RefreshCw, Thermometer, Wind, Droplets, Eye, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

// Open-Meteo is free, no API key needed
const WMO_CODES = {
  0:  { label_ar: 'صافٍ تماماً',     label_en: 'Clear Sky',          icon: '☀️' },
  1:  { label_ar: 'صافٍ في الغالب',  label_en: 'Mainly Clear',       icon: '🌤️' },
  2:  { label_ar: 'غيوم متفرقة',     label_en: 'Partly Cloudy',      icon: '⛅' },
  3:  { label_ar: 'غائم',             label_en: 'Overcast',           icon: '☁️' },
  45: { label_ar: 'ضباب',             label_en: 'Foggy',              icon: '🌫️' },
  48: { label_ar: 'ضباب صقيعي',       label_en: 'Rime Fog',           icon: '🌫️' },
  51: { label_ar: 'رذاذ خفيف',       label_en: 'Light Drizzle',      icon: '🌦️' },
  61: { label_ar: 'مطر خفيف',         label_en: 'Light Rain',         icon: '🌧️' },
  63: { label_ar: 'مطر معتدل',        label_en: 'Moderate Rain',      icon: '🌧️' },
  65: { label_ar: 'مطر غزير',         label_en: 'Heavy Rain',         icon: '⛈️' },
  80: { label_ar: 'زخات خفيفة',       label_en: 'Light Showers',      icon: '🌦️' },
  95: { label_ar: 'عاصفة رعدية',     label_en: 'Thunderstorm',       icon: '⛈️' },
};

const CITIES = [
  { name_ar: 'سيوة',        name_en: 'Siwa',            lat: 29.2031,  lon: 25.5195 },
  { name_ar: 'القاهرة',     name_en: 'Cairo',          lat: 30.0444,  lon: 31.2357 },
  { name_ar: 'الإسكندرية', name_en: 'Alexandria',      lat: 31.2001,  lon: 29.9187 },
  { name_ar: 'أسوان',       name_en: 'Aswan',           lat: 24.0889,  lon: 32.8998 },
  { name_ar: 'الرياض',      name_en: 'Riyadh',          lat: 24.6877,  lon: 46.7219 },
  { name_ar: 'جدة',         name_en: 'Jeddah',          lat: 21.3891,  lon: 39.8579 },
  { name_ar: 'دبي',         name_en: 'Dubai',           lat: 25.2048,  lon: 55.2708 },
  { name_ar: 'بغداد',       name_en: 'Baghdad',         lat: 33.3128,  lon: 44.3615 },
  { name_ar: 'الكويت',      name_en: 'Kuwait City',     lat: 29.3759,  lon: 47.9774 },
  { name_ar: 'عمّان',       name_en: 'Amman',           lat: 31.9539,  lon: 35.9106 },
];

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,visibility,weathercode&wind_speed_unit=ms&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('weather fetch failed');
  return res.json();
}

export default function WeatherWidget({ onWeatherUpdate }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const [weather, setWeather]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [locationName, setLocName]  = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const loadWeather = useCallback(async (lat, lon, name) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWeather(lat, lon);
      setWeather(data.current);
      setLocName(name);
      if (onWeatherUpdate) {
        const wmo = WMO_CODES[data.current.weathercode] || WMO_CODES[0];
        onWeatherUpdate({
          temp: data.current.temperature_2m,
          icon: wmo.icon,
          label: isRTL ? wmo.label_ar : wmo.label_en,
          city: name
        });
      }
    } catch {
      setError(isRTL ? 'تعذّر جلب بيانات الطقس' : 'Could not load weather data');
    } finally {
      setLoading(false);
    }
  }, [isRTL, onWeatherUpdate]);

  // On mount: default to CITIES[0] (Siwa)
  useEffect(() => {
    const city = selectedCity || CITIES[0];
    loadWeather(city.lat, city.lon, isRTL ? city.name_ar : city.name_en);
  }, [selectedCity, loadWeather, isRTL]);

  const wmoInfo = WMO_CODES[weather?.weathercode] || WMO_CODES[0];
  const temp = weather?.temperature_2m ?? '--';
  const humidity = weather?.relative_humidity_2m ?? '--';
  const wind = weather?.wind_speed_10m ? (weather.wind_speed_10m * 3.6).toFixed(1) : '--';
  const visibility = weather?.visibility ? (weather.visibility / 1000).toFixed(1) : '--';

  return (
    <Card className="relative overflow-hidden border-border/60 bg-gradient-to-br from-sky-500/10 via-card to-blue-500/5 hover:shadow-lg transition-all duration-300 group">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-sky-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />

      <CardContent className="p-5 relative z-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold truncate max-w-[120px]">{locationName || '...'}</span>
          </div>
          <div className="flex items-center gap-2">
            {/* City picker */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(p => !p)}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-sky-600 transition-colors px-2 py-1 rounded-lg border border-border/40 bg-muted/30 hover:bg-muted/60"
              >
                {isRTL ? 'اختر مدينة' : 'Pick city'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showPicker && (
                <div className="absolute top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden" style={{ [isRTL ? 'right' : 'left']: 0 }}>
                  {CITIES.map(c => (
                    <button
                      key={c.name_en}
                      onClick={() => { setSelectedCity(c); setShowPicker(false); }}
                      className="w-full text-right px-3 py-2 text-xs hover:bg-sky-50 dark:hover:bg-sky-950/20 hover:text-sky-700 transition-colors font-medium"
                    >
                      {isRTL ? c.name_ar : c.name_en}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => selectedCity
                ? loadWeather(selectedCity.lat, selectedCity.lon, isRTL ? selectedCity.name_ar : selectedCity.name_en)
                : loadWeather(CITIES[0].lat, CITIES[0].lon, isRTL ? CITIES[0].name_ar : CITIES[0].name_en)
              }
              className="p-1.5 rounded-full hover:bg-sky-100 dark:hover:bg-sky-950/30 text-muted-foreground hover:text-sky-600 transition-colors"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-20">
            <div className="w-8 h-8 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-xs text-muted-foreground py-4">{error}</p>
        ) : (
          <>
            {/* Main temp + icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl leading-none">{wmoInfo.icon}</div>
              <div>
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {temp}<span className="text-lg font-bold text-muted-foreground">°C</span>
                </div>
                <div className="text-xs font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
                  {isRTL ? wmoInfo.label_ar : wmoInfo.label_en}
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Droplets,    val: `${humidity}%`,    label: isRTL ? 'رطوبة' : 'Humidity',    color: 'text-blue-500' },
                { icon: Wind,        val: `${wind} km/h`,    label: isRTL ? 'رياح' : 'Wind',         color: 'text-emerald-500' },
                { icon: Eye,         val: `${visibility}km`, label: isRTL ? 'رؤية' : 'Visibility',   color: 'text-amber-500' },
              ].map(({ icon: Icon, val, label, color }) => (
                <div key={label} className="bg-muted/30 rounded-xl p-2 flex flex-col items-center gap-1">
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                  <span className="text-[11px] font-black text-foreground">{val}</span>
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
