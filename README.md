# Tile Flash

When a Home Assistant [tile card](https://www.home-assistant.io/dashboards/tile/) changes value, its background flashes and then slowly fades back to normal.

It applies to every tile card as soon as it is installed. There is no card to add and no dashboard to edit.

## Installation

### Marketplace (Home Assistant 2026.11+) or HACS

1. Add this repository as a custom repository, type **Dashboard** (a GitHub account must be connected to the Marketplace).
2. Install **Tile Flash**.
3. Reload your browser.

### Manual

1. Copy `tile-flash.js` to `/config/www/`.
2. Under **Settings > Dashboards > Resources**, add `/local/tile-flash.js` as a JavaScript module.
3. Reload your browser.

## What counts as a change

- The entity's state.
- The attributes the tile shows: the ones in its `state_content`, or else the default for its domain (for example a light's brightness or a cover's position).

A tile doesn't flash when the page loads, or when an entity becomes `unavailable` or `unknown` or comes back from either. Otherwise a restart would flash the whole dashboard.

No flash appears if the device asks for reduced motion (on Windows: **Animation effects** turned off).

## Options

Set these in a [theme](https://www.home-assistant.io/integrations/frontend/#defining-themes). All are optional.

| Theme variable | Default | Description |
| --- | --- | --- |
| `tile-flash-color` | The tile's color | Flash color |
| `tile-flash-opacity` | `0.55` | Peak strength, from 0 to 1 |
| `tile-flash-duration` | `2500ms` | Fade length. `0` turns the effect off |

```yaml
my_theme:
  tile-flash-color: "#ffc107"
  tile-flash-opacity: 0.7
  tile-flash-duration: 4s
```

## Limits

- It relies on the internals of the tile card (`hui-tile-card`), so a Home Assistant update could break it. In that case tiles keep working, without the flash.
- A sensor that updates every few seconds flashes every few seconds.
