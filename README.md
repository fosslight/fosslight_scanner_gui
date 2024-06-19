# FOSSLight Scanner GUI

An Electron application with React and TypeScript, for FOSSLight Scanner.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Java (for JAR analysis)](https://www.oracle.com/java/technologies/downloads/)
- [Microsoft Build Tools (for Windows)](https://visualstudio.microsoft.com/ko/visual-cpp-build-tools/)

### Install

```bash
$ yarn
```

### Development

```bash
$ yarn dev
```

### Build

```bash
# For windows
$ yarn build:win

# For macOS
$ yarn build:mac

# For Linux
$ yarn build:linux
```

## Bug Report

- Korean characters in any of input fields are not supported. (string encoding issue)
