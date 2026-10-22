import { useMemo, useState } from 'react';
import type { LedgerEntry, Order } from '../../../types';
import { buildBillingRecap } from './build-billing-recap';
import type { BillingRecap, BillingRecapFilters } from './billing-recap-types';

export interface UseBillingRecapParams {
  orders: Order[];
  ledgers: LedgerEntry[];
  /** Role mitra: dikunci ke id mitra miliknya, pilihan filter mitra diabaikan. */
  lockedMitraId?: string;
}

export interface UseBillingRecapResult {
  filters: BillingRecapFilters;
  recap: BillingRecap;
  setStartDate: (value: string) => void;
  setEndDate: (value: string) => void;
  setMitraId: (value: string) => void;
}

export function useBillingRecap({ orders, ledgers, lockedMitraId }: UseBillingRecapParams): UseBillingRecapResult {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMitraId, setMitraId] = useState('all');

  const mitraId = lockedMitraId ?? selectedMitraId;
  const filters = useMemo<BillingRecapFilters>(
    () => ({ startDate, endDate, mitraId }),
    [startDate, endDate, mitraId],
  );
  const recap = useMemo(() => buildBillingRecap(orders, ledgers, filters), [orders, ledgers, filters]);

  return { filters, recap, setStartDate, setEndDate, setMitraId };
}
