export default function Toggle({ checked, pending, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={pending}
      className={`toggle ${checked ? 'on' : ''} ${pending ? 'pending' : ''}`}
      onClick={onChange}
    >
      <span className="knob" />
    </button>
  );
}
