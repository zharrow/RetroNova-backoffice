import { Directive, ElementRef, input, effect, inject } from '@angular/core';

@Directive({
  selector: '[appArcadeGlow]',
  standalone: true
})
export class ArcadeGlowDirective {
  private readonly el = inject(ElementRef);
  
  // Nouveaux inputs signals
  readonly color = input<string>('blue');
  readonly intensity = input<number>(1);
  readonly animated = input<boolean>(true);
  
  constructor() {
    // Effect pour réagir aux changements
    effect(() => {
      this.applyGlow();
    });
  }
  
  private applyGlow(): void {
    const element = this.el.nativeElement;
    const glowColor = this.getGlowColor();
    
    element.style.boxShadow = `
      0 0 ${10 * this.intensity()}px ${glowColor},
      0 0 ${20 * this.intensity()}px ${glowColor},
      inset 0 0 ${10 * this.intensity()}px ${glowColor}33
    `;
    
    if (this.animated()) {
      element.classList.add('arcade-glow-animated');
    }
  }
  
  private getGlowColor(): string {
    const colorMap: Record<string, string> = {
      blue: 'var(--neon-blue)',
      purple: 'var(--neon-purple)',
      pink: 'var(--neon-pink)',
      green: 'var(--neon-green)'
    };
    
    return colorMap[this.color()] || this.color();
  }
}