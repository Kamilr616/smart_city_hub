import PropTypes from 'prop-types';
const shapes = {
  overview: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  devices: (
    <>
      <path d="M8 3v4m8-4v4M7 7h10v6a5 5 0 0 1-10 0V7Zm5 11v3" />
    </>
  ),
  sensors: (
    <>
      <path d="M3 12h4l3-7 4 14 3-7h4" />
    </>
  ),
  locations: (
    <>
      <path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  add: <path d="M12 4v16M4 12h16" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 21v-3a6 6 0 0 1 12 0v3m3-13v6m-3-3h6" />
    </>
  ),
  arrow: <path d="m9 5 7 7-7 7" />,
  logout: (
    <>
      <path d="M9 4H4v16h5m6-13 5 5-5 5m-7-5h12" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
    </>
  ),
};
export default function Icon({ name, ...props }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {shapes[name] || shapes.devices}
    </svg>
  );
}
Icon.propTypes = { name: PropTypes.string.isRequired };
