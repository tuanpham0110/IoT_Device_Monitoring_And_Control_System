function pageList(page, total) {
	if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
	const pages = new Set([1, total, page, page - 1, page + 1]);
	const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
	const out = [];
	sorted.forEach((p, i) => {
		if (i && p - sorted[i - 1] > 1) out.push('…' + i);
		out.push(p);
	});
	return out;
}

export default function Pagination({ page, totalPages, onChange }) {
	if (totalPages <= 1) return null;
	return (
		<div className="pagination">
		<button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} aria-label="Trang trước">‹</button>
		{pageList(page, totalPages).map((p) => (typeof p === 'number'
			? <button type="button" key={p} className={p === page ? 'active' : ''} onClick={() => onChange(p)}>{p}</button>
			: <span key={p} className="ellipsis">…</span>))}
		<button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)} aria-label="Trang sau">›</button>
		</div>
	);
	}
