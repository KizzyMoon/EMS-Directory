import { useCallback, useEffect, useState } from 'react';
import { getTrainingSessions } from '../../../lib/trainingApi';
import type { TrainingSession } from '../types';

export function useTrainingSessions() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSessions(await getTrainingSessions());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load training sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { sessions, setSessions, loading, error, reload };
}
