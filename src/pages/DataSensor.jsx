import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { SENSORS } from '../data/mock';
import DataTable from '../components/DataTable';

const columns = [
  { key: 'id', label: 'ID (pk)' },
  { key: 'sensor_id', label: 'Sensor ID (fk)' },
  { key: 'name', label: 'Tên cảm biến', render: (r) => SENSORS[r.sensor_id].name, sortValue: (r) => SENSORS[r.sensor_id].name },
  { key: 'type', label: 'Loại (type)', render: (r) => SENSORS[r.sensor_id].type, sortValue: (r) => SENSORS[r.sensor_id].type },
  { key: 'value', label: 'Giá trị (value)', render: (r) => <span className="mono">{r.value.toFixed(1)}</span> },
  { key: 'unit', label: 'Đơn vị (unit)', render: (r) => SENSORS[r.sensor_id].unit, sortValue: (r) => SENSORS[r.sensor_id].unit },
  { key: 'create_at', label: 'Thời gian (create_at)', render: (r) => <span className="mono">{r.create_at}</span> },
];

// Khoảng thời gian tính ngược từ hiện tại (phút). 0 = tất cả
const RANGES = [
  { value: 0, label: 'Tất cả thời gian' },
  { value: 1, label: '1 phút gần nhất' },
  { value: 5, label: '5 phút gần nhất' },
  { value: 15, label: '15 phút gần nhất' },
  { value: 60, label: '1 giờ gần nhất' },
];

const toMs = (createAt) => new Date(createAt.replace(' ', 'T')).getTime();

export default function DataSensor() {
  const { sensorData } = useApp();
  const [keyword, setKeyword] = useState('');
  const [sensorId, setSensorId] = useState('all');
  const [timeText, setTimeText] = useState('');
  const [range, setRange] = useState(0);

  const filtered = useMemo(() => {
    const since = range ? Date.now() - range * 60 * 1000 : 0;
    const t = timeText.trim();
    const k = keyword.trim().replace(',', '.');
    const num = Number(k);
    return sensorData.filter((r) => {
      if (sensorId !== 'all' && r.sensor_id !== Number(sensorId)) return false;
      if (k) {
        if (Number.isNaN(num)) return false;               // gõ chữ -> không ra kết quả
        if (k.includes('.')) {
          if (r.value.toFixed(1) !== num.toFixed(1)) return false;  // 30.5 -> đúng 30.5
        } else if (r.value < num - 1 || r.value >= num + 1) {
          return false;                                     // 30 -> từ 29.0 đến 30.9
        }
      }
      if (t && !r.create_at.includes(t)) return false;
      if (since && toMs(r.create_at) < since) return false;
      return true;
    });
  }, [sensorData, keyword, sensorId, timeText, range]);

  const reset = () => { setKeyword(''); setSensorId('all'); setTimeText(''); setRange(0); };

  return (
    <div className="stack">
      <h2 className="section-title">Dữ liệu cảm biến (Table data_sensor)</h2>

      <div className="panel filters">
        <label className="field">
          <span>Tìm kiếm giá trị</span>
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Ví dụ 27.5" inputMode="decimal" />
        </label>
        <label className="field">
          <span>Cảm biến (sensor_id)</span>
          <select value={sensorId} onChange={(e) => setSensorId(e.target.value)}>
            <option value="all">Tất cả cảm biến</option>
            {Object.entries(SENSORS).map(([id, s]) => <option key={id} value={id}>#{id} · {s.name}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Tìm theo thời gian</span>
          <input value={timeText} onChange={(e) => setTimeText(e.target.value)} placeholder="Ví dụ 16:56 hoặc 2026-09-23" />
        </label>
        <label className="field">
          <span>Khoảng thời gian</span>
          <select value={range} onChange={(e) => setRange(Number(e.target.value))}>
            {RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
        <button type="button" className="btn-ghost" onClick={reset}>Đặt lại</button>
        <span className="filters-count mono small muted">Tìm thấy {filtered.length} bản ghi</span>
      </div>

      <DataTable columns={columns} rows={filtered} defaultSort={{ key: 'id', dir: 'desc' }} />
    </div>
  );
}
