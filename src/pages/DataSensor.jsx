import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { SENSORS } from '../data/mock';
import DataTable from '../components/DataTable';

const columns = [
	{ key: 'id', label: 'ID (pk)' },
	{
		key: 'name',
		label: 'Tên cảm biến',
		render: (r) => SENSORS[r.sensor_id].name,
		sortValue: (r) => SENSORS[r.sensor_id].name,
	},
	{
		key: 'value',
		label: 'Giá trị (value)',
		render: (r) => <span className="mono">{r.value.toFixed(1)}</span>,
	},
	{
		key: 'unit',
		label: 'Đơn vị (unit)',
		render: (r) => SENSORS[r.sensor_id].unit,
		sortValue: (r) => SENSORS[r.sensor_id].unit,
	},
	{
		key: 'create_at',
		label: 'Thời gian (create_at)',
		render: (r) => <span className="mono">{r.create_at}</span>,
	},
];

export default function DataSensor() {
	const { sensorData } = useApp();
	const [keyword, setKeyword] = useState('');
	const [filter, setFilter] = useState('all'); // 'all' | sensor_id | 'time'
	const byTime = filter === 'time';

	const filtered = useMemo(() => {
		const k = keyword.trim();
		if (byTime) return k ? sensorData.filter((r) => r.create_at.includes(k)) : sensorData;
		const v = k.replace(',', '.');
		if (!v) return sensorData; // chỉ chọn cảm biến mà chưa nhập giá trị -> chưa lọc
		const num = Number(v);
		return sensorData.filter((r) => {
			if (filter !== 'all' && r.sensor_id !== Number(filter)) return false;
			if (Number.isNaN(num)) return false; // gõ chữ -> không ra kết quả
			if (v.includes('.')) return r.value.toFixed(1) === num.toFixed(1); // 30.5 -> đúng 30.5
			return r.value >= num && r.value < num + 1; // 35 -> từ 35.0 đến 35.9
		});
	}, [sensorData, keyword, filter, byTime]);

	const changeFilter = (value) => {
		// Chuyển giữa lọc theo giá trị và theo thời gian thì xoá nội dung ô nhập cũ
		if ((value === 'time') !== byTime) setKeyword('');
		setFilter(value);
	};
	const reset = () => {
		setKeyword('');
		setFilter('all');
	};

	return (
		<div className="stack">
			<h2 className="section-title">Dữ liệu cảm biến (Table data_sensor)</h2>

			<div className="panel filters">
				<label className="field">
					<span>Bộ lọc dữ liệu</span>
					<select value={filter} onChange={(e) => changeFilter(e.target.value)}>
						<option value="all">Tất cả cảm biến</option>
						{Object.entries(SENSORS).map(([id, s]) => (
							<option key={id} value={id}>
								#{id} · {s.name}
							</option>
						))}
						<option value="time">Theo thời gian</option>
					</select>
				</label>
				<label className="field">
					<span>{byTime ? 'Nhập thời gian' : 'Nhập giá trị'}</span>
					{byTime ? (
						<input
							key="time"
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							placeholder="Ví dụ 16:56 hoặc 2026-09-23"
						/>
					) : (
						<input
							key="value"
							value={keyword}
							onChange={(e) => setKeyword(e.target.value)}
							placeholder="Ví dụ 27.5"
							inputMode="decimal"
						/>
					)}
				</label>
				<button type="button" className="btn-ghost" onClick={reset}>
					Đặt lại
				</button>
				<span className="filters-count mono small muted">
					Tìm thấy {filtered.length} bản ghi
				</span>
			</div>

			<DataTable columns={columns} rows={filtered} defaultSort={{ key: 'id', dir: 'desc' }} />
		</div>
	);
}
