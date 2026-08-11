import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import HUD from './HUD'
import TabBar from './TabBar'
import Backdrop from '@/components/ui/Backdrop'
import DailyReward from '@/components/ui/DailyReward'
import { EASE } from '@/lib/design'

/** HUD on top, tabs at the bottom, one page in between. That's the whole app. */
export default function AppLayout() {
  const location = useLocation()
  const roomKey = location.pathname.split('/').slice(0, 2).join('/')

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Backdrop />
      <HUD />
      <DailyReward />

      <main className="relative h-full" style={{ zIndex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={roomKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: EASE }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar />
    </div>
  )
}
