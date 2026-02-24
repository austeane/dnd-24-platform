# Campaign Progression Modes

The platform supports three progression modes, configured per campaign.

## Standard 5e 2024

Traditional D&D 2024 SRD rules.

- Characters pick a class and follow its progression table
- Leveling via XP thresholds or milestone (DM choice)
- Spells are governed by class spell lists and preparation rules
- Feats via ASI (Ability Score Improvement) choices
- No XP-as-currency spending

## AA Only (Advanced Adventurers)

No classes. Everything purchased with XP.

- **XP is currency**: DM awards XP, players spend it on abilities, HP, ability scores, spells, proficiencies
- **Level**: Every 20 XP earned = 1 level (determines proficiency bonus)
- **Saving throws**: Your two highest ability scores become save proficiencies
- **Spellcasting**: Modular. Pick INT/WIS/CHA. Buy cantrip casting (6 exp), slots individually, learn spells (1 exp each). No preparation — cast any known spell.
- **Abilities**: Purchased from a catalog with prerequisites and ability trees
- **No classes, no subclasses**

## Hybrid (Classes + AA)

The mode our campaign uses. XP can be spent on class levels OR AA purchases.

- Characters can take class levels (costs 20 XP per level)
- Characters can also buy AA abilities with XP
- XP earned can be split: e.g., 8 XP earned → 5 on AA ability, 3 banked toward next class level
- When banked XP ≥ 20, a "Level Up" option appears
- Spell access can come from both class spell lists AND AA purchases
- Effects from both sources merge through the unified effect model

### Hybrid Conflict Rules

- **Proficiency deduplication**: Same proficiency from class + AA doesn't double-count
- **Extra Attack stacking**: Modeled as `extraAttackCount`, max from any source wins
- **Spell slots**: Class slots and AA slots are separate pools (TBD: or merged?)
- **Spell preparation**: Class spells follow class prep rules. AA spells require no preparation.

## Feature Matrix

| Feature | Standard | AA Only | Hybrid |
|---------|----------|---------|--------|
| Classes & subclasses | Yes | No | Yes |
| XP as currency | No (unless XP leveling) | Yes | Yes |
| Level progression | XP thresholds / milestone | 20 XP = 1 level | 20 XP = 1 class level |
| Spell access | Class spell lists | Universal (buy + learn) | Both |
| Preparation | By class rules | None | Mixed by source |
| Saving throw prof | Class-granted | Top 2 ability scores | Class-granted |
| Armor/weapon prof | Class/species/feat | Purchased | Both |
| AA ability purchases | No | Yes | Yes |

## Implementation Notes

The `ProgressionMode` type (`"aa-only" | "hybrid" | "standard"`) is set on `CampaignConfig` and flows through all character computation. The effect model handles all three modes uniformly — the difference is which Sources are available to a character.
