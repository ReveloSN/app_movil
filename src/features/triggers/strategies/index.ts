import type { DraftOf, TriggerDraft, TriggerKind } from '../trigger.types';
import { scheduleStrategy } from './schedule.strategy';
import type { TriggerStrategy } from './trigger.strategy';
import { wifiEnterStrategy } from './wifi-enter.strategy';
import { wifiExitStrategy } from './wifi-exit.strategy';

type StrategyRegistry = { [K in TriggerKind]: TriggerStrategy<DraftOf<K>> };

const STRATEGIES: StrategyRegistry = {
  schedule: scheduleStrategy,
  wifi_exit: wifiExitStrategy,
  wifi_enter: wifiEnterStrategy,
};

/** Orden del selector de tipo (06-1). */
export const TRIGGER_KINDS: readonly TriggerKind[] = ['schedule', 'wifi_exit', 'wifi_enter'];

export const isTriggerKind = (value: string): value is TriggerKind => value in STRATEGIES;

export const strategyForKind = (kind: TriggerKind): TriggerStrategy => STRATEGIES[kind] as TriggerStrategy;

/** Estrategia del aviso. El registro garantiza que coincide con el tipo del borrador. */
export const strategyFor = <D extends TriggerDraft>(draft: D): TriggerStrategy<D> =>
  STRATEGIES[draft.type] as unknown as TriggerStrategy<D>;

export type { TriggerStrategy } from './trigger.strategy';
