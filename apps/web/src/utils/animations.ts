/**
 * Advanced Animation System
 * Smooth, performant animations using CSS and JS
 */

export const easings = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

export function animateHeight(element: HTMLElement, targetHeight: number, duration = 300) {
  const startHeight = element.offsetHeight;
  const difference = targetHeight - startHeight;
  const startTime = performance.now();

  function updateHeight(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    
    element.style.height = `${startHeight + difference * ease}px`;
    
    if (progress < 1) {
      requestAnimationFrame(updateHeight);
    }
  }

  requestAnimationFrame(updateHeight);
}

export function staggerChildren(
  container: HTMLElement,
  animationClass: string,
  staggerDelay = 50
) {
  const children = Array.from(container.children) as HTMLElement[];
  
  children.forEach((child, index) => {
    setTimeout(() => {
      child.classList.add(animationClass);
    }, index * staggerDelay);
  });
}

export function createRippleEffect(event: MouseEvent, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  const ripple = document.createElement('div');
  ripple.className = 'ripple-effect';
  ripple.style.cssText = `
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    pointer-events: none;
    animation: ripple 0.6s ease-out;
  `;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(ripple);

  setTimeout(() => ripple.remove(), 600);
}

export function setupGlobalAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-fade-in {
      animation: fadeIn 0.3s ease-out;
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }

    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }
  `;
  
  document.head.appendChild(style);
}

export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const elementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, options);

    if (elementRef.current) {
      observerRef.current.observe(elementRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, options]);

  return { observer: observerRef.current, elementRef };
}

// Import React for TypeScript
import React from 'react';

