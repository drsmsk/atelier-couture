'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES, PRODUCT_STATUSES } from '@/lib/constants';
import StatusBadge from '@/components/StatusBadge';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [payments, setPayments] = useState([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState('');
  const [newPaymentDate, setNewPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newPaymentNote, setNewPaymentNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    setLoading(true);
    const [{ data: productData }, { data: paymentsData }] = await Promise.all([
      supabase.from('products').select('*, clients(id, full_name)').eq('id', id).single(),
      supabase.from('payments').select('*').eq('product_id', id).order('payment_date', { ascending: false }),
    ]);
    setProduct(productData);
    setPayments(paymentsData || []);
    setLoading(false);
  }

  function updateField(key, value) {
    setProduct((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    let photoUrl = product.photo_url;
    if (photoFile) {
      const path = `${Date.now()}-${photoFile.name}`;
      const { error: uploadError } = await supabase.storage.from('product-photos').upload(path, photoFile);
      if (uploadError) {
        setSaving(false);
        setError("Erreur lors de l'envoi de la photo.");
        return;
      }
      photoUrl = supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl;
    }

    const { error } = await supabase
      .from('products')
      .update({
        type: product.type,
        description: product.description,
        price: Number(product.price) || 0,
        status: product.status,
        order_date: product.order_date,
        notes: product.notes,
        photo_url: photoUrl,
      })
      .eq('id', id);

    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }
    setEditing(false);
    setPhotoFile(null);
    loadData();
  }

  async function handleDelete() {
    if (!confirm('Supprimer cette pièce ? Cette action est irréversible.')) return;
    const clientId = product.client_id;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression.');
      return;
    }
    router.push(`/clients/${clientId}`);
  }

  async function handleAddPayment(e) {
    e.preventDefault();
    if (!newPaymentAmount) return;
    const { error } = await supabase.from('payments').insert({
      product_id: id,
      amount: Number(newPaymentAmount),
      payment_date: newPaymentDate,
      note: newPaymentNote.trim() || null,
    });
    if (error) {
      alert("Erreur lors de l'ajout du versement.");
      return;
    }
    setNewPaymentAmount('');
    setNewPaymentNote('');
    loadData();
  }

  async function handleDeletePayment(paymentId) {
    if (!confirm('Supprimer ce versement ?')) return;
    await supabase.from('payments').delete().eq('id', paymentId);
    loadData();
  }

  if (loading) return <p>Chargement…</p>;
  if (!product) return <p>Pièce introuvable.</p>;

  const totalVerse = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const resteAPayer = Number(product.price) - totalVerse;

  return (
    <div>
      <div className="topbar">
        <h1>{product.description || product.type}</h1>
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

      <p className="breadcrumb">
        Client :{' '}
        {product.clients ? (
          <Link href={`/clients/${product.clients.id}`}>{product.clients.full_name}</Link>
        ) : (
          '—'
        )}
      </p>

      <div className="stats-row">
        <div className="stat">
          <span>Prix</span>
          <strong>{Number(product.price).toLocaleString('fr-FR')} DA</strong>
        </div>
        <div className="stat">
          <span>Total versé</span>
          <strong>{totalVerse.toLocaleString('fr-FR')} DA</strong>
        </div>
        <div className="stat">
          <span>Reste à payer</span>
          <strong>{resteAPayer.toLocaleString('fr-FR')} DA</strong>
        </div>
      </div>

      <div className="panel product-panel">
        {product.photo_url && <img src={product.photo_url} alt="" className="product-photo" />}

        {editing ? (
          <div className="form-grid">
            <div className="field">
              <label>Type</label>
              <select value={product.type} onChange={(e) => updateField('type', e.target.value)}>
                {PRODUCT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Statut</label>
              <select value={product.status} onChange={(e) => updateField('status', e.target.value)}>
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="field field-wide">
              <label>Description / nom</label>
              <input value={product.description || ''} onChange={(e) => updateField('description', e.target.value)} />
            </div>
            <div className="field">
              <label>Prix (DA)</label>
              <input
                type="number"
                step="0.01"
                value={product.price}
                onChange={(e) => updateField('price', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" value={product.order_date} onChange={(e) => updateField('order_date', e.target.value)} />
            </div>
            <div className="field">
              <label>Nouvelle photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <div className="field field-wide">
              <label>Notes</label>
              <textarea rows={3} value={product.notes || ''} onChange={(e) => updateField('notes', e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="info-grid">
            <div>
              <span>Type</span>
              <p>{product.type}</p>
            </div>
            <div>
              <span>Statut</span>
              <p>
                <StatusBadge status={product.status} />
              </p>
            </div>
            <div>
              <span>Date</span>
              <p>{new Date(product.order_date).toLocaleDateString('fr-FR')}</p>
            </div>
            {product.notes && (
              <div className="field-wide">
                <span>Notes</span>
                <p>{product.notes}</p>
              </div>
            )}
          </div>
        )}

        {error && <p className="form-error">{error}</p>}

        {editing && (
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setEditing(false);
                setPhotoFile(null);
                setError('');
                loadData();
              }}
            >
              Annuler
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        )}
      </div>

      <h2 className="section-title">Versements</h2>

      <form className="panel payment-form" onSubmit={handleAddPayment}>
        <div className="form-grid">
          <div className="field">
            <label>Montant (DA)</label>
            <input
              type="number"
              step="0.01"
              value={newPaymentAmount}
              onChange={(e) => setNewPaymentAmount(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={newPaymentDate} onChange={(e) => setNewPaymentDate(e.target.value)} />
          </div>
          <div className="field">
            <label>Note</label>
            <input value={newPaymentNote} onChange={(e) => setNewPaymentNote(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          Ajouter le versement
        </button>
      </form>

      {payments.length === 0 ? (
        <div className="empty-state">Aucun versement enregistré.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Note</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td>{new Date(p.payment_date).toLocaleDateString('fr-FR')}</td>
                <td>{Number(p.amount).toLocaleString('fr-FR')} DA</td>
                <td>{p.note || '—'}</td>
                <td>
                  <button className="btn btn-ghost btn-small" onClick={() => handleDeletePayment(p.id)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
