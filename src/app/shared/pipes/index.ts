// src/app/shared/pipes/index.ts (barrel export)

export * from './math.pipe';
export * from './format.pipe';
export * from './safe.pipe';

// Exemple d'utilisation dans un template :

/*
<!-- Avec le pipe math -->
<div>{{ machine().utilization_rate | math:'round' }}%</div>
<div>{{ score | math:'max':100 }}</div>

<!-- Avec le pipe format -->
<div>{{ revenue | format:'currency' }}</div>
<div>{{ fileSize | format:'fileSize' }}</div>
<div>{{ percentage | format:'percentage':2 }}</div>
<div>{{ bigNumber | format:'shortNumber' }}</div>

<!-- Avec le pipe safe -->
<div [innerHTML]="htmlContent | safe:'html'"></div>
*/