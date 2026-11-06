// Source-transcribed prebattle capability subset, not a simulator or complete portfolio.
export const prebattleCapabilities = [
  {
    "id": "khaleesi-heal",
    "variantId": "sqlite-champion-19",
    "kind": "healing",
    "trigger": "skill_use",
    "recipients": "target_ally",
    "leaderOnly": false,
    "amount": 60,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 16,
      "sourceId": 92,
      "exactText": "Daenerys HEALS a target team member for 60% ATK, and the target gains 25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    }
  },
  {
    "id": "khaleesi-stamina-target",
    "variantId": "sqlite-champion-19",
    "kind": "stamina_grant",
    "trigger": "skill_use",
    "recipients": "target_ally",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_skills",
      "recordId": 16,
      "sourceId": 92,
      "exactText": "Daenerys HEALS a target team member for 60% ATK, and the target gains 25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    }
  },
  {
    "id": "khaleesi-leader-refund",
    "variantId": "sqlite-champion-19",
    "kind": "stamina_refund",
    "trigger": "ally_skill_use",
    "recipients": "skill_user",
    "leaderOnly": true,
    "amount": 10,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 39,
      "sourceId": 91,
      "exactText": "After a team member uses their Skill, Daenerys grants them +10% Stamina, if they are a Free Cities team member they gain an additional +10% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "khaleesi-free-cities-refund",
    "variantId": "sqlite-champion-19",
    "kind": "stamina_refund",
    "trigger": "ally_skill_use",
    "recipients": "faction",
    "leaderOnly": true,
    "amount": 10,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 39,
      "sourceId": 91,
      "exactText": "After a team member uses their Skill, Daenerys grants them +10% Stamina, if they are a Free Cities team member they gain an additional +10% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "faction": "Free Cities",
    "recipientRole": "skill_user",
    "additional": true
  },
  {
    "id": "khaleesi-guard",
    "variantId": "sqlite-champion-19",
    "kind": "stamina_grant",
    "trigger": "hp_guard",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 40,
      "sourceId": 91,
      "exactText": "Daenerys has an HP Guard at 10% HP. When the HP Guard is activated, she gains 100% Stamina. When she is defeated, all allies gain 25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "hp_guard_10_percent"
  },
  {
    "id": "khaleesi-defeat",
    "variantId": "sqlite-champion-19",
    "kind": "stamina_grant",
    "trigger": "owner_defeat",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 40,
      "sourceId": 91,
      "exactText": "Daenerys has an HP Guard at 10% HP. When the HP Guard is activated, she gains 100% Stamina. When she is defeated, all allies gain 25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "owner_defeat"
  },
  {
    "id": "khaleesi-iconic-heal",
    "variantId": "sqlite-champion-19",
    "kind": "healing",
    "trigger": "ally_skill_use",
    "recipients": "skill_user",
    "leaderOnly": false,
    "amount": 40,
    "unit": "percent_atk",
    "source": {
      "table": "iconic_abilities",
      "recordId": 12,
      "sourceId": 93,
      "exactText": "Whenever an ally uses their Skill, Daenerys HEALS them for 40% ATK. This can Critically HEAL. If this Critically HEALS, Daenerys grants that ally a 30% Power Buff for 3 turns. If that Skill did Critical Damage, Daenerys REMOVES 5 Buffs from the damaged enemy.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "itemRequired": true,
    "itemRank": "5",
    "itemLevel": 20
  },
  {
    "id": "drogo-physical",
    "variantId": "sqlite-champion-5",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 300,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 2,
      "sourceId": 12,
      "exactText": "Khal Drogo recklessly strikes a single enemy for 300% ATK Physical Damage, with a +25% bonus Critical Strike Chance, and sacrificing 15% Current HP in the attack.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "physical",
    "selfCost": {
      "amount": 15,
      "unit": "percent_current_hp"
    }
  },
  {
    "id": "drogo-free-cities-opening",
    "variantId": "sqlite-champion-5",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "faction",
    "leaderOnly": true,
    "amount": 50,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 8,
      "sourceId": 11,
      "exactText": "All Free Cities team members begin combat with +50% Stamina. Every time Khal defeats an enemy, allies gain +25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "faction": "Free Cities"
  },
  {
    "id": "drogo-defeat-refund",
    "variantId": "sqlite-champion-5",
    "kind": "stamina_grant",
    "trigger": "owner_enemy_defeat",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 25,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 8,
      "sourceId": 11,
      "exactText": "All Free Cities team members begin combat with +50% Stamina. Every time Khal defeats an enemy, allies gain +25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "enemy_defeat"
  },
  {
    "id": "qarth-fire-target",
    "variantId": "sqlite-champion-6",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 200,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 3,
      "sourceId": 17,
      "exactText": "Drogon strikes a target enemy for 200% ATK Fire Damage and afflicts them with FEAR x2. Rhaegal and Viserion then each strike a random target for 75% ATK Fire Damage. Rhaegal and Viserion's attacks ignore TAUNT and STEALTH.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "fire"
  },
  {
    "id": "qarth-fire-random",
    "variantId": "sqlite-champion-6",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "random_enemies",
    "leaderOnly": false,
    "amount": 75,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 3,
      "sourceId": 17,
      "exactText": "Drogon strikes a target enemy for 200% ATK Fire Damage and afflicts them with FEAR x2. Rhaegal and Viserion then each strike a random target for 75% ATK Fire Damage. Rhaegal and Viserion's attacks ignore TAUNT and STEALTH.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "fire",
    "hits": 2
  },
  {
    "id": "qarth-leader-refund",
    "variantId": "sqlite-champion-6",
    "kind": "stamina_grant",
    "trigger": "enemy_skill_use",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 15,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 10,
      "sourceId": 16,
      "exactText": "When an enemy uses a Skill, Daenerys grants all allies +15% Stamina and she gains 2 WRATH.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "rhaenyra-fury",
    "variantId": "sqlite-champion-9",
    "kind": "fury_grant",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 1,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 6,
      "sourceId": 39,
      "exactText": "Rhaenyra grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    }
  },
  {
    "id": "rhaenyra-fire",
    "variantId": "sqlite-champion-9",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 300,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 6,
      "sourceId": 39,
      "exactText": "Rhaenyra grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "fire"
  },
  {
    "id": "rhaenyra-enraged-fire",
    "variantId": "sqlite-champion-9",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": 400,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 6,
      "sourceId": 39,
      "exactText": "Rhaenyra grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "fire",
    "condition": "owner_enraged"
  },
  {
    "id": "rhaenyra-enraged-refund",
    "variantId": "sqlite-champion-9",
    "kind": "stamina_grant",
    "trigger": "owner_enraged",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 50,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 16,
      "sourceId": 35,
      "exactText": "When Rhaenyra becomes ENRAGED, all allies gain +50% Stamina. When any team member becomes ENRAGED, REMOVE all Debuffs from Rhaenyra.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "owner_enraged"
  },
  {
    "id": "alicent-physical",
    "variantId": "sqlite-champion-58",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 57,
      "sourceId": 353,
      "exactText": "Alicent deals 25% ATK Physical Damage to an enemy, with bonus 35% per BIRTHRIGHT. She HEALS the team for 22% ATK, with a chance to Critically HEAL, then grants the team 3 BIRTHRIGHT, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    },
    "damageType": "physical",
    "perBirthrightBonus": {
      "amount": 35,
      "unit": "percent_atk"
    }
  },
  {
    "id": "alicent-heal",
    "variantId": "sqlite-champion-58",
    "kind": "healing",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 22,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 57,
      "sourceId": 353,
      "exactText": "Alicent deals 25% ATK Physical Damage to an enemy, with bonus 35% per BIRTHRIGHT. She HEALS the team for 22% ATK, with a chance to Critically HEAL, then grants the team 3 BIRTHRIGHT, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    }
  },
  {
    "id": "alicent-birthright-team",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_grant",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 3,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 57,
      "sourceId": 353,
      "exactText": "Alicent deals 25% ATK Physical Damage to an enemy, with bonus 35% per BIRTHRIGHT. She HEALS the team for 22% ATK, with a chance to Critically HEAL, then grants the team 3 BIRTHRIGHT, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    }
  },
  {
    "id": "alicent-birthright-spend",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_spend",
    "trigger": "skill_use",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 1,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 57,
      "sourceId": 353,
      "exactText": "Alicent deals 25% ATK Physical Damage to an enemy, with bonus 35% per BIRTHRIGHT. She HEALS the team for 22% ATK, with a chance to Critically HEAL, then grants the team 3 BIRTHRIGHT, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    }
  },
  {
    "id": "alicent-opening-birthright",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_opening",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 8,
    "unit": "marks",
    "source": {
      "table": "champion_traits",
      "recordId": 123,
      "sourceId": 351,
      "exactText": "Alicent begins combat with 8 BIRTHRIGHT and 75% Stamina. When a team member takes Critical Damage from a Skill, she sacrifices 10% Current HP to gain +15% Stamina and grant the damaged team member 2 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Per Target"
    }
  },
  {
    "id": "alicent-opening-stamina",
    "variantId": "sqlite-champion-58",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 75,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 123,
      "sourceId": 351,
      "exactText": "Alicent begins combat with 8 BIRTHRIGHT and 75% Stamina. When a team member takes Critical Damage from a Skill, she sacrifices 10% Current HP to gain +15% Stamina and grant the damaged team member 2 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Per Target"
    }
  },
  {
    "id": "alicent-leader-birthright",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_grant",
    "trigger": "ally_takes_skill_damage",
    "recipients": "damaged_ally",
    "leaderOnly": true,
    "amount": 2,
    "unit": "marks",
    "source": {
      "table": "champion_traits",
      "recordId": 122,
      "sourceId": 351,
      "exactText": "When any ally is damaged by a Skill, Alicent heals them for 5% of their Max HP and grants that ally 2 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Per Target"
    }
  },
  {
    "id": "alicent-leader-heal",
    "variantId": "sqlite-champion-58",
    "kind": "healing",
    "trigger": "ally_takes_skill_damage",
    "recipients": "damaged_ally",
    "leaderOnly": true,
    "amount": 5,
    "unit": "percent_max_hp",
    "source": {
      "table": "champion_traits",
      "recordId": 122,
      "sourceId": 351,
      "exactText": "When any ally is damaged by a Skill, Alicent heals them for 5% of their Max HP and grants that ally 2 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Per Target"
    }
  },
  {
    "id": "alicent-crit-birthright",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_grant",
    "trigger": "ally_takes_critical_skill_damage",
    "recipients": "damaged_ally",
    "leaderOnly": false,
    "amount": 2,
    "unit": "marks",
    "source": {
      "table": "champion_traits",
      "recordId": 123,
      "sourceId": 351,
      "exactText": "Alicent begins combat with 8 BIRTHRIGHT and 75% Stamina. When a team member takes Critical Damage from a Skill, she sacrifices 10% Current HP to gain +15% Stamina and grant the damaged team member 2 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Per Target"
    },
    "condition": "incoming_critical_skill_damage"
  },
  {
    "id": "alicent-iconic-birthright",
    "variantId": "sqlite-champion-58",
    "kind": "birthright_grant",
    "trigger": "turn_start",
    "recipients": "weakest_ally",
    "leaderOnly": false,
    "amount": 2,
    "unit": "marks",
    "source": {
      "table": "iconic_abilities",
      "recordId": 26,
      "sourceId": 354,
      "exactText": "At the start of each turn, Alicent has a 35% chance to grant 2 BIRTHRIGHT to her Weakest ally. When a Greens ally is defeated, Alicent gains 5 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "chance": 0.35,
    "itemRequired": true,
    "itemRank": "3",
    "itemLevel": 14
  },
  {
    "id": "tywin-physical",
    "variantId": "sqlite-champion-15",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": 175,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 12,
      "sourceId": 73,
      "exactText": "Tywin deals 175% ATK Physical Damage to all enemies and has a 100% chance to REMOVE 1 Buff from them. TREASURY (4): He grants all allies 5 BIRTHRIGHT. If the ally is a Lannister, grants 2 additional BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 10
    },
    "damageType": "physical"
  },
  {
    "id": "tywin-birthright-team",
    "variantId": "sqlite-champion-15",
    "kind": "birthright_grant",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 5,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 12,
      "sourceId": 73,
      "exactText": "Tywin deals 175% ATK Physical Damage to all enemies and has a 100% chance to REMOVE 1 Buff from them. TREASURY (4): He grants all allies 5 BIRTHRIGHT. If the ally is a Lannister, grants 2 additional BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 10
    },
    "condition": "treasury_cost",
    "treasuryCost": 4
  },
  {
    "id": "tywin-birthright-lannister",
    "variantId": "sqlite-champion-15",
    "kind": "birthright_grant",
    "trigger": "skill_use",
    "recipients": "faction",
    "leaderOnly": false,
    "amount": 2,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 12,
      "sourceId": 73,
      "exactText": "Tywin deals 175% ATK Physical Damage to all enemies and has a 100% chance to REMOVE 1 Buff from them. TREASURY (4): He grants all allies 5 BIRTHRIGHT. If the ally is a Lannister, grants 2 additional BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 10
    },
    "faction": "Lannister",
    "additional": true,
    "condition": "treasury_cost",
    "treasuryCost": 4
  },
  {
    "id": "tywin-opening-coins",
    "variantId": "sqlite-champion-15",
    "kind": "treasury_grant",
    "trigger": "battle_start",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 10,
    "unit": "banked_coins",
    "source": {
      "table": "champion_traits",
      "recordId": 30,
      "sourceId": 71,
      "exactText": "Start the battle with 10 Coins in the TREASURY. Every 2 turns, Tywin will apply a mark of RUIN to the Strongest enemy. At 3 RUIN, the enemy will have their Current HP cut down by 75% and an -25% DEF Debuff. Does not affect Dragons.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "tywin-ruin",
    "variantId": "sqlite-champion-15",
    "kind": "damage_payoff",
    "trigger": "ruin_3_stacks",
    "recipients": "enemy",
    "leaderOnly": true,
    "amount": 75,
    "unit": "percent_current_hp",
    "source": {
      "table": "champion_traits",
      "recordId": 30,
      "sourceId": 71,
      "exactText": "Start the battle with 10 Coins in the TREASURY. Every 2 turns, Tywin will apply a mark of RUIN to the Strongest enemy. At 3 RUIN, the enemy will have their Current HP cut down by 75% and an -25% DEF Debuff. Does not affect Dragons.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "not_dragons",
    "excludedTargetType": "dragon"
  },
  {
    "id": "olenna-heal",
    "variantId": "sqlite-champion-17",
    "kind": "healing",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 60,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 14,
      "sourceId": 83,
      "exactText": "Olenna HEALS all team members for 60% ATK and grants them +45% Critical Strike Chance for 3 turns. This can Critically HEAL. Olenna then afflicts all enemies with POISON for 3 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    }
  },
  {
    "id": "olenna-critical",
    "variantId": "sqlite-champion-17",
    "kind": "critical_chance",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 45,
    "unit": "percent",
    "source": {
      "table": "champion_skills",
      "recordId": 14,
      "sourceId": 83,
      "exactText": "Olenna HEALS all team members for 60% ATK and grants them +45% Critical Strike Chance for 3 turns. This can Critically HEAL. Olenna then afflicts all enemies with POISON for 3 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "durationTurns": 3
  },
  {
    "id": "olenna-poison",
    "variantId": "sqlite-champion-17",
    "kind": "status_apply",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": null,
    "unit": null,
    "source": {
      "table": "champion_skills",
      "recordId": 14,
      "sourceId": 83,
      "exactText": "Olenna HEALS all team members for 60% ATK and grants them +45% Critical Strike Chance for 3 turns. This can Critically HEAL. Olenna then afflicts all enemies with POISON for 3 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "status": "poison",
    "durationTurns": 3
  },
  {
    "id": "jaqen-opening-stamina",
    "variantId": "sqlite-champion-21",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": true,
    "amount": 100,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 43,
      "sourceId": 100,
      "exactText": "At the beginning of combat, Jaqen adds 5 Coins to the Treasury and gains +100% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "jaqen-opening-coins",
    "variantId": "sqlite-champion-21",
    "kind": "treasury_grant",
    "trigger": "battle_start",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 5,
    "unit": "banked_coins",
    "source": {
      "table": "champion_traits",
      "recordId": 43,
      "sourceId": 100,
      "exactText": "At the beginning of combat, Jaqen adds 5 Coins to the Treasury and gains +100% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "jaqen-healed-refund",
    "variantId": "sqlite-champion-21",
    "kind": "stamina_refund",
    "trigger": "owner_healed",
    "recipients": "self_and_healer",
    "leaderOnly": false,
    "amount": 35,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 44,
      "sourceId": 101,
      "exactText": "Anytime Jaqen is HEALED, he and his healer both gain +35% Stamina, and he spawns 1 Coin Gem.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "jaqen-healed-gem",
    "variantId": "sqlite-champion-21",
    "kind": "coin_gem_spawn",
    "trigger": "owner_healed",
    "recipients": "board",
    "leaderOnly": false,
    "amount": 1,
    "unit": "board_coin_gems",
    "source": {
      "table": "champion_traits",
      "recordId": 44,
      "sourceId": 101,
      "exactText": "Anytime Jaqen is HEALED, he and his healer both gain +35% Stamina, and he spawns 1 Coin Gem.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "adolescent-rhaegal-physical",
    "variantId": "sqlite-champion-33",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 500,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 30,
      "sourceId": 202,
      "exactText": "Rhaegal deals 500% ATK Physical Damage to an enemy with a bonus 400% Execute Damage. If Rhaegal defeats his target, he restores 80% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "physical",
    "condition": "after_bide",
    "executeBonus": {
      "amount": 400,
      "unit": "percent_atk"
    }
  },
  {
    "id": "adolescent-rhaegal-defeat-refund",
    "variantId": "sqlite-champion-33",
    "kind": "stamina_refund",
    "trigger": "owner_enemy_defeat",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 80,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_skills",
      "recordId": 30,
      "sourceId": 202,
      "exactText": "Rhaegal deals 500% ATK Physical Damage to an enemy with a bonus 400% Execute Damage. If Rhaegal defeats his target, he restores 80% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "condition": "enemy_defeat"
  },
  {
    "id": "adolescent-rhaegal-opening-stamina",
    "variantId": "sqlite-champion-33",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 69,
      "sourceId": 201,
      "exactText": "Rhaegal begins battle with 100% Stamina and 30 stacks of BIDE. He loses 1 at the start of every other turn, 3 any time an ally uses their Skill, and 5 when any champion is defeated.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    },
    "condition": "after_bide"
  },
  {
    "id": "adolescent-rhaegal-bide",
    "variantId": "sqlite-champion-33",
    "kind": "bide",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 30,
    "unit": "stacks",
    "source": {
      "table": "champion_traits",
      "recordId": 69,
      "sourceId": 201,
      "exactText": "Rhaegal begins battle with 100% Stamina and 30 stacks of BIDE. He loses 1 at the start of every other turn, 3 any time an ally uses their Skill, and 5 when any champion is defeated.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    },
    "definitionSourceId": 557
  },
  {
    "id": "gwayne-physical",
    "variantId": "sqlite-champion-43",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 230,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 42,
      "sourceId": 272,
      "exactText": "Gwayne strikes an enemy twice, once for 230% ATK Physical Damage and again for 20% of his Current HP as True Damage.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 8
    },
    "damageType": "physical"
  },
  {
    "id": "gwayne-true",
    "variantId": "sqlite-champion-43",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 20,
    "unit": "percent_current_hp",
    "source": {
      "table": "champion_skills",
      "recordId": 42,
      "sourceId": 272,
      "exactText": "Gwayne strikes an enemy twice, once for 230% ATK Physical Damage and again for 20% of his Current HP as True Damage.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 8
    },
    "damageType": "true"
  },
  {
    "id": "gwayne-refund",
    "variantId": "sqlite-champion-43",
    "kind": "stamina_refund",
    "trigger": "owner_healed_or_birthright_from_skill",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 92,
      "sourceId": 271,
      "exactText": "When HEALED or given BIRTHRIGHT by a Skill, Gwayne gains +10% Critical Damage and +30% Critical Strike Chance Buffs for 3 turns, and gains 25% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "jorah-physical",
    "variantId": "sqlite-champion-46",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 180,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 45,
      "sourceId": 289,
      "exactText": "Jorah Strikes an enemy for 180% ATK Physical Damage, then TAUNTS the enemy team and gains a +30% DEF Buff for 3 turns. While TAUNTING, he COUNTERS enemies who damage him with a Skill for 180% ATK Physical Damage.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 10
    },
    "damageType": "physical"
  },
  {
    "id": "jorah-leader-skill-refund",
    "variantId": "sqlite-champion-46",
    "kind": "stamina_refund",
    "trigger": "leader_skill_use",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 99,
      "sourceId": 287,
      "exactText": "When the team Leader uses their Skill, Jorah gains +25% Stamina and +25% Unnatural Resistance for 4 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "egg-heal",
    "variantId": "sqlite-champion-47",
    "kind": "healing",
    "trigger": "skill_use",
    "recipients": "target_ally",
    "leaderOnly": false,
    "amount": 50,
    "unit": "percent_max_hp",
    "source": {
      "table": "champion_skills",
      "recordId": 46,
      "sourceId": 294,
      "exactText": "Egg HEALS a target team member for 50% Max HP and REMOVES 1 Debuff(s) from each team member. All allied Fighters gain a +15% ATK Buff for 3 turns. Egg can Critically HEAL.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 9
    }
  },
  {
    "id": "egg-crit-heal-refund",
    "variantId": "sqlite-champion-47",
    "kind": "stamina_grant",
    "trigger": "owner_critical_heal",
    "recipients": "healed_ally",
    "leaderOnly": false,
    "amount": 40,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 101,
      "sourceId": 293,
      "exactText": "Anytime Egg HEALS Dunk, he grants him a SHIELD worth 30% of Dunk's Current HP. If Egg Critically HEALS his target, he also grants them +40% Stamina. This Stamina boost is doubled for Dunk.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "critical_heal"
  },
  {
    "id": "meryn-physical",
    "variantId": "sqlite-champion-49",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": 140,
    "unit": "percent_def",
    "source": {
      "table": "champion_skills",
      "recordId": 48,
      "sourceId": 305,
      "exactText": "Meryn deals 140% DEF Physical Damage to all enemies, then TAUNTS for 4 turns. TREASURY (3): Meryn gains +50% Physical Resistance and Fire Resistance for 4 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 10
    },
    "damageType": "physical"
  },
  {
    "id": "meryn-opening",
    "variantId": "sqlite-champion-49",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 105,
      "sourceId": 304,
      "exactText": "Meryn begins combat with full Stamina. Once per turn, when an enemy becomes STUNNED, WOUNDED, or DECEIVED, Meryn spawns 1 Coin Gem and gains +40% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "meryn-status-refund",
    "variantId": "sqlite-champion-49",
    "kind": "stamina_refund",
    "trigger": "enemy_status_applied",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 40,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 105,
      "sourceId": 304,
      "exactText": "Meryn begins combat with full Stamina. Once per turn, when an enemy becomes STUNNED, WOUNDED, or DECEIVED, Meryn spawns 1 Coin Gem and gains +40% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    },
    "condition": "enemy_stunned_wounded_or_deceived",
    "oncePerTurn": true
  },
  {
    "id": "sunfyre-fire",
    "variantId": "sqlite-champion-56",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "random_enemy",
    "leaderOnly": false,
    "amount": 60,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 55,
      "sourceId": 341,
      "exactText": "Sunfyre strikes a random enemy, dealing 60% ATK Fire Damage and reducing the target's Fire Resistance by -4% for 2 turns. For each BIRTHRIGHT on Sunfyre, this attack repeats. Sunfyre then loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    },
    "damageType": "fire",
    "repeatsPerBirthright": true
  },
  {
    "id": "sunfyre-birthright-spend",
    "variantId": "sqlite-champion-56",
    "kind": "birthright_spend",
    "trigger": "skill_use",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 1,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 55,
      "sourceId": 341,
      "exactText": "Sunfyre strikes a random enemy, dealing 60% ATK Fire Damage and reducing the target's Fire Resistance by -4% for 2 turns. For each BIRTHRIGHT on Sunfyre, this attack repeats. Sunfyre then loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 7
    }
  },
  {
    "id": "sunfyre-opening-birthright",
    "variantId": "sqlite-champion-56",
    "kind": "birthright_opening",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 8,
    "unit": "marks",
    "source": {
      "table": "champion_traits",
      "recordId": 118,
      "sourceId": 340,
      "exactText": "Sunfyre begins combat with +8 BIRTHRIGHT and +60% Stamina. When he accumulates BIRTHRIGHT, he gains +15% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "sunfyre-opening-stamina",
    "variantId": "sqlite-champion-56",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 60,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 118,
      "sourceId": 340,
      "exactText": "Sunfyre begins combat with +8 BIRTHRIGHT and +60% Stamina. When he accumulates BIRTHRIGHT, he gains +15% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "sunfyre-birthright-refund",
    "variantId": "sqlite-champion-56",
    "kind": "stamina_refund",
    "trigger": "owner_gains_birthright",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 15,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 118,
      "sourceId": 340,
      "exactText": "Sunfyre begins combat with +8 BIRTHRIGHT and +60% Stamina. When he accumulates BIRTHRIGHT, he gains +15% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "All"
    }
  },
  {
    "id": "gendry-critical",
    "variantId": "sqlite-champion-57",
    "kind": "critical_chance",
    "trigger": "skill_use",
    "recipients": "target_ally",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent",
    "source": {
      "table": "champion_skills",
      "recordId": 56,
      "sourceId": 347,
      "exactText": "Gendry grants a target team member +100% Critical Strike Chance for 2 turns. He then spawns a random Power-Up with a 80% chance to spawn a Vertical Clear Power-Up.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 9
    },
    "durationTurns": 2
  },
  {
    "id": "gendry-powerup",
    "variantId": "sqlite-champion-57",
    "kind": "powerup_spawn",
    "trigger": "skill_use",
    "recipients": "board",
    "leaderOnly": false,
    "amount": 1,
    "unit": "powerups",
    "source": {
      "table": "champion_skills",
      "recordId": 56,
      "sourceId": 347,
      "exactText": "Gendry grants a target team member +100% Critical Strike Chance for 2 turns. He then spawns a random Power-Up with a 80% chance to spawn a Vertical Clear Power-Up.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 9
    },
    "subtypeChance": {
      "type": "vertical_clear",
      "chance": 0.8
    }
  },
  {
    "id": "criston-opening",
    "variantId": "sqlite-champion-65",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": true,
    "amount": 100,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 136,
      "sourceId": 390,
      "exactText": "Criston begins combat with 100% Stamina. When Criston marks himself with CRISTON'S CHARGE he gains TAUNT for 6 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "criston-retaliation",
    "variantId": "sqlite-champion-65",
    "kind": "skill_damage",
    "trigger": "marked_ally_takes_skill_damage",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 370,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 63,
      "sourceId": 392,
      "exactText": "Criston grants a target team member 17% DEF for 5 turns, and marks them with CRISTON'S CHARGE. When a team member bearing this mark is damaged by a Skill, Criston strikes the attacker for 370% ATK Physical Damage.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 6
    },
    "damageType": "physical",
    "condition": "marked_ally_takes_skill_damage"
  },
  {
    "id": "criston-marked-refund",
    "variantId": "sqlite-champion-65",
    "kind": "stamina_grant",
    "trigger": "marked_ally_skill_use",
    "recipients": "marked_ally",
    "leaderOnly": false,
    "amount": 35,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 137,
      "sourceId": 390,
      "exactText": "When a team member with CRISTON'S CHARGE uses their Skill, Criston inflicts 2 FIRE to random enemies. He sacrifices -75% of his Stamina to grant the marked ally +35%.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "cristons_charge",
    "selfCost": {
      "amount": 75,
      "unit": "percent_stamina"
    }
  },
  {
    "id": "halfman-physical",
    "variantId": "sqlite-champion-74",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 150,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 72,
      "sourceId": 446,
      "exactText": "Tyrion grants his allies a +5% Power Buff for 3 turns, then strikes an enemy for 150% ATK Physical Damage. TREASURY (6): Tyrion's allies each strike his target for 100% ATK Physical Damage, and he DECEIVES all enemies for 2 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    },
    "damageType": "physical"
  },
  {
    "id": "halfman-team-assist",
    "variantId": "sqlite-champion-74",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 72,
      "sourceId": 446,
      "exactText": "Tyrion grants his allies a +5% Power Buff for 3 turns, then strikes an enemy for 150% ATK Physical Damage. TREASURY (6): Tyrion's allies each strike his target for 100% ATK Physical Damage, and he DECEIVES all enemies for 2 turns.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    },
    "damageType": "physical",
    "condition": "treasury_cost",
    "treasuryCost": 6,
    "attackers": "all_allies"
  },
  {
    "id": "halfman-guard-coins",
    "variantId": "sqlite-champion-74",
    "kind": "treasury_grant",
    "trigger": "hp_guard",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 6,
    "unit": "banked_coins",
    "source": {
      "table": "champion_traits",
      "recordId": 158,
      "sourceId": 443,
      "exactText": "Tyrion has an HP Guard at 10% that, when activated, grants him a 10% Max HP SHIELD and adds 6 Coins to the TREASURY.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "hp_guard_10_percent"
  },
  {
    "id": "otto-physical",
    "variantId": "sqlite-champion-76",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": 25,
    "unit": "percent_atk",
    "source": {
      "table": "champion_skills",
      "recordId": 74,
      "sourceId": 461,
      "exactText": "For every BIRTHRIGHT on Otto, each enemy loses -1% DEF for 2 turns. Otto then deals 25% ATK Physical Damage to all enemies, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    },
    "damageType": "physical"
  },
  {
    "id": "otto-birthright-spend",
    "variantId": "sqlite-champion-76",
    "kind": "birthright_spend",
    "trigger": "skill_use",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 1,
    "unit": "marks",
    "source": {
      "table": "champion_skills",
      "recordId": 74,
      "sourceId": 461,
      "exactText": "For every BIRTHRIGHT on Otto, each enemy loses -1% DEF for 2 turns. Otto then deals 25% ATK Physical Damage to all enemies, and loses 1 BIRTHRIGHT.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    }
  },
  {
    "id": "otto-team-opening",
    "variantId": "sqlite-champion-76",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 10,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 163,
      "sourceId": 459,
      "exactText": "The team starts combat with +10% Stamina. Once per turn, when an ally damages the Strongest enemy with a Skill, Otto returns 40% of their Stamina and grants them a 25% Power Buff for 2 turns. Limited to 5 times per battle.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "otto-leader-refund",
    "variantId": "sqlite-champion-76",
    "kind": "stamina_refund",
    "trigger": "ally_skill_damages_strongest",
    "recipients": "skill_user",
    "leaderOnly": true,
    "amount": 40,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 163,
      "sourceId": 459,
      "exactText": "The team starts combat with +10% Stamina. Once per turn, when an ally damages the Strongest enemy with a Skill, Otto returns 40% of their Stamina and grants them a 25% Power Buff for 2 turns. Limited to 5 times per battle.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "damages_strongest",
    "oncePerTurn": true,
    "maxPerBattle": 5
  },
  {
    "id": "otto-opening-birthright",
    "variantId": "sqlite-champion-76",
    "kind": "birthright_opening",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 8,
    "unit": "marks",
    "source": {
      "table": "champion_traits",
      "recordId": 164,
      "sourceId": 460,
      "exactText": "Otto begins combat with 8 BIRTHRIGHT and 75% Stamina. The first time an enemy is defeated, he grants all team members +8% Stamina per BIRTHRIGHT he has.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "otto-opening-stamina",
    "variantId": "sqlite-champion-76",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": false,
    "amount": 75,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 164,
      "sourceId": 460,
      "exactText": "Otto begins combat with 8 BIRTHRIGHT and 75% Stamina. The first time an enemy is defeated, he grants all team members +8% Stamina per BIRTHRIGHT he has.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "otto-defeat-refund",
    "variantId": "sqlite-champion-76",
    "kind": "stamina_grant",
    "trigger": "first_enemy_defeat",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 8,
    "unit": "percent_stamina_per_owner_birthright",
    "source": {
      "table": "champion_traits",
      "recordId": 164,
      "sourceId": 460,
      "exactText": "Otto begins combat with 8 BIRTHRIGHT and 75% Stamina. The first time an enemy is defeated, he grants all team members +8% Stamina per BIRTHRIGHT he has.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    },
    "condition": "enemy_defeat"
  },
  {
    "id": "talisa-heal",
    "variantId": "sqlite-champion-84",
    "kind": "healing",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 15,
    "unit": "percent_max_hp",
    "source": {
      "table": "champion_skills",
      "recordId": 82,
      "sourceId": 507,
      "exactText": "Talisa grants a target team member TAUNT for 3 turns with a 75% chance to grant them 1 RENEW.  She then HEALS the team for 15% Max HP and REMOVES all Sustained Damage effects from them.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    }
  },
  {
    "id": "talisa-cleanse",
    "variantId": "sqlite-champion-84",
    "kind": "cleanse",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": null,
    "unit": null,
    "source": {
      "table": "champion_skills",
      "recordId": 82,
      "sourceId": 507,
      "exactText": "Talisa grants a target team member TAUNT for 3 turns with a 75% chance to grant them 1 RENEW.  She then HEALS the team for 15% Max HP and REMOVES all Sustained Damage effects from them.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "shownSkillLevel": 1
    },
    "status": "sustained_damage"
  },
  {
    "id": "tyrion-opening-coins",
    "variantId": "sqlite-champion-12",
    "kind": "treasury_grant",
    "trigger": "battle_start",
    "recipients": "team",
    "leaderOnly": true,
    "amount": 6,
    "unit": "banked_coins",
    "source": {
      "table": "champion_traits",
      "recordId": 23,
      "sourceId": 55,
      "exactText": "Starts the battle with 6 Coins in the TREASURY and 50% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "tyrion-opening-stamina",
    "variantId": "sqlite-champion-12",
    "kind": "opening_stamina",
    "trigger": "battle_start",
    "recipients": "self",
    "leaderOnly": true,
    "amount": 50,
    "unit": "percent_stamina",
    "source": {
      "table": "champion_traits",
      "recordId": 23,
      "sourceId": 55,
      "exactText": "Starts the battle with 6 Coins in the TREASURY and 50% Stamina.",
      "reviewStatus": "complete",
      "currentness": "not_reverified",
      "scope": "Once"
    }
  },
  {
    "id": "tyrion-marked-physical",
    "variantId": "sqlite-champion-12",
    "kind": "skill_damage",
    "trigger": "marked_ally_skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "amount": 310,
    "unit": "percent_def",
    "source": {
      "table": "champion_skills",
      "recordId": 9,
      "sourceId": 58,
      "exactText": "Tyrion marks an ally as TYRION'S DEFENDER. When that Champion uses their Skill, Tyrion deals all enemies 310% DEF Physical Damage. If Tyrion uses this Skill on a Champion already marked with TYRION'S DEFENDER, he adds +8 Coins to the Treasury.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "damageType": "physical",
    "condition": "marked_ally_skill_use"
  },
  {
    "id": "tyrion-reapply-coins",
    "variantId": "sqlite-champion-12",
    "kind": "treasury_grant",
    "trigger": "skill_use",
    "recipients": "team",
    "leaderOnly": false,
    "amount": 8,
    "unit": "banked_coins",
    "source": {
      "table": "champion_skills",
      "recordId": 9,
      "sourceId": 58,
      "exactText": "Tyrion marks an ally as TYRION'S DEFENDER. When that Champion uses their Skill, Tyrion deals all enemies 310% DEF Physical Damage. If Tyrion uses this Skill on a Champion already marked with TYRION'S DEFENDER, he adds +8 Coins to the Treasury.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "condition": "already_marked_ally"
  },
  {
    "variantId": "sqlite-champion-6",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "source": {
      "table": "champion_skills",
      "recordId": 3,
      "sourceId": 17,
      "exactText": "Drogon strikes a target enemy for 200% ATK Fire Damage and afflicts them with FEAR x2. Rhaegal and Viserion then each strike a random target for 75% ATK Fire Damage. Rhaegal and Viserion's attacks ignore TAUNT and STEALTH.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "id": "qarth-fear",
    "kind": "status_apply",
    "status": "fear",
    "amount": 2,
    "unit": "marks"
  },
  {
    "variantId": "sqlite-champion-9",
    "trigger": "skill_use",
    "recipients": "enemy",
    "leaderOnly": false,
    "source": {
      "table": "champion_skills",
      "recordId": 6,
      "sourceId": 39,
      "exactText": "Rhaenyra grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "id": "rhaenyra-fire-status",
    "kind": "status_apply",
    "status": "fire",
    "amount": 1,
    "unit": "marks"
  },
  {
    "variantId": "sqlite-champion-9",
    "trigger": "skill_use",
    "recipients": "all_enemies",
    "leaderOnly": false,
    "source": {
      "table": "champion_skills",
      "recordId": 6,
      "sourceId": 39,
      "exactText": "Rhaenyra grants all team members 1 FURY, then deals 300% ATK Fire Damage to an enemy, and afflicts them with 1 FIRE. When ENRAGED, she deals an additional 400% ATK Fire Damage to all enemies, and afflicts them with 1 FIRE.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    },
    "id": "rhaenyra-enraged-fire-status",
    "kind": "status_apply",
    "status": "fire",
    "amount": 1,
    "unit": "marks",
    "condition": "owner_enraged"
  },
  {
    "id": "jaqen-true",
    "variantId": "sqlite-champion-21",
    "kind": "skill_damage",
    "trigger": "skill_use",
    "recipients": "weakest_enemy",
    "leaderOnly": false,
    "amount": 100,
    "unit": "percent_atk",
    "damageType": "true",
    "source": {
      "table": "guide_ability",
      "recordId": "audit-champion-skill-jaqen-hghar",
      "sourceId": 101991,
      "exactText": "Jaqen strikes the Weakest enemy for 100% ATK True Damage. He then grants a target team member +35% Dodge Chance for 3 turns. TREASURY (5): If Jaqen chose a non-Beast ally, he Takes Their Face at 70% HP.",
      "reviewStatus": "complete",
      "currentness": "not_reverified"
    }
  }
];
export const prebattleProfiles = [
  {
    "variantId": "sqlite-champion-5",
    "skillSpeed": "Very Fast",
    "sourceRef": "champion_skills:2:source:12",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-6",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:3:source:17",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-9",
    "skillSpeed": "Slow",
    "sourceRef": "champion_skills:6:source:39",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-12",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:9:source:58",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-15",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:12:source:73",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-17",
    "skillSpeed": "Fast",
    "sourceRef": "champion_skills:14:source:83",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-19",
    "skillSpeed": "Fast",
    "sourceRef": "champion_skills:16:source:92",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-21",
    "skillSpeed": null,
    "sourceRef": "ability:audit-champion-skill-jaqen-hghar",
    "speedStatus": "unknown"
  },
  {
    "variantId": "sqlite-champion-33",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:30:source:202",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-43",
    "skillSpeed": "Slow",
    "sourceRef": "champion_skills:42:source:272",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-46",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:45:source:289",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-47",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:46:source:294",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-49",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:48:source:305",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-56",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:55:source:341",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-57",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:56:source:347",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-58",
    "skillSpeed": "Slow",
    "sourceRef": "champion_skills:57:source:353",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-65",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:63:source:392",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-74",
    "skillSpeed": "Fast",
    "sourceRef": "champion_skills:72:source:446",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-76",
    "skillSpeed": "Very Slow",
    "sourceRef": "champion_skills:74:source:461",
    "speedStatus": "source_recorded"
  },
  {
    "variantId": "sqlite-champion-84",
    "skillSpeed": "Normal",
    "sourceRef": "champion_skills:82:source:507",
    "speedStatus": "source_recorded"
  }
];
export const drogonPlanRules = {
  "targetId": "legendary-assault:drogon",
  "encounterId": "drogon",
  "abilities": [
    {
      "id": "drogon-aegis-bane",
      "name": "Aegis Bane",
      "text": "Drogon strikes an enemy, dealing 100% ATK Fire Damage.",
      "scope": "Once",
      "reviewStatus": "complete"
    },
    {
      "id": "drogon-born-in-flames-ii",
      "name": "Born in Flames II",
      "text": "Drogon is immune to: STUN, DECEIVE, PACIFY, FIRE, RAID, POISON, and ICE. At the start of the turn, if no champions used their SKILL in the previous turn, Drogon has a 50% chance to afflict all enemies with 1 FIRE.",
      "scope": "Once",
      "reviewStatus": "complete"
    },
    {
      "id": "drogon-brimstone-rain-ii",
      "name": "Brimstone Rain II",
      "text": "At the start of each turn, if no player champions used their SKILLS during the previous turn, Drogon will strike all enemies for 10% ATK Fire Damage. This attack deals an additional 15% ATK Fire Damage every time it triggers.",
      "scope": "Once",
      "reviewStatus": "complete"
    },
    {
      "id": "drogon-daznaks-fury",
      "name": "Daznak's Fury",
      "text": "At the start of each turn, allies with BIRTHRIGHT deal 5% of Drogon's HP to him. Free Cities allies gain an indefinite 10% ATK buff and recover 30% Stamina after using their skill.",
      "scope": "Once",
      "reviewStatus": "complete"
    },
    {
      "id": "drogon-dracarys",
      "name": "Dracarys",
      "text": "Drogon strikes an enemy, dealing 250% ATK Fire Damage to them and WOUNDING them for 5 turns.",
      "scope": "Once",
      "reviewStatus": "complete"
    },
    {
      "id": "drogon-ember-storm-ii",
      "name": "Ember Storm II",
      "text": "Any time a power-up gem is matched or destroyed, Drogon strikes all enemies for 50% ATK Fire Damage and reduces the enemy TREASURY by 1. All player champions have their Gem Damage reduced by -75%.",
      "scope": "All",
      "reviewStatus": "complete"
    }
  ],
  "tips": [
    {
      "id": "drogon-birthright",
      "text": "Champions with BIRTHRIGHT are strong against Drogon.",
      "reviewStatus": "screenshot_verified_current"
    },
    {
      "id": "drogon-fast-champions",
      "text": "Use fast champions to prevent Drogon's Brimstone Rain ability.",
      "reviewStatus": "screenshot_verified_current"
    },
    {
      "id": "drogon-shields-fire",
      "text": "Be careful, Drogon can destroy shields and is immune to FIRE.",
      "reviewStatus": "screenshot_verified_current"
    }
  ],
  "currentness": "historical_screenshot_unconfirmed_current",
  "reviewStatus": "screenshot_verified_historical",
  "notes": [
    "Source FIRE immunity wording is retained literally; no claim of fresh verification or detailed stacking rules.",
    "Do not infer Stamina refunds add arithmetically without verified stacking mechanics.",
    "BIRTHRIGHT payoff is a sourced potential interaction, not predicted damage or a guaranteed per-turn sequence."
  ],
  "definitions": [
    {
      "ability_id": 33,
      "ability_name": "Birthright",
      "exact_visible_text": "Heritage and privilege provide the recipient a percent increase in damage from Skill, Leader, and Passive abilities per mark. One is removed per turn.",
      "completion_state": "complete",
      "source_id": 545
    },
    {
      "ability_id": 15,
      "ability_name": "Fury",
      "exact_visible_text": "Increases the target's Stamina gain and increases the effect of ENRAGED by 3%.",
      "completion_state": "complete",
      "source_id": 527
    },
    {
      "ability_id": 45,
      "ability_name": "Bide",
      "exact_visible_text": "Causes the target to not gain Stamina or complete any action until enough actions are completed.",
      "completion_state": "complete",
      "source_id": 557
    }
  ]
};
