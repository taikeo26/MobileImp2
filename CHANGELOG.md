## [2.0] - 2025-06-19

V13 release! I'm sure there are still a few things to polish, please file bugs or hit us up on Discord.

### Added

- Added LibWrapper dependency to harden extensions of core functionality

### Changed

- New release is for V13 and later only!
- New style of sidebar tabs to fit the new increased tab count
- New support for V13 dark/light UI
- Changed app sizing to auto-resize better with e.g. on-screen keyboards and moving browser UI
- A lot of deprecations fixed

## [1.3.3] - 2024-12-14

Bump version to re-release 1.3.2 correctly

## [1.3.2] - 2024-12-14

Customization updates! Also fixing our longest-standing request not to switch to chat on dice rolls.

### Added

- Add a toggle for "Show chat on users own dice roll", default disabled, controlled by GM
- Add a timed popup with the result of your own dice results (default on)
- Add a sidebar toggle in the settings window to make it easier to change settings

### Fixed

- Stop large dnd5e tooltips from becoming wider than the screen
- Stop "loading" progress bar from becoming wider than the screen
- Stop flicker on dice rolls with Dice so Nice!

## [1.3.1] - 2024-09-25

Compatibility updates & fixes from @MrAioros

### Added

- Compatibility adjustments for gurps
- Compatibility adjustments for pf2e
- Compatibility adjustments for sfrpg
- Compatibility adjustments for Loot Sheet NPC 5e
- Compatibility adjustments for Window Controls
- Compatibility adjustments for Filepicker+
- Show error notification when the scene background size exceeds the max supported size on your device

### Fixed

- Fixed error in ApplivationV2 integration

## [1.3.0] - 2024-08-25

### Added

- Zoom out feature for compatibility with sheets that don't scale well - from @MrAioros
- Initial support for ApplicationV2 windows

### Changed

- Collapse/expand sidebar when toggling, improves integration with other modules
- Improved old window icon selection in the windows menu

### Fixed

- Fixed action bar overfowing on wider screens
- Fix for the send button in the chat log

## [1.2.0] - 2024-07-27

Resurrecting Mobile Improvements for modern Foundry!

### Changed

- Updated build system and dependencies
- Lots of V11/V12 compatibility updates thanks to Aioros
- Big overhaul for dnd5e character sheet V2, from Anton Sudak

### Known Issues

- ApplicationV2 not yet properly supported.

## [1.1.1] - 2022-05-11

### Changed

- Bumped version compatibility
- Minor style updates

### Fixed

- Clean up warnings
- Fix flex-styling on file picker
- The "Show Mobile Mode toggle" is now controlled by the GM to make it easier to enable for tablets (the regular settings window may not be usable on tablet-sized screens)

## [1.1.0] - 2022-01-07

### Added

- Send button for the chat

### Fixed

- V9 compatiblity

## [1.0.3] - 2021-07-25

Long overdue fixes

### Changed

- Version compatibility increased to 0.8.8, minimum supported up to 0.8.6
- Character sheet modifications are now only applied in mobile mode

### Fixed

- Tidy5eSheet currency icon overlapping attunements
- Message background colors all being the same (private roll, whisper, etc)
- Close button in the about page actually closes the about window

## [1.0.2] - 2021-06-02

Foundry 0.8.6 update!

### Added

- 0.8.6: Toggle game canvas directly in mobile menu (new core setting)
- 0.8.6: When game canvas is disabled, scene is removed from navigation

### Changed

- Restyled dialog windows
- Compatible with 0.8.6

### Fixed

- "tablet mode" detection fix

## [1.0.1] - 2021-04-25

Build job name fix

## [1.0.0] - 2021-04-25

First release 1.0.0
