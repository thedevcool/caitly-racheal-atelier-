/** Korean room name in Nanum Myeongjo beside the English name (brief 4: keep it). */
export function RoomTag({ korean, name }: { korean: string; name: string }) {
  return (
    <div className="roomtag">
      <span className="ko" lang="ko">
        {korean}
      </span>
      <span className="en">{name}</span>
    </div>
  );
}

export function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <ul className="chips">
      {items.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}
