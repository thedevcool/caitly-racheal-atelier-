import type { RoomWithContent } from "@/lib/content";
import { ScreeningRoom } from "./ScreeningRoom";
import { Shopfront } from "./Shopfront";
import { Studio } from "./Studio";
import { Library } from "./Library";

/** Picks each room's installation by slug; rooms alternate sides by position. */
export function RoomSection({ room, index }: { room: RoomWithContent; index: number }) {
  const flip = index % 2 === 1;
  switch (room.slug) {
    case "screening":
      return <ScreeningRoom room={room} flip={flip} />;
    case "shopfront":
      return <Shopfront room={room} flip={flip} />;
    case "studio":
      return <Studio room={room} flip={flip} />;
    case "library":
      return <Library room={room} />;
    default:
      return null;
  }
}
