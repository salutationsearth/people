import type { Group } from "@/lib/types";
import styles from "./Footer.module.css";

export function Footer({ photo }: { photo?: Group["photo"] }) {
  return (
    <footer className={styles.footer}>
      <p>
        Data provided by <a href="https://joshuaproject.net">Joshua Project</a>
      </p>
      <p>
        Language classification: <a href="https://glottolog.org">Glottolog</a> (CC BY 4.0)
      </p>
      <p>
        Map: <a href="https://www.naturalearthdata.com">Natural Earth</a>
      </p>
      {photo && (
        <p>
          Photo: {photo.creditUrl ? <a href={photo.creditUrl}>{photo.credit}</a> : photo.credit}, {photo.license}
        </p>
      )}
    </footer>
  );
}
