'use client'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'

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

type ScrollContainer = HTMLElement | Window

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

export function GsapMotionProvider({ children }: { children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useGSAP(
    (context, contextSafe) => {
      const root = rootRef.current
      if (!root || !contextSafe) return

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const ownedTriggers: ScrollTrigger[] = []
      let observerFrame = 0
      const pendingDynamicNodes = new Set<HTMLElement>()

      const revealBatch = (elements: Element[]) => {
        if (reducedMotion) {
          gsap.set(elements, {
            x: 0,
            y: 0,
            scale: 1,
            clearProps: 'transform,willChange',
          })
          return
        }

        gsap.to(elements, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.68,
          delay: Number((elements[0] as HTMLElement | undefined)?.dataset.gsapDelay || 0),
          stagger: { each: 0.06, from: 'start' },
          ease: 'power3.out',
          overwrite: 'auto',
          clearProps: 'transform,willChange',
        })
      }

      const bindRevealTargets = (targets: HTMLElement[]) => {
        const elements = uniqueElements(
          targets.filter(
            (element) =>
              !element.dataset.gsapBound &&
              !isIgnored(element) &&
              !element.closest(`${MODAL_SELECTOR}, ${OVERLAY_SELECTOR}, .animate-in`)
          )
        )

        if (!elements.length) return

        // Never hide clinical content while waiting for ScrollTrigger. If a
        // nested scroller is recalculated late, the data remains readable and
        // only the transform animation is deferred.
        elements.forEach((element) => {
          element.dataset.gsapBound = 'true'

          if (reducedMotion) {
            gsap.set(element, {
              x: 0,
              y: 0,
              scale: 1,
              clearProps: 'transform,willChange',
            })
          } else {
            gsap.set(element, {
              y: 18,
              scale: 0.985,
              willChange: 'transform,opacity',
            })
          }
        })

        if (reducedMotion) return

        const groups = new Map<ScrollContainer, HTMLElement[]>()
        elements.forEach((element) => {
          const scroller = getScrollContainer(element, root)
          const group = groups.get(scroller) || []
          group.push(element)
          groups.set(scroller, group)
        })

        groups.forEach((group, scroller) => {
          const triggers = ScrollTrigger.batch(group, {
            interval: 0.07,
            batchMax: 10,
            once: true,
            scroller: scroller === window ? undefined : scroller,
            start: 'top 88%',
            onEnter: (batch) => revealBatch(batch),
          })

          ownedTriggers.push(...triggers)
        })
      }

      const animateCards = (targets: HTMLElement[]) => {
        const cards = uniqueElements(
          targets.filter((element) => !element.dataset.gsapCardBound && !isIgnored(element))
        )

        if (!cards.length) return

        cards.forEach((card) => {
          card.dataset.gsapCardBound = 'true'
        })

        if (reducedMotion) {
          gsap.set(cards, {
            x: 0,
            y: 0,
            scale: 1,
            clearProps: 'transform,willChange',
          })
          return
        }

        gsap.fromTo(
          cards,
          { y: 16, scale: 0.985 },
          {
            y: 0,
            scale: 1,
            duration: 0.68,
            ease: 'power3.out',
            stagger: { each: 0.055, from: 'start' },
            clearProps: 'transform,willChange',
          }
        )
      }

      const animatePage = () => {
        const pageTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-page]'))
        const cardTargets = Array.from(root.querySelectorAll<HTMLElement>(CARD_SELECTOR))
        const sidebarTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-sidebar]'))
          .filter((element) => !element.dataset.gsapMounted)
        const headerTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-header]'))
          .filter((element) => !element.dataset.gsapMounted)
        const bannerTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-banner]'))
          .filter((element) => !element.dataset.gsapMounted)
        const routeTitleTargets = Array.from(root.querySelectorAll<HTMLElement>('[data-gsap-route-title]'))
        const activeNavTargets = Array.from(
          root.querySelectorAll<HTMLElement>('[data-gsap-nav-item][aria-current="page"]')
        )

        ;[...sidebarTargets, ...headerTargets, ...bannerTargets].forEach((element) => {
          element.dataset.gsapMounted = 'true'
        })

        const revealTargets = Array.from(root.querySelectorAll<HTMLElement>(AUTO_REVEAL_SELECTOR))
        bindRevealTargets(revealTargets)
        animateCards(cardTargets)

        if (reducedMotion) {
          gsap.set(
            [
              ...pageTargets,
              ...sidebarTargets,
              ...headerTargets,
              ...bannerTargets,
              ...routeTitleTargets,
              ...activeNavTargets,
            ],
            {
              x: 0,
              y: 0,
              scale: 1,
              clearProps: 'transform,willChange',
            }
          )
          return
        }

        if (pageTargets.length) {
          gsap.fromTo(
            pageTargets,
            { autoAlpha: 0, y: 18 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.64,
              ease: 'power2.out',
              stagger: 0.025,
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

        animateCards(cards)

        if (reducedMotion) {
          gsap.set([...overlays, ...modals], {
            x: 0,
            y: 0,
            scale: 1,
            clearProps: 'transform,willChange',
          })
        } else {
          overlays
            .filter((element) => !element.dataset.gsapOverlayBound)
            .forEach((element) => {
              element.dataset.gsapOverlayBound = 'true'
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
            .filter((element) => !element.dataset.gsapModalBound)
            .forEach((element) => {
              element.dataset.gsapModalBound = 'true'
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

        bindRevealTargets(revealTargets)

        if (!reducedMotion) {
          requestAnimationFrame(() => ScrollTrigger.refresh())
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
        if (reducedMotion || element.dataset.gsapHoverActive) return

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

      const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh())

      return () => {
        observer.disconnect()
        document.removeEventListener('pointerover', handlePointerOver)
        document.removeEventListener('pointerout', handlePointerOut)
        if (observerFrame) cancelAnimationFrame(observerFrame)
        cancelAnimationFrame(refreshFrame)
        ownedTriggers.forEach((trigger) => trigger.kill())
      }
    },
    { scope: rootRef, dependencies: [pathname], revertOnUpdate: true }
  )

  return (
    <div ref={rootRef} data-gsap-root className="min-h-full">
      {children}
    </div>
  )
}
