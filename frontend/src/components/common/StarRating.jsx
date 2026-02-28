export default function StarRating({ rating, onRate, readonly = false, size = "md" }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={"star-rating star-rating--" + size}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={"star" + (star <= Math.round(rating) ? " star--filled" : "")}
          onClick={() => !readonly && onRate && onRate(star)}
          disabled={readonly}
          style={{ cursor: readonly ? "default" : "pointer" }}
        >
          ★
        </button>
      ))}
      {rating > 0 && <span className="rating-value">{Number(rating).toFixed(1)}</span>}
    </div>
  );
}
