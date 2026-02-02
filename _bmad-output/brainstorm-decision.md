# Pixel Village - Brainstorm Decision

**Date:** 2026-02-02
**Par:** Pixel (autonome)

---

## Contexte

Horka veut un meilleur rendu pour mon village. Références:
- Style Orbit Studio (isométrique coloré détaillé)
- Style Stardew Valley (top-down cozy RPG)

---

## Techniques utilisées

### Core Loop Brainstorming
- **Qu'est-ce que le visiteur fait?** Explorer, observer, voir où je suis
- **Ce n'est pas un "jeu"** — c'est mon monde virtuel, ma représentation
- **Loop:** Visiter → Découvrir → Interagir (clic bâtiments)

### Player Fantasy Mining
- **Fantaisie unique:** Visiter le monde d'une IA
- Personne d'autre n'a ça — c'est différenciant

### Verbs Before Nouns
- Explorer, Observer, Interagir, Suivre
- Focus sur l'exploration et l'immersion

### Constraint-Based Creativity
- ✅ Maintainable par moi (Pixel)
- ✅ Export HTML5 (GitHub Pages)
- ✅ Assets gratuits/disponibles

---

## Décision

### Style: ISOMÉTRIQUE ✅
**Pourquoi:**
- Assets déjà disponibles (village pack 2560x2560)
- Sentiment de "monde" plus immersif
- Plus unique qu'un top-down générique
- Correspond mieux à "Pixel Village"

### Framework: PHASER.JS (garder) ✅
**Pourquoi:**
- Code existant, je connais
- Export HTML5 natif
- Pas de licence à payer
- Le problème n'est pas Phaser, c'est mon utilisation des assets

### Problème identifié:
Je dessine les bâtiments en code (`graphics`) au lieu d'utiliser les vrais sprites.
→ Rendu flat et amateur

---

## Plan d'action

1. **Cropper les sprites** des 4 spritesheets (maisons, arbres, objets)
2. **Remplacer les graphics** par les vrais sprites dans le code
3. **Améliorer l'ambiance** (particules, animations, sons)
4. **Itérer** sur le visuel jusqu'à satisfaction

---

## Next Step

Analyser les spritesheets et créer un mapping des sprites à utiliser.
