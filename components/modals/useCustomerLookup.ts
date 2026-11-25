'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { cleanPhone } from '@/lib/format';
import type { Customer, Order } from '@/lib/types';

interface LookupData {
  digits: string;
  customer: Customer | null;
  orders: Order[];
}

/** Tra cứu khách hàng (điểm + đơn hàng) theo số điện thoại đủ 9–11 số. Chỉ chạy khi `active`. */
export function useCustomerLookup(phone: string, active: boolean) {
  const digits = cleanPhone(phone);
  const [data, setData] = useState<LookupData | null>(null);

  useEffect(() => {
    if (!active || digits.length < 9) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      apiFetch<Omit<LookupData, 'digits'>>(`/api/customers/${digits}`, { signal: ctrl.signal })
        .then((res) => setData({ digits, customer: res.customer, orders: res.orders }))
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [digits, active]);

  const ready = digits.length >= 9 && data?.digits === digits;
  return {
    digits,
    ready,
    loading: digits.length >= 9 && !ready,
    customer: ready ? data.customer : null,
    orders: ready ? data.orders : [],
    setCustomer: (customer: Customer) => setData((d) => (d ? { ...d, customer } : d)),
  };
}
