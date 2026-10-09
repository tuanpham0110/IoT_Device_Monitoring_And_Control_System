import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
	INITIAL_DEVICES,
	USER,
	formatTime,
	nextValue,
	seedActions,
	seedSensorData,
} from '../data/mock';

const AppContext = createContext(null);
const AUTH_KEY = 'iot_auth_user';
const MAX_ROWS = 1500;
const seed = seedSensorData();
const seededActions = seedActions();

function readStoredUser() {
	try {
		return localStorage.getItem(AUTH_KEY) ? USER : null;
	} catch {
		return null;
	}
}

export function AppProvider({ children }) {
	const [user, setUser] = useState(readStoredUser);
	const [sensorData, setSensorData] = useState(seed.rows);
	const [latest, setLatest] = useState(seed.last);
	const [devices, setDevices] = useState(INITIAL_DEVICES);
	const [actions, setActions] = useState(seededActions);
	const [connected] = useState(true);

	const latestRef = useRef(seed.last);
	const devicesRef = useRef(INITIAL_DEVICES);
	const nextActionId = useRef(seededActions.length + 1);
	useEffect(() => {
		devicesRef.current = devices;
	}, [devices]);

	// Giả lập ESP32 gửi dữ liệu mỗi 3 giây (sau này thay bằng MQTT/WebSocket)
	useEffect(() => {
		const timer = setInterval(() => {
			const prev = latestRef.current;
			const next = {
				1: nextValue(1, prev[1]),
				2: nextValue(2, prev[2]),
				3: nextValue(3, prev[3]),
			};
			latestRef.current = next;
			const now = formatTime(new Date());
			setLatest(next);
			setSensorData((rows) => {
				let id = rows.length ? rows[rows.length - 1].id : 0;
				const added = [1, 2, 3].map((sid) => ({
					id: ++id,
					sensor_id: sid,
					value: next[sid],
					create_at: now,
				}));
				return [...rows, ...added].slice(-MAX_ROWS);
			});
		}, 3000);
		return () => clearInterval(timer);
	}, []);

	const login = useCallback((username, password) => {
		if (username.trim() === USER.username && password === USER.password) {
			setUser(USER);
			try {
				localStorage.setItem(AUTH_KEY, '1');
			} catch {
				/* bỏ qua */
			}
			return true;
		}
		return false;
	}, []);

	const logout = useCallback(() => {
		setUser(null);
		try {
			localStorage.removeItem(AUTH_KEY);
		} catch {
			/* bỏ qua */
		}
	}, []);

	// Bật/tắt LED: ghi log 'loading' -> chờ ESP32 phản hồi -> cập nhật device.status và status của log
	const toggleDevice = useCallback((deviceId) => {
		const device = devicesRef.current.find((d) => d.id === deviceId);
		if (!device || device.pending) return;
		const target = device.status === 'ON' ? 'OFF' : 'ON';
		const actionId = nextActionId.current++;
		setDevices((list) => list.map((d) => (d.id === deviceId ? { ...d, pending: true } : d)));
		setActions((list) => [
			...list,
			{
				id: actionId,
				device_id: deviceId,
				user_id: 1,
				action: target,
				status: 'loading',
				time: formatTime(new Date()),
			},
		]);

		setTimeout(() => {
			const ok = Math.random() > 0.1; // 10% thất bại để demo trạng thái failed
			setDevices((list) =>
				list.map((d) =>
					d.id === deviceId
						? { ...d, pending: false, status: ok ? target : d.status }
						: d,
				),
			);
			setActions((list) =>
				list.map((a) =>
					a.id === actionId ? { ...a, status: ok ? 'success' : 'failed' } : a,
				),
			);
		}, 800);
	}, []);

	return (
		<AppContext.Provider
			value={{
				user,
				login,
				logout,
				sensorData,
				latest,
				devices,
				actions,
				toggleDevice,
				connected,
			}}
		>
			{children}
		</AppContext.Provider>
	);
}

export const useApp = () => useContext(AppContext);
