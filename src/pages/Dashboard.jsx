import { useMemo } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext';
import { SENSORS } from '../data/mock';
import { toSeries } from '../data/chart';
import Toggle from '../components/Toggle';
import ChartTooltip from '../components/ChartTooltip';
import { IconBulb, IconDrop, IconSun, IconThermo } from '../components/Icons';

const ICONS = { 1: IconThermo, 2: IconDrop, 3: IconSun };

function SensorCard({ id, value }) {
	const s = SENSORS[id];
	const Icon = ICONS[id];
	const pct = Math.min(100, (value / s.scale) * 100);
	return (
		<div className="panel sensor-card" style={{ '--c': s.color }}>
		<div className="sensor-head"><Icon /> {s.short} (Sensor #{id})</div>
		<div className="sensor-value mono">{value.toFixed(1)}<span>{s.unit}</span></div>
		<div className="bar"><div className="bar-fill" style={{ width: pct + '%' }} /></div>
		<div className="mono muted small">Unit: {s.unit} · {s.type}</div>
		</div>
	);
}

export default function Dashboard() {
	const { latest, sensorData, devices, toggleDevice } = useApp();
	const series = useMemo(() => toSeries(sensorData, 20), [sensorData]);
	const onCount = devices.filter((d) => d.status === 'ON').length;

	return (
		<div className="dashboard">
		<section className="sensor-grid">
			{[1, 2, 3].map((id) => <SensorCard key={id} id={id} value={latest[id]} />)}
		</section>

		<section className="dash-grid">
			<div className="panel chart-panel">
			<div className="panel-head">
				<h2>Biểu đồ cảm biến theo thời gian thực</h2>
				<span className="muted small mono">Cập nhật mỗi 3 giây</span>
			</div>
			<div className="chart-box">
				<ResponsiveContainer width="100%" height="100%">
				<LineChart data={series} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
					<CartesianGrid stroke="rgba(120,160,220,.12)" vertical={false} />
					<XAxis dataKey="time" tick={{ fill: '#8aa3c7', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
					<YAxis yAxisId="left" tick={{ fill: '#8aa3c7', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 100]} />
					<YAxis yAxisId="right" orientation="right" tick={{ fill: '#8aa3c7', fontSize: 11 }} tickLine={false} axisLine={false} domain={[0, 400]} />
					<Tooltip content={<ChartTooltip />} />
					<Legend wrapperStyle={{ fontSize: 12 }} />
					<Line yAxisId="left" type="monotone" dataKey="s1" name="Nhiệt độ (°C)" stroke={SENSORS[1].color} strokeWidth={2} dot={false} isAnimationActive={false} />
					<Line yAxisId="left" type="monotone" dataKey="s2" name="Độ ẩm (%)" stroke={SENSORS[2].color} strokeWidth={2} dot={false} isAnimationActive={false} />
					<Line yAxisId="right" type="monotone" dataKey="s3" name="Ánh sáng (lux)" stroke={SENSORS[3].color} strokeWidth={2} dot={false} isAnimationActive={false} />
				</LineChart>
				</ResponsiveContainer>
			</div>
			</div>

			<div className="side-col">
			<div className="panel">
				<div className="panel-head">
				<h2>Điều khiển thiết bị</h2>
				<span className="muted small mono">{onCount}/{devices.length} đang bật</span>
				</div>
				<div className="led-row">
				{devices.map((d) => (
					<div key={d.id} className={`led ${d.status === 'ON' ? 'on' : ''} ${d.pending ? 'pending' : ''}`}>
					<div className="led-bulb"><IconBulb width={22} height={22} /></div>
					<div className="led-name">{d.name}</div>
					<div className="mono small led-state">{d.pending ? 'Đang gửi…' : d.status}</div>
					<Toggle checked={d.status === 'ON'} pending={d.pending} onChange={() => toggleDevice(d.id)} label={`Bật tắt ${d.name}`} />
					</div>
				))}
				</div>
				<p className="muted small note">Mỗi lần bật/tắt sẽ cập nhật bảng device và ghi log vào bảng device_action.</p>
			</div>
			</div>
		</section>
		</div>
	);
}
