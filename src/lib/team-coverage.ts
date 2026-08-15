import { effectiveness } from "./type-chart";
import { POKEMON_TYPE_NAMES } from "./type-colors";
import type { TypeName } from "./type-chart";

export type DefensiveCoverageRow = {
  type: TypeName;
  weak: number;
  resist: number;
  immune: number;
};

// One row per real pokemon type (attacking side): how many team members are
// weak/resist/immune to it. Sorted by `weak` descending is the useful
// default -- the team's biggest exposures float to the top.
export function defensiveCoverage(teamTypes: TypeName[][]): DefensiveCoverageRow[] {
  return POKEMON_TYPE_NAMES.map((attackType) => {
    let weak = 0;
    let resist = 0;
    let immune = 0;
    for (const memberTypes of teamTypes) {
      const multiplier = effectiveness(attackType, memberTypes);
      if (multiplier === 0) immune++;
      else if (multiplier < 1) resist++;
      else if (multiplier > 1) weak++;
    }
    return { type: attackType, weak, resist, immune };
  });
}

// Which defending types at least one team member's own types hit
// super-effectively (STAB coverage) -- the complement is the team's
// offensive gaps.
export function offensiveCoverage(teamTypes: TypeName[][]): Set<TypeName> {
  const covered = new Set<TypeName>();
  for (const defendType of POKEMON_TYPE_NAMES) {
    const hit = teamTypes.some((memberTypes) => memberTypes.some((atk) => effectiveness(atk, [defendType]) > 1));
    if (hit) covered.add(defendType);
  }
  return covered;
}
