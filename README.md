# GravWell: A BabylonJS-powered journey

This README contains basic information about GravWell, including how to build and run the project from source.

GravWell is a WIP.

Blog posts about GravWell are aggregated [here](https://www.liquidelectron.com/gravwell).

## Where to find GravWell

### Short answer

The latest hosted release is at https://gravwell.liquidelectron.com

### Longer answer

The `main` branch is the production release branch. Whenever a PR is successfully merged into that branch, an [Action](.github\workflows\azure-static-web-apps-ambitious-bush-0506c6a10.yml) runs which first builds then deploys GravWell to an Azure Static WebApp.

The `dev` branch contains the next planned release, which is maintained as an open PR. The same GH Action which deploys to production also creates/tears down a staging site for an open PR.

> **Note: The Azure platform currently limits the number of staging sites to a single instance. The open PR from dev -> main stage site is used for pre-release testing**

## GravWell overview

In GravWell, players must navigate their ship around a stellar system while avoiding unplanned "lithobraking" - crashing - contact with any of the celestial bodies. At all times, the celestial spheres tug at the players' ship with the force of their gravity. The ship has powerful engines, and armed with a map of the gravitational potential, players are given the tools to escape from their gravitational prison

_Unnecessarily redundant side-note: Game description and concepts are WIP_ and subject to major change.

## Controls and how to play

Super simple.

### Rotation

* Rotate right: `D` or **&rightarrow;**
* Rotate left: `A` or **&leftarrow;**
* Fire engines: `W` or **&uparrow;**

> note: engines apply thrust in the direction in which the _ship_ is pointing, not the direction of motion!

### The minimap

The top-right corner of the screen shows a miniaturized, top-down orthographic view of the game world. In other words, it's a minimap. As the player's ship falls through space, a trail is displayed following the ship. This is important information for players because it is a primary helper for them being able to estimate the ship's trajectory over time

### Buttons

Pretty self-explanatory.

* Resume / Pause does what it says on the label

* Restart will reset the current scenario, re-computing and generating values from the game data provided to it initially. The practical effect of this is that though some things will remain constant, many values are generated randomly, meaning that every experience is going to be a bit different from any other.

* Debug toggles the BabylonJS inspector

---

## Design overview and roadmap

### Important notes and concepts

* The forces acting upon a player's ship are computed using standard Newtonian dynamics, e.g. `F = ma = G * (m1 * m2) / r^2`
* To simplify calculations, rendering, and gameplay experiences, computations are done in 2-D space
* Typically, the y-axis component of the relevant 3-space Vectors is either ignored or repurposed for e.g., holding calculation results or display purposes
* Base (seed) Astrophysical parameters are listed in the [default-gameData.json](default-gameData.json). These and other derivative figures of merit are computed and scaled in the [src/GameData.ts](GameData) class module
* Units are always metric (mks) unless indicated otherwise
* The masses involved with the stars and planets are on rough orders of magnitude comparable to our real world system, however given the tiny size of our simulation (e.g., a few thousand sq. km at most) vs the real Solar System (let's just call it _immensely_ more large) densities are of course ridiculously high. I haven't bothered yet to calculate whether or not these objects exceed black hole density, but I've calibrated the star's mass/density relationship to be roughly equivalent to a white dwarf or neutron star
* The basic data for a given running instance of a scenario are logged to the developer console.

---

## Building from source

### Build artifacts and output

The project's compiled assets are dropped into the [/dist/](/dist/) folder. This is controlled by the TSC and by WebPack, for JS and other assets respectively.

### Development environment setup

#### VSode

#### TypeScript setup

#### Webpack config

### Cloning/Forking the repos

### Build using scripts

Simplest way to go. Just run `npm run build` from the root of the repos

### Hosting GravWell in a local development server

Run `npm run start` to launch the webpack dev server and start the TS and other asset compilation in a local session

---


