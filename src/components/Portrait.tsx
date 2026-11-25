import type { Group } from "@/lib/types";
import styles from "./Portrait.module.css";

export function Portrait({ photo, badge }: { photo: NonNullable<Group["photo"]>; badge: string }) {
  return (
    <figure className={styles.portrait}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="Today's portrait" />
      <span className={styles.badge}>{badge}</span>
      <figcaption className={styles.credit}>
        Photo: {photo.creditUrl ? <a href={photo.creditUrl}>{photo.credit}</a> : photo.credit}, {photo.license}
      </figcaption>
    </figure>
  );
}
