import { motion, useScroll, useTransform, useAnimation } from 'framer-motion'
import { ArrowRight, Trophy } from 'lucide-react'
import { t, Language } from '../../i18n/translations'

interface HeroSectionProps {
  language: Language
  onGetStartedClick?: () => void
}

export default function HeroSection({ language, onGetStartedClick }: HeroSectionProps) {
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8])
  const handControls = useAnimation()

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
  }
  const staggerContainer = { animate: { transition: { staggerChildren: 0.1 } } }

  return (
    <section className='relative pt-32 pb-20 px-4'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid lg:grid-cols-2 gap-12 items-center'>
          {/* Left Content */}
          <motion.div className='space-y-8 relative z-10' style={{ opacity, scale }} initial='initial' animate='animate' variants={staggerContainer}>

            <h1 className='text-5xl lg:text-7xl font-bold leading-tight' style={{ color: 'var(--brand-light-gray)' }}>
              {t('heroTitle1', language)}
              <br />
              <span style={{ color: 'var(--brand-yellow)' }}>{t('heroTitle2', language)}</span>
            </h1>

            <motion.p className='text-xl leading-relaxed' style={{ color: 'var(--text-secondary)' }} variants={fadeInUp}>
              {t('heroDescription', language)}
            </motion.p>

            <motion.div className='flex flex-wrap gap-4 pt-4' variants={fadeInUp}>
              <motion.button 
                onClick={onGetStartedClick}
                className='flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg' 
                style={{ background: 'var(--brand-yellow)', color: 'var(--brand-black)' }} 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                {t('getStartedNow', language)}
                <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ArrowRight className='w-5 h-5' />
                </motion.div>
              </motion.button>
              
              <motion.a 
                href='/competition' 
                className='flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg' 
                style={{ background: 'transparent', color: 'var(--brand-light-gray)', border: '2px solid var(--brand-yellow)' }} 
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(240, 185, 11, 0.1)' }} 
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className='w-5 h-5' />
                {t('exploreCompetition', language)}
              </motion.a>
            </motion.div>
          </motion.div>

          {/* Right Visual - Interactive Robot */}
          <div 
            className='relative w-full cursor-pointer'
            onMouseEnter={() => {
              handControls.start({
                y: [-8, 8, -8],
                rotate: [-3, 3, -3],
                x: [-2, 2, -2],
                transition: {
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.5, 1]
                }
              })
            }}
            onMouseLeave={() => {
              handControls.start({
                y: 0,
                rotate: 0,
                x: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut"
                }
              })
            }}
          >
            {/* Background Layer */}
            <motion.img 
              src='/images/hand-bg.png' 
              alt='Agent Trade Platform Background' 
              className='w-full opacity-90'
              style={{ opacity, scale }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            
            {/* Hand Layer - Animated */}
            <motion.img 
              src='/images/hand.png' 
              alt='Robot Hand' 
              className='absolute top-0 left-0 w-full'
              style={{ opacity }}
              animate={handControls}
              initial={{ y: 0, rotate: 0, x: 0 }}
              whileHover={{
                scale: 1.05,
                transition: { type: 'spring', stiffness: 400 }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

