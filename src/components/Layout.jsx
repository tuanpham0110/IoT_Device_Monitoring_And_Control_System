import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { IconChart, IconDashboard, IconHistory, IconLogout, IconUser } from './Icons';

const NAV = [
	{ to: '/', label: 'Dashboard', icon: IconDashboard, title: 'Bảng điều khiển' },
	{ to: '/data-sensor', label: 'Data Sensor', icon: IconChart, title: 'Dữ liệu cảm biến (data_sensor)' },
	{ to: '/device-action', label: 'Device Action', icon: IconHistory, title: 'Lịch sử thiết bị (device_action)' },
	{ to: '/profile', label: 'Profile', icon: IconUser, title: 'Hồ sơ người dùng (users)' },
];

function Clock() {
	const [now, setNow] = useState(new Date());
	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);
	return <span className="mono">{now.toLocaleTimeString('vi-VN', { hour12: false })}</span>;
}

export default function Layout() {
	const { logout, connected } = useApp();
	const navigate = useNavigate();
	const { pathname } = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);
	const current = NAV.find((n) => n.to === pathname) ?? NAV[0];

	useEffect(() => setMenuOpen(false), [pathname]);

	const handleLogout = () => {
		logout();
		navigate('/login', { replace: true });
	};

	return (
		<div className={`app ${pathname === '/' ? 'no-scroll' : ''}`}>
		<aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
			<div className="brand">
			<span className="brand-dot" />
			<div>
				<div className="brand-name">IoT</div>
				<div className="brand-sub">Phòng thông minh</div>
			</div>
			</div>

			<nav className="nav">
			{NAV.map(({ to, label, icon: Icon }) => (
				<NavLink key={to} to={to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
				<Icon /> {label}
				</NavLink>
			))}
			</nav>

			<div className="sidebar-foot">
			<div className={`conn ${connected ? 'ok' : 'off'}`}>
				<span className="dot" /> {connected ? 'ESP32 đã kết nối qua MQTT' : 'Mất kết nối ESP32'}
			</div>
			<button type="button" className="logout" onClick={handleLogout}><IconLogout /> Đăng xuất</button>
			</div>
		</aside>
		{menuOpen && <div className="backdrop" onClick={() => setMenuOpen(false)} />}

		<div className="main">
			<header className="topbar">
			<button type="button" className="menu-btn" aria-label="Mở menu" onClick={() => setMenuOpen(true)}>
				<span /><span /><span />
			</button>
			<h1>{current.title}</h1>
			<div className="clock"><span className="dot live" /><Clock /></div>
			</header>
			<main className="content"><Outlet /></main>
		</div>
		</div>
	);
}
