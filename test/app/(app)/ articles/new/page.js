'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES, COUTURE_TYPES, BRODERIE_ZONES, ARTICLE_SIZE_FIELDS } from '@/lib/constants';

export default function NewArticlePage() {
  const router = useRouter();
  const [types, setTypes] = useState([]);
  const [couleur, setCouleur] = useState('');
  const [sizes, setSizes] = useState({});
  const [typesCouture, setTypesCouture] = useState([]);
  const [zonesBroderie, setZonesBroderie] = useState([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function toggleInArray(setter, value) {
    setter((arr) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]));
  }

  function updateSize(key, value) {
    setSizes((s) => ({ ...s, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (types.length === 0) {
      setError('Sélectionnez au moins un type.');
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

    const payload = {
      type: types,
      couleur: couleur.trim() || null,
      type_couture: typesCouture,
      zones_broderie: typesCouture.includes('Avec broderie') ? zonesBroderie : [],
      description: description.trim() || null,
      price: price ? Number(price) : 0,
      notes: notes.trim() || null,
      photo_url: photoUrl,
    };
    ARTICLE_SIZE_FIELDS.forEach(({ key }) => {
      payload[key] = sizes[key] ? Number(sizes[key]) : null;
    });

    const { data, error } = await supabase.from('articles').insert(payload).select().single();
    setSaving(false);
    if (error) {
      setError("Erreur lors de l'enregistrement.");
      return;
    }
    router.push(`/articles/${data.id}`);
  }

  return (
    <div>
      <div className="topbar">
        <h1>Nouvel article</h1>
      </div>

      <form className="panel" onSubmit={handleSubmit}>
        <div className="field">
          <label>Type</label>
          <div className="checkbox-row">
            {PRODUCT_TYPES.map((t) => (
              <label key={t} className="checkbox-label">
                <input type="checkbox" checked={types.includes(t)} onChange={() => toggleInArray(setTypes, t)} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Couleur</label>
          <input value={couleur} onChange={(e) => setCouleur(e.target.value)} />
        </div>

        <h2 className="section-title">Mesures (cm)</h2>
        <div className="form-grid">
          {ARTICLE_SIZE_FIELDS.map(({ key, label }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                type="number"
                step="0.5"
                value={sizes[key] || ''}
                onChange={(e) => updateSize(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <h2 className="section-title">Type de couture</h2>
        <div className="field">
          <div className="checkbox-row">
            {COUTURE_TYPES.map((t) => (
              <label key={t} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={typesCouture.includes(t)}
                  onChange={() => toggleInArray(setTypesCouture, t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        {typesCouture.includes('Avec broderie') && (
          <div className="field">
            <label>Zones de broderie</label>
            <div className="checkbox-row">
              {BRODERIE_ZONES.map((zone) => (
                <label key={zone} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={zonesBroderie.includes(zone)}
                    onChange={() => toggleInArray(setZonesBroderie, zone)}
                  />
                  {zone}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="field">
          <label>Description / nom</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex. Caftan vert broderie dos"
          />
        </div>

        <div className="form-grid">
          <div className="field">
            <label>Prix (DA)</label>
            <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="field">
            <label>Photo</label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          </div>
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : "Enregistrer l'article"}
          </button>
        </div>
      </form>
    </div>
  );
}
