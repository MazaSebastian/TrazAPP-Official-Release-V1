
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { weatherService, DailyWeather } from '../services/weatherService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  WiDaySunny,
  WiDayCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog
} from 'react-icons/wi';
import { FaChevronDown, FaTint } from 'react-icons/fa';

const WidgetContainer = styled.div`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: #f8fafc;
  overflow: hidden;
  transition: all 0.3s ease;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 1rem;
    white-space: normal;
    text-align: center;
    justify-content: center;
  }

  svg { font-size: 1.5rem; flex-shrink: 0; }
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  @media (max-width: 600px) {
    flex-direction: column;
    justify-content: center;
    text-align: center;
  }
`;

const CurrentTempBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(20, 83, 45, 0.3);
  color: #4ade80;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  font-size: 1.2rem;
  font-weight: bold;
  border: 1px solid rgba(74, 222, 128, 0.2);
  white-space: nowrap;

  .metric {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .divider {
    width: 1px;
    height: 1.2rem;
    background: rgba(74, 222, 128, 0.3);
  }

  @media (max-width: 600px) {
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
    gap: 0.75rem;
  }
`;

const AccordionContent = styled.div<{ $isOpen: boolean }>`
  display: grid;
  grid-template-rows: ${p => p.$isOpen ? '1fr' : '0fr'};
  transition: grid-template-rows 0.3s ease-in-out;
  
  & > div {
    overflow: hidden;
  }
`;

const ChevronIcon = styled(FaChevronDown) <{ $isOpen: boolean }>`
  transition: transform 0.3s ease;
  transform: ${p => p.$isOpen ? 'rotate(180deg)' : 'rotate(0)'};
  color: #94a3b8;
  font-size: 1.25rem;

  @media (max-width: 600px) {
    margin-top: 0.5rem;
  }
`;

const ForecastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;

  @media (max-width: 600px) {
    display: flex;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    gap: 0.5rem;
    scroll-behavior: smooth;
    
    // Hide scrollbar but keep functionality
    &::-webkit-scrollbar { display: none; }
    -ms-overflow-style: none; /* IE as well */
  }
`;

const DayCard = styled.div<{ isRainy?: boolean }>`
  background: ${props => props.isRainy ? 'rgba(56, 189, 248, 0.1)' : 'rgba(30, 41, 59, 0.5)'};
  border: ${props => props.isRainy ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent'};
  border-radius: 1rem;
  padding: 0.75rem 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;

  @media (max-width: 600px) {
    min-width: 75px; /* Force minimum width to prevent squishing in flex */
    flexShrink: 0;
  }

  // Rain visual effect if needed
  ${props => props.isRainy && `
    box-shadow: 0 0 15px rgba(56, 189, 248, 0.1);
    transform: translateY(-4px);
  `}

  &:hover {
    background: rgba(15, 23, 42, 0.8);
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .day-name {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
    color: ${props => props.isRainy ? '#7dd3fc' : '#94a3b8'};
  }

  .icon {
    font-size: 2rem;
    margin: 0.25rem 0;
    color: ${props => props.isRainy ? '#38bdf8' : '#2dd4bf'};
  }

  .temps {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f8fafc;
    
    .max { color: #fca5a5; margin-right: 4px; }
    .min { color: #bae6fd; }
  }

  .precip {
    font-size: 0.75rem;
    color: #bae6fd;
    margin-top: 0.25rem;
    font-weight: 700;
    background: rgba(56, 189, 248, 0.2);
    padding: 2px 6px;
    border-radius: 4px;
  }
`;

const getWeatherIcon = (code: number, precip?: number) => {
  // WMO Weather interpretation codes (WW)

  // Custom Override: If precip is negligible (< 1.0mm), show clouds instead of rain
  // This prevents "Rain" icon when it's just a 0.2mm drizzle
  if (precip !== undefined && precip < 1.0 && (code >= 51 && code <= 99)) {
    return <WiDayCloudy color="#a0aec0" />;
  }

  // 0: Clear sky
  if (code === 0) return <WiDaySunny color="#ecc94b" />;
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  if (code <= 3) return <WiDayCloudy color="#a0aec0" />;
  // 45, 48: Fog
  if (code <= 48) return <WiFog color="#cbd5e0" />;
  // 51-67: Drizzle and Rain
  if (code <= 67) return <WiRain color="#4299e1" />;
  // 71-77: Snow
  if (code <= 77) return <WiSnow color="#63b3ed" />;
  // 80-82: Rain showers
  if (code <= 82) return <WiRain color="#4299e1" />;
  // 95-99: Thunderstorm
  return <WiThunderstorm color="#805ad5" />;
};

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<{ current: { temp: number; humidity: number; code: number }; daily: DailyWeather[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // Default closed on mobile, open on desktop? Let's just default to open on desktop, but closed entirely on mobile.

  // Use a media query in JS to set initial state to closed if mobile
  useEffect(() => {
    if (window.innerWidth > 600) {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const data = await weatherService.getForecast();
      setWeather(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading || !weather) return null;

  return (
    <WidgetContainer>
      <HeaderContainer onClick={() => setIsOpen(!isOpen)} style={{ marginBottom: isOpen ? '1.5rem' : '0' }}>
        <Title><WiDaySunny /> Pronóstico (Munro/Olivos)</Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: window.innerWidth > 600 ? 'row' : 'column' }}>
          <CurrentTempBadge>
            <div className="metric">
              {getWeatherIcon(weather.current.code)}
              <span>{Math.round(weather.current.temp)}°C</span>
            </div>
            <div className="divider" />
            <div className="metric" style={{ color: '#7dd3fc' }}>
              <FaTint size={14} />
              <span>{Math.round(weather.current.humidity)}%</span>
            </div>
          </CurrentTempBadge>
          <ChevronIcon $isOpen={isOpen} />
        </div>
      </HeaderContainer>

      <AccordionContent $isOpen={isOpen}>
        <div>
          <ForecastGrid>
            {weather.daily.map((day) => {
              // Strict visual alarm: ONLY if precipitation is significant (> 1.5mm)
              // We ignore the code here to avoid "bordering" drizzle days
              const isRainy = day.precipitation >= 1.5;

              return (
                <DayCard key={day.date} isRainy={isRainy}>
                  <div className="day-name">
                    {format(new Date(day.date + 'T00:00:00'), 'EEE', { locale: es })}
                  </div>
                  <div className="icon">
                    {getWeatherIcon(day.weatherCode, day.precipitation)}
                  </div>
                  <div className="temps">
                    <span className="max">{Math.round(day.maxTemp)}°</span>
                    <span className="min">{Math.round(day.minTemp)}°</span>
                  </div>
                  {day.precipitation >= 1.0 && (
                    <div className="precip">{day.precipitation}mm</div>
                  )}
                </DayCard>
              );
            })}
          </ForecastGrid>
        </div>
      </AccordionContent>
    </WidgetContainer>
  );
};
