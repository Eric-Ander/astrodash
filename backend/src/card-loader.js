const fs = require('fs');
const path = require('path');
const express = require('express');

/**
 * CardLoader - Auto-discovers card plugins from the cards/ directory.
 *
 * At startup it scans for manifest.json files, validates them, mounts
 * any backend routes under /api/cards/<cardId>/, and exposes a registry
 * of available cards via GET /api/cards.
 */
class CardLoader {
  constructor() {
    this.cards = new Map();
    this.cardsDir = path.resolve(__dirname, '../../cards');
  }

  /**
   * Discover all cards in the cards/ directory.
   * Each card must have a manifest.json at its root.
   */
  discover() {
    if (!fs.existsSync(this.cardsDir)) {
      console.log('Cards directory not found, skipping card discovery');
      return;
    }

    const entries = fs.readdirSync(this.cardsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const cardDir = path.join(this.cardsDir, entry.name);
      const manifestPath = path.join(cardDir, 'manifest.json');

      if (!fs.existsSync(manifestPath)) {
        console.warn(`Card "${entry.name}" has no manifest.json, skipping`);
        continue;
      }

      try {
        const raw = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(raw);

        if (!this.validateManifest(manifest, entry.name)) continue;

        // Ensure id matches directory name
        if (manifest.id !== entry.name) {
          console.warn(
            `Card "${entry.name}": manifest id "${manifest.id}" does not match directory name, using directory name`
          );
          manifest.id = entry.name;
        }

        this.cards.set(manifest.id, {
          manifest,
          dir: cardDir,
        });

        console.log(`Card discovered: ${manifest.id} (${manifest.name} v${manifest.version})`);
      } catch (err) {
        console.error(`Failed to load card "${entry.name}":`, err.message);
      }
    }

    console.log(`Card discovery complete: ${this.cards.size} card(s) found`);
  }

  /**
   * Validate required manifest fields.
   */
  validateManifest(manifest, dirName) {
    const required = ['id', 'name', 'version'];
    for (const field of required) {
      if (!manifest[field]) {
        console.warn(`Card "${dirName}": manifest missing required field "${field}", skipping`);
        return false;
      }
    }
    return true;
  }

  /**
   * Mount card backend routes and the card registry endpoint onto the Express app.
   */
  mount(app) {
    // Mount each card's backend routes under /api/cards/<cardId>/
    for (const [cardId, card] of this.cards) {
      const routesPath = path.join(card.dir, 'backend', 'routes.js');

      if (fs.existsSync(routesPath)) {
        try {
          const cardRouter = require(routesPath);
          app.use(`/api/cards/${cardId}`, cardRouter);
          console.log(`Card routes mounted: /api/cards/${cardId}/`);
        } catch (err) {
          console.error(`Failed to mount routes for card "${cardId}":`, err.message);
        }
      }
    }

    // Serve card frontend files statically
    // Each card's frontend/ directory is accessible at /cards/<cardId>/frontend/
    app.use('/cards', express.static(this.cardsDir));

    // Registry endpoint: GET /api/cards
    app.get('/api/cards', (req, res) => {
      res.json(this.getRegistry());
    });
  }

  /**
   * Return the card registry (public manifest data for all discovered cards).
   */
  getRegistry() {
    const registry = [];

    for (const [cardId, card] of this.cards) {
      const m = card.manifest;
      registry.push({
        id: m.id,
        name: m.name,
        description: m.description || '',
        version: m.version,
        icon: m.icon || '',
        category: m.category || 'general',
        defaultEnabled: m.defaultEnabled !== false,
        defaultPosition: m.defaultPosition || 99,
        requiresAuth: m.requiresAuth === true,
        requiresLocation: m.requiresLocation !== false,
        dataSource: m.dataSource || null,
        size: m.size || { default: 'medium', options: ['small', 'medium', 'large'] },
        frontendEntry: `/cards/${m.id}/frontend/${m.id}-card.js`,
      });
    }

    // Sort by defaultPosition
    registry.sort((a, b) => a.defaultPosition - b.defaultPosition);

    return { cards: registry };
  }
}

module.exports = new CardLoader();
