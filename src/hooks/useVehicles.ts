import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { Vehicle } from '../../App';

// In-memory mock for when no backend is running (hackathon demo mode)
const MOCK_VEHICLES: Vehicle[] = [
  { id:'1', name:'CAT 320 Excavator',    model:'320 GC',  year:2023, hours:'1,204', status:'good',    glbUrl: undefined },
  { id:'2', name:'CAT 950 Wheel Loader', model:'950 GC',  year:2022, hours:'3,841', status:'monitor', glbUrl: undefined },
  { id:'3', name:'CAT D6 Dozer',         model:'D6 XE',   year:2024, hours:'442',   status:'good',    glbUrl: undefined },
  { id:'4', name:'CAT 745 Truck',        model:'745 AWD', year:2021, hours:'7,203', status:'severe',  glbUrl: undefined },
];

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading,  setLoading]  = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/vehicles');
      setVehicles(data);
    } catch {
      // Fallback to mock data for demo
      setVehicles(MOCK_VEHICLES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, []);
  return { vehicles, loading, refetch };
}