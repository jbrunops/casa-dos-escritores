"use client"
import { useMotionValue, motion, useMotionTemplate } from "framer-motion"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase-browser"

export function HeroHighlight({
  title,
  subtitle,
  buttonText,
  buttonLink
}) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [targetLink, setTargetLink] = useState("/signup")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const supabase = createBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && session.user) {
        setTargetLink("/dashboard/new")
      } else {
        setTargetLink("/signup")
      }
      setIsLoaded(true)
    }
    
    checkSession()
  }, [])

  // SVG patterns para estados diferentes
  const dotPatterns = {
    default: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23E5E7EB' id='pattern-circle' cx='10' cy='10' r='1.5'%3E%3C/circle%3E%3C/svg%3E")`,
    hover: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='16' height='16' fill='none'%3E%3Ccircle fill='%23484DB5' id='pattern-circle' cx='10' cy='10' r='1.5'%3E%3C/circle%3E%3C/svg%3E")`,
  }

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    if (!currentTarget) return
    const { left, top } = currentTarget.getBoundingClientRect()

    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className="group relative flex h-[24rem] w-full items-center justify-center bg-white"
      onMouseMove={handleMouseMove}
      style={{ marginBottom: 0, zIndex: 10 }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: dotPatterns.default,
        }}
      />
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          backgroundImage: dotPatterns.hover,
          WebkitMaskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
          maskImage: useMotionTemplate`
            radial-gradient(
              200px circle at ${mouseX}px ${mouseY}px,
              black 0%,
              transparent 100%
            )
          `,
        }}
      />

      <div className="relative z-20 max-w-[75rem] mx-auto px-4 sm:px-6 md:px-0 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          {title || (
            <>
              Compartilhe suas <Highlight>histórias</Highlight> e conecte-se com outros <Highlight>escritores</Highlight>
            </>
          )}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          {subtitle || "Uma plataforma para escritores expressarem sua criatividade, compartilharem suas obras e receberem feedback valioso da comunidade."}
        </p>
        {isLoaded && (
          <Link 
            href={buttonLink || targetLink} 
            className="h-10 px-6 inline-flex items-center justify-center bg-[#484DB5] text-white rounded-md hover:bg-opacity-90 transition-all duration-300 font-medium"
          >
            {buttonText || "Comece a escrever agora"}
          </Link>
        )}
      </div>
    </div>
  )
}

export function Highlight({ children, className }) {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 1.5,
        ease: "linear",
        delay: 0.3,
      }}
      style={{
        backgroundRepeat: "no-repeat",
        backgroundPosition: "left center",
        display: "inline",
      }}
      className={`relative inline-block bg-gradient-to-r from-[#484DB5]/30 to-[#484DB5]/10 px-1 pb-1 ${className || ""}`}
    >
      {children}
    </motion.span>
  )
} 