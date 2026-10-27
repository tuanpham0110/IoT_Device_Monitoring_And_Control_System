import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { USER } from '../data/mock';
import {
	controlDevice,
	fetchActions,
	fetchDevices,
	fetchSensorHistory,
	toAction,
	toDevice,
	toLatest,
	toSensorRows,
} from '../data/api';

const AppContext = createContext(null);
const AUTH_KEY = 'iot_auth_user';
// Mỗi bản ghi datasensor thành 3 dòng => giữ 500 lần đo gần nhất
const MAX_READINGS = 500;
const MAX_ROWS = MAX_READINGS * 3;
const MAX_ACTIONS = 500;
const EMPTY_LATEST = { 1: 0, 2: 0, 3: 0 };

function readStoredUser() {
	try {
		return localStorage.getItem(AUTH_KEY) ? USER : null;
	} catch {
		return null;
	}
}

// Thêm hoặc cập nhật các dòng action_log theo id (lệnh loading -> success/failed)
function upsertActions(list, changed) {
	const byId = new Map(list.map((a) => [a.id, a]));
	for (const a of changed) byId.set(a.id, a);
	return [...byId.values()].sort((a, b) => a.id - b.id).slice(-MAX_ACTIONS);
}

export function AppProvider({ children }) {
	const [user, setUser] = useState(readStoredUser);
	const [sensorData, setSensorData] = useState([]);
	const [latest, setLatest] = useState(EMPTY_LATEST);
	const [devices, setDevices] = useState([]);
	const [actions, setActions] = useState([]);
	const [mqttConnected, setMqttConnected] = useState(false);

	const devicesRef = useRef(devices);
	useEffect(() => {
		devicesRef.current = devices;
	}, [devices]);

	// Tải dữ liệu ban đầu từ MySQL qua REST API, sau đó nhận realtime qua Socket.IO
	useEffect(() => {
		let cancelled = false;

		Promise.all([fetchSensorHistory(MAX_READINGS), fetchDevices(), fetchActions(MAX_ACTIONS)])
			.then(([readings, deviceList, actionList]) => {
				if (cancelled) return;
				setSensorData(readings.flatMap(toSensorRows));
				if (readings.length) setLatest(toLatest(readings[readings.length - 1]));
				setDevices(deviceList.map(toDevice));
				setActions((list) => upsertActions(list, actionList.map(toAction)));
			})
			.catch((err) => console.error('[API] Không tải được dữ liệu ban đầu:', err.message));

		const socket = io();
		socket.on('mqtt:status', ({ connected }) => setMqttConnected(connected));
		socket.on('device:status', (list) => setDevices(list.map(toDevice)));
		socket.on('device:action', (list) =>
			setActions((prev) => upsertActions(prev, list.map(toAction))),
		);
		socket.on('sensor:data', (reading) => {
			setLatest(toLatest(reading));
			setSensorData((rows) => {
				const added = toSensorRows(reading);
				// Snapshot khi (re)connect có thể gửi lại bản ghi đã có
				if (rows.some((r) => r.id === added[0].id)) return rows;
				return [...rows, ...added].slice(-MAX_ROWS);
			});
		});
		socket.on('disconnect', () => setMqttConnected(false));

		return () => {
			cancelled = true;
			socket.disconnect();
		};
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

	// Gửi lệnh tới backend; trạng thái đèn và log (loading -> success/failed) về qua Socket.IO
	const toggleDevice = useCallback(async (deviceId) => {
		const device = devicesRef.current.find((d) => d.id === deviceId);
		if (!device || device.pending) return;
		setDevices((list) => list.map((d) => (d.id === deviceId ? { ...d, pending: true } : d)));
		try {
			await controlDevice(deviceId, device.status !== 'ON');
		} catch (err) {
			console.warn(`[Control] ${device.name}: ${err.message}`);
		} finally {
			// Lỗi trước khi backend gửi lệnh (mất MQTT, mất mạng...) thì không có sự kiện socket nào
			fetchDevices()
				.then((list) => setDevices(list.map(toDevice)))
				.catch(() =>
					setDevices((list) =>
						list.map((d) => (d.id === deviceId ? { ...d, pending: false } : d)),
					),
				);
		}
	}, []);

	// Coi là kết nối khi backend nối được broker và ESP32 vẫn đang gửi dữ liệu
	const connected = mqttConnected && devices.some((d) => d.online);

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
