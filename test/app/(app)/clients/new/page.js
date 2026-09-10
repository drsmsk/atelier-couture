'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { MEASUREMENTS } from '@/lib/constants';

export default function NewClientPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [measurements, setMeasurements] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function updateMeasurement(key, value) {
    setMeasurements((m) => ({ ...m, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Le nom du client est requis.');
      return;
    }
    setSaving(true);

    const payload = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      notes: notes.trim() || null,
    };
    MEASUREMENTS.forEach(({ key }) => {
      const v = measurements[key];
      payload[key] = v ? Number(v) : null;
    });

    const { data, error } = await supabase.from('clients').insert(payload).select().single();
    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }
    router.push(`/clients/${data.id}`);
  }

  return (
    <div>
      <div className="topbar">
        <h1>Nouveau client</h1>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Nom complet</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                value={measurements[key] || ''}
                onChange={(e) => updateMeasurement(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}
