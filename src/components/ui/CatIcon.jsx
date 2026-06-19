// Shared line-art category icons — used by both the avatar customizer tabs and
// the shop section headers, so the two surfaces always show identical icons.
//
//   id        — slot/category: skin | outfit | hat | glasses | accessory |
//               hands | legs | frame | backItem | effect
//   color     — explicit stroke colour (applied via inline style so it renders
//               regardless of theme/context); falls back to currentColor.
//   className — sizing (default w-8 h-8).
export default function CatIcon({ id, color, className = 'w-8 h-8' }) {
  const common = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', className,
    style: color ? { color } : undefined,
  }
  switch (id) {
    case 'skin': // BODY — monkey head
      return (
        <svg {...common}>
          <circle cx="4.7" cy="12.5" r="1.85" />
          <circle cx="19.3" cy="12.5" r="1.85" />
          <path d="M6.1 10.3C5.6 6.2 9 4.3 12 4.3s6.4 1.9 5.9 6c.5 4.3-2.1 7.4-5.9 7.4S5.6 14.6 6.1 10.3Z" />
          <path d="M9.5 4.6c.5-1.2 1.3-1.3 1.8-.4.6-1 1.5-.9 1.9.2" />
          <circle cx="9.9" cy="10" r="0.78" fill="currentColor" stroke="none" />
          <circle cx="14.1" cy="10" r="0.78" fill="currentColor" stroke="none" />
          <ellipse cx="12" cy="13.4" rx="3" ry="2.5" />
          <path d="M11.2 12.2c.5-.5 1.1-.5 1.6 0" />
          <path d="M10.6 14c.9.8 1.9.8 2.8 0" />
        </svg>
      )
    case 'outfit': // OUTFITS — t-shirt
      return (
        <svg {...common}>
          <path d="M9 4 5.6 6 4 9.6l2.6 1V19.4c0 .5.4.9.9.9h9c.5 0 .9-.4.9-.9V10.6l2.6-1L18.4 6 15 4c0 1.9-6 1.9-6 0Z" />
        </svg>
      )
    case 'hat': // HEADWEAR — crown
      return (
        <svg {...common}>
          <circle cx="12" cy="4.5" r="1.3" />
          <circle cx="4.7" cy="7.4" r="1.2" />
          <circle cx="19.3" cy="7.4" r="1.2" />
          <path d="M4.9 8.4 7.2 13.6 12 6.2 16.8 13.6l2.3-5.2" />
          <rect x="5.5" y="13.6" width="13" height="3.4" rx="1.1" />
        </svg>
      )
    case 'glasses': // FACE — round glasses
      return (
        <svg {...common}>
          <circle cx="7" cy="13" r="3.4" />
          <circle cx="17" cy="13" r="3.4" />
          <path d="M10.4 12.6h3.2" />
          <path d="M3.6 12 2 11" />
          <path d="M20.4 12 22 11" />
        </svg>
      )
    case 'accessory': // ACCESSORIES — cowl scarf
      return (
        <svg {...common}>
          <ellipse cx="12" cy="7" rx="5.8" ry="3" />
          <ellipse cx="12" cy="7" rx="2.4" ry="1.1" />
          <path d="M7.9 9.6 7.4 16.2c0 .35.25.6.6.6h7c.35 0 .6-.25.6-.6l-.5-6.6" />
          <path d="M8 16.9v1.7M9.4 17v1.7M10.8 17v1.7M12.2 17v1.7M13.6 16.9v1.7" />
        </svg>
      )
    case 'hands': // HANDS — mitten / hand
      return (
        <svg {...common}>
          <path d="M9 11V5.4a1.4 1.4 0 0 1 2.8 0V10" />
          <path d="M11.8 9.6V4.6a1.4 1.4 0 0 1 2.8 0V10" />
          <path d="M14.6 10V6.2a1.4 1.4 0 0 1 2.8 0V13c0 3.4-1.8 6-5.2 6s-4-1.4-5.4-3.4l-2-2.8a1.5 1.5 0 0 1 2.3-1.9L9 12" />
        </svg>
      )
    case 'legs': // LEGS — sneaker
      return (
        <svg {...common}>
          <path d="M3.5 16.8 4 8.2a1 1 0 0 1 1.8-.5l2.4 3.4c.6.8 1.5 1.3 2.5 1.5l6.6 1.2c1.3.2 2.7 1.1 2.7 2.7v.3a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1Z" />
          <path d="M7.5 15v2M10.5 15.5v2M13.5 16v1.8M16.5 16.4v1.4" />
        </svg>
      )
    case 'frame': // AVATAR FRAMES — ring + sparkle
      return (
        <svg {...common}>
          <rect x="4.5" y="4.5" width="15" height="15" rx="4.5" />
          <rect x="7.5" y="7.5" width="9" height="9" rx="2.5" />
          <path d="M18.5 3.2c0 1.4.5 1.9 1.9 1.9-1.4 0-1.9.5-1.9 1.9 0-1.4-.5-1.9-1.9-1.9 1.4 0 1.9-.5 1.9-1.9Z" />
        </svg>
      )
    case 'backItem': // BACK ITEMS — backpack
      return (
        <svg {...common}>
          <rect x="6" y="7.2" width="12" height="12.6" rx="3.2" />
          <path d="M9 7.2V5.7a3 3 0 0 1 6 0v1.5" />
          <rect x="9.2" y="11.4" width="5.6" height="5.4" rx="1.5" />
          <path d="M12 11.4v-2" />
          <path d="M6 11.2c-1.1.3-1.6 1.1-1.6 2.2v2M18 11.2c1.1.3 1.6 1.1 1.6 2.2v2" />
        </svg>
      )
    case 'effect': // EFFECTS — sparkles
      return (
        <svg {...common}>
          <path d="M10 4.5c0 4.2 1.3 5.5 5.5 5.5-4.2 0-5.5 1.3-5.5 5.5 0-4.2-1.3-5.5-5.5-5.5 4.2 0 5.5-1.3 5.5-5.5Z" />
          <path d="M17.8 14c0 2.2.7 2.9 2.9 2.9-2.2 0-2.9.7-2.9 2.9 0-2.2-.7-2.9-2.9-2.9 2.2 0 2.9-.7 2.9-2.9Z" />
        </svg>
      )
    default:
      return <svg {...common}><circle cx="12" cy="12" r="8" /></svg>
  }
}
