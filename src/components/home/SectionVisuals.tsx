import {
  Check,
  Command,
  FileText,
  Globe2,
  Image,
  MessageSquare,
  Mic,
  Monitor,
  Plug,
  Search,
  Sparkles,
  Workflow,
} from 'lucide-react'
import styles from '@/styles/Home.module.css'

// Decorative capability diagrams, not screenshots or interactive product controls.
export function PlatformVisual({ index }: { index: number }) {
  return (
    <div className={styles.platformVisual} aria-hidden="true">
      {index === 0 && (
        <div className={styles.connectionDiagram}>
          <div className={styles.endpointColumn}>
            <span>
              <Globe2 />
            </span>
            <span>
              <Search />
            </span>
            <span>
              <FileText />
            </span>
          </div>
          <svg viewBox="0 0 160 120" fill="none">
            <path d="M0 15H55Q70 15 70 30V90Q70 105 55 105H0M0 60H160M70 60H160" />
          </svg>
          <span className={styles.diagramCore}>
            <Plug />
          </span>
        </div>
      )}
      {index === 1 && (
        <div className={styles.pluginMosaic}>
          {[
            Search,
            Image,
            FileText,
            Mic,
            Command,
            Globe2,
            MessageSquare,
            Sparkles,
            Workflow,
          ].map((Icon, i) => (
            <span key={i}>
              <Icon />
            </span>
          ))}
        </div>
      )}
      {index === 2 && (
        <div className={styles.skillDiagram}>
          <div className={styles.skillSheet}>
            <Sparkles />
            <i />
            <i />
            <i />
            <span>
              <Check />
              <i />
            </span>
          </div>
          <span className={styles.skillShortcut}>
            <Command />
            <Sparkles />
          </span>
        </div>
      )}
      {index === 3 && (
        <div className={styles.workflowDiagram}>
          <span>
            <Command />
          </span>
          <i />
          <span className={styles.diagramCore}>
            <Workflow />
          </span>
          <i />
          <div>
            <span>
              <Check />
            </span>
            <span>
              <FileText />
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export function CompanionVisual({ kind }: { kind: 'pet' | 'channels' }) {
  return (
    <div
      className={styles.companionVisual}
      aria-hidden="true"
    >
      {kind === 'pet' ? (
        <div className={styles.desktopDiagram}>
          <div className={styles.desktopBar}>
            <i />
            <i />
            <i />
            <span />
          </div>
          <div className={styles.desktopLines}>
            <i />
            <i />
            <i />
          </div>
          <div className={styles.petTile}>
            <svg
              viewBox="0 0 64 64"
              shapeRendering="crispEdges"
              fill="currentColor"
            >
              <path d="M12 12h8v8h24v-8h8v32h-8v8H20v-8h-8z" />
              <path d="M20 28h8v8h-8zm16 0h8v8h-8z" fill="#101111" />
              <path d="M28 40h8v4h-8z" fill="#6a6b6c" />
            </svg>
            <span>
              <Check />
            </span>
          </div>
          <div className={styles.desktopDock}>
            {[Command, MessageSquare, FileText, Sparkles].map((Icon, i) => (
              <span key={i}>
                <Icon />
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.channelDiagram}>
          <div className={styles.channelMac}>
            <Monitor />
            <div>
              <i />
              <i />
            </div>
          </div>
          <div className={styles.signalBridge}>
            <i />
            <i />
            <i />
          </div>
          <div className={styles.phoneDiagram}>
            <span />
            <div>
              <MessageSquare />
              <i />
            </div>
            <div>
              <Check />
              <i />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
