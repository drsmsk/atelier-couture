'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES, PRODUCT_STATUSES } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [totals, setTotals] = useState({});
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: productsData }, { data: totalsData }] = await Promise.all([
      supabase.from('products').select('*, clients(full_name)').order('order_date', { ascending: false }),
      supabase.from('product_totals').select('*'),
    ]);
    setProducts(productsData || []);
    const map = {};
    (totalsData || []).forEach((t) => {
      map[t.product_id] = t;
    });
    setTotals(map);
    setLoading(false);
  }

  const filtered = products.filter(
    (p) => (!typeFilter || p.type === typeFilter) && (!statusFilter || p.status === statusFilter)
  );

  return (
    <div>
      <div className="topbar">
        <h1>Pièces</h1>
        <Link href="/products/new" className="btn btn-primary">
          Nouvelle pièce
        </Link>
      </div>

      <div className="filters-row">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">Tous les types</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tous les statuts</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Aucune pièce trouvée.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Pièce</th>
              <th>Client</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Prix</th>
              <th>Reste à payer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const t = totals[p.id] || { reste_a_payer: p.price };
              return (
                <tr key={p.id}>
                  <td>
                    {p.photo_url ? (
                      <img src={p.photo_url} alt="" className="thumb" />
                    ) : (
                      <div className="thumb thumb-empty" />
                    )}
                  </td>
                  <td>
                    <Link href={`/products/${p.id}`}>{p.description || p.type}</Link>
                  </td>
                  <td>
                    {p.clients ? (
                      <Link href={`/clients/${p.client_id}`}>{p.clients.full_name}</Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{p.type}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{Number(p.price).toLocaleString('fr-FR')} DA</td>
                  <td>{Number(t.reste_a_payer).toLocaleString('fr-FR')} DA</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
