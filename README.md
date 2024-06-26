# 🤖 BlindBeat

## Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Setup and Installation](#setup-and-installation)
4. [Available Scripts](#-available-scripts)
5. [Libraries and Dependencies](#-libraries-and-dependencies)
6. [Contributing](#-contributing)

## 🌐 Overview

Welcome to the **Zen Bot Project**! This project offers a Discord bot using `discord.js` and `MongoDB` with `Prisma` for database operations.

## 🌟 Features

- Easy setup and installation
- Utilizes `discord.js` and `MongoDB`
- Provides various scripts for development, testing, and deployment

## 🚀 Getting Started

### Prerequisites

Before starting, ensure your machine has:

1. [Node.js](https://nodejs.org/)
2. [Bun](https://bun.sh/)
3. A [Discord application](https://discord.com/developers/applications) and bot setup. Refer to [this guide](https://discordjs.guide/preparations/setting-up-a-bot-application.html#creating-your-bot).

## 🚀 Setup and Installation

1. **Clone the Repository:**

    ```bash
      git clone git@github.com:ManuelR-T/BlindBeat.git
      cd BlindBeat
    ```

2. **Install Dependencies:**

    ```bash
      bun install && bun run db:update
    ```

3. **Environment Configuration:**
   - Create a `.env` file by copying the example file:

    ```bash
      cp .env.example .env
    ```

   - Populate the `.env` file with the required environment variables.

## 📜 Available Scripts

- **Database**: Perform database operations.
  - **Start**: Start the database.

    ```bash
      bun run db:start
    ```

  - **Stop**: Stop the database.

    ```bash
      bun run db:stop
    ```

  - **Update**: Update the database. Command to run after making changes to the database schema. (.prisma file)

    ```bash
      bun run db:update
    ```

  - **Check**: Open the database in the browser.

    ```bash
      bun run db:check
    ```

- **Dev**: Begin the bot in development mode.

  ```bash
    bun run dev
  ```

- **Commands**: Update the Discord bot's commands. (Note: This might take up to an hour to reflect changes)

  ```bash
    bun run commands:update
  ```

- **Test**: Execute the tests.
  - **Test**: Execute the tests one time.

    ```bash
      bun test
    ```

  - **Watch**: Execute the tests in watch mode.

    ```bash
      bun test --watch
    ```

- **Lint**: Perform linting on the codebase using ESLint with the Prettier plugin.

  ```bash
    bun run lint:fix
  ```

## 📚 Libraries and Dependencies

- **Core Libraries:**
  - `discord.js`: Interact with the Discord API.
  - `dotenv`: Load environment variables from `.env` files.
  - `prisma`: Handle MongoDB operations effectively.

- **Development Tools:**
  - `Bun`: An all-in-one JavaScript runtime & toolkit & package manager.
  - `TypeScript`: For static type-checking and better developer experience.
  - `ESLint` & `Prettier`: For linting and formatting the codebase.

## 🤝 Contributing

We welcome contributions! Please follow the below steps:

1. Fork the repository.
2. Create a New Branch for your features or fixes.
3. Commit Changes to your branch.
4. Push Changes to your fork.
5. Submit a Pull Request for review.

Your contributions will undergo a review before merging. Let's collaborate to enhance this project further!
