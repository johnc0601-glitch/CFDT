import Image from 'next/image'
import styles from './HiltonBluffsHero.module.css'

const stats = [
  {
    value: '1,800',
    label: 'Approved homes',
    icon: 'home',
  },
  {
    value: '581.20',
    label: 'Buildable acres',
    icon: 'leaf',
    featured: true,
  },
  {
    value: '1,809.78',
    label: 'Total property acres',
    icon: 'pin',
  },
  {
    value: '6',
    label: 'Development phases',
    icon: 'chart',
  },
]

function Icon({name}: {name: string}) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 11.2 12 4l9 7.2v8.3a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5v-8.3Z" />
      </svg>
    )
  }

  if (name === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.5 3.5C12.4 3.6 7.6 6.1 5.2 10c-2 3.2-1.5 7.2-1.5 7.2s4 .6 7.2-1.4c3.9-2.4 6.4-7.2 6.5-14.3l2.1 2Z" />
        <path d="M5 19c2.9-4.4 6.5-7.8 11-10.3" />
      </svg>
    )
  }

  if (name === 'pin') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V9m5 10V5m5 14v-7m4 7V3" />
    </svg>
  )
}

export function HiltonBluffsHero() {
  return (
    <section className={styles.hero} aria-labelledby="hilton-bluffs-title">
      <div className={styles.summary}>
        <div className={styles.eyebrow}>Major subdivision</div>
        <h1 id="hilton-bluffs-title">Hilton Bluffs</h1>
        <p className={styles.location}>Castle Hayne, New Hanover County</p>

        <div className={styles.rule} />

        <div className={styles.stats}>
          {stats.map((stat) => (
            <div
              className={`${styles.stat} ${stat.featured ? styles.featured : ''}`}
              key={stat.label}
            >
              <span className={styles.icon}>
                <Icon name={stat.icon} />
              </span>
              <span className={styles.statText}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.status}>
          <span className={styles.statusDot} />
          Conditional preliminary approval
        </div>
      </div>

      <div className={styles.plan}>
        <div className={styles.planHeader}>
          <div>
            <span>Preliminary plan</span>
            <strong>How the community is planned</strong>
          </div>
          <a
            href="/projects/hilton-bluffs#documents"
            className={styles.planLink}
          >
            View source documents
          </a>
        </div>

        <div className={styles.imageFrame}>
          <Image
            src="/projects/hilton-bluffs/hilton-bluffs-plan-hero.png"
            alt="Hilton Bluffs preliminary subdivision plan showing the proposed neighborhood layout"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 68vw"
            className={styles.image}
          />
        </div>

        <div className={styles.planFooter}>
          <span>Sheet C-2.0</span>
          <span>Paramounte Engineering</span>
          <span>February 23, 2026</span>
        </div>
      </div>
    </section>
  )
}
