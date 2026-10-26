import { site } from '@/content/site';
import styles from './page.module.css';

export default function Home() {
  return (
    <main id="contenu" className={styles.main}>
      <h1 className={styles.accroche}>{site.accroche}</h1>
    </main>
  );
}
