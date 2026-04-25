import { ReactNode } from "react";
import styles from "./MainLayout.module.css";

export interface MainLayoutProps {
  sidebar: ReactNode;
  mainContent: ReactNode;
}

/**
 * MainLayout component - main app layout with sidebar and content
 */
export const MainLayout = ({ sidebar, mainContent }: MainLayoutProps) => {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.main}>{mainContent}</main>
    </div>
  );
};
