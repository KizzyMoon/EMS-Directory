import { useCallback, useEffect, useState } from 'react';
import { getRideAlongOverview } from '../../../lib/rideAlongsApi';
import type { AvailableRideAlongCadet, RideAlong } from '../types';

export function useRideAlongs() {
  const [rideAlongs, setRideAlongs] = useState<RideAlong[]>([]);
  const [availableCadets, setAvailableCadets] = useState<AvailableRideAlongCadet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await getRideAlongOverview();
      setRideAlongs(overview.rideAlongs);
      setAvailableCadets(overview.availableCadets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load ride alongs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { rideAlongs, setRideAlongs, availableCadets, loading, error, reload };
}
