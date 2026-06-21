export default function RatingRow({ rating = 5 }) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <span className="rating-icons" aria-label={`${value} sao`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < value ? "filled" : ""}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12 3.8 2.2 4.45 4.9.72-3.55 3.46.84 4.88L12 15l-4.39 2.31.84-4.88L4.9 8.97l4.9-.72L12 3.8Z" />
          </svg>
        </span>
      ))}
    </span>
  );
}
