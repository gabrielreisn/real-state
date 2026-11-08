/** The navy-and-gold mark used for icons, drawn for next/og (flexbox-only layout). */
export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f1a3a',
        color: '#e0ac69',
        fontSize: size * 0.42,
        fontWeight: 700,
        letterSpacing: -size * 0.01,
      }}
    >
      AN
    </div>
  );
}
