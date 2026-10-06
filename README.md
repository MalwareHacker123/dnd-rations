# Quartermaster

Two sheets for the same table.

**Customers** runs the master customer equation: effective foot traffic, food appeal, market decay, and a logistic conversion rate, capped by the number of seats. The sample house is an Italian seafood bistro in the Port District: 5,821 interested, 58.16% conversion, 300 seated, and 3,085 turned away.

**Supplies** is a checklist for food, water, feed, and gear on a fifth-edition trip. Tick who is eating, which animals are in harness, and what goes in the packs. The ledger totals the weight, the coin, and whether a cart, a mule, or the party can carry it. The sample trip is four people, one mule, a cart, and fourteen days of rations and water.

## Save box

Save names a sheet in this browser. That sheet stores the restaurant and the supply list together. Download writes a JSON file. Drop that file in Dropbox, Drive, or any folder, then load it on another machine with **Load file**.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:38421](http://127.0.0.1:38421).

```bash
npm test
npm run build
```

`npm run build` writes a static site to `out/`. The live sheet and the named list stay in this browser. A downloaded JSON file is the copy you can keep in Dropbox.

## Put it on GitHub Pages

1. Push this project to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. The workflow in `.github/workflows/pages.yml` publishes the site on every push to `main`.

A project site is served at `https://<user>.github.io/<repository>/`. A user site (`<user>.github.io`) is served at the root. The workflow sets that path for you.

## What the customer count uses

The count is `min(seats, floor(interested × conversion))`.

- Effective foot traffic is the published regional curve, not a fresh logarithm. Vin is 782, Port District is 5,320, Fast Food is 6,293.
- Food appeal is 0.35 cuisine + 0.30 price + 0.20 reputation + 0.15 weekly trend, then squared.
- Port District scores a menu above tier 3 as 0.10. Vin Region scores a menu under tier 5 as 0.05.
- In Pomodoro, a check under 10 sets reputation to 0.20 for 1d6 days.
- Market decay is `e^(−λ × competitors)` times the regional system multiplier.
- Conversion follows the logistic curve. The sheet keeps the first four decimals of that curve, which is how the Port bistro lands on 58.16%. Grab-and-go can push conversion past 100%.

District target tiers other than Port District (tier 2) are suggested starting points. Change them when the street aims higher or lower.

## What the supply ledger uses

- Food: 1 lb a person each day. Half a pound counts as half a day without food. Rations are a 2 lb pack at 5 sp.
- Water: 1 gallon a day, or 2 in hot weather. A gallon weighs 8 lb. A waterskin holds 4 pints and weighs 5 lb full.
- Feed: 10 lb and 5 cp per animal per day, unless they can graze.
- Carrying capacity: Strength × 15 lb. The variant rule is optional.
- A hitched animal pulls five times its carrying capacity, including the vehicle.
- Backpack or sack: 30 lb. Chest: 300 lb. A bedroll or rope can be strapped to a backpack.

Create Food and Water, cast once a day, covers up to 15 people or 5 steeds. The meal spoils after a day, so the sheet keeps one backup day.

## Attribution

Quartermaster is compatible with fifth edition.

This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.
