import {RUN_SPEED} from './달리기모션.mjs';
export const SPRINT_MULTIPLIER=1.5;
// Shift only boosts forward exploration, including diagonals. Driving and
// racing keep their own controls; no stamina, cooldown or saved resource.
export const explorationSpeed=(forward,sprint)=>RUN_SPEED*(forward>0&&sprint?SPRINT_MULTIPLIER:1);
