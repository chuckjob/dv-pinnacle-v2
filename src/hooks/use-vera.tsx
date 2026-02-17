import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Platform, MediaType } from '@/types/goal';

export type VeraPanelContext = 'general' | 'goal-create' | 'campaign-analyze';

interface VeraContextValue {
  veraOpen: boolean;
  veraContext: VeraPanelContext;
  openVera: () => void;
  openVeraWithContext: (ctx: VeraPanelContext) => void;
  closeVera: () => void;
  toggleVera: () => void;
  goalCreated: boolean;
  setGoalCreated: (v: boolean) => void;
  goalConnectedDspLabel: string;
  setGoalConnectedDspLabel: (v: string) => void;
  goalPlatform: Platform | '';
  setGoalPlatform: (v: Platform | '') => void;
  goalMediaType: MediaType | '';
  setGoalMediaType: (v: MediaType | '') => void;
  goalName: string;
  setGoalName: (v: string) => void;
  refreshedGoalIds: Set<string>;
  addRefreshedGoalId: (id: string) => void;
  appliedRecIds: Set<number>;
  addAppliedRec: (id: number) => void;
}

const VeraContext = createContext<VeraContextValue | null>(null);

export function VeraProvider({ children }: { children: ReactNode }) {
  const [veraOpen, setVeraOpen] = useState(false);
  const [veraContext, setVeraContext] = useState<VeraPanelContext>('general');
  const [goalCreated, setGoalCreated] = useState(false);
  const [goalConnectedDspLabel, setGoalConnectedDspLabel] = useState('');
  const [goalPlatform, setGoalPlatform] = useState<Platform | ''>('');
  const [goalMediaType, setGoalMediaType] = useState<MediaType | ''>('');
  const [goalName, setGoalName] = useState('');
  const [refreshedGoalIds, setRefreshedGoalIds] = useState<Set<string>>(new Set());
  const [appliedRecIds, setAppliedRecIds] = useState<Set<number>>(new Set());

  const addRefreshedGoalId = useCallback((id: string) => {
    setRefreshedGoalIds(prev => new Set(prev).add(id));
  }, []);

  const addAppliedRec = useCallback((id: number) => {
    setAppliedRecIds(prev => new Set(prev).add(id));
  }, []);

  const openVeraWithContext = useCallback((ctx: VeraPanelContext) => {
    setVeraContext(ctx);
    setVeraOpen(true);
  }, []);

  return (
    <VeraContext.Provider
      value={{
        veraOpen,
        veraContext,
        openVera: () => setVeraOpen(true),
        openVeraWithContext,
        closeVera: () => setVeraOpen(false),
        toggleVera: () => setVeraOpen(prev => !prev),
        goalCreated,
        setGoalCreated,
        goalConnectedDspLabel,
        setGoalConnectedDspLabel,
        goalPlatform,
        setGoalPlatform,
        goalMediaType,
        setGoalMediaType,
        goalName,
        setGoalName,
        refreshedGoalIds,
        addRefreshedGoalId,
        appliedRecIds,
        addAppliedRec,
      }}
    >
      {children}
    </VeraContext.Provider>
  );
}

export function useVera() {
  const ctx = useContext(VeraContext);
  if (!ctx) throw new Error('useVera must be used within VeraProvider');
  return ctx;
}
