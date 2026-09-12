'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { MEASUREMENTS } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [productTotals, setProductTotals] = useState({});
  const [clientTotals, setClientTotals] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [{ data: clientData }, { data: productsData }, { data: totalsData }, { data: clientTotalsData }, { data: paymentsData }] =
      await Promise.all([
        supabase.from('clients').select('*').eq('id', id).single(),
        supabase.from('products').select('*').eq('client_id', id).order('order_date', { ascending: false }),
        supabase.from('product_totals').select('*'),
        supabase.from('client_totals').select('*').eq('client_id', id).single(),
        supabase
          .from('payments')
          .select('*, products!inner(id, description, type, client_id)')
          .eq('products.client_id', id)
          .order('payment_date', { ascending: false }),
      ]);
    setClient(clientData);
    setProducts(productsData || []);
    const map = {};
    (totalsData || []).forEach((t) => {
      map[t.product_id] = t;
    });
    setProductTotals(map);
    setClientTotals(clientTotalsData);
    setPayments(paymentsData || []);
    setLoading(false);
  }

  function updateField(key, value) {
    setClient((c) => ({ ...c, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      full_name: client.full_name,
      phone: client.phone,
      notes: client.notes,
    };
    MEASUREMENTS.forEach(({ key }) => {
      payload[key] = client[key] || null;
    });

    const { error } = await supabase.from('clients').update(payload).eq('id', id);
    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }
    setEditing(false);
    loadData();
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce client ? Cette action est irréversible.')) return;
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      alert('Impossible de supprimer : ce client a des pièces enregistrées.');
      return;
    }
    router.push('/clients');
  }

  if (loading) return <p>Chargement…</p>;
  if (!client) return <p>Client introuvable.</p>;

  return (
    <div>
      <div className="topbar">
        <h1>{client.full_name}</h1>
        <div className="topbar-actions">
          {!editing && (
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              Modifier
            </button>
          )}
          <button className="btn btn-danger" onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat">
          <span>Total commandé</span>
          <strong>{Number(clientTotals?.total_commande || 0).toLocaleString('fr-FR')} DA</strong>
        </div>
        <div className="stat">
          <span>Total versé</span>
          <strong>{Number(clientTotals?.total_verse || 0).toLocaleString('fr-FR')} DA</strong>
        </div>
        <div className="stat">
          <span>Reste à payer</span>
          <strong>{Number(clientTotals?.reste_a_payer || 0).toLocaleString('fr-FR')} DA</strong>
        </div>
      </div>

      {editing ? (
        <form className="panel" onSubmit={handleSave}>
          <div className="form-grid">
            <div className="field">
              <label>Nom complet</label>
              <input
                value={client.full_name || ''}
                onChange={(e) => updateField('full_name', e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input value={client.phone || ''} onChange={(e) => updateField('phone', e.target.value)} />
            </div>
          </div>

          <h2 className="section-title">Mensurations (cm)</h2>
          <div className="form-grid">
            {MEASUREMENTS.map(({ key, label }) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input
                  type="number"
                  step="0.5"
                  value={client[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea rows={3} value={client.notes || ''} onChange={(e) => updateField('notes', e.target.value)} />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                loadData();
              }}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <div className="panel">
          <div className="info-grid">
            <div>
              <span>Téléphone</span>
              <p>{client.phone || '—'}</p>
            </div>
          </div>

          <h2 className="section-title">Mensurations (cm)</h2>
          <div className="info-grid">
            {MEASUREMENTS.map(({ key, label }) => (
              <div key={key}>
                <span>{label}</span>
                <p>{client[key] ?? '—'}</p>
              </div>
            ))}
          </div>

          {client.notes && (
            <>
              <h2 className="section-title">Notes</h2>
              <p>{client.notes}</p>
            </>
          )}
        </div>
      )}

      <div className="topbar">
        <h2>Pièces commandées</h2>
        <Link href={`/products/new?clientId=${id}`} className="btn btn-primary">
          Nouvelle pièce
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">Aucune pièce pour ce client.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Pièce</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Prix</th>
              <th>Reste à payer</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const t = productTotals[p.id] || { reste_a_payer: p.price };
              return (
                <tr key={p.id}>
                  <td>
                    <Link href={`/products/${p.id}`}>{p.description || p.type}</Link>
                  </td>
                  <td>{p.type}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{Number(p.price).toLocaleString('fr-FR')} DA</td>
                  <td>{Number(t.reste_a_payer).toLocaleString('fr-FR')} DA</td>
                  <td>{new Date(p.order_date).toLocaleDateString('fr-FR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="topbar">
        <h2>Versements</h2>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state">Aucun versement pour ce client.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
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
