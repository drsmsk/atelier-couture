const STATUS_CLASSES = {
  'En cours': 'badge-en-cours',
  Essayage: 'badge-essayage',
  Livré: 'badge-livre',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASSES[status] || ''}`}>{status}</span>;
}
