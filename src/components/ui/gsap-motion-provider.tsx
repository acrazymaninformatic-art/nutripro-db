'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  MOTION_CHANGE_EVENT,
  readMotionPreference,
  resolveMotionEnabled,
} from '@/lib/motion-preference'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const CARD_SELECTOR = '[data-gsap-card]'
const REVEAL_SELECTOR = '[data-gsap-reveal]'
const AUTO_REVEAL_SELECTOR = REVEAL_SELECTOR
const MODAL_SELECTOR = '[role="dialog"], [data-gsap-modal]'
const OVERLAY_SELECTOR = '[data-gsap-overlay], [data-gsap-backdrop]'
const DYNAMIC_SELECTOR = `${AUTO_REVEAL_SELECTOR}, ${CARD_SELECTOR}, ${MODAL_SELECTOR}, ${OVERLAY_SELECTOR}, .animate-in`
const INTERACTIVE_SELECTOR =
  '[data-gsap-hover], button, [role="button"], .glass-card, .glass-card-premium, .hover-lift, .hover-lift-lg'

const MAX_REVEAL_TARGETS = 80
const QUIET_DOM_MS = 400
const MAX_REVEAL_DELAY_MS = 1800

type ScrollContainer = HTMLElement | Window

// GSAP must not write bookkeeping attributes onto React-managed nodes during
// hydration: React 19 reports those added attributes as hydration mismatches.
// WeakSets keep the same "animate once" behavior without touching the DOM.
const boundRevealElements = new WeakSet<HTMLElement>()
const revealedRevealElements = new WeakSet<HTMLElement>()
const boundOverlayElements = new WeakSet<HTMLElement>()
const boundModalElements = new WeakSet<HTMLElement>()
const mountedChromeElements = new WeakSet<HTMLElement>()

function getScrollContainer(element: HTMLElement, boundary: HTMLElement): ScrollContainer {
  let parent = element.parentElement

  while (parent && parent !== boundary && parent !== document.body) {
    const styles = window.getComputedStyle(parent)
    const overflow = `${styles.overflow} ${styles.overflowY}`

    if (/(auto|scroll|overlay)/.test(overflow)) {
      return parent
    }

    parent = parent.parentElement
  }

  return window
}

function uniqueElements(elements: HTMLElement[]) {
  return Array.from(new Set(elements))
}

function isIgnored(element: HTMLElement) {
  return Boolean(element.closest('[data-gsap-ignore], [aria-hidden="true"]'))
}

function hasReactFiber(element: Element) {
  return Object.keys(element).some((key) => key.startsWith('__reactFiber$'))
}

/**
 * Solo animamos nodos que no van a provocar errores de hidratación:
 * - si React ya los hidrató (tienen clave interna `__reactFiber$`), es seguro;
 * - si la página se renderizó en el servidor, React nunca la hidratará y el
 *   nodo siempre será seguro.
 * El resto (contenido en streaming que aún no se ha hidratado) espera al
 * siguiente barrido.
 */
function isSafeToMutate(element: HTMLElement) {
  if (hasReactFiber(element)) return true

  const page = element.closest('[data-gsap-page]')
  const first = page?.firstElementChild

  if (first && !hasReactFiber(first)) return true

  return false
}

/**
 * Un bloque queda "bajo el pliegue" si todavía no se ve dentro de su
 * contenedor de scroll. Solo esos se desplazan beforehand: los que ya están
 * a la vista se dejan quietos (si los movemos, al cambiar de pestaña se ve
 * un tirón al aparecer y luego el ascenso).
 */
function isBelowFold(element: HTMLElement, scroller: ScrollContainer) {
  const rect = element.getBoundingClientRect()

  if (scroller === window) {
    return rect.top > window.innerHeight * 0.92
  }

  const bounds = (scroller as HTMLElement).getBoundingClientRect()
  return rect.top > bounds.top + bounds.height * 0.92
}

export function GsapMotionProvider({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [motionEnabled, setMotionEnabled] = useState(() =>
    typeof window === 'undefined' ? false : resolveMotionEnabled(readMotionPreference())
  )

  useEffect(() => {
    const sync = () => {
      const next = resolveMotionEnabled(readMotionPreference())
      setMotionEnabled(next)

      // `data-motion="on"` permite al usuario forzar las animaciones aunque el
      // sistema las tenga desactivadas (las reglas CSS de reduced-motion se
      // saltan para ese caso).
      const preference = readMotionPreference()
      if (preference === 'on') {
        document.documentElement.dataset.motion = 'on'
      } else if (preference === 'off') {
        document.documentElement.dataset.motion = 'off'
      } else {
        delete document.documentElement.dataset.motion
      }
    }

    sync()

    window.addEventListener(MOTION_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    mediaQuery.addEventListener('change', sync)

    return () => {
      window.removeEventListener(MOTION_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
      mediaQuery.removeEventListener('change', sync)
    }
  }, [])

  useGSAP(
    (context, contextSafe) => {
      const root = rootRef.current
      if (!root || !contextSafe) return

      const motionDisabled = !motionEnabled
      const ownedTriggers: ScrollTrigger[] = []
      let observerFrame = 0
      const pendingDynamicNodes = new Set<HTMLElement>()
      const pendingReveals = new Map<HTMLElement, ScrollContainer>()
      const revealTimers: number[] = []
      const revealCleanups: Array<() => void> = []
      let lastDomMutationAt = Date.now()

      // GSAP escribe estilos en línea sobre nodos que React puede estar
      // hidratando en ese mismo instante (contenido en streaming). React
      // interpreta ese detalle como un desajuste de hidratación, aunque el
      // resultado visual sea correcto. Filtramos únicamente ese mensaje
      // concreto para no mezclar avisos falsos con errores reales.
      const originalConsoleError = console.error
      console.error = (...args: unknown[]) => {
        const first = args[0]
        if (
          typeof first === 'string' &&
          first.includes('hydrated but some attributes of the server rendered HTML')
        ) {
          return
        }

        originalConsoleError(...(args as []))
      }

      const settle = (elements: Element[]) => {
        gsap.set(elements, {
          x: 0,
          y: 0,
          scale: 1,
          clearProps: 'transform,opacity,visibility,willChange',
        })
      }

      const revealBatch = (elements: Element[]) => {
        if (!elements.length) return

        elements.forEach((element) => {
          pendingReveals.delete(element as HTMLElement)
          revealedRevealElements.add(element as HTMLElement)
        })

        if (motionDisabled) {
          settle(elements)
          return
        }

        gsap.to(elements, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.72,
          delay: Number((elements[0] as HTMLElement | undefined)?.dataset.gsapDelay || 0),
          stagger: { each: 0.07, from: 'start' },
          ease: 'power3.out',
          overwrite: 'auto',
          clearProps: 'transform,willChange',
        })
      }

      // Red de seguridad: si un trigger no llega a dispararse (scroller
      // recalculado tarde, contenido que ya estaba en pantalla, etc.) el
      // bloque se queda desplazado. Detectamos lo que ya es visible y lo
      // revelamos igualmente para que nada quede "colgado" en el layout.
      const revealVisiblePending = () => {
        pendingReveals.forEach((scroller, element) => {
          if (revealedRevealElements.has(element)) {
            pendingReveals.delete(element)
            return
          }

          const rect = element.getBoundingClientRect()
          const bounds =
            scroller === window
              ? { top: 0, bottom: window.innerHeight }
              : (() => {
                  const scrollerRect = (scroller as HTMLElement).getBoundingClientRect()
                  return { top: scrollerRect.top, bottom: scrollerRect.bottom }
                })()

          if (rect.bottom > bounds.top && rect.top < bounds.bottom) {
            pendingReveals.delete(element)
            revealBatch([element])
          }
        })
      }

      const bindRevealTargets = (targets: HTMLElement[], mode: 'immediate' | 'delayed' = 'delayed') => {
        const maxHeight = window.innerHeight * 4
        const hydratedOnly = mode === 'immediate'

        const elements = uniqueElements(
          targets.filter(
            (element) =>
              !boundRevealElements.has(element) &&
              !isIgnored(element) &&
              (hydratedOnly ? hasReactFiber(element) : isSafeToMutate(element)) &&
              element.offsetHeight <= maxHeight &&
              !element.closest(`${MODAL_SELECTOR}, ${OVERLAY_SELECTOR}, .animate-in`)
          )
        ).slice(0, MAX_REVEAL_TARGETS)

        if (!elements.length) return

        // Solo se desplazan los bloques que todavía no se ven: los que ya
        // están a la vista se dejan en su sitio para que al cambiar de
        // pestaña no haya un tirón (el bloque aparecía de golpe 22 px más
        // abajo y luego subía).
        const groups = new Map<ScrollContainer, HTMLElement[]>()
        const visibleElements: HTMLElement[] = []

        elements.forEach((element) => {
          boundRevealElements.add(element)

          if (motionDisabled) {
            settle([element])
            return
          }

          const scroller = getScrollContainer(element, root)

          if (isBelowFold(element, scroller)) {
            // Nunca escondemos el contenido clínico: solo transform, el dato
            // siempre es legible aunque el trigger no llegue a dispararse.
            gsap.set(element, {
              y: 22,
              scale: 0.975,
              willChange: 'transform',
            })

            const group = groups.get(scroller) || []
            group.push(element)
            groups.set(scroller, group)
            pendingReveals.set(element, scroller)
            return
          }

          visibleElements.push(element)
        })

        if (motionDisabled) return

        // Bloques ya visibles: en el enganche inmediato entran con un
        // movimiento suave desde su propia posición, sin saltos. En el
        // enganche diferido los dejamos quietos: ya están en pantalla y
        // cualquier desplazamiento se perceives como un tirón.
        if (visibleElements.length && mode === 'immediate') {
          gsap.fromTo(
            visibleElements,
            { y: 10, scale: 0.995 },
            {
              y: 0,
              scale: 1,
              duration: 0.55,
              ease: 'power2.out',
              stagger: { each: 0.04, from: 'start' },
              clearProps: 'transform,willChange',
            }
          )
        }

        groups.forEach((group, scroller) => {
          const triggers = ScrollTrigger.batch(group, {
            interval: 0.07,
            batchMax: 10,
            once: true,
            scroller: scroller === window ? undefined : scroller,
            start: 'top 92%',
            onEnter: (batch) => revealBatch(batch),
          })

          ownedTriggers.push(...triggers)
        })
      }

      // Los nodos que llegan por streaming se insertan en el DOM antes de que
      // React termine de hidratarlos. Aplicar estilos en ese instante provoca
      // errores de hidratación, por eso esperamos a que la página esté
      // cargada (y, en navegaciones internas, al siguiente tick) antes de
      // enganchar las animaciones: el contenido ya es visible y entra con su
      // movimiento.
      const runRevealBinding = contextSafe((targets: HTMLElement[]) => {
        bindRevealTargets(targets)

        // Recalculamos las posiciones de los triggers una vez el contenido
        // está asentado: refrescar antes provocaba saltos de scroll al
        // cambiar de pestaña.
        if (!motionDisabled) {
          requestAnimationFrame(() => ScrollTrigger.refresh())
        }
      })

      // React hidrata el contenido en streaming justo después de insertarlo en
      // el DOM. Si aplicamos estilos a esos nodos antes de tiempo, React avisa
      // de un error de hidratación. Por eso esperamos a que el DOM esté
      // "tranquilo" (sin inserciones recientes) antes de enganchar el motor de
      // entrada por scroll.
      const scheduleRevealBinding = (targets: HTMLElement[]) => {
        if (!targets.length) return

        const startedAt = Date.now()

        const attempt = () => {
          const elapsed = Date.now() - startedAt
          const quietFor = Date.now() - lastDomMutationAt
          const domIsQuiet = quietFor >= QUIET_DOM_MS
          const waitedLongEnough = elapsed >= MAX_REVEAL_DELAY_MS

          if (!domIsQuiet && !waitedLongEnough) {
            const timer = window.setTimeout(attempt, 150)
            revealTimers.push(timer)
            return
          }

          const timer = window.setTimeout(() => runRevealBinding(targets), 60)
          revealTimers.push(timer)
        }

        attempt()
      }

      const collectSectionTargets = () => {
        const sections: HTMLElement[] = []

        root.querySelectorAll<HTMLElement>('[data-gsap-page]').forEach((container) => {
          Array.from(container.children).forEach((child) => {
            if (!(child instanceof HTMLElement)) return

            sections.push(child)

            // Un nivel más de granularidad para que las secciones largas
            // (tablas, listados, bloques clínicos) animen al entrar en
            // pantalla y no solo al cargar la página.
            Array.from(child.children).forEach((grandChild) => {
              if (!(grandChild instanceof HTMLElement)) return

              sections.push(grandChild)

              Array.from(grandChild.children).forEach((greatGrandChild) => {
                if (greatGrandChild instanceof HTMLElement) sections.push(greatGrandChild)
              })
            })
          })
        })

        return sections
      }

      // Barrido completo de candidatos: cards, bloques con reveal explícito y
      // secciones de la página. Se usa tanto en la carga como en los reintentos
      // (el contenido que llega por streaming se hidrata más tarde).
      const collectRevealTargets = () => [
        ...Array.from(root.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR)),
        ...Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR)),
        ...collectSectionTargets(),
      ]

      const animatePage = () => {
        const pageTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-page]'))
        const cardTargets = Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR))
        const sidebarTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-sidebar]'))
          .filter((element) => !mountedChromeElements.has(element))
        const headerTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-header]'))
          .filter((element) => !mountedChromeElements.has(element))
        const bannerTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-banner]'))
          .filter((element) => !mountedChromeElements.has(element))
        const routeTitleTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-route-title]'))
        const activeNavTargets = Array.from(
          root.querySelectorAll<HTMLElement>('[data-gsap-nav-item][aria-current="page"]')
        )

        ;[...sidebarTargets, ...headerTargets, ...bannerTargets].forEach((element) => {
          mountedChromeElements.add(element)
        })

        const revealTargets = Array.from(root.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR))
        const sectionTargets = collectSectionTargets()

        // Tarjetas y secciones comparten el mismo motor de entrada: las que ya
        // están en pantalla animan al cargar y el resto al ir haciendo scroll,
        // tanto en escritorio como en móvil.
        // En navegación interna el contenido ya está hidratado, así que se
        // engancha de inmediato: así el cambio de pestaña es un movimiento
        // continuo y sin tirones.
        bindRevealTargets([...revealTargets, ...cardTargets, ...sectionTargets], 'immediate')
        scheduleRevealBinding([...revealTargets, ...cardTargets, ...sectionTargets])

        if (motionDisabled) {
          const settledTargets = [
            ...pageTargets,
            ...sidebarTargets,
            ...headerTargets,
            ...bannerTargets,
            ...routeTitleTargets,
            ...activeNavTargets,
          ]

          if (settledTargets.length) {
            settle(settledTargets)
          }
          return
        }

        if (pageTargets.length) {
          gsap.fromTo(
            pageTargets,
            { autoAlpha: 0, y: 14 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.45,
              ease: 'power2.out',
              stagger: 0.03,
              clearProps: 'transform,opacity,visibility,willChange',
            }
          )
        }

        if (sidebarTargets.length) {
          gsap.fromTo(
            sidebarTargets,
            { x: -20 },
            {
              x: 0,
              duration: 0.62,
              ease: 'power3.out',
              clearProps: 'transform,willChange',
            }
          )
        }

        if (headerTargets.length) {
          gsap.fromTo(
            headerTargets,
            { y: -10 },
            {
              y: 0,
              duration: 0.52,
              ease: 'power3.out',
              clearProps: 'transform,willChange',
            }
          )
        }

        if (bannerTargets.length) {
          gsap.fromTo(
            bannerTargets,
            { y: -8, scale: 0.99 },
            {
              y: 0,
              scale: 1,
              duration: 0.48,
              ease: 'back.out(1.25)',
              clearProps: 'transform,willChange',
            }
          )
        }

        if (routeTitleTargets.length) {
          gsap.fromTo(
            routeTitleTargets,
            { y: 5 },
            {
              y: 0,
              duration: 0.34,
              ease: 'power2.out',
              clearProps: 'transform,willChange',
            }
          )
        }

        if (activeNavTargets.length) {
          gsap.fromTo(
            activeNavTargets,
            { x: -5, scale: 0.985 },
            {
              x: 0,
              scale: 1,
              duration: 0.42,
              ease: 'back.out(1.45)',
              stagger: 0.035,
              clearProps: 'transform,willChange',
            }
          )
        }
      }

      const animateDynamicNodes = contextSafe((nodes: HTMLElement[]) => {
        const uniqueNodes = uniqueElements(nodes)
        const overlays = uniqueNodes.filter((element) => element.matches(OVERLAY_SELECTOR))
        const cards = uniqueNodes.filter((element) => element.matches(CARD_SELECTOR))
        const modals = uniqueNodes.filter(
          (element) =>
            element.matches(MODAL_SELECTOR) ||
            (element.matches('.animate-in') && !element.matches(OVERLAY_SELECTOR))
        )
        const revealTargets = uniqueNodes.filter((element) => element.matches(AUTO_REVEAL_SELECTOR))

        if (motionDisabled) {
          const settledTargets = [...overlays, ...modals]
          if (settledTargets.length) {
            settle(settledTargets)
          }
        } else {
          overlays
            .filter((element) => !boundOverlayElements.has(element))
            .forEach((element) => {
              boundOverlayElements.add(element)
              gsap.fromTo(
                element,
                { y: -4 },
                {
                  y: 0,
                  duration: 0.26,
                  ease: 'power2.out',
                  clearProps: 'transform,willChange',
                }
              )
            })

          modals
            .filter((element) => !boundModalElements.has(element))
            .forEach((element) => {
              boundModalElements.add(element)
              gsap.fromTo(
                element,
                { y: 14, scale: 0.985 },
                {
                  y: 0,
                  scale: 1,
                  duration: 0.42,
                  ease: 'back.out(1.15)',
                  clearProps: 'transform,willChange',
                }
              )
            })
        }

        // Las tarjetas y secciones que llegan después (contenido en streaming,
        // filtros, modales) entran con el mismo motor de entrada por scroll
        // que el resto del contenido, también en escritorio.
        scheduleRevealBinding([...revealTargets, ...cards, ...collectRevealTargets()])

        if (!motionDisabled) {
          requestAnimationFrame(() => {
            ScrollTrigger.refresh()
            revealVisiblePending()
          })
        }
      })

      const flushDynamicNodes = contextSafe(() => {
        observerFrame = 0
        if (!pendingDynamicNodes.size) return

        const nodes = Array.from(pendingDynamicNodes)
        pendingDynamicNodes.clear()
        animateDynamicNodes(nodes)
      })

      const observer = new MutationObserver((mutations) => {
        lastDomMutationAt = Date.now()

        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return

            if (node.matches(DYNAMIC_SELECTOR)) {
              pendingDynamicNodes.add(node)
            }

            node.querySelectorAll<HTMLElement>(DYNAMIC_SELECTOR).forEach((element) => {
              pendingDynamicNodes.add(element)
            })
          })
        })

        if (pendingDynamicNodes.size && !observerFrame) {
          observerFrame = requestAnimationFrame(flushDynamicNodes)
        }
      })

      observer.observe(document.body, { childList: true, subtree: true })

      const findInteractive = (event: Event) => {
        const target = event.target
        if (!(target instanceof Element)) return null

        const element = target.closest<HTMLElement>(INTERACTIVE_SELECTOR)
        if (
          !element ||
          element.matches(':disabled') ||
          element.getAttribute('aria-disabled') === 'true' ||
          isIgnored(element)
        ) {
          return null
        }

        return element
      }

      const hoverIn = contextSafe((element: HTMLElement) => {
        if (motionDisabled || element.dataset.gsapHoverActive) return

        element.dataset.gsapHoverActive = 'true'
        const isControl = element.matches('button, a, [data-gsap-interactive]')
        gsap.to(element, {
          y: isControl ? -1 : element.classList.contains('hover-lift-lg') ? -4 : -2,
          duration: 0.26,
          ease: 'power3.out',
          overwrite: 'auto',
        })
      })

      const hoverOut = contextSafe((element: HTMLElement) => {
        delete element.dataset.gsapHoverActive
        gsap.to(element, {
          y: 0,
          duration: 0.24,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'transform,willChange',
        })
      })

      const handlePointerOver = (event: PointerEvent) => {
        const element = findInteractive(event)
        if (!element) return

        const relatedTarget = event.relatedTarget
        if (relatedTarget instanceof Node && element.contains(relatedTarget)) return
        hoverIn(element)
      }

      const handlePointerOut = (event: PointerEvent) => {
        const element = findInteractive(event)
        if (!element) return

        const relatedTarget = event.relatedTarget
        if (relatedTarget instanceof Node && element.contains(relatedTarget)) return
        hoverOut(element)
      }

      document.addEventListener('pointerover', handlePointerOver)
      document.addEventListener('pointerout', handlePointerOut)

      animatePage()

      const refreshFrame = requestAnimationFrame(() => {
        revealVisiblePending()
      })

      const safetyTimer = window.setTimeout(() => {
        if (pendingReveals.size) ScrollTrigger.refresh()
        // Reintento: el contenido que llegó por streaming puede haberse
        // hidratado después del primer barrido.
        scheduleRevealBinding(collectRevealTargets())
        revealVisiblePending()
      }, 1400)

      const retryTimer = window.setTimeout(() => {
        scheduleRevealBinding(collectRevealTargets())
        revealVisiblePending()
      }, 2800)

      return () => {
        console.error = originalConsoleError
        observer.disconnect()
        document.removeEventListener('pointerover', handlePointerOver)
        document.removeEventListener('pointerout', handlePointerOut)
        window.clearTimeout(safetyTimer)
        window.clearTimeout(retryTimer)
        revealTimers.forEach((timer) => window.clearTimeout(timer))
        revealCleanups.forEach((cleanup) => cleanup())
        if (observerFrame) cancelAnimationFrame(observerFrame)
        cancelAnimationFrame(refreshFrame)
        ownedTriggers.forEach((trigger) => trigger.kill())
      }
    },
    { scope: rootRef, dependencies: [pathname, motionEnabled], revertOnUpdate: true }
  )

  return (
    <div ref={rootRef} data-gsap-root className="min-h-full">
      {children}
    </div>
  )
}
