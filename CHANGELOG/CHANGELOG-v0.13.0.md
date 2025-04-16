# Changelog

## [0.13.0](https://github.com/RobinThrift/conveyor/releases/tag/v0.13.0) - 2025-04-16

### <!-- 1 -->Fixes

- Remove reference to old dependency [567af83c3c](https://github.com/RobinThrift/conveyor/commit/567af83c3c8ed2de726625036e152b4d0fe20e13) (@RobinThrift)
- Fix typo in OpenAPI description [fd2f1fe2d8](https://github.com/RobinThrift/conveyor/commit/fd2f1fe2d86361ab51481604c2ab5e3cfa63e483) (@RobinThrift)
- Fix changelog entries with the same timestamp weren't applied [fdf4ca9b15](https://github.com/RobinThrift/conveyor/commit/fdf4ca9b1505538af0c59f80d6231e93e5517317) (@RobinThrift)
- Fix tag filter tree [374ca7a04a](https://github.com/RobinThrift/conveyor/commit/374ca7a04a7cd6d790579e706e4e42593d1a8c92) (@RobinThrift)
- Fix tag filter tree gaps [29ad01144c](https://github.com/RobinThrift/conveyor/commit/29ad01144cdcbffa4a741b29ff149fc2ba066acd) (@RobinThrift)
- Fix formatting [37d62a6b84](https://github.com/RobinThrift/conveyor/commit/37d62a6b84c62611a50ae6be306076cc33b810dd) (@RobinThrift)
- Fix warning when displaying attachments without a hash [3e5cf00aa5](https://github.com/RobinThrift/conveyor/commit/3e5cf00aa5725529d3127f993845d76199e358f3) (@RobinThrift)
- Fix Memo retrieval and filtering [f13d758324](https://github.com/RobinThrift/conveyor/commit/f13d7583244e6139cb3cda00eeffaa2dea6dd560) (@RobinThrift)
- Fix wrong prop names after refactor [400dc96e12](https://github.com/RobinThrift/conveyor/commit/400dc96e12d60c698891ee6a8d80eb58ea4412f0) (@RobinThrift)
- Fix reference to date-fns [2ea80bef39](https://github.com/RobinThrift/conveyor/commit/2ea80bef39b0eddfca38486b3f6f59a3c1970d62) (@RobinThrift)
- Fix relative date time display for dates > 3 days [ec93725782](https://github.com/RobinThrift/conveyor/commit/ec93725782ff092be605d4911557508e14ef2f29) (@RobinThrift)
- Fix links to tags in rendered Memos [417642797c](https://github.com/RobinThrift/conveyor/commit/417642797caa0e662bc1e65570c497ba75714e49) (@RobinThrift)
- Fix that additional Memos are loaded when the scroll area is past the end of the list [53af90ad8c](https://github.com/RobinThrift/conveyor/commit/53af90ad8c715ff9ba6fba7a4536948668cb63f9) (@RobinThrift)
- Fix formatting [6cfe8f8060](https://github.com/RobinThrift/conveyor/commit/6cfe8f80605c383e421f58219f1345c97b159f89) (@RobinThrift)
- Fix amount the main screen moves back in 3D space on mobile when opening the sidebar [4082092fc8](https://github.com/RobinThrift/conveyor/commit/4082092fc85440d48db9cec0114fdcfa13564294) (@RobinThrift)
- Fix linting isseus [69c73d22b7](https://github.com/RobinThrift/conveyor/commit/69c73d22b7d7192cb7afa52acb8f6e85491352d4) (@RobinThrift)
- Prevent unnecessary rerenders of DateTime components [438e46285c](https://github.com/RobinThrift/conveyor/commit/438e46285ca077f79c718d4475d6c53d0128e3eb) (@RobinThrift)
- Fix timeout set too short [00102a880b](https://github.com/RobinThrift/conveyor/commit/00102a880b7c47a3feb2e39b5df793bdfaf80815) (@RobinThrift)
- Fix Memo list layout selector [320bc62313](https://github.com/RobinThrift/conveyor/commit/320bc623131a7b9504fa486db85df1355e933834) (@RobinThrift)
- Fix linting issue [2ff0b9cf9e](https://github.com/RobinThrift/conveyor/commit/2ff0b9cf9e9bc8ec36133bbffb100735c2ef938d) (@RobinThrift)

### <!-- 4 -->Dependencies

- Upgrade JavaScript React Packages [051a1dcb8d](https://github.com/RobinThrift/conveyor/commit/051a1dcb8d9586bc51663ec72d8bbe89d71182c6) (Robin Thrift)
- Upgrade dependency @scalar/api-reference-react to v0.6.10 [b41c878e3f](https://github.com/RobinThrift/conveyor/commit/b41c878e3f2bdfe49aa2e8f24e9ad1ef50b87ac1) (Robin Thrift)
- Remove date-fns dependency [203c5aa4f0](https://github.com/RobinThrift/conveyor/commit/203c5aa4f0329997604728f25c0d30f2b2e2a5e2) (@RobinThrift)

### <!-- 5 -->Removed

- Remove dead code [228932e22c](https://github.com/RobinThrift/conveyor/commit/228932e22cc3c144692d984ec19af94cb67fb835) (@RobinThrift)

### <!-- 6 -->Other Changes

- Refactor tag tree filter to use react-aria-components instead of react-accessible-treeview [e0894490b6](https://github.com/RobinThrift/conveyor/commit/e0894490b6f5ee39a27fd61024c6603bc6fa2881) (@RobinThrift)
- Replace react-day-picker with react-aria-components [0052bc0bdc](https://github.com/RobinThrift/conveyor/commit/0052bc0bdcfe1942cf7d1aeb184c7dce50a41936) (@RobinThrift)
- Replace OffCanvas @base-ui-components/react/dialog with react-aria-components and add touch drag handler [b81c2b9eae](https://github.com/RobinThrift/conveyor/commit/b81c2b9eaebb7fb4ecd3e57c987544b518392f1f) (@RobinThrift)
- Fix minor styling and performance issues with the tag tree [4cf3f0c1b0](https://github.com/RobinThrift/conveyor/commit/4cf3f0c1b0d95c7c6109063223a822c6cb09d306) (@RobinThrift)
- Replace of date-fns for relative formatting [54c8da489f](https://github.com/RobinThrift/conveyor/commit/54c8da489f32eddc94d0a1d51d82692cbf7333cf) (@RobinThrift)
- Replace @radix-ui/react-dropdown-menu with react-aria-components Menu component [b6a07ea023](https://github.com/RobinThrift/conveyor/commit/b6a07ea023e115556b429423a073ef301671d905) (@RobinThrift)
- Refactor entire navigation to be faster and make more sense on mobile [739bcc3f06](https://github.com/RobinThrift/conveyor/commit/739bcc3f065b0cc032c4c599b72cc7ab4cc1b96c) (@RobinThrift)
- Replace gear icon with sliders icon for settings [fecbb6d8d8](https://github.com/RobinThrift/conveyor/commit/fecbb6d8d8120b833e24e2ab888eaf324be4ebc9) (@RobinThrift)
- Refactor how settings are organised for more flexibility in the future [8252d435fa](https://github.com/RobinThrift/conveyor/commit/8252d435fa81d2475e671118d5d34ea09d2335e2) (@RobinThrift)
- Parse Markdown on UI thread to prevent lag when displaying Memos [46e08174d7](https://github.com/RobinThrift/conveyor/commit/46e08174d7a383782ac27384a407b890f09c92be) (@RobinThrift)
- Replace @radix-ui/react-select with react-aria-components [804791c9cb](https://github.com/RobinThrift/conveyor/commit/804791c9cb4edabfb6a4db49ea3bc74ef2016ca1) (@RobinThrift)

[0.13.0]: https://github.com/RobinThrift/conveyor/compare/v0.12.4..v0.13.0

