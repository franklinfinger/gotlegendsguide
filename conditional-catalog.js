// Small source-transcribed effect subset; not a complete portfolio or current-game verification.
export const reviewedEffects = [
  {
    "id": "gregor-skill",
    "name": "Gregor Skill",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 1,
      "sourceId": 9,
      "exactText": "Gregor deals 300% ATK Physical Damage to all enemies and has a 50% chance to WOUND them for 3 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "skill"
    },
    "requirements": [],
    "outcomes": [
      {
        "kind": "damage",
        "target": "all_enemies",
        "amount": 300,
        "unit": "percent_atk",
        "damageType": "physical"
      },
      {
        "kind": "apply_status",
        "target": "all_enemies",
        "status": "wound",
        "chance": 0.5,
        "durationTurns": 3
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-opening",
    "name": "Gregor opening Treasury",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "champion_traits",
      "recordId": 5,
      "sourceId": 7,
      "exactText": "Starts the battle with 4 Coins in the TREASURY. When Gregor WOUNDS an enemy, he gains COUNTER for 3 turns and adds 2 Coins to the TREASURY.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "battle_start"
    },
    "requirements": [
      {
        "kind": "leader"
      }
    ],
    "outcomes": [
      {
        "kind": "resource",
        "target": "team",
        "resource": "treasury_coins",
        "amount": 4,
        "unit": "banked_coins"
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-wound-coins",
    "name": "Gregor WOUND payoff",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "champion_traits",
      "recordId": 5,
      "sourceId": 7,
      "exactText": "Starts the battle with 4 Coins in the TREASURY. When Gregor WOUNDS an enemy, he gains COUNTER for 3 turns and adds 2 Coins to the TREASURY.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "wound"
    },
    "requirements": [
      {
        "kind": "leader"
      },
      {
        "kind": "owner_applies_status",
        "status": "wound"
      }
    ],
    "outcomes": [
      {
        "kind": "resource",
        "target": "team",
        "resource": "treasury_coins",
        "amount": 2,
        "unit": "banked_coins"
      },
      {
        "kind": "apply_status",
        "target": "self",
        "status": "counter",
        "durationTurns": 3
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-revive",
    "name": "Gregor defeat Treasury spend",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "champion_traits",
      "recordId": 6,
      "sourceId": 8,
      "exactText": "Upon defeat, TREASURY (6): Gregor loses his helmet, and is instantly revived to 80% HP with an indefinite +10% Power Buff.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "defeat"
    },
    "requirements": [
      {
        "kind": "resource",
        "resource": "treasury_coins",
        "amount": 6,
        "consumes": true,
        "definitionSourceId": 513
      }
    ],
    "outcomes": [
      {
        "kind": "revive",
        "target": "self",
        "amount": 80,
        "unit": "percent_hp"
      },
      {
        "kind": "power_buff",
        "target": "self",
        "amount": 10,
        "unit": "percent",
        "duration": "indefinite"
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-helm-critical",
    "name": "Helm critical Skill: board gems",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "iconic_abilities",
      "recordId": 1,
      "sourceId": 10,
      "exactText": "When Gregor Critically Strikes an enemy with his Skill, he REMOVES all RENEW from that enemy and spawns 3 Coin Gems. Gregor is immune to POISON, BLEED, and BRITTLE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": "V",
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "critical_skill_strike"
    },
    "requirements": [
      {
        "kind": "item",
        "rank": "V",
        "level": 20
      }
    ],
    "outcomes": [
      {
        "kind": "spawn_gem",
        "target": "board",
        "resource": "coin_gems",
        "amount": 3,
        "unit": "board_gems"
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-helm-renew",
    "name": "Helm critical Skill: RENEW removal",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "iconic_abilities",
      "recordId": 1,
      "sourceId": 10,
      "exactText": "When Gregor Critically Strikes an enemy with his Skill, he REMOVES all RENEW from that enemy and spawns 3 Coin Gems. Gregor is immune to POISON, BLEED, and BRITTLE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": "V",
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "critical_skill_strike"
    },
    "requirements": [
      {
        "kind": "item",
        "rank": "V",
        "level": 20
      },
      {
        "kind": "enemy_status",
        "status": "renew"
      }
    ],
    "outcomes": [
      {
        "kind": "remove_status",
        "target": "enemy",
        "status": "renew",
        "amount": "all"
      }
    ],
    "side": "player"
  },
  {
    "id": "gregor-helm-immunity",
    "name": "Helm personal immunities",
    "variantId": "sqlite-champion-4",
    "targetId": null,
    "source": {
      "table": "iconic_abilities",
      "recordId": 1,
      "sourceId": 10,
      "exactText": "When Gregor Critically Strikes an enemy with his Skill, he REMOVES all RENEW from that enemy and spawns 3 Coin Gems. Gregor is immune to POISON, BLEED, and BRITTLE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": "V",
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "passive"
    },
    "requirements": [
      {
        "kind": "item",
        "rank": "V",
        "level": 20
      }
    ],
    "outcomes": [
      {
        "kind": "immunity",
        "target": "self",
        "status": "poison"
      },
      {
        "kind": "immunity",
        "target": "self",
        "status": "bleed"
      },
      {
        "kind": "immunity",
        "target": "self",
        "status": "brittle"
      }
    ],
    "side": "player"
  },
  {
    "id": "olenna-critical",
    "name": "olenna critical",
    "variantId": "sqlite-champion-17",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 14,
      "sourceId": 83,
      "exactText": "Olenna HEALS all team members for 60% ATK and grants them +45% Critical Strike Chance for 3 turns. This can Critically HEAL. Olenna then afflicts all enemies with POISON for 3 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "skill"
    },
    "requirements": [],
    "outcomes": [
      {
        "kind": "critical_chance",
        "target": "team",
        "amount": 45,
        "unit": "percent_critical_strike_chance",
        "durationTurns": 3
      }
    ],
    "side": "player"
  },
  {
    "id": "jacaerys-critical",
    "name": "jacaerys critical",
    "variantId": "sqlite-champion-32",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 29,
      "sourceId": 197,
      "exactText": "Jacaerys gains 1 FURY, grants all team members +25% Critical Strike Chance for 2 turns, then deals 340% ATK Fire Damage to a single enemy.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "skill"
    },
    "requirements": [],
    "outcomes": [
      {
        "kind": "critical_chance",
        "target": "team",
        "amount": 25,
        "unit": "percent_critical_strike_chance",
        "durationTurns": 2
      }
    ],
    "side": "player"
  },
  {
    "id": "gendry-critical",
    "name": "gendry critical",
    "variantId": "sqlite-champion-57",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 56,
      "sourceId": 347,
      "exactText": "Gendry grants a target team member +100% Critical Strike Chance for 2 turns. He then spawns a random Power-Up with a 80% chance to spawn a Vertical Clear Power-Up.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 9,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "skill"
    },
    "requirements": [],
    "outcomes": [
      {
        "kind": "critical_chance",
        "target": "target_ally",
        "amount": 100,
        "unit": "percent_critical_strike_chance",
        "durationTurns": 2
      }
    ],
    "side": "player"
  },
  {
    "id": "tyrion-opening",
    "name": "Original Tyrion opening Treasury",
    "variantId": "sqlite-champion-12",
    "targetId": null,
    "source": {
      "table": "champion_traits",
      "recordId": 23,
      "sourceId": 55,
      "exactText": "Starts the battle with 6 Coins in the TREASURY and 50% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "battle_start"
    },
    "requirements": [
      {
        "kind": "leader"
      }
    ],
    "outcomes": [
      {
        "kind": "resource",
        "target": "team",
        "resource": "treasury_coins",
        "amount": 6,
        "unit": "banked_coins"
      }
    ],
    "side": "player"
  },
  {
    "id": "tyrion-reapply",
    "name": "Original Tyrion marked-ally reapplication",
    "variantId": "sqlite-champion-12",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 9,
      "sourceId": 58,
      "exactText": "Tyrion marks an ally as TYRION'S DEFENDER. When that Champion uses their Skill, Tyrion deals all enemies 310% DEF Physical Damage. If Tyrion uses this Skill on a Champion already marked with TYRION'S DEFENDER, he adds +8 Coins to the Treasury.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "reapply_mark"
    },
    "requirements": [
      {
        "kind": "ally_mark",
        "status": "tyrions_defender"
      }
    ],
    "outcomes": [
      {
        "kind": "resource",
        "target": "team",
        "resource": "treasury_coins",
        "amount": 8,
        "unit": "banked_coins"
      }
    ],
    "side": "player"
  },
  {
    "id": "halfman-guard",
    "name": "Half-Man HP Guard payout",
    "variantId": "sqlite-champion-74",
    "targetId": null,
    "source": {
      "table": "champion_traits",
      "recordId": 158,
      "sourceId": 443,
      "exactText": "Tyrion has an HP Guard at 10% that, when activated, grants him a 10% Max HP SHIELD and adds 6 Coins to the TREASURY.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "hp_guard"
    },
    "requirements": [
      {
        "kind": "hp_threshold",
        "amount": 10,
        "unit": "percent_max_hp"
      }
    ],
    "outcomes": [
      {
        "kind": "resource",
        "target": "team",
        "resource": "treasury_coins",
        "amount": 6,
        "unit": "banked_coins"
      }
    ],
    "side": "player"
  },
  {
    "id": "rickard-bleed",
    "name": "Rickard BLEED setup",
    "variantId": "sqlite-champion-38",
    "targetId": null,
    "source": {
      "table": "champion_skills",
      "recordId": 37,
      "sourceId": 243,
      "exactText": "Rickard afflicts an enemy with 2 ICE and 1 BLEED. If his target was already BRITTLE, they are afflicted with 3 BLEED instead. He then strikes them for 560% ATK Physical Damage. If Rickard defeats his target, he refunds 65% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 9,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": null
    },
    "trigger": {
      "kind": "skill"
    },
    "requirements": [],
    "outcomes": [
      {
        "kind": "apply_status",
        "target": "enemy",
        "status": "bleed",
        "amount": 1,
        "unit": "marks"
      }
    ],
    "side": "player"
  },
  {
    "id": "rhaegal-bleed-payoff",
    "name": "Rhaegal BLEED Skill punishment",
    "variantId": null,
    "targetId": "legendary-assault:rhaegal",
    "source": {
      "table": "raid_boss_abilities",
      "recordId": 3,
      "sourceId": 589,
      "exactText": "If Rhaegal uses his SKILL while BLEEDING, he takes 2% Max HP True Damage per BLEED mark on him. At the start of each turn, Rhaegal takes 20000 flat True Damage per FIRE mark on him. When the TAUNTING ally is HEALED, they gain 1 BLOCK and 1 RENEW. If they are a TARGARYEN or BOLTON, Rhaegal also takes 20% of his Max HP as Physical Damage.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": "Once",
      "shownRank": "II",
      "exactPhaseText": null,
      "sourceIds": [
        589,
        590,
        591
      ]
    },
    "trigger": {
      "kind": "enemy_skill"
    },
    "requirements": [
      {
        "kind": "enemy_status",
        "status": "bleed"
      }
    ],
    "outcomes": [
      {
        "kind": "damage",
        "target": "enemy",
        "amount": 2,
        "unit": "percent_max_hp_per_bleed_mark",
        "damageType": "true"
      }
    ],
    "side": "encounter"
  },
  {
    "id": "harpys-opening",
    "name": "Harpy opening WOUND window",
    "variantId": null,
    "targetId": "war:harpys-pit",
    "source": {
      "table": "final_war_outpost_rules",
      "recordId": "harpys-pit",
      "sourceId": 102134,
      "exactText": "All enemies begin battle WOUNDED for 3 turns.",
      "reviewStatus": "screenshot_verified_current",
      "currentness": "not_reverified",
      "shownSkillLevel": null,
      "scope": null,
      "shownRank": null,
      "exactPhaseText": "Bonuses apply to both teams in Phase 3 and the winning Alliance in Phase 4."
    },
    "trigger": {
      "kind": "battle_start"
    },
    "requirements": [
      {
        "kind": "turn_window",
        "through": 3
      },
      {
        "kind": "war_phase"
      }
    ],
    "outcomes": [
      {
        "kind": "apply_status",
        "target": "all_enemies",
        "status": "wound",
        "durationTurns": 3
      }
    ],
    "side": "phase_dependent_both_teams"
  }
];
export const treasuryDefinition = {"sourceId": 513, "exactText": "If you have enough Coins to afford this ability's Treasury Cost, the effect will happen and the Coins will be removed from your bank."};
