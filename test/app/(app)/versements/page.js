'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function VersementsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase
      .from('payments')
      .select('*, products(id, description, type, clients(id, full_name))')
      .order('payment_date', { ascending: false });
    setPayments(data || []);
    setLoading(false);
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <div className="topbar">
        <h1>Versements</h1>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span>Total des versements</span>
          <strong>{total.toLocaleString('fr-FR')} DA</strong>
        </div>
        <div className="stat">
          <span>Nombre de versements</span>
          <strong>{payments.length}</strong>
        </div>
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : payments.length === 0 ? (
        <div className="empty-state">Aucun versement enregistré.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Pièce</th>
              <th>Montant</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</td>
                <td>
                  {p.products?.clients ? (
                    <Link href={`/clients/${p.products.clients.id}`}>{p.products.clients.full_name}</Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  {p.products ? (
                    <Link href={`/products/${p.products.id}`}>{p.products.description || p.products.type}</Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{Number(p.amount).toLocaleString('fr-FR')} DA</td>
                <td>{p.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
