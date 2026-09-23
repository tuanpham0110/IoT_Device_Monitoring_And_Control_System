import { useState } from 'react';
import { useApp } from '../context/AppContext';

function initials(name) {
  const words = name.trim().split(/\s+/);
  return words.map((w) => w[0]).join('').slice(-3).toUpperCase();
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function Profile() {
  const { user } = useApp();
  const [imgFailed, setImgFailed] = useState(false);

  const links = [
    ['Figma', user.figma, 'figma.com/BaiTapIoT'],
    ['GitHub', user.github, 'github.com/tuanpham0110/IoT'],
    ['Postman', user.postman, 'postman.com/BaiTapIoT'],
    ['Báo cáo', user.report, 'docs.google.com/BaoCaoIoT'],
  ];

  return (
    <div className="panel profile">
      <div className="profile-side">
        <div className="avatar">
          {user.avatar && !imgFailed
            ? <img src={user.avatar} alt={`Ảnh đại diện của ${user.fullname}`} onError={() => setImgFailed(true)} />
            : initials(user.fullname)}
        </div>
        <div className="profile-name">{user.fullname}</div>
        <div className="mono small accent-2">Báo cáo Bài Tập lớn IoT</div>
      </div>

      <div className="profile-body">
        <div className="profile-grid">
          <div className="pf"><span>Họ và tên</span><strong>{user.fullname}</strong></div>
          <div className="pf"><span>Mã sinh viên</span><strong className="mono">{user.student_id}</strong></div>
          <div className="pf"><span>Ngày sinh</span><strong className="mono">{formatDate(user.date_of_birth)}</strong></div>
        </div>

        <div className="link-list">
          {links.map(([label, url, text]) => (
            <a key={label} className="link-row" href={url} target="_blank" rel="noreferrer">
              <span className="link-label">{label}</span>
              <span className="mono link-url" title={url}>{text}</span>
              <span className="link-open" aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
