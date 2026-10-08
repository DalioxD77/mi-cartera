"use client";

import styles from "./WelcomeScreen.module.css";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.title}>Tu cartera. Simple desde el primer toque.</h1>
        <p className={styles.subtitle}>
          Inicia sesión y administra tus activos y alertas en segundos.
        </p>
        <div className={styles.fxLayer}>
          <button className={styles.button} onClick={onStart} type="button">
            <span className={styles.buttonText}>Comenzar</span>
            <span className={styles.buttonIcon} aria-hidden="true">
              <svg className={styles.svg} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                <path d="M779.180132 473.232045 322.354755 16.406668c-21.413706-21.413706-56.121182-21.413706-77.534887 0-21.413706 21.413706-21.413706 56.122205 0 77.534887l418.057421 418.057421L244.819868 930.057421c-21.413706 21.413706-21.413706 56.122205 0 77.534887 10.706853 10.706853 24.759917 16.059767 38.767955 16.059767s28.061103-5.353938 38.767955-16.059767L779.180132 550.767955C800.593837 529.35425 800.593837 494.64575 779.180132 473.232045z" />
              </svg>
            </span>
            <span className={styles.circleOverlay} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
