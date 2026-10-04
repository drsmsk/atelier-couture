'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES, COUTURE_TYPES, BRODERIE_ZONES, ARTICLE_SIZE_FIELDS } from '@/lib/constants';

export default function ArticleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('articles').select('*').eq('id', id).single();
    setArticle(data);
    setLoading(false);
  }

  function updateField(key, value) {
    setArticle((a) => ({ ...a, [key]: value }));
  }

  function toggleInField(key, value) {
    setArticle((a) => {
      const arr = a[key] || [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...a, [key]: next };
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');

    if (!article.type || article.type.length === 0) {
      setSaving(false);
      setError('Sélectionnez au moins un type.');
      return;
    }

    let photoUrl = article.photo_url;
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
      type: article.type,
      couleur: article.couleur,
      type_couture: article.type_couture || [],
      zones_broderie: (article.type_couture || []).includes('Avec broderie') ? article.zones_broderie || [] : [],
      description: article.description,
      price: Number(article.price) || 0,
      notes: article.notes,
      photo_url: photoUrl,
    };
    ARTICLE_SIZE_FIELDS.forEach(({ key }) => {
      payload[key] = article[key] || null;
    });

    const { error } = await supabase.from('articles').update(payload).eq('id', id);
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
    if (!confirm('Supprimer cet article ? Cette action est irréversible.')) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      alert('Erreur lors de la suppression.');
      return;
    }
    router.push('/articles');
  }

  if (loading) return <p>Chargement…</p>;
  if (!article) return <p>Article introuvable.</p>;

  return (
    <div>
      <div className="topbar">
        <h1>{article.description || (article.type || []).join(', ')}</h1>
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

      <div className="panel product-panel">
        {article.photo_url && <img src={article.photo_url} alt="" className="product-photo" />}

        {editing ? (
          <div className="form-grid">
            <div className="field field-wide">
              <label>Type</label>
              <div className="checkbox-row">
                {PRODUCT_TYPES.map((t) => (
                  <label key={t} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(article.type || []).includes(t)}
                      onChange={() => toggleInField('type', t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Couleur</label>
              <input value={article.couleur || ''} onChange={(e) => updateField('couleur', e.target.value)} />
            </div>

            {ARTICLE_SIZE_FIELDS.map(({ key, label }) => (
              <div className="field" key={key}>
                <label>{label}</label>
                <input
                  type="number"
                  step="0.5"
                  value={article[key] ?? ''}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            ))}

            <div className="field field-wide">
              <label>Type de couture</label>
              <div className="checkbox-row">
                {COUTURE_TYPES.map((t) => (
                  <label key={t} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(article.type_couture || []).includes(t)}
                      onChange={() => toggleInField('type_couture', t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Prix (DA)</label>
              <input
                type="number"
                step="0.01"
                value={article.price}
                onChange={(e) => updateField('price', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Nouvelle photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <div className="field field-wide">
              <label>Description / nom</label>
              <input value={article.description || ''} onChange={(e) => updateField('description', e.target.value)} />
            </div>

            {(article.type_couture || []).includes('Avec broderie') && (
              <div className="field field-wide">
                <label>Zones de broderie</label>
                <div className="checkbox-row">
                  {BRODERIE_ZONES.map((zone) => (
                    <label key={zone} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(article.zones_broderie || []).includes(zone)}
                        onChange={() => toggleInField('zones_broderie', zone)}
                      />
                      {zone}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="field field-wide">
              <label>Notes</label>
              <textarea rows={3} value={article.notes || ''} onChange={(e) => updateField('notes', e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="info-grid">
            <div>
              <span>Type</span>
              <p>{(article.type || []).join(', ') || '—'}</p>
            </div>
            <div>
              <span>Couleur</span>
              <p>{article.couleur || '—'}</p>
            </div>
            {ARTICLE_SIZE_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <span>{label}</span>
                <p>{article[key] ?? '—'}</p>
              </div>
            ))}
            <div>
              <span>Type de couture</span>
              <p>{(article.type_couture || []).join(', ') || '—'}</p>
            </div>
            {(article.type_couture || []).includes('Avec broderie') && (
              <div>
                <span>Zones de broderie</span>
                <p>{(article.zones_broderie || []).join(', ') || '—'}</p>
              </div>
            )}
            <div>
              <span>Prix</span>
              <p>{Number(article.price).toLocaleString('fr-FR')} DA</p>
            </div>
            {article.notes && (
              <div className="field-wide">
                <span>Notes</span>
                <p>{article.notes}</p>
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
    </div>
  );
}
