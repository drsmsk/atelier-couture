'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { PRODUCT_TYPES } from '@/lib/constants';

export default function ArticlesPage() {
  const [articles, setArticles] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    setArticles(data || []);
    setLoading(false);
  }

  const filtered = articles.filter((a) => !typeFilter || (a.type || []).includes(typeFilter));

  return (
    <div>
      <div className="topbar">
        <h1>Articles (prêt-à-porter)</h1>
        <Link href="/articles/new" className="btn btn-primary">
          Nouvel article
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
      </div>

      {loading ? (
        <p>Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Aucun article pour l&rsquo;instant.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>Article</th>
              <th>Type</th>
              <th>Couleur</th>
              <th>Couture</th>
              <th>Prix</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.photo_url ? (
                    <img src={a.photo_url} alt="" className="thumb" />
                  ) : (
                    <div className="thumb thumb-empty" />
                  )}
                </td>
                <td>
                  <Link href={`/articles/${a.id}`}>{a.description || (a.type || []).join(', ')}</Link>
                </td>
                <td>{(a.type || []).join(', ')}</td>
                <td>{a.couleur || '—'}</td>
                <td>
                  <span className="badge badge-neutral">{(a.type_couture || []).join(', ') || '—'}</span>
                </td>
                <td>{Number(a.price).toLocaleString('fr-FR')} DA</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
