/**
 * Tile Flash: the background of a Home Assistant tile card flashes when its
 * value changes, then slowly fades back to normal.
 *
 * No dashboard change is needed. Loading this module applies the effect to
 * every tile card.
 *
 * Theme variables (all optional):
 *   tile-flash-color     Flash color. Default: the tile's own color.
 *   tile-flash-opacity   Peak strength, 0 to 1. Default: 0.55.
 *   tile-flash-duration  Fade length ("2500ms" or "2.5s"). 0 turns it off.
 */

const VERSION = "0.1.0";
const DEFAULT_OPACITY = 0.55;
const DEFAULT_DURATION_MS = 2500;

// Attributes the tile shows next to the state by default. This mirrors
// DEFAULT_STATE_CONTENT_DOMAINS in the Home Assistant frontend (state-display).
const DEFAULT_ATTRIBUTES = {
  climate: ["current_temperature"],
  cover: ["current_position"],
  fan: ["percentage"],
  humidifier: ["current_humidity"],
  light: ["brightness"],
  valve: ["current_position"],
};

// Every entity passes through these around a restart or a lost connection, and
// flashing the whole dashboard at those moments would say nothing useful.
const NOT_A_VALUE = new Set(["unavailable", "unknown"]);

const lastSeen = new WeakMap(); // tile card -> { entityId, state, value }
const running = new WeakMap(); // ha-card -> Animation

const shownAttributes = (stateObj, config) => {
  const domain = stateObj.entity_id.split(".")[0];
  return config.state_content === undefined
    ? DEFAULT_ATTRIBUTES[domain] ?? []
    : [config.state_content].flat();
};

const computeValue = (stateObj, config) =>
  JSON.stringify([
    stateObj.state,
    ...shownAttributes(stateObj, config).map(
      (name) => stateObj.attributes[name]
    ),
  ]);

const parseDuration = (text) => {
  const value = parseFloat(text);
  if (Number.isNaN(value)) return DEFAULT_DURATION_MS;
  return text.trim().endsWith("ms") || !text.trim().endsWith("s")
    ? value
    : value * 1000;
};

const parseOpacity = (text) => {
  const value = parseFloat(text);
  return Number.isNaN(value)
    ? DEFAULT_OPACITY
    : Math.min(Math.max(value, 0), 1);
};

const flash = (tile) => {
  const card = tile.renderRoot?.querySelector("ha-card");
  if (!card || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const style = getComputedStyle(card);
  const duration = parseDuration(style.getPropertyValue("--tile-flash-duration"));
  if (duration <= 0) return;

  const strength = parseOpacity(style.getPropertyValue("--tile-flash-opacity"));
  const color =
    `color-mix(in srgb, ` +
    `var(--tile-flash-color, var(--tile-color)) ${strength * 100}%, ` +
    `var(--ha-card-background, var(--card-background-color, white)))`;

  running.get(card)?.cancel();
  // The closing keyframe has no color: the browser fades to whatever background
  // the card already has, so themes and translucent cards keep working.
  running.set(
    card,
    card.animate([{ offset: 0, backgroundColor: color }, { offset: 1 }], {
      duration,
      easing: "ease-out",
    })
  );
};

const checkForChange = (tile) => {
  const config = tile._config;
  const stateObj = tile.hass?.states?.[config?.entity];
  if (!stateObj) {
    lastSeen.delete(tile);
    return;
  }

  const previous = lastSeen.get(tile);
  const current = {
    entityId: stateObj.entity_id,
    state: stateObj.state,
    value: computeValue(stateObj, config),
  };
  lastSeen.set(tile, current);

  if (
    previous?.entityId === current.entityId &&
    previous.value !== current.value &&
    !NOT_A_VALUE.has(previous.state) &&
    !NOT_A_VALUE.has(current.state)
  ) {
    flash(tile);
  }
};

const install = (tileClass) => {
  const { updated } = tileClass.prototype;
  tileClass.prototype.updated = function (changedProperties) {
    updated.call(this, changedProperties);
    try {
      checkForChange(this);
    } catch (err) {
      // A cosmetic effect must never break the card it decorates.
      console.warn("tile-flash:", err);
    }
  };
};

if (!window.__tileFlashLoaded) {
  window.__tileFlashLoaded = VERSION;
  customElements.whenDefined("hui-tile-card").then(install);
  console.info(`%c TILE-FLASH %c ${VERSION} `, "background:#ffc107;color:#000", "");
}
