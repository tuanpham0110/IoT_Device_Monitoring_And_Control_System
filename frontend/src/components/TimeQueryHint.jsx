import { UNIT_LABEL } from '../data/timeQuery';

// Cho biết đang lọc theo đơn vị nào, hoặc báo sai định dạng
export default function TimeQueryHint({ query }) {
	if (!query) return null;
	if (query.error) return <span className="time-hint error">Sai định dạng thời gian · </span>;
	return <span className="time-hint">Lọc theo {UNIT_LABEL[query.unit]} · </span>;
}
