// Gom các bản ghi data_sensor theo thời điểm để vẽ biểu đồ
export function toSeries(sensorData, limit = 20) {
    const map = new Map();
    for (const r of sensorData) {
      if (!map.has(r.create_at)) map.set(r.create_at, { time: r.create_at.slice(11) });
      map.get(r.create_at)['s' + r.sensor_id] = r.value;
    }
    return [...map.values()].slice(-limit);
}
