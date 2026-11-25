"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Close } from "./Icons";
import styles from "./Modal.module.css";

type Props = { title: string; subtitle?: string; variant?: "center" | "side"; onClose: () => void; children: ReactNode };

export function Modal({ title, subtitle, variant = "center", onClose, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${styles[variant]}`}
      aria-labelledby="modal-title"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className={styles.inner}>
        <header className={styles.header}>
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            <Close />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
