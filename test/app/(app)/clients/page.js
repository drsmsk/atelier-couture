'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [totals, setTotals] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [{ data: clientsData }, { data: totalsData }] = await Promise.all([
      supabase.from('clients').select('*').order('full_name'),
      supabase.from('client_totals').select('*'),
    ]);
    const totalsMap = {};
    (totalsData || []).forEach((t) => {
      totalsMap[t.client_id] = t;
    });
    setClients(clientsData || []);
    setTotals(totalsMap);
    setLoading(false);
  }

  const filtered = clients.filter((c) =>
    c.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="topbar">
        <h1>Clients</h1>
        <Link href="/clients/new" className="btn btn-primary">
          Nouveau client
        </Link>
      </div>

      <input
        className="search-input"
        placeholder="Rechercher un client…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Aucun client pour l&rsquo;instant.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Total commandé</th>
              <th>Total versé</th>
              <th>Reste à payer</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const t = totals[c.id] || { total_commande: 0, total_verse: 0, reste_a_payer: 0 };
              return (
                <tr key={c.id}>
                  <td>
                    <Link href={`/clients/${c.id}`}>{c.full_name}</Link>
                  </td>
                  <td>{c.phone || '—'}</td>
                  <td>{Number(t.total_commande).toLocaleString('fr-FR')} DA</td>
                  <td>{Number(t.total_verse).toLocaleString('fr-FR')} DA</td>
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
