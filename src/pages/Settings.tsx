import { PageHeader } from '../components/layout/PageHeader';
import { lore, getRandomTip } from '../lib/lore';
import styles from './Settings.module.css';

export function Settings() {
  return (
    <div>
      <PageHeader title={lore.settings.title} />
      <div className={styles.content}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lore.settings.themeTitle}</h2>
          <p className={styles.placeholder}>Theme controls coming soon.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{lore.settings.exportTitle}</h2>
          <p className={styles.placeholder}>Export & import coming in Phase 5.</p>
        </section>

        <div className={styles.tip}>
          <em>"{getRandomTip()}"</em>
        </div>

        <div className={styles.version}>
          {lore.appName} v0.1.0
        </div>
      </div>
    </div>
  );
}
