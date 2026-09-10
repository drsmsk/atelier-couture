'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES, PRODUCT_STATUSES } from '@/lib/constants';

export default function NewProductPage() {
  return (
    <Suspense fallback={<p>Chargement…</p>}>
      <NewProductForm />
    </Suspense>
  );
}

function NewProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('clientId') || '';

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [type, setType] = useState(PRODUCT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState(PRODUCT_STATUSES[0]);
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('clients')
      .select('id, full_name')
      .order('full_name')
      .then(({ data }) => setClients(data || []));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!clientId) {
      setError('Veuillez sélectionner un client.');
      return;
    }
    setSaving(true);

    let photoUrl = null;
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

    const { data, error } = await supabase
      .from('products')
      .insert({
        client_id: clientId,
        type,
        description: description.trim() || null,
        price: price ? Number(price) : 0,
        status,
        order_date: orderDate,
        notes: notes.trim() || null,
        photo_url: photoUrl,
      })
      .select()
      .single();

    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }
    router.push(`/products/${data.id}`);
  }

  return (
    <div>
      <div className="topbar">
        <h1>Nouvelle pièce</h1>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Description / nom</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Caftan brodé or"
          />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Prix (DA)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {PRODUCT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer la pièce'}
          </button>
        </div>
      </form>
    </div>
  );
}
