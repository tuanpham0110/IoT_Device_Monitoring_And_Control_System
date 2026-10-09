import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import DataTable from '../components/DataTable';

const STATUS_COLOR = { success: 'green', failed: 'red', loading: 'yellow' };

export default function DeviceAction() {
	const { actions, devices } = useApp();
	const [time, setTime] = useState('');
	const [deviceId, setDeviceId] = useState('all');
	const [action, setAction] = useState('all');
	const [status, setStatus] = useState('all');

	const nameOf = useMemo(() => Object.fromEntries(devices.map((d) => [d.id, d.name])), [devices]);

	const columns = useMemo(
		() => [
			{ key: 'id', label: 'ID (pk)' },
			{
				key: 'name',
				label: 'Tên thiết bị',
				render: (r) => nameOf[r.device_id],
				sortValue: (r) => nameOf[r.device_id],
			},
			{ key: 'user_id', label: 'User ID (fk)' },
			{
				key: 'action',
				label: 'Hành động (action)',
				render: (r) => (
					<span className={`badge ${r.action === 'ON' ? 'green' : 'red'}`}>
						{r.action}
					</span>
				),
			},
			{
				key: 'status',
				label: 'Trạng thái (status)',
				render: (r) => (
					<span className={`badge ${STATUS_COLOR[r.status]}`}>{r.status}</span>
				),
			},
			{
				key: 'time',
				label: 'Thời điểm (time)',
				render: (r) => <span className="mono">{r.time}</span>,
			},
		],
		[nameOf],
	);

	const filtered = useMemo(
		() =>
			actions.filter((r) => {
				if (deviceId !== 'all' && r.device_id !== Number(deviceId)) return false;
				if (action !== 'all' && r.action !== action) return false;
				if (status !== 'all' && r.status !== status) return false;
				const t = time.trim();
				if (t && !r.time.includes(t)) return false;
				return true;
			}),
		[actions, deviceId, action, status, time],
	);

	const reset = () => {
		setTime('');
		setDeviceId('all');
		setAction('all');
		setStatus('all');
	};

	return (
		<div className="stack">
			<h2 className="section-title">Lịch sử điều khiển thiết bị (Table device_action)</h2>

			<div className="panel filters">
				<label className="field">
					<span>Tìm theo thời gian</span>
					<input
						value={time}
						onChange={(e) => setTime(e.target.value)}
						placeholder="Ví dụ 16:56 hoặc 2026-09-23"
					/>
				</label>
				<label className="field">
					<span>Thiết bị</span>
					<select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
						<option value="all">Tất cả thiết bị</option>
						{devices.map((d) => (
							<option key={d.id} value={d.id}>
								{d.name}
							</option>
						))}
					</select>
				</label>
				<label className="field">
					<span>Hành động (action)</span>
					<select value={action} onChange={(e) => setAction(e.target.value)}>
						<option value="all">Tất cả</option>
						<option value="ON">ON</option>
						<option value="OFF">OFF</option>
					</select>
				</label>
				<label className="field">
					<span>Trạng thái (status)</span>
					<select value={status} onChange={(e) => setStatus(e.target.value)}>
						<option value="all">Tất cả</option>
						<option value="success">success</option>
						<option value="failed">failed</option>
						<option value="loading">loading</option>
					</select>
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
