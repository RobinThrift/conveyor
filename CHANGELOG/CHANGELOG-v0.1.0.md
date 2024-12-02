# Changelog

## [0.1.0](https://github.com/RobinThrift/belt/releases/tag/v0.1.0) - 2024-12-02

### <!-- 0 -->New Features (APITokens)

- Add API Tokens [0ef87b2f4d](https://github.com/RobinThrift/belt/commit/0ef87b2f4dbbe41c6204cd4cb3828fafbb051fe1) (Robin Thrift)

### <!-- 0 -->New Features (Attachments)

- Add basic attachment support [a4bc680bff](https://github.com/RobinThrift/belt/commit/a4bc680bff1117ec762b42b45b77d1c85afb2c2c) (Robin Thrift)

### <!-- 0 -->New Features (Memos)

- Add basic Memo listing and creation [c75ac21b6c](https://github.com/RobinThrift/belt/commit/c75ac21b6ccb0f37fe8e9e26c033db4c10ebda13) (Robin Thrift)
- Add Tags [2f390797ad](https://github.com/RobinThrift/belt/commit/2f390797ad4344965194ad1ff0117d0c4147a3f1) (Robin Thrift)
- Add Memo creation and editing in List Page [39fda6b4f2](https://github.com/RobinThrift/belt/commit/39fda6b4f2d2647b078c6ac9011033f4b4b253eb) (Robin Thrift)
- Add single Memo page [a52e104e9a](https://github.com/RobinThrift/belt/commit/a52e104e9aa79501338d3a33fe53d293218a4246) (Robin Thrift)
- Add Archive and Bin pages/API [9b608214c6](https://github.com/RobinThrift/belt/commit/9b608214c677d1527b92a8d5bdf96f1683f09ef9) (Robin Thrift)
- Add archive and bin [f9283eb55d](https://github.com/RobinThrift/belt/commit/f9283eb55d763f469f117608ae3c4075be86118f) (Robin Thrift)

### <!-- 0 -->New Features (Settings)

- Add settings page [c93877b722](https://github.com/RobinThrift/belt/commit/c93877b7222f96ec4476bf240e774a2e14241f1e) (Robin Thrift)

### <!-- 0 -->New Features (UI)

- Add basic UI [6c6b5bfa06](https://github.com/RobinThrift/belt/commit/6c6b5bfa068231b750b41271615f2af69bc7cda9) (Robin Thrift)
- Add dark mode [7820643e18](https://github.com/RobinThrift/belt/commit/7820643e1885722177ae2ff9f9e83723cc561e02) (Robin Thrift)

### <!-- 0 -->New Features (UI/Memos)

- Add Image zoom component [1a5a9d85be](https://github.com/RobinThrift/belt/commit/1a5a9d85beb9dbeb1b3e6bc934fb8a7bf09b3589) (Robin Thrift)

### <!-- 1 -->Fixes

- Fix CSS vars to TW conversion [a2a941131e](https://github.com/RobinThrift/belt/commit/a2a941131e20118d288bcc8e6ecfa93c7b2fc619) (Robin Thrift)
- Formatting [49c5d363c1](https://github.com/RobinThrift/belt/commit/49c5d363c10687f48c4518e39ea4677685554a66) (Robin Thrift)
- Fix crash when Vim keybindings are not activated [e22bc21507](https://github.com/RobinThrift/belt/commit/e22bc21507e255d44edb65c7ce2afc899b7f62f0) (Robin Thrift)
- Fix not setting the loading indicator to false after creating a Memo [8b5d2957bb](https://github.com/RobinThrift/belt/commit/8b5d2957bbad62978ca7569b6476a012e8c9b55b) (Robin Thrift)
- Remove accidentally committed file [f97b6555c3](https://github.com/RobinThrift/belt/commit/f97b6555c3c4bd0a662121c596217a4a1d51ab08) (Robin Thrift)
- Fix missing dependency for cross compilation [6757605b94](https://github.com/RobinThrift/belt/commit/6757605b9489e6829b0d1374d49cf963a687c17c) (Robin Thrift)

### <!-- 2 -->Documentation (README)

- Add Goals and Roadmap [a3e6291d24](https://github.com/RobinThrift/belt/commit/a3e6291d247527a3f3ad370b71aad3ce879e1f3f) (Robin Thrift)

### <!-- 4 -->Dependencies

- Remove unnecessary dependency [53171715e9](https://github.com/RobinThrift/belt/commit/53171715e9eb3326e803ac8c5c118c664bfc9fe8) (Robin Thrift)
- Upgrade storybook to v8.4.5 [ad0351ac41](https://github.com/RobinThrift/belt/commit/ad0351ac41192c7fe25ab0ddcf5b3f5b5def1eac) (Robin Thrift)
- Fix platform dependent optional dependencies [d0fc260b47](https://github.com/RobinThrift/belt/commit/d0fc260b4706da6ed0331d41231d4a2c6ca700de) (Robin Thrift)
- Replace github.com/mattn/go-sqlite3 with modernc.org/sqlite [fdf0bf239d](https://github.com/RobinThrift/belt/commit/fdf0bf239d2e774659cf2f787369b0b2f5f504ac) (Robin Thrift)

### <!-- 6 -->Other Changes

- Initial setup [47547843b5](https://github.com/RobinThrift/belt/commit/47547843b55ed7c8c0e15cd96659229bf10d726f) (Robin Thrift)
- Add authentication and basic setup [ceb67c26f4](https://github.com/RobinThrift/belt/commit/ceb67c26f48fdab4eccc08df5228130fc5f1c779) (Robin Thrift)
- Add Dockerfile [d7cae57c30](https://github.com/RobinThrift/belt/commit/d7cae57c302198da6abe6c3260cdd7f3388c6193) (Robin Thrift)
- Add basic test setup for API e2e tests [70336e416e](https://github.com/RobinThrift/belt/commit/70336e416e5ca850c0b39f1495163759834d505e) (Robin Thrift)
- Move markdown parsing to worker for better performance [e2933621ff](https://github.com/RobinThrift/belt/commit/e2933621ff1a882d82ca96b903f2b67e793b02e6) (Robin Thrift)
- Move code parsing to idle task to not block main thread [498f54909b](https://github.com/RobinThrift/belt/commit/498f54909bd3aad31bd1e2ed3eeed67082afa6d1) (Robin Thrift)
- Add vacuum API spec linter [9162d9be0f](https://github.com/RobinThrift/belt/commit/9162d9be0fcec68705161aa42c2ba3636b6465e5) (Robin Thrift)
- Add OCI Image build files and task [4818da21de](https://github.com/RobinThrift/belt/commit/4818da21de6183a7293bc3233f596764d507283e) (Robin Thrift)
- Fix test and lint tasks for clean repos [13ccc3a6b2](https://github.com/RobinThrift/belt/commit/13ccc3a6b2f5d67319d1e80cd29120624d252b23) (Robin Thrift)
- Add JS linting to CI [2413f72ba8](https://github.com/RobinThrift/belt/commit/2413f72ba82822543d6a40c12a95c66eceb6a16e) (Robin Thrift)
- Fix test and linting outputs [2befe7add5](https://github.com/RobinThrift/belt/commit/2befe7add5277578f1fa3e96be4f1de435a5bbdf) (Robin Thrift)
- Prevent concurrent CI task runs [a2a86681d5](https://github.com/RobinThrift/belt/commit/a2a86681d54fbadee2350fb1140f66234ae96996) (Robin Thrift)
- Add release workflow [d1203bfc13](https://github.com/RobinThrift/belt/commit/d1203bfc13149f08b9863f8ca652cff548b3d320) (Robin Thrift)


