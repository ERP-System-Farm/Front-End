import React, { createContext, useContext, useState, useEffect } from 'react';
import { intelligenceApi } from '../../services/intelligenceApi';

const SeasonContext = createContext(null);

export const SeasonProvider = ({ children }) => {
  const [seasons, setSeasons] = useState([]);
  const [activeSeason, setActiveSeasonState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSeasons = async () => {
    try {
      setIsLoading(true);
      const response = await intelligenceApi.getSeasons();
      const seasonList = response.data?.results || response.data || [];
      setSeasons(seasonList);
      
      if (seasonList.length > 0) {
        const storedId = localStorage.getItem('selected_season_id');
        let matched = null;
        
        if (storedId) {
          matched = seasonList.find(s => s.id === storedId);
        }
        
        if (!matched) {
          // Find first open/active season
          matched = seasonList.find(s => s.status === 'OPEN') || seasonList[0];
        }
        
        setActiveSeasonState(matched);
      }
    } catch (error) {
      console.error('Failed to fetch seasons for intelligence provider:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  const setActiveSeason = (season) => {
    setActiveSeasonState(season);
    if (season?.id) {
      localStorage.setItem('selected_season_id', season.id);
    } else {
      localStorage.removeItem('selected_season_id');
    }
  };

  return (
    <SeasonContext.Provider
      value={{
        seasons,
        activeSeason,
        setActiveSeason,
        isLoading,
        refreshSeasons: fetchSeasons,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
};

export const useSeason = () => {
  const context = useContext(SeasonContext);
  if (!context) {
    throw new Error('useSeason must be used within a SeasonProvider');
  }
  return context;
};
