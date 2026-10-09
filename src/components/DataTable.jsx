import { useEffect, useMemo, useState } from 'react';
import Pagination from './Pagination';
import { SortIcon } from './Icons';

// columns: [{ key, label, render?(row), sortValue?(row) }]
export default function DataTable({
	columns,
	rows,
	defaultSort,
	emptyText = 'Không có bản ghi nào khớp bộ lọc.',
}) {
	const [sort, setSort] = useState(defaultSort ?? { key: columns[0].key, dir: 'desc' });
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const sorted = useMemo(() => {
		const col = columns.find((c) => c.key === sort.key);
		const get = col?.sortValue ?? ((r) => r[sort.key]);
		return [...rows].sort((a, b) => {
			const va = get(a);
			const vb = get(b);
			const cmp =
				typeof va === 'number' && typeof vb === 'number'
					? va - vb
					: String(va).localeCompare(String(vb), 'vi');
			return sort.dir === 'asc' ? cmp : -cmp;
		});
	}, [rows, sort, columns]);

	const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
	useEffect(() => {
		if (page > totalPages) setPage(totalPages);
	}, [page, totalPages]);
	const start = (page - 1) * pageSize;
	const visible = sorted.slice(start, start + pageSize);

	const toggleSort = (key) => {
		setSort((s) =>
			s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
		);
		setPage(1);
	};

	return (
		<>
			<div className="panel table-wrap">
				<table className="table">
					<thead>
						<tr>
							{columns.map((c) => (
								<th
									key={c.key}
									aria-sort={
										sort.key === c.key
											? sort.dir === 'asc'
												? 'ascending'
												: 'descending'
											: 'none'
									}
								>
									<button type="button" onClick={() => toggleSort(c.key)}>
										{c.label}{' '}
										<SortIcon dir={sort.key === c.key ? sort.dir : null} />
									</button>
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{visible.length === 0 && (
							<tr>
								<td colSpan={columns.length} className="empty">
									{emptyText}
								</td>
							</tr>
						)}
						{visible.map((row) => (
							<tr key={row.id}>
								{columns.map((c) => (
									<td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="table-foot">
				<div className="muted mono small">
					Hiển thị {sorted.length ? start + 1 : 0}–
					{Math.min(start + pageSize, sorted.length)} / {sorted.length} bản ghi ·{' '}
					<select
						className="page-size"
						value={pageSize}
						onChange={(e) => {
							setPageSize(Number(e.target.value));
							setPage(1);
						}}
						aria-label="Số bản ghi mỗi trang"
					>
						{[5, 10, 20, 50].map((n) => (
							<option key={n} value={n}>
								{n}
							</option>
						))}
					</select>{' '}
					bản ghi / trang
				</div>
				<Pagination page={page} totalPages={totalPages} onChange={setPage} />
			</div>
		</>
	);
}
