import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import logoImg from '@site/static/img/ogrre-logo.png';


import styles from "./index.module.css";

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const siteCaption = siteConfig?.customFields?.siteCaption as string | undefined;
  return (
    <header className={clsx("hero hero--primary", styles.heroBanner)}>
      <div className="container">

        <div className={styles.heroTitleContainer}>
          <img src={logoImg} className={styles.heroLogo} alt="Ogrre logo" />
          <Heading as="h1" className={clsx(styles.kumbhSansTitle, styles.heroTitle)}>
            {siteConfig.title}
          </Heading>

        </div>
         <p className={clsx('hero__subtitle',styles.kumbhSansTitle)}>{siteConfig.tagline}</p>
          {siteCaption && (
            <p className={styles.siteCaption}>{siteCaption}</p>
          )}
        
       {/*
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Docusaurus Tutorial - 5min ⏱️
          </Link>
        </div>
        */}
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <div className={styles.buttons} style={{marginBottom: 8}}>
          <Link className="button button--primary button--lg"
            to="/docs/about">Documentation</Link>
        </div>
      </main>
    </Layout>
  );
}
